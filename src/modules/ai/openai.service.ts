import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  EMAIL_ANALYSIS_SYSTEM_PROMPT,
  buildEmailAnalysisUserPrompt,
} from 'src/modules/ai/prompts/email.prompt';
import { EmailAnalysisResult } from 'src/modules/ai/dto/email-analysis-result.dto';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({ apiKey: this.config.get<string>('env.openai.apiKey') });
    this.model = this.config.get<string>('env.openai.model') ?? 'gpt-4o-mini';
  }

  async analyzeEmail(params: {
    from: string;
    to: string;
    subject: string;
    body: string;
  }): Promise<EmailAnalysisResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EMAIL_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: buildEmailAnalysisUserPrompt(params) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    return this.parseAndValidate(raw);
  }

  private parseAndValidate(raw: string): EmailAnalysisResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.logger.warn(`LLM invalid JSON, falling back to isTask=false: ${raw}`);
      return { isTask: false, title: null, description: null, dueDate: null, assigneeEmail: null };
    }

    const obj = parsed as Partial<EmailAnalysisResult>;
    if (typeof obj.isTask !== 'boolean') {
      return { isTask: false, title: null, description: null, dueDate: null, assigneeEmail: null };
    }

    if (!obj.isTask) {
      return { isTask: false, title: null, description: null, dueDate: null, assigneeEmail: null };
    }

    return {
      isTask: true,
      title: typeof obj.title === 'string' ? obj.title.slice(0, 200) : 'Untitled task',
      description: typeof obj.description === 'string' ? obj.description.slice(0, 2000) : '',
      dueDate: this.isValidDateString(obj.dueDate) ? (obj.dueDate as string) : null,
      assigneeEmail: typeof obj.assigneeEmail === 'string' ? obj.assigneeEmail : null,
    };
  }

  private isValidDateString(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return !Number.isNaN(Date.parse(value));
  }
}
