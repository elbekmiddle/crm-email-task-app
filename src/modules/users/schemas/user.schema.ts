import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  // Bitta user bir nechta email manzilga ega bo'lishi mumkin
  // (masalan sales@acme.com, ali@acme.com). Inbound emailning "to"
  // maydoni shu ro'yxat bilan solishtirilib tenant aniqlanadi.
  @Prop({ type: [String], required: true, index: true })
  emails: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
