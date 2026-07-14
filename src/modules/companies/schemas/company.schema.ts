import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true, collection: 'companies' })
export class Company extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  // Minimal-auth token: bitta kompaniya uchun bitta statik bearer token.
  // Bull/webhook/tasks endpointlarida shu orqali tenant aniqlanadi.
  @Prop({ required: true, unique: true, index: true })
  apiToken: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
