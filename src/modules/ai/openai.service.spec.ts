import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenAiService } from 'src/modules/ai/openai.service';

// OpenAI SDK'ni to'liq mock qilamiz — haqiqiy tarmoq so'rovi yubormaymiz.
// Faqat parseAndValidate mantig'ini sinaymiz, chunki bu THREATS.md #3'dagi
// "prompt injection / malformed LLM output" xavfiga qarshi asosiy himoya.
const mockCreate = jest.fn();

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
  };
});

describe('OpenAiService', () => {
  let service: OpenAiService;

  beforeEach(async () => {
    mockCreate.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAiService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'env.openai.apiKey') return 'test-key';
              if (key === 'env.openai.model') return 'gpt-4o-mini';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get(OpenAiService);
  });

  function mockLlmResponse(content: string) {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content } }],
    });
  }

  const email = { from: 'john@example.com', to: 'sales@acme.com', subject: 'Quote', body: 'Please send pricing' };

  it('returns isTask=true with fields when the model returns valid JSON', async () => {
    mockLlmResponse(
      JSON.stringify({
        isTask: true,
        title: 'Send pricing quote',
        description: 'Customer wants pricing for 100 licenses',
        dueDate: '2026-08-01',
        assigneeEmail: 'ali@acme.com',
      }),
    );

    const result = await service.analyzeEmail(email);

    expect(result.isTask).toBe(true);
    expect(result.title).toBe('Send pricing quote');
    expect(result.dueDate).toBe('2026-08-01');
    expect(result.assigneeEmail).toBe('ali@acme.com');
  });

  it('returns isTask=false when the model says so', async () => {
    mockLlmResponse(JSON.stringify({ isTask: false }));

    const result = await service.analyzeEmail(email);

    expect(result).toEqual({ isTask: false, title: null, description: null, dueDate: null, assigneeEmail: null });
  });

  it('degrades to isTask=false on invalid (non-JSON) output — never throws', async () => {
    mockLlmResponse('Sure! Here is the JSON you asked for: { not actually json');

    const result = await service.analyzeEmail(email);

    expect(result.isTask).toBe(false);
  });

  it('degrades to isTask=false when "isTask" field is missing or wrong type', async () => {
    mockLlmResponse(JSON.stringify({ title: 'Something' })); // isTask missing entirely

    const result = await service.analyzeEmail(email);

    expect(result.isTask).toBe(false);
  });

  it('ignores an unparseable dueDate instead of throwing', async () => {
    mockLlmResponse(
      JSON.stringify({
        isTask: true,
        title: 'Do the thing',
        description: 'desc',
        dueDate: 'not-a-real-date',
        assigneeEmail: null,
      }),
    );

    const result = await service.analyzeEmail(email);

    expect(result.isTask).toBe(true);
    expect(result.dueDate).toBeNull();
  });

  it('truncates an oversized title/description rather than storing them unbounded', async () => {
    mockLlmResponse(
      JSON.stringify({
        isTask: true,
        title: 'x'.repeat(500),
        description: 'y'.repeat(5000),
        dueDate: null,
        assigneeEmail: null,
      }),
    );

    const result = await service.analyzeEmail(email);

    expect(result.title?.length).toBeLessThanOrEqual(200);
    expect(result.description?.length).toBeLessThanOrEqual(2000);
  });

  it('does NOT invent an assigneeEmail if the model provides a non-string value', async () => {
    mockLlmResponse(
      JSON.stringify({ isTask: true, title: 't', description: 'd', dueDate: null, assigneeEmail: 12345 }),
    );

    const result = await service.analyzeEmail(email);

    expect(result.assigneeEmail).toBeNull();
  });
});
