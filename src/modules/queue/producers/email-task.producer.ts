import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_TASK_JOB, EMAIL_TASK_QUEUE } from 'src/modules/queue/queue.constants';

@Injectable()
export class EmailTaskProducer {
  constructor(@InjectQueue(EMAIL_TASK_QUEUE) private readonly queue: Queue) {}

  async enqueueEmailForAnalysis(emailId: string): Promise<void> {
    await this.queue.add(
      EMAIL_TASK_JOB,
      { emailId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );
  }
}
