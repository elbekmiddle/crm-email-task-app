import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from 'src/modules/users/users.service';

/**
 * Email "to" manzilidan companyId'ni topadi.
 * Alohida service qilingan sabab: bu logika kelajakda boshqa joyларда ham
 * kerak bo'lishi mumkin (masalan manual email import, testing tool va h.k).
 */
@Injectable()
export class TenantResolverService {
  private readonly logger = new Logger(TenantResolverService.name);

  constructor(private readonly usersService: UsersService) {}

  async resolveCompanyIdFromEmail(toAddress: string): Promise<Types.ObjectId | null> {
    const user = await this.usersService.findByEmailAddress(toAddress.toLowerCase());
    if (!user) {
      this.logger.warn(`No user/company found for inbound "to" address: ${toAddress}`);
      return null;
    }
    return user.companyId;
  }
}
