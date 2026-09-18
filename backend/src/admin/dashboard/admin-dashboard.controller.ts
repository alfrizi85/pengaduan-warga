import {
  Controller,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService: AdminDashboardService,
  ) {}

  @Get()
  getStatistics(@Query() dto: AdminDashboardQueryDto) {
    return this.adminDashboardService.getStatistics(dto);
  }
}
