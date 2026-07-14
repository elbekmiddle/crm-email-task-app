import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CompaniesRepository } from 'src/modules/companies/repositories/companies.repository';
import { RequestWithTenant } from 'src/common/interfaces/request-with-tenant.interface';

/**
 * Tenant identification — no auth/login system was in scope for this task,
 * so instead of a full JWT/session layer this guard resolves the tenant
 * from an `x-company-id` header (a real company's Mongo _id, created via
 * `npm run seed` or the Companies API).
 *
 * The important part the task DOES require is still enforced: the client
 * never gets to smuggle a companyId into the body/query of GET /tasks or
 * POST /tasks/:id/review — it's always read here, attached to the request,
 * and every downstream query filters by it. Swapping this guard for real
 * auth later (JWT -> req.user.companyId) doesn't require touching any
 * controller or service code, since they only depend on `req.company`.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const companyId = request.headers['x-company-id'];

    if (!companyId || typeof companyId !== 'string') {
      throw new UnauthorizedException('x-company-id header talab qilinadi');
    }

    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('x-company-id noto`g`ri ObjectId');
    }

    const company = await this.companiesRepository.findById(companyId);
    if (!company) {
      throw new UnauthorizedException('Bunday company topilmadi');
    }

    request.company = company;
    return true;
  }
}
