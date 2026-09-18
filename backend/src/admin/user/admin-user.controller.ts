import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';

import { AdminUserService } from './admin-user.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUserController {
  constructor(
    private readonly adminUserService: AdminUserService,
  ) {}

  @Get()
  findAll(@Query() dto: AdminUserQueryDto) {
    return this.adminUserService.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUserService.findOne(id);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminUserService.updateRole(
      id,
      dto,
      user.sub,
    );
  }
}
