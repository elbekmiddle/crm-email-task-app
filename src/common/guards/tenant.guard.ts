import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CompaniesRepository } from 'src/modules/companies/repositories/companies.repository';
import { RequestWithTenant } from 'src/common/interfaces/request-with-tenant.interface';

/**
 * Minimal tenant authentication.
 *
 * Har bir Company'ga bitta statik "apiToken" beriladi (seed orqali yaratiladi).
 * Client so'rov yuborayotganda:
 *   Authorization: Bearer <company apiToken>
 *
 * Guard shu token orqali companyId ni server tomonda aniqlaydi va
 * req.company ga biriktiradi. Client hech qachon o'zi companyId
 * yubormaydi -> IDOR / cross-tenant leakage oldini oladi.
 *
 * Eslatma: bu productionga yaroqli to'liq auth emas (JWT/refresh/rollar yo'q).
 * DESIGN.md da izohlangan ataylab qilingan soddalashtirish.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token talab qilinadi');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const company = await this.companiesRepository.findByApiToken(token);

    if (!company) {
      throw new UnauthorizedException('Token noto`g`ri');
    }

    request.company = company;
    return true;
  }
}
