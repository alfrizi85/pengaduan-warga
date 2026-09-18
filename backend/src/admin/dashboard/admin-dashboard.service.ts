import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(dto: AdminDashboardQueryDto) {
    const complaints =
      await this.prisma.db.orm.public.Complaint
        .where({
          deletedAt: null,
        })
        .all();

    const categories =
      await this.prisma.db.orm.public.Category
        .where({})
        .all();

    let filteredComplaints = complaints;

    if (dto.fromDate) {
      const fromTime = Date.parse(dto.fromDate);

      if (Number.isNaN(fromTime)) {
        throw new BadRequestException(
          'fromDate tidak valid.',
        );
      }

      filteredComplaints =
        filteredComplaints.filter(
          (complaint) =>
            complaint.createdAt.epochMilliseconds >=
            fromTime,
        );
    }

    if (dto.toDate) {
      const toTime = Date.parse(dto.toDate);

      if (Number.isNaN(toTime)) {
        throw new BadRequestException(
          'toDate tidak valid.',
        );
      }

      filteredComplaints =
        filteredComplaints.filter(
          (complaint) =>
            complaint.createdAt.epochMilliseconds <=
            toTime,
        );
    }

    if (
      dto.fromDate &&
      dto.toDate &&
      Date.parse(dto.fromDate) > Date.parse(dto.toDate)
    ) {
      throw new BadRequestException(
        'fromDate tidak boleh lebih besar dari toDate.',
      );
    }

    const total = filteredComplaints.length;

    const status = {
      submitted: filteredComplaints.filter(
        (complaint) =>
          complaint.status === 'SUBMITTED',
      ).length,
      processing: filteredComplaints.filter(
        (complaint) =>
          complaint.status === 'PROCESSING',
      ).length,
      resolved: filteredComplaints.filter(
        (complaint) =>
          complaint.status === 'RESOLVED',
      ).length,
      rejected: filteredComplaints.filter(
        (complaint) =>
          complaint.status === 'REJECTED',
      ).length,
    };

    const byCategory = categories.map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      totalComplaints:
        filteredComplaints.filter(
          (complaint) =>
            complaint.categoryId === category.id,
        ).length,
    }));
    const trendMap = new Map<string, number>();

for (const complaint of filteredComplaints) {
  const dateKey = complaint.createdAt
    .toString()
    .slice(0, 10);

  trendMap.set(
    dateKey,
    (trendMap.get(dateKey) ?? 0) + 1,
  );
}

const trend = Array.from(trendMap.entries())
  .sort(([dateA], [dateB]) =>
    dateA.localeCompare(dateB),
  )
  .map(([date, totalComplaints]) => ({
    date,
    totalComplaints,
  }));

    return {
      period: {
        fromDate: dto.fromDate ?? null,
        toDate: dto.toDate ?? null,
      },
      total,
      status,
      byCategory,
      trend,
    };
  }
}