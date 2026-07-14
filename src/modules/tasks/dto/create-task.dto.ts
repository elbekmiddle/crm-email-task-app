import { Types } from 'mongoose';
import { TaskSource } from 'src/modules/tasks/schemas/task.schema';

export class CreateTaskDto {
  companyId: Types.ObjectId;
  title: string;
  description?: string;
  dueDate?: Date | null;
  assigneeEmail?: string | null;
  source: TaskSource;
  llmGenerated: boolean;
  sourceEmailId?: Types.ObjectId;
}
