import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailMessage, EmailMessageSchema } from 'src/modules/emails/schemas/email-message.schema';
import { EMAIL_TASK_QUEUE } from 'src/modules/queue/queue.constants';
import { EmailTaskProducer } from 'src/modules/queue/producers/email-task.producer';
import { EmailTaskProcessor } from 'src/modules/queue/processors/email-task.processor';
import { AiModule } from 'src/modules/ai/ai.module';
import { TasksModule } from 'src/modules/tasks/tasks.module';
import { getBullConnection } from 'src/config/bull/bull.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => getBullConnection(config),
    }),
    BullModule.registerQueue({ name: EMAIL_TASK_QUEUE }),
    MongooseModule.forFeature([{ name: EmailMessage.name, schema: EmailMessageSchema }]),
    AiModule,
    TasksModule,
  ],
  providers: [EmailTaskProducer, EmailTaskProcessor],
  exports: [EmailTaskProducer],
})
export class QueueModule {}
