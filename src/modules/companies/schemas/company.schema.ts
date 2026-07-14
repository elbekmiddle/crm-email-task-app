import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true, collection: 'companies' })
export class Company extends Document {
  @Prop({ required: true, trim: true })
  name: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
