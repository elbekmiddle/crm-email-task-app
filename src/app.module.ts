import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import envConfig from 'src/config/env/env.config';
import { validateEnv } from 'src/config/env/env.schema';
import { getMongooseConfig } from 'src/config/database/mongoose.config';
import { CompaniesModule } from 'src/modules/companies/companies.module';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { EmailsModule } from 'src/modules/emails/emails.module';
import { AiModule } from 'src/modules/ai/ai.module';
import { QueueModule } from 'src/modules/queue/queue.module';
import { TasksModule } from 'src/modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validate: validateEnv,
    }),

    // IP boshiga 1 daqiqada 60 so'rov — webhook endpoint uchun ham
    // qo'shimcha himoya (THREATS.md ga qarang).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getMongooseConfig,
    }),

    CompaniesModule,
    UsersModule,
    AuthModule,
    AiModule,
    QueueModule,
    EmailsModule,
    TasksModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
