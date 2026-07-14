import { Module } from '@nestjs/common';
import { GeminiService } from 'src/modules/ai/gemini.service';

@Module({
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AiModule {}
