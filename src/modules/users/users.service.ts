import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from 'src/modules/users/repositories/users.repository';
import { UserDocument } from 'src/modules/users/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  createUser(name: string, companyId: Types.ObjectId, emails: string[]): Promise<UserDocument> {
    return this.usersRepository.create({
      name,
      companyId,
      emails: emails.map((e) => e.toLowerCase()),
    });
  }

  findByEmailAddress(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmailAddress(email);
  }
}
