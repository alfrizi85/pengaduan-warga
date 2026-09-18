import { 
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AdminComplaintQueryDto } from './dto/admin-complaint-query.dto';
import { AssignComplaintDto } from './dto/assign-complaint.dto';
import { AdminAuditService } from '../audit/admin-audit.service';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class AdminComplaintService {
  constructor(
    private readonly prisma: PrismaService,
      private readonly audit: AdminAuditService,
      private readonly notifications: NotificationService,
  ) {}

  async findAll(dto: AdminComplaintQueryDto) {
  const page = dto.page ?? 1;
  const limit = dto.limit ?? 20;

  const complaints =
    await this.prisma.db.orm.public.Complaint
      .where({
        deletedAt: null,
      })
      .all();

  let filtered = complaints;

  // Filter status.
  if (dto.status) {
    filtered = filtered.filter(
      (complaint) =>
        complaint.status === dto.status,
    );
  }

  // Filter category.
  if (dto.categoryId) {
    filtered = filtered.filter(
      (complaint) =>
        complaint.categoryId === dto.categoryId,
    );
  }

  // Filter assignment berdasarkan UUID.
  if (dto.assignedToId) {
    filtered = filtered.filter(
      (complaint) =>
        complaint.assignedToId === dto.assignedToId,
    );
  }

  // Filter complaint yang belum ditugaskan.
  if (dto.unassigned === true) {
    filtered = filtered.filter(
      (complaint) =>
        complaint.assignedToId === null,
    );
  }

  // Search.
  if (dto.search) {
    const keyword = dto.search
      .trim()
      .toLowerCase();

    filtered = filtered.filter(
      (complaint) =>
        complaint.title
          .toLowerCase()
          .includes(keyword) ||
        complaint.publicCode
          .toLowerCase()
          .includes(keyword) ||
        complaint.description
          .toLowerCase()
          .includes(keyword) ||
        (complaint.locationAddress ?? '')
          .toLowerCase()
          .includes(keyword),
    );
  }

  // Filter tanggal berdasarkan createdAt.
  if (dto.fromDate) {
    const fromTime = Date.parse(dto.fromDate);

    filtered = filtered.filter(
      (complaint) =>
        complaint.createdAt.epochMilliseconds >=
        fromTime,
    );
  }

  if (dto.toDate) {
    const toTime = Date.parse(dto.toDate);

    filtered = filtered.filter(
      (complaint) =>
        complaint.createdAt.epochMilliseconds <=
        toTime,
    );
  }

  // Complaint terbaru di atas.
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
      totalPages:
        Math.ceil(total / limit),
    },
  };
}

async findOne(id: string) {
  const complaint =
    await this.prisma.db.orm.public.Complaint
      .where({
        id,
        deletedAt: null,
      })
      .first();

  if (!complaint) {
    throw new NotFoundException(
      'Pengaduan tidak ditemukan.',
    );
  }

  const [
    reporter,
    assignedTo,
    category,
    statusHistory,
    comments,
    attachments,
  ] = await Promise.all([
    this.prisma.db.orm.public.User
      .where({
        id: complaint.userId,
        deletedAt: null,
      })
      .first(),

    complaint.assignedToId
      ? this.prisma.db.orm.public.User
          .where({
            id: complaint.assignedToId,
            deletedAt: null,
          })
          .first()
      : null,

    this.prisma.db.orm.public.Category
      .where({
        id: complaint.categoryId,
      })
      .first(),

    this.prisma.db.orm.public.ComplaintStatusHistory
      .where({
        complaintId: id,
      })
      .all(),

    this.prisma.db.orm.public.ComplaintComment
      .where({
        complaintId: id,
      })
      .all(),

    this.prisma.db.orm.public.ComplaintAttachment
      .where({
        complaintId: id,
      })
      .all(),
  ]);

  return {
    complaint,
    reporter,
    assignedTo,
    category,
    statusHistory,
    comments,
    attachments,
  };
}

async assign(
  complaintId: string,
  adminId: string,
  dto: AssignComplaintDto,
) {
  const complaint =
    await this.prisma.db.orm.public.Complaint
      .where({
        id: complaintId,
        deletedAt: null,
      })
      .first();

  if (!complaint) {
    throw new NotFoundException(
      'Pengaduan tidak ditemukan.',
    );
  }

  const admin =
    await this.prisma.db.orm.public.User
      .where({
        id: dto.assignedToId,
        deletedAt: null,
      })
      .first();

  if (!admin) {
    throw new NotFoundException(
      'User yang akan menerima assignment tidak ditemukan.',
    );
  }

  if (admin.role !== 'ADMIN') {
    throw new BadRequestException(
      'Pengaduan hanya dapat ditugaskan kepada ADMIN.',
    );
  }

  const previousAssignedToId = complaint.assignedToId;

  const updatedComplaint =
    await this.prisma.db.orm.public.Complaint
      .where({
        id: complaintId,
        deletedAt: null,
      })
      .update({
        assignedToId: dto.assignedToId,
      });

  await this.audit.create({
    actorId: adminId,
    action: previousAssignedToId
      ? 'CHANGE_COMPLAINT_ASSIGNMENT'
      : 'ASSIGN_COMPLAINT',
    entityType: 'Complaint',
    entityId: complaintId,
    metadata: {
      previousAssignedToId,
      assignedToId: dto.assignedToId,
    },
  });

  await this.notifications.create({
    userId: dto.assignedToId,
    title: 'Pengaduan ditugaskan',
    message: `Anda menerima assignment untuk pengaduan ${complaintId}.`,
    type: 'COMPLAINT_ASSIGNED',
  });

  return updatedComplaint;
}

async unassign(complaintId: string, adminId: string) {
  const complaint =
    await this.prisma.db.orm.public.Complaint
      .where({
        id: complaintId,
        deletedAt: null,
      })
      .first();

  if (!complaint) {
    throw new NotFoundException(
      'Pengaduan tidak ditemukan.',
    );
  }

  if (!complaint.assignedToId) {
    throw new BadRequestException(
      'Pengaduan belum memiliki petugas.',
    );
  }

  const updatedComplaint =
    await this.prisma.db.orm.public.Complaint
      .where({
        id: complaintId,
        deletedAt: null,
      })
      .update({
        assignedToId: null,
      });

  await this.audit.create({
    actorId: adminId,
    action: 'UNASSIGN_COMPLAINT',
    entityType: 'Complaint',
    entityId: complaintId,
    metadata: {
      previousAssignedToId: complaint.assignedToId,
      assignedToId: null,
    },
  });

  return updatedComplaint;
}

}