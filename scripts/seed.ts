/**
 * Demo seed: bitta company + user (bir nechta email bilan) yaratadi
 * va sinov uchun kerak bo'ladigan Bearer tokenni konsolga chiqaradi.
 *
 * Ishlatish: npm run seed
 */
import * as mongoose from 'mongoose';
import { randomBytes } from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/crm_tasks';
  await mongoose.connect(uri);

  const CompanySchema = new mongoose.Schema(
    { name: String, apiToken: String },
    { collection: 'companies', timestamps: true },
  );
  const UserSchema = new mongoose.Schema(
    { name: String, companyId: mongoose.Schema.Types.ObjectId, emails: [String] },
    { collection: 'users', timestamps: true },
  );

  const CompanyModel = mongoose.model('SeedCompany', CompanySchema, 'companies');
  const UserModel = mongoose.model('SeedUser', UserSchema, 'users');

  const apiToken = randomBytes(24).toString('hex');
  const company = await CompanyModel.create({ name: 'Acme Inc', apiToken });

  const user = await UserModel.create({
    name: 'Ali',
    companyId: company._id,
    emails: ['sales@acme.com', 'ali@acme.com'],
  });

  console.log('--- Seed complete ---');
  console.log('Company:', company.name, company._id.toString());
  console.log('Bearer token (use in Authorization header):', apiToken);
  console.log('User emails routed to this company:', user.emails.join(', '));
  console.log('---------------------');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
