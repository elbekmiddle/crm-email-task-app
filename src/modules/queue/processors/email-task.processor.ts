import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import {
  EmailMessage,
  EmailMessageDocument,
  EmailProcessingStatus,
} from 'src/modules/emails/schemas/email-message.schema';
import { GeminiService } from 'src/modules/ai/gemini.service';
import { TasksService } from 'src/modules/tasks/tasks.service';
import { TaskSource } from 'src/modules/tasks/schemas/task.schema';
import { EMAIL_TASK_QUEUE } from 'src/modules/queue/queue.constants';

@Processor(EMAIL_TASK_QUEUE)
export class EmailTaskProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailTaskProcessor.name);

  constructor(
    @InjectModel(EmailMessage.name) private readonly emailModel: Model<EmailMessageDocument>,
    private readonly geminiService: GeminiService,
    private readonly tasksService: TasksService,
  ) {
    super();
  }

  async process(job: Job<{ emailId: string }>): Promise<void> {
    const { emailId } = job.data;
    const email = await this.emailModel.findById(emailId).exec();

    if (!email) {
      this.logger.error(`Email ${emailId} not found, skipping job`);
      return;
    }

    if (!email.companyId) {
      // Xavfsizlik: companyId bo'lmasa task hech qachon yaratilmaydi.
      email.status = EmailProcessingStatus.IGNORED_UNKNOWN_TENANT;
      await email.save();
      return;
    }

    try {
      const analysis = await this.geminiService.analyzeEmail({
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
      });

      if (analysis.isTask) {
        await this.tasksService.createTask({
          companyId: email.companyId,
          title: analysis.title ?? 'Untitled task',
          description: analysis.description ?? '',
          dueDate: analysis.dueDate ? new Date(analysis.dueDate) : null,
          assigneeEmail: analysis.assigneeEmail,
          source: TaskSource.EMAIL,
          llmGenerated: true,
          sourceEmailId: email._id,
        });
      }

      email.status = EmailProcessingStatus.PROCESSED;
      await email.save();
    } catch (err) {
      email.status = EmailProcessingStatus.FAILED;
      email.failureReason = err instanceof Error ? err.message : String(err);
      await email.save();
      // Qayta throw qilamiz -> BullMQ retry/backoff siyosati ishga tushadi.
      throw err;
    }
  }
}
