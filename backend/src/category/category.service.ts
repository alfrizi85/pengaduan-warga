import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCategoryDto) {
    const existingCategory =
      await this.prisma.db.orm.public.Category
        .where({ name: dto.name })
        .first();

    if (existingCategory) {
      throw new ConflictException(
        'Category dengan nama tersebut sudah ada.',
      );
    }

    const category =
      await this.prisma.db.orm.public.Category.create({
        name: dto.name,
        description: dto.description,
      });

    return category;
  }

  async findAll() {
    return this.prisma.db.orm.public.Category
      .where({ isActive: true })
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

  async update(id: string, dto: UpdateCategoryDto) {
    const category =
      await this.prisma.db.orm.public.Category
        .where({ id })
        .first();

    if (!category) {
      throw new NotFoundException(
        'Category tidak ditemukan.',
      );
    }

    // Jika nama diubah, pastikan tidak bentrok dengan category lain.
    if (dto.name && dto.name !== category.name) {
      const existingCategory =
        await this.prisma.db.orm.public.Category
          .where({ name: dto.name })
          .first();

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(
          'Category dengan nama tersebut sudah ada.',
        );
      }
    }

    return this.prisma.db.orm.public.Category
      .where({ id })
      .update({
        name: dto.name ?? category.name,
        description:
          dto.description ?? category.description,
      });
  }
  
  async deactivate(id: string) {
  const category =
    await this.prisma.db.orm.public.Category
      .where({ id })
      .first();

  if (!category) {
    throw new NotFoundException(
      'Category tidak ditemukan.',
    );
  }

  return this.prisma.db.orm.public.Category
    .where({ id })
    .update({
      isActive: false,
    });
}
}
