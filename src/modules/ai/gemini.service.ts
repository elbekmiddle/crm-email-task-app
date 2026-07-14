import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  EMAIL_ANALYSIS_SYSTEM_PROMPT,
  buildEmailAnalysisUserPrompt,
} from 'src/modules/ai/prompts/email.prompt';
import { EmailAnalysisResult } from 'src/modules/ai/dto/email-analysis-result.dto';

const EMPTY_RESULT: EmailAnalysisResult = {
  isTask: false,
  title: null,
  description: null,
  dueDate: null,
  assigneeEmail: null,
};

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenerativeAI(this.config.get<string>('env.gemini.apiKey')!);
    this.modelName = this.config.get<string>('env.gemini.model') ?? 'gemini-2.0-flash';
  }

  async analyzeEmail(params: {
    from: string;
    to: string;
    subject: string;
    body: string;
  }): Promise<EmailAnalysisResult> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: EMAIL_ANALYSIS_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(buildEmailAnalysisUserPrompt(params));
    const raw = result.response.text() ?? '{}';
    return this.parseAndValidate(raw);
  }

  private parseAndValidate(raw: string): EmailAnalysisResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger.warn(`LLM invalid JSON, falling back to isTask=false: ${raw}`);
      return { ...EMPTY_RESULT };
    }

    const obj = parsed as Partial<EmailAnalysisResult>;
    if (typeof obj.isTask !== 'boolean' || !obj.isTask) {
      return { ...EMPTY_RESULT };
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
