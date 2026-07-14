# CRM Email → Task Automation

Inbound email → AI classification → multi-tenant CRM task, built with NestJS + MongoDB + BullMQ/Redis + Gemini.

## Stack

```
NestJS
 ├── Mongoose (MongoDB)
 ├── BullMQ (Redis) — async LLM processing
 ├── Gemini API   — email classification
 ├── Swagger      — /docs
 └── Docker Compose (app + mongo + redis)
```

## Quick start

```bash
cp .env.example .env
# fill in GEMINI_API_KEY and WEBHOOK_SECRET

docker compose up --build
```

Once containers are up, seed a demo company + user:

```bash
docker compose exec app npm run seed
```

This prints the demo company's Mongo `_id` and the email addresses routed to
it (`sales@acme.com`, `ali@acme.com`). There's no login/auth system in scope
for this task — tenant is resolved from an `x-company-id` header (see
DESIGN.md for why). Use the printed `_id` as that header's value for
`GET /tasks` and `POST /tasks/:id/review`.

Swagger docs: http://localhost:8080/api/v1/docs

## Simulating the fake email-provider

```bash
curl -X POST http://localhost:8080/webhooks/email \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <WEBHOOK_SECRET from .env>" \
  -d '{
    "from": "john@example.com",
    "to": "sales@acme.com",
    "subject": "Need a quote for 100 licenses",
    "body": "Please send me pricing before Friday"
  }'
```

The webhook responds `202 Accepted` immediately (email is persisted and queued);
actual LLM classification + Task creation happens asynchronously in the BullMQ worker.

## Reviewing generated tasks

```bash
curl "http://localhost:8080/tasks?status=pending&page=1&limit=20" \
  -H "x-company-id: <companyId from seed>"

curl -X POST http://localhost:8080/tasks/<taskId>/review \
  -H "x-company-id: <companyId from seed>" \
  -H "Content-Type: application/json" \
  -d '{"action":"accept"}'
```

## Flow

```
POST /webhooks/email
        │
        ▼
EmailsService.receiveInboundEmail
        │
        ▼
TenantResolverService (to-address → User → companyId)
        │
        ▼
EmailMessage saved (Mongo, status=queued|ignored_unknown_tenant)
        │
        ▼
EmailTaskProducer → BullMQ queue (Redis)
        │
        ▼
EmailTaskProcessor (worker)
        │
        ▼
GeminiService.analyzeEmail → { isTask, title, description, dueDate, assigneeEmail }
        │
        ├── isTask=false → EmailMessage.status = processed, no Task
        │
        └── isTask=true  → TasksService.createTask (companyId scoped)
                                  │
                                  ▼
                        GET /tasks · POST /tasks/:id/review
                        (tenant resolved via x-company-id header)
```

See `DESIGN.md` for scope/tradeoffs and `THREATS.md` for the security model.
