import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum TaskSource {
  EMAIL = 'email',
  MANUAL = 'manual',
}

@Schema({ timestamps: true, collection: 'tasks' })
export class Task extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ enum: TaskStatus, default: TaskStatus.PENDING, index: true })
  status: TaskStatus;

  @Prop({ type: Date, required: false })
  dueDate?: Date;

  @Prop({ required: false })
  assigneeEmail?: string;

  @Prop({ enum: TaskSource, default: TaskSource.MANUAL })
  source: TaskSource;

  @Prop({ default: false })
  llmGenerated: boolean;

  // Debugging/audit uchun — qaysi inbound email'dan yaratilgani
  @Prop({ type: Types.ObjectId, ref: 'EmailMessage', required: false })
  sourceEmailId?: Types.ObjectId;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index({ companyId: 1, status: 1, createdAt: -1 });
