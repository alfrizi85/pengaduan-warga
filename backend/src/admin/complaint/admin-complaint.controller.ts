import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';

import { AssignComplaintDto } from './dto/assign-complaint.dto';
import { AdminComplaintService } from './admin-complaint.service';
import { AdminComplaintQueryDto } from './dto/admin-complaint-query.dto';

@Controller('admin/complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminComplaintController {
  constructor(
    private readonly adminComplaintService: AdminComplaintService,
  ) {}

  @Get()
  findAll(
    @Query() dto: AdminComplaintQueryDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    return this.adminComplaintService.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminComplaintService.findOne(id);
  }

  @Patch(':id/assignment')
assign(
  @Param('id') id: string,
  @Body() dto: AssignComplaintDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.adminComplaintService.assign(
    id,
    user.sub,
    dto,
  );
}

  @Patch(':id/assign')
  assignCompatibility(
    @Param('id') id: string,
    @Body() dto: AssignComplaintDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminComplaintService.assign(id, user.sub, dto);
  }

  @Delete(':id/assignment')
  unassign(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminComplaintService.unassign(id, user.sub);
  }

}
