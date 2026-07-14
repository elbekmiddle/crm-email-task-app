import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CompaniesRepository } from 'src/modules/companies/repositories/companies.repository';
import { CompanyDocument } from 'src/modules/companies/schemas/company.schema';

@Injectable()
export class CompaniesService {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  async createCompany(name: string): Promise<CompanyDocument> {
    const apiToken = randomBytes(24).toString('hex');
    return this.companiesRepository.create({ name, apiToken });
  }
}
