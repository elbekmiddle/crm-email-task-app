import { Module } from '@nestjs/common';
import { OpenAiService } from 'src/modules/ai/openai.service';

@Module({
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class AiModule {}
