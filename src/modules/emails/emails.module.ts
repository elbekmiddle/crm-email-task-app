import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmailMessage,
  EmailMessageSchema,
} from 'src/modules/emails/schemas/email-message.schema';
import { EmailsController } from 'src/modules/emails/emails.controller';
import { EmailsService } from 'src/modules/emails/emails.service';
import { TenantResolverService } from 'src/modules/emails/tenant-resolver.service';
import { UsersModule } from 'src/modules/users/users.module';
import { QueueModule } from 'src/modules/queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EmailMessage.name, schema: EmailMessageSchema }]),
    UsersModule,
    QueueModule,
  ],
  controllers: [EmailsController],
  providers: [EmailsService, TenantResolverService],
  exports: [MongooseModule],
})
export class EmailsModule {}
