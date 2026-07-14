import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from 'src/modules/tasks/schemas/task.schema';
import { CreateTaskDto } from 'src/modules/tasks/dto/create-task.dto';

@Injectable()
export class TasksRepository {
  constructor(@InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>) {}

  create(dto: CreateTaskDto): Promise<TaskDocument> {
    return this.taskModel.create(dto);
  }

  async findAllForCompany(
    companyId: Types.ObjectId,
    status: TaskStatus | undefined,
    page: number,
    limit: number,
  ): Promise<{ items: TaskDocument[]; total: number }> {
    const filter: Record<string, unknown> = { companyId };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.taskModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  // Muhim: qidiruv HAR DOIM companyId bilan birga bo'ladi, shuning uchun
  // boshqa kompaniyaning taski review qilinmaydi (cross-tenant IDOR yo'q).
  findByIdForCompany(id: string, companyId: Types.ObjectId): Promise<TaskDocument | null> {
    return this.taskModel.findOne({ _id: id, companyId }).exec();
  }

  async updateStatus(id: string, companyId: Types.ObjectId, status: TaskStatus): Promise<TaskDocument | null> {
    return this.taskModel
      .findOneAndUpdate({ _id: id, companyId }, { status }, { new: true })
      .exec();
  }
}
