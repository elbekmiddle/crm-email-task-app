import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { TenantResolverService } from 'src/modules/emails/tenant-resolver.service';
import { UsersService } from 'src/modules/users/users.service';

describe('TenantResolverService', () => {
  let service: TenantResolverService;
  let usersService: { findByEmailAddress: jest.Mock };

  beforeEach(async () => {
    usersService = { findByEmailAddress: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantResolverService, { provide: UsersService, useValue: usersService }],
    }).compile();

    service = module.get(TenantResolverService);
  });

  it('returns the companyId when the "to" address matches a known user', async () => {
    const companyId = new Types.ObjectId();
    usersService.findByEmailAddress.mockResolvedValue({ companyId });

    const result = await service.resolveCompanyIdFromEmail('sales@acme.com');

    expect(result).toBe(companyId);
  });

  it('returns null for an unknown address (never enqueues an LLM call for unknown tenants)', async () => {
    usersService.findByEmailAddress.mockResolvedValue(null);

    const result = await service.resolveCompanyIdFromEmail('nobody@random.com');

    expect(result).toBeNull();
  });

  it('lowercases the address before lookup (case-insensitive routing)', async () => {
    usersService.findByEmailAddress.mockResolvedValue(null);

    await service.resolveCompanyIdFromEmail('Sales@ACME.com');

    expect(usersService.findByEmailAddress).toHaveBeenCalledWith('sales@acme.com');
  });
});
