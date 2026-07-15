import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TasksService } from 'src/modules/tasks/tasks.service';
import { TasksRepository } from 'src/modules/tasks/repositories/tasks.repository';
import { TaskStatus } from 'src/modules/tasks/schemas/task.schema';

describe('TasksService.reviewTask', () => {
  let service: TasksService;
  let repo: { findByIdForCompany: jest.Mock; updateStatus: jest.Mock };

  const companyId = new Types.ObjectId();
  const taskId = new Types.ObjectId().toString();

  beforeEach(async () => {
    repo = { findByIdForCompany: jest.fn(), updateStatus: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: TasksRepository, useValue: repo }],
    }).compile();

    service = module.get(TasksService);
  });

  it('throws NotFoundException when the task does not exist for this company (cross-tenant lookups 404, not 403)', async () => {
    repo.findByIdForCompany.mockResolvedValue(null);

    await expect(service.reviewTask(taskId, companyId, 'accept')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when the task was already reviewed (prevents re-processing races)', async () => {
    repo.findByIdForCompany.mockResolvedValue({ _id: taskId, companyId, status: TaskStatus.ACCEPTED });

    await expect(service.reviewTask(taskId, companyId, 'accept')).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('accepts a pending task and persists status=accepted', async () => {
    repo.findByIdForCompany.mockResolvedValue({ _id: taskId, companyId, status: TaskStatus.PENDING });
    repo.updateStatus.mockResolvedValue({ _id: taskId, companyId, status: TaskStatus.ACCEPTED });

    const result = await service.reviewTask(taskId, companyId, 'accept');

    expect(repo.updateStatus).toHaveBeenCalledWith(taskId, companyId, TaskStatus.ACCEPTED);
    expect(result.status).toBe(TaskStatus.ACCEPTED);
  });

  it('rejects a pending task and persists status=rejected', async () => {
    repo.findByIdForCompany.mockResolvedValue({ _id: taskId, companyId, status: TaskStatus.PENDING });
    repo.updateStatus.mockResolvedValue({ _id: taskId, companyId, status: TaskStatus.REJECTED });

    const result = await service.reviewTask(taskId, companyId, 'reject');

    expect(repo.updateStatus).toHaveBeenCalledWith(taskId, companyId, TaskStatus.REJECTED);
    expect(result.status).toBe(TaskStatus.REJECTED);
  });
});
