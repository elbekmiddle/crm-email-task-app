import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type EmailMessageDocument = HydratedDocument<EmailMessage>;

export enum EmailProcessingStatus {
  QUEUED = 'queued',
  PROCESSED = 'processed',
  FAILED = 'failed',
  IGNORED_UNKNOWN_TENANT = 'ignored_unknown_tenant',
}

// Inbound email'ning o'zi saqlanadi — audit/debug uchun, va Bull job
// faqat shu documentning _id sini ko'taradi (katta payloadni queue'ga
// tashimaslik uchun).
@Schema({ timestamps: true, collection: 'email_messages' })
export class EmailMessage extends Document {
  @Prop({ required: true })
  from: string;

  @Prop({ required: true, index: true })
  to: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: false, index: true })
  companyId?: Types.ObjectId;

  @Prop({ enum: EmailProcessingStatus, default: EmailProcessingStatus.QUEUED })
  status: EmailProcessingStatus;

  @Prop({ required: false })
  failureReason?: string;
}

export const EmailMessageSchema = SchemaFactory.createForClass(EmailMessage);
