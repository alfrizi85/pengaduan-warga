import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from '../../category/dto/create-category.dto';
import { UpdateCategoryDto } from '../../category/dto/update-category.dto';
import { AdminAuditService } from '../audit/admin-audit.service';

@Injectable()
export class AdminCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async findAll() {
    return this.prisma.db.orm.public.Category
      .where({})
      .all();
  }

  async findOne(id: string) {
    const category =
      await this.prisma.db.orm.public.Category
        .where({ id })
        .first();

    if (!category) {
      throw new NotFoundException(
        'Category tidak ditemukan.',
      );
    }

    return category;
  }

  async create(dto: CreateCategoryDto, adminId: string) {
    const existingCategory =
      await this.prisma.db.orm.public.Category
        .where({ name: dto.name })
        .first();

    if (existingCategory) {
      throw new ConflictException(
        'Category dengan nama tersebut sudah ada.',
      );
    }

    const category = await this.prisma.db.orm.public.Category.create({
      name: dto.name,
      description: dto.description,
    });

    await this.audit.create({
      actorId: adminId,
      action: 'CREATE_CATEGORY',
      entityType: 'Category',
      entityId: category.id,
      metadata: { name: category.name },
    });

    return category;
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    adminId: string,
  ) {
    const category =
      await this.prisma.db.orm.public.Category
        .where({ id })
        .first();

    if (!category) {
      throw new NotFoundException(
        'Category tidak ditemukan.',
      );
    }

    if (
      dto.name &&
      dto.name !== category.name
    ) {
      const existingCategory =
        await this.prisma.db.orm.public.Category
          .where({ name: dto.name })
          .first();

      if (
        existingCategory &&
        existingCategory.id !== id
      ) {
        throw new ConflictException(
          'Category dengan nama tersebut sudah ada.',
        );
      }
    }

    const updatedCategory = await this.prisma.db.orm.public.Category
      .where({ id })
      .update({
        name: dto.name ?? category.name,
        description:
          dto.description ?? category.description,
      });

    await this.audit.create({
      actorId: adminId,
      action: 'UPDATE_CATEGORY',
      entityType: 'Category',
      entityId: id,
      metadata: {
        fromName: category.name,
        toName: updatedCategory?.name ?? dto.name ?? category.name,
        fromDescription: category.description,
        toDescription:
          updatedCategory?.description ??
          dto.description ??
          category.description,
      },
    });

    return updatedCategory;
  }

  async setActive(
    id: string,
    isActive: boolean,
    adminId: string,
  ) {
    const category =
      await this.prisma.db.orm.public.Category
        .where({ id })
        .first();

    if (!category) {
      throw new NotFoundException(
        'Category tidak ditemukan.',
      );
    }

    const updatedCategory = await this.prisma.db.orm.public.Category
      .where({ id })
      .update({
        isActive,
      });

    await this.audit.create({
      actorId: adminId,
      action: 'UPDATE_CATEGORY_STATUS',
      entityType: 'Category',
      entityId: id,
      metadata: {
        fromIsActive: category.isActive,
        toIsActive: isActive,
      },
    });

    return updatedCategory;
  }

  async getUsage(id: string) {
    const category =
      await this.prisma.db.orm.public.Category
        .where({ id })
        .first();

    if (!category) {
      throw new NotFoundException(
        'Category tidak ditemukan.',
      );
    }

    const complaints =
      await this.prisma.db.orm.public.Complaint
        .where({
          categoryId: id,
          deletedAt: null,
        })
        .all();

    return {
      categoryId: id,
      categoryName: category.name,
      totalComplaints: complaints.length,
    };
  }
}
