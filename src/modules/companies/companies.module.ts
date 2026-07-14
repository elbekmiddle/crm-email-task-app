import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from 'src/modules/companies/schemas/company.schema';
import { CompaniesRepository } from 'src/modules/companies/repositories/companies.repository';
import { CompaniesService } from 'src/modules/companies/companies.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }])],
  providers: [CompaniesRepository, CompaniesService],
  exports: [CompaniesRepository, CompaniesService],
})
export class CompaniesModule {}
