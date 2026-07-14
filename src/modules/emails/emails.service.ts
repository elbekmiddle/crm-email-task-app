import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EmailMessage,
  EmailMessageDocument,
  EmailProcessingStatus,
} from 'src/modules/emails/schemas/email-message.schema';
import { InboundEmailDto } from 'src/modules/emails/dto/inbound-email.dto';
import { TenantResolverService } from 'src/modules/emails/tenant-resolver.service';
import { EmailTaskProducer } from 'src/modules/queue/producers/email-task.producer';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    @InjectModel(EmailMessage.name) private readonly emailModel: Model<EmailMessageDocument>,
    private readonly tenantResolver: TenantResolverService,
    private readonly emailTaskProducer: EmailTaskProducer,
  ) {}

  /**
   * Webhook handler chaqiradigan asosiy metod.
   * Tez javob qaytarish uchun: email darhol saqlanadi, og'ir ish
   * (LLM chaqiruvi) Bull worker'ga o'tkaziladi.
   */
  async receiveInboundEmail(dto: InboundEmailDto): Promise<{ emailId: string; status: EmailProcessingStatus }> {
    const companyId = await this.tenantResolver.resolveCompanyIdFromEmail(dto.to);

    const emailDoc = await this.emailModel.create({
      from: dto.from,
      to: dto.to,
      subject: dto.subject,
      body: dto.body,
      companyId: companyId ?? undefined,
      status: companyId ? EmailProcessingStatus.QUEUED : EmailProcessingStatus.IGNORED_UNKNOWN_TENANT,
    });

    if (!companyId) {
      // Noma'lum tenant: hech kimga tegishli bo'lmagan email uchun task
      // yaratilmaydi, lekin audit uchun saqlab qolinadi.
      this.logger.warn(`Email ${emailDoc._id} ignored: unknown tenant for "${dto.to}"`);
      return { emailId: String(emailDoc._id), status: emailDoc.status };
    }

    await this.emailTaskProducer.enqueueEmailForAnalysis(String(emailDoc._id));
    return { emailId: String(emailDoc._id), status: emailDoc.status };
  }
}
