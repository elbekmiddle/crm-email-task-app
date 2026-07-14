import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithTenant } from 'src/common/interfaces/request-with-tenant.interface';

/**
 * Controller ichida req.company o'rniga to'g'ridan-to'g'ri companyId/company olish uchun.
 * Muhim: bu ma'lumot HAR DOIM TenantGuard orqali server tomonda aniqlanadi,
 * client hech qachon companyId ni body/query orqali yubormaydi.
 */
export const CurrentCompany = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.company;
  },
);
