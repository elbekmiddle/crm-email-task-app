# DESIGN.md

## What I built

An inbound-email-to-CRM-task pipeline, multi-tenant, with human review before a
task is considered final:

- `POST /webhooks/email` — receives the fake provider's payload, validates a
  shared webhook secret, resolves which company the email belongs to (via the
  `to` address → `User.emails[]` → `companyId`), persists the raw email, and
  enqueues it for analysis. Responds `202` immediately — it never waits on the
  LLM call, so a slow/unavailable Gemini API can't make the provider's webhook
  time out or retry-storm us.
- A **BullMQ worker** (`EmailTaskProcessor`) picks up the job, calls **Gemini**
  with a strict JSON-only prompt, and — if the email is judged actionable —
  creates a `Task` scoped to `companyId`. Failures are retried with
  exponential backoff (3 attempts) and the source `EmailMessage` is marked
  `failed`/`processed` for observability.
- `GET /tasks?status=&page=&limit=` — tenant-scoped, paginated. `companyId`
  is **never** taken from the client's body/query; it's resolved server-side
  by `TenantGuard` from an `x-company-id` header (see "Auth" below).
- `POST /tasks/:id/review` — accept/reject a pending, LLM-generated task. The
  lookup is `{ _id, companyId }`, so a task can only ever be reviewed by the
  company it belongs to; already-reviewed tasks are rejected with 400 to avoid
  re-processing races.
- Repository pattern throughout (`*.repository.ts`): controllers never touch
  Mongoose directly, services never build queries directly — makes it easy to
  swap Mongo for Postgres later or unit-test services with a mocked repo.

## Auth — deliberately minimal

The task brief doesn't ask for a login/session/JWT system, only that
`GET /tasks` and `POST /tasks/:id/review` be **tenant-scoped**. So instead of
building auth that wasn't requested, `TenantGuard` resolves the tenant from an
`x-company-id` header (a real `Company._id`, created via `npm run seed`):

```
x-company-id: <company's Mongo _id>
```

This still satisfies the actual requirement — the client can't put its own
`companyId` in the request body/query, every repository query filters by the
server-resolved `companyId`, and cross-tenant task IDs 404 instead of leaking
data (see THREATS.md). What it does *not* give you is user identity, roles,
or a way to tell company employees apart — there's a single implicit "you are
this company" per header value. Swapping this for real auth later (JWT →
`req.user.companyId`) is a one-file change: only `TenantGuard` needs to
change, since every controller/service only depends on `req.company`.

## What I cut (and why, given ~3 days)

- **Login/JWT/roles**, per above — out of scope for what's being tested here
  (webhook design, LLM integration, multi-tenancy, async processing, security
  thinking), and would eat a full day on its own for no requirement it serves.
- **Attachment / rich-email parsing.** Only `from/to/subject/body` are
  modeled. Real email (MIME, HTML bodies, attachments, threads) is a project
  of its own.
- **Idempotency / dedup on the webhook.** If the fake provider retries the
  same email, we'd create a second `EmailMessage` and, potentially, a second
  Task. Documented as a known gap rather than building a dedup key.
- **Assignee resolution.** `assigneeEmail` from Gemini is stored as-is; I did
  not validate it against `User.emails[]` / auto-link it to a `User` document.
  Cheap to add, cut for time.
- **UI.** Not requested; API-only per the task brief.
- **Complex permissions / audit trail beyond `EmailMessage.status`.** A real
  CRM would want a full activity log per task (who reviewed what, when) —
  meaningless without real user identity anyway (see Auth above).

## Tradeoffs

- **MongoDB vs Postgres.** The brief pointed at Mongo + Mongoose, and email
  payloads are naturally schema-flexible (subject/body now, headers/
  attachments/threading later), so Mongo was a reasonable fit for a 2–3 day
  build. For a real multi-tenant CRM with relational data (companies → users →
  tasks → comments → attachments → permissions) I'd lean Postgres + Prisma/
  TypeORM instead — tenant-scoped joins and referential integrity (e.g.
  "assignee must be a user of this company") are cheaper to enforce at the DB
  layer than in application code.
- **BullMQ/Redis is not strictly required** by the brief but the async
  boundary is the right place to put a slow, sometimes-flaky external call
  (Gemini) so the webhook stays fast and retryable independently of the HTTP
  request/response cycle.
- **Storing the raw email** (`EmailMessage`) instead of only the derived
  `Task` costs a bit of storage but buys real debuggability: I can see exactly
  what the LLM saw, re-run analysis on failures, and audit "why was this task
  created."
- **LLM output is not trusted blindly.** `GeminiService` parses and validates
  the model's JSON (booleans/strings/date-parseable), and anything malformed
  degrades to `isTask: false` rather than throwing or creating garbage tasks.
  A `Task` created from an LLM is always `status = pending` until a human
  reviews it — the model never gets to unilaterally put something on someone's
  plate.

## What I'd do with another week

1. Real auth: users, login, JWT with `companyId`/`role` claims, and a
   per-user audit trail on `POST /tasks/:id/review` (this is the natural
   next step once identity is actually required, not before).
2. Webhook idempotency: hash `(from, to, subject, body, timestamp)` or accept
   a provider-supplied message ID, and dedupe on it.
3. Validate/auto-link `assigneeEmail` to an existing `User` in the same
   company; reject or null it out otherwise instead of storing an arbitrary
   string.
4. Rate-limit and monitor Gemini spend per tenant (an abusive/compromised
   sender could otherwise drive unbounded LLM cost — see THREATS.md).
5. Add a dead-letter queue view / admin endpoint for `failed` `EmailMessage`s
   so operators can see and manually retry/inspect stuck emails.
6. Real integration tests (webhook → queue → task, with BullMQ in test mode
   and Gemini mocked) instead of relying on manual curl testing.
7. Structured logging/tracing across the webhook → queue → worker boundary
   (correlation ID per email) to make production debugging tractable.
