import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TasksRepository } from 'src/modules/tasks/repositories/tasks.repository';
import { CreateTaskDto } from 'src/modules/tasks/dto/create-task.dto';
import { GetTasksQueryDto } from 'src/modules/tasks/dto/get-tasks-query.dto';
import { TaskDocument, TaskStatus } from 'src/modules/tasks/schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  createTask(dto: CreateTaskDto): Promise<TaskDocument> {
    return this.tasksRepository.create(dto);
  }

  async listTasks(companyId: Types.ObjectId, query: GetTasksQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { items, total } = await this.tasksRepository.findAllForCompany(
      companyId,
      query.status,
      page,
      limit,
    );

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reviewTask(
    taskId: string,
    companyId: Types.ObjectId,
    action: 'accept' | 'reject',
  ): Promise<TaskDocument> {
    const task = await this.tasksRepository.findByIdForCompany(taskId, companyId);
    if (!task) {
      throw new NotFoundException('Task topilmadi');
    }
    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException('Faqat pending statusdagi task review qilinishi mumkin');
    }

    const newStatus = action === 'accept' ? TaskStatus.ACCEPTED : TaskStatus.REJECTED;
    const updated = await this.tasksRepository.updateStatus(taskId, companyId, newStatus);
    if (!updated) {
      throw new NotFoundException('Task topilmadi');
    }
    return updated;
  }
}
