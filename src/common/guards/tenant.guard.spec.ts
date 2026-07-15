import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { CompaniesRepository } from 'src/modules/companies/repositories/companies.repository';

function makeContext(headers: Record<string, string | undefined>): ExecutionContext {
  const request: any = { headers, company: undefined };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let repo: { findById: jest.Mock };

  beforeEach(async () => {
    repo = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantGuard, { provide: CompaniesRepository, useValue: repo }],
    }).compile();

    guard = module.get(TenantGuard);
  });

  it('rejects when x-company-id header is missing', async () => {
    const ctx = makeContext({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when x-company-id is not a valid ObjectId (prevents NoSQL-injection-shaped input)', async () => {
    const ctx = makeContext({ 'x-company-id': 'not-an-object-id; DROP TABLE' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('rejects when the company does not exist — never leaks whether the ID is "almost valid"', async () => {
    const validId = new Types.ObjectId().toString();
    repo.findById.mockResolvedValue(null);

    const ctx = makeContext({ 'x-company-id': validId });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the resolved company to the request and allows the call through', async () => {
    const validId = new Types.ObjectId().toString();
    const fakeCompany = { _id: validId, name: 'Acme Inc' };
    repo.findById.mockResolvedValue(fakeCompany);

    const request: any = { headers: { 'x-company-id': validId } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(request.company).toBe(fakeCompany);
  });
});
