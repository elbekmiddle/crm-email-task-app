import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from 'src/modules/companies/schemas/company.schema';

@Injectable()
export class CompaniesRepository {
  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
  ) {}

  create(data: Partial<Company>): Promise<CompanyDocument> {
    return this.companyModel.create(data);
  }

  findById(id: string): Promise<CompanyDocument | null> {
    return this.companyModel.findById(id).exec();
  }

  findByApiToken(apiToken: string): Promise<CompanyDocument | null> {
    return this.companyModel.findOne({ apiToken }).exec();
  }
}
