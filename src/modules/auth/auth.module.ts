import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/modules/companies/companies.module';
import { TenantGuard } from 'src/common/guards/tenant.guard';

/**
 * "Auth" bu yerda ataylab minimal: to'liq login/JWT/refresh flow
 * task doirasidan tashqarida (ko'ring DESIGN.md). Faqat tenant
 * identifikatsiyasi uchun TenantGuard shu yerda expose qilinadi.
 */
@Module({
  imports: [CompaniesModule],
  providers: [TenantGuard],
  exports: [TenantGuard],
})
export class AuthModule {}
