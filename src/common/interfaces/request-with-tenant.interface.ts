import { Request } from 'express';
import { CompanyDocument } from 'src/modules/companies/schemas/company.schema';

export interface RequestWithTenant extends Request {
  company: CompanyDocument;
}
