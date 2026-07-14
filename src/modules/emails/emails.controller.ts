import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { EmailsService } from 'src/modules/emails/emails.service';
import { InboundEmailDto } from 'src/modules/emails/dto/inbound-email.dto';

@ApiTags('webhooks')
@Controller('webhooks/email')
export class EmailsController {
  constructor(
    private readonly emailsService: EmailsService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handleInboundEmail(
    @Body() dto: InboundEmailDto,
    @Headers('x-webhook-secret') providedSecret: string | undefined,
  ) {
    // Fake email-provider webhook'ini himoya qilish uchun oddiy shared secret.
    // Bu hech kim tasodifan/ataylab shu endpointga spam email/task yubormasligi uchun.
    const expectedSecret = this.config.get<string>('env.webhookSecret');
    if (!providedSecret || providedSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    const result = await this.emailsService.receiveInboundEmail(dto);
    return { success: true, ...result };
  }
}
