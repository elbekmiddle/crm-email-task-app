import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getMongooseConfig = (config: ConfigService): MongooseModuleOptions => ({
  uri: config.get<string>('env.mongodbUri'),
});
