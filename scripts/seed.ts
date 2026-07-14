/**
 * Demo seed: bitta company + user (bir nechta email bilan) yaratadi.
 * Chiqarilgan companyId'ni `x-company-id` header sifatida ishlating
 * (GET /tasks, POST /tasks/:id/review uchun).
 *
 * Ishlatish: npm run seed
 */
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/crm_tasks';
  await mongoose.connect(uri);

  const CompanySchema = new mongoose.Schema(
    { name: String },
    { collection: 'companies', timestamps: true },
  );
  const UserSchema = new mongoose.Schema(
    { name: String, companyId: mongoose.Schema.Types.ObjectId, emails: [String] },
    { collection: 'users', timestamps: true },
  );

  const CompanyModel = mongoose.model('SeedCompany', CompanySchema, 'companies');
  const UserModel = mongoose.model('SeedUser', UserSchema, 'users');

  const company = await CompanyModel.create({ name: 'Acme Inc' });

  const user = await UserModel.create({
    name: 'Ali',
    companyId: company._id,
    emails: ['sales@acme.com', 'ali@acme.com'],
  });

  console.log('--- Seed complete ---');
  console.log('Company:', company.name);
  console.log('x-company-id header value:', company._id.toString());
  console.log('User emails routed to this company:', user.emails.join(', '));
  console.log('---------------------');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
