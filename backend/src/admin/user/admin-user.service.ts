import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  async findAll(dto: AdminUserQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const users =
      await this.prisma.db.orm.public.User
        .where({
          deletedAt: null,
        })
        .all();

    let filtered = users;

    if (dto.role) {
      filtered = filtered.filter(
        (user) => user.role === dto.role,
      );
    }

    if (dto.search) {
      const keyword = dto.search.trim().toLowerCase();

      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(keyword) ||
          user.email.toLowerCase().includes(keyword) ||
          (user.username ?? '').toLowerCase().includes(keyword),
      );
    }

    filtered.sort(
      (a, b) =>
        b.createdAt.epochMilliseconds -
        a.createdAt.epochMilliseconds,
    );

    const total = filtered.length;
    const offset = (page - 1) * limit;

    const data = filtered.slice(
      offset,
      offset + limit,
    );

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user =
      await this.prisma.db.orm.public.User
        .where({
          id,
          deletedAt: null,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        'User tidak ditemukan.',
      );
    }

    return user;
  }

  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    currentAdminId: string,
  ) {
    const user =
      await this.prisma.db.orm.public.User
        .where({
          id,
          deletedAt: null,
        })
        .first();

    if (!user) {
      throw new NotFoundException(
        'User tidak ditemukan.',
      );
    }

    if (
      id === currentAdminId &&
      dto.role !== 'ADMIN'
    ) {
      throw new BadRequestException(
        'Admin tidak dapat menurunkan role dirinya sendiri.',
      );
    }

    const previousRole = user.role;

    const updatedUser =
      await this.prisma.db.orm.public.User
        .where({
          id,
          deletedAt: null,
        })
        .update({
          role: dto.role,
        });

    await this.adminAuditService.create({
      actorId: currentAdminId,
      action: 'UPDATE_USER_ROLE',
      entityType: 'User',
      entityId: id,
      metadata: {
        fromRole: previousRole,
        toRole: dto.role,
      },
    });

    return updatedUser;
  }
}
