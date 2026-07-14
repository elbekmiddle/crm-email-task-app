import { Injectable } from '@nestjs/common';
import { CompaniesRepository } from 'src/modules/companies/repositories/companies.repository';
import { CompanyDocument } from 'src/modules/companies/schemas/company.schema';

@Injectable()
export class CompaniesService {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  createCompany(name: string): Promise<CompanyDocument> {
    return this.companiesRepository.create({ name });
  }
}
