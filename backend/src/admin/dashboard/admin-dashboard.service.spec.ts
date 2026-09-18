import { BadRequestException } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  const createdAt = (date: string) => ({
    epochMilliseconds: Date.parse(date),
    toString: () => date,
  });

  it('returns status, category, trend, and date-filtered totals', async () => {
    const prisma = {
      db: {
        orm: {
          public: {
            Complaint: { where: jest.fn() },
            Category: { where: jest.fn() },
          },
        },
      },
    };
    prisma.db.orm.public.Complaint.where.mockReturnValue({
      all: jest.fn().mockResolvedValue([
        { status: 'SUBMITTED', categoryId: 'cat-1', createdAt: createdAt('2026-01-01T10:00:00.000Z') },
        { status: 'PROCESSING', categoryId: 'cat-1', createdAt: createdAt('2026-01-02T10:00:00.000Z') },
        { status: 'RESOLVED', categoryId: 'cat-2', createdAt: createdAt('2026-01-03T10:00:00.000Z') },
        { status: 'REJECTED', categoryId: 'cat-2', createdAt: createdAt('2026-01-04T10:00:00.000Z') },
      ]),
    });
    prisma.db.orm.public.Category.where.mockReturnValue({
      all: jest.fn().mockResolvedValue([
        { id: 'cat-1', name: 'Road' },
        { id: 'cat-2', name: 'Waste' },
      ]),
    });

    const result = await new AdminDashboardService(prisma as never).getStatistics({
      fromDate: '2026-01-02T00:00:00.000Z',
      toDate: '2026-01-03T23:59:59.000Z',
    });

    expect(result.total).toBe(2);
    expect(result.status).toEqual({ submitted: 0, processing: 1, resolved: 1, rejected: 0 });
    expect(result.byCategory).toEqual([
      { categoryId: 'cat-1', categoryName: 'Road', totalComplaints: 1 },
      { categoryId: 'cat-2', categoryName: 'Waste', totalComplaints: 1 },
    ]);
    expect(result.trend).toEqual([
      { date: '2026-01-02', totalComplaints: 1 },
      { date: '2026-01-03', totalComplaints: 1 },
    ]);
  });

  it('returns zero statistics for an empty date range', async () => {
    const prisma = {
      db: { orm: { public: {
        Complaint: { where: jest.fn().mockReturnValue({ all: jest.fn().mockResolvedValue([]) }) },
        Category: { where: jest.fn().mockReturnValue({ all: jest.fn().mockResolvedValue([]) }) },
      } } },
    };

    const result = await new AdminDashboardService(prisma as never).getStatistics({
      fromDate: '2027-01-01T00:00:00.000Z',
      toDate: '2027-01-02T00:00:00.000Z',
    });

    expect(result.total).toBe(0);
    expect(result.trend).toEqual([]);
  });

  it('rejects an inverted date range', async () => {
    const prisma = {
      db: { orm: { public: {
        Complaint: { where: jest.fn().mockReturnValue({ all: jest.fn().mockResolvedValue([]) }) },
        Category: { where: jest.fn().mockReturnValue({ all: jest.fn().mockResolvedValue([]) }) },
      } } },
    };

    await expect(new AdminDashboardService(prisma as never).getStatistics({
      fromDate: '2026-02-01T00:00:00.000Z',
      toDate: '2026-01-01T00:00:00.000Z',
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});