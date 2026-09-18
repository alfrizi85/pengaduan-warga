import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { AdminCategoryService } from './admin-category.service';
import { CreateCategoryDto } from '../../category/dto/create-category.dto';
import { UpdateCategoryDto } from '../../category/dto/update-category.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCategoryController {
  constructor(
    private readonly adminCategoryService: AdminCategoryService,
  ) {}

  @Get()
  findAll() {
    return this.adminCategoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminCategoryService.findOne(id);
  }

  @Get(':id/usage')
  getUsage(@Param('id') id: string) {
    return this.adminCategoryService.getUsage(id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: JwtPayload) {
    return this.adminCategoryService.create(dto, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminCategoryService.update(id, dto, user.sub);
  }

  @Patch(':id/status')
  setActive(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminCategoryService.setActive(
      id,
      body.isActive,
      user.sub,
    );
  }
}
