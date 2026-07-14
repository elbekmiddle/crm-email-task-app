import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { CurrentCompany } from 'src/common/decorators/current-company.decorator';
import { CompanyDocument } from 'src/modules/companies/schemas/company.schema';
import { TasksService } from 'src/modules/tasks/tasks.service';
import { GetTasksQueryDto } from 'src/modules/tasks/dto/get-tasks-query.dto';
import { ReviewTaskDto } from 'src/modules/tasks/dto/review-task.dto';

@ApiTags('tasks')
@ApiHeader({ name: 'x-company-id', description: 'Tenant company Mongo _id', required: true })
@UseGuards(TenantGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(@CurrentCompany() company: CompanyDocument, @Query() query: GetTasksQueryDto) {
    return this.tasksService.listTasks(company._id, query);
  }

  @Post(':id/review')
  review(
    @CurrentCompany() company: CompanyDocument,
    @Param('id') id: string,
    @Body() dto: ReviewTaskDto,
  ) {
    return this.tasksService.reviewTask(id, company._id, dto.action);
  }
}
