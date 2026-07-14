import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from 'src/modules/tasks/schemas/task.schema';
import { TasksRepository } from 'src/modules/tasks/repositories/tasks.repository';
import { TasksService } from 'src/modules/tasks/tasks.service';
import { TasksController } from 'src/modules/tasks/tasks.controller';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CompaniesModule } from 'src/modules/companies/companies.module'

@Module({
  imports: [MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]), AuthModule, CompaniesModule],
  controllers: [TasksController],
  providers: [TasksRepository, TasksService],
  exports: [TasksRepository, TasksService],
})
export class TasksModule {}
