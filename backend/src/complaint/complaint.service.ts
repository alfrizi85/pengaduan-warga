import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Temporal } from '@js-temporal/polyfill';

import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { CreateComplaintCommentDto } from './dto/create-complaint-comment.dto';
@Injectable()
export class ComplaintService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateComplaintDto,
    userId: string,
  ) {
    const category =
      await this.prisma.db.orm.public.Category
        .where({
          id: dto.categoryId,
          isActive: true,
        })
        .first();

    if (!category) {
      throw new NotFoundException(
        'Category tidak ditemukan atau sudah tidak aktif.',
      );
    }

    const publicCode = await this.generatePublicCode();

    const complaint =
      await this.prisma.db.orm.public.Complaint.create({
        publicCode,
        userId,
        categoryId: dto.categoryId,
        title: dto.title,
        locationAddress: dto.locationAddress,
        latitude: dto.latitude,
        longitude: dto.longitude,
        description: dto.description,
      });

    return complaint;
  }

  async findAll(userId: string) {
  return this.prisma.db.orm.public.Complaint
    .where({
      userId,
      deletedAt: null,
    })
    .all();
}

  async findOne(id: string, userId: string) {

    const complaint =
      await this.prisma.db.orm.public.Complaint
        .where({
          id,
          userId,
          deletedAt: null,
        })
        .first();

    if (!complaint) {
      throw new NotFoundException(
        'Pengaduan tidak ditemukan.',
      );
    }

    return complaint;
  }

  async update(
  id: string,
  userId: string,
  dto: UpdateComplaintDto,
) {
  const complaint =
    await this.prisma.db.orm.public.Complaint
      .where({
        id,
        userId,
      })
      .first();

  if (!complaint) {
    throw new NotFoundException(
      'Pengaduan tidak ditemukan.',
    );
  }

  if (complaint.status !== 'SUBMITTED') {
    throw new BadRequestException(
      'Pengaduan hanya dapat diubah saat status masih SUBMITTED.',
    );
  }

  // Jika category diubah, category baru harus aktif.
  if (
    dto.categoryId &&
    dto.categoryId !== complaint.categoryId
  ) {
    const category =
      await this.prisma.db.orm.public.Category
        .where({
          id: dto.categoryId,
          isActive: true,
        })
        .first();

    if (!category) {
      throw new NotFoundException(
        'Category tidak ditemukan atau sudah tidak aktif.',
      );
    }
  }

  return this.prisma.db.orm.public.Complaint
    .where({
      id,
      userId,
    })
    .update({
      title: dto.title ?? complaint.title,
      categoryId:
        dto.categoryId ?? complaint.categoryId,
      locationAddress:
        dto.locationAddress ??
        complaint.locationAddress,
      latitude:
        dto.latitude ?? complaint.latitude,
      longitude:
        dto.longitude ?? complaint.longitude,
      description:
        dto.description ?? complaint.description,
    });
}

  private async generatePublicCode(): Promise<string> {
    const prefix = 'PGR';
    const timestamp = Date.now().toString().slice(-8);

    const code = `${prefix}-${timestamp}`;

    const existing =
      await this.prisma.db.orm.public.Complaint
        .where({ publicCode: code })
        .first();

    if (existing) {
      return `${prefix}-${Date.now()}`;
    }

    return code;
  }

  async remove(id: string, userId: string) {
  const complaint =
    await this.prisma.db.orm.public.Complaint
      .where({
        id,
        userId,
      })
      .first();

  if (!complaint) {
    throw new NotFoundException(
      'Pengaduan tidak ditemukan.',
    );
  }

  if (complaint.status !== 'SUBMITTED') {
    throw new BadRequestException(
      'Pengaduan hanya dapat dihapus saat status masih SUBMITTED.',
    );
  }

  return this.prisma.db.orm.public.Complaint
    .where({
      id,
      userId,
    })
    .update({
      deletedAt: Temporal.Now.instant(),
    });
}

async updateStatus(
  id: string,
  adminId: string,
  dto: UpdateComplaintStatusDto,
) {
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

  const currentStatus = complaint.status;
  const nextStatus = dto.status;

  // Status yang sama tidak perlu diproses ulang.
  if (currentStatus === nextStatus) {
    throw new BadRequestException(
      `Pengaduan sudah berstatus ${currentStatus}.`,
    );
  }

  // Aturan transisi status.
  const allowedTransitions: Record<
    string,
    string[]
  > = {
    SUBMITTED: ['PROCESSING', 'REJECTED'],
    PROCESSING: ['RESOLVED'],
    RESOLVED: [],
    REJECTED: [],
  };

  const allowed =
    allowedTransitions[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Perubahan status dari ${currentStatus} ke ${nextStatus} tidak diperbolehkan.`,
    );
  }

  // Update status complaint.
  const updatedComplaint =
    await this.prisma.db.orm.public.Complaint
      .where({
        id,
        deletedAt: null,
      })
      .update({
        status: nextStatus,
      });

  // Simpan riwayat perubahan status.
  await this.prisma.db.orm.public.ComplaintStatusHistory.create({
    complaintId: id,
    status: nextStatus,
    changedById: adminId,
    note: dto.note,
  });

  return updatedComplaint;
}

async getStatusHistory(
  id: string,
  userId: string,
  role: 'USER' | 'ADMIN',
) {
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

  // USER hanya boleh melihat history complaint miliknya.
  if (
    role === 'USER' &&
    complaint.userId !== userId
  ) {
    throw new NotFoundException(
      'Pengaduan tidak ditemukan.',
    );
  }

  return this.prisma.db.orm.public.ComplaintStatusHistory
    .where({
      complaintId: id,
    })
    .all();
}

async createComment(
  complaintId: string,
  userId: string,
  role: 'USER' | 'ADMIN',
  dto: CreateComplaintCommentDto,
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

  // USER hanya boleh memberi komentar pada complaint miliknya.
  if (
    role === 'USER' &&
    complaint.userId !== userId
  ) {
    throw new NotFoundException(
      'Pengaduan tidak ditemukan.',
    );
  }

  // USER selalu PUBLIC.
  // ADMIN boleh PUBLIC atau INTERNAL.
  const visibility =
    role === 'ADMIN'
      ? dto.visibility ?? 'PUBLIC'
      : 'PUBLIC';

  return this.prisma.db.orm.public.ComplaintComment.create({
    complaintId,
    authorId: userId,
    content: dto.content,
    visibility,
  });
}

async getComments(
  complaintId: string,
  userId: string,
  role: 'USER' | 'ADMIN',
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

  if (
    role === 'USER' &&
    complaint.userId !== userId
  ) {
    throw new NotFoundException(
      'Pengaduan tidak ditemukan.',
    );
  }

  const comments =
    await this.prisma.db.orm.public.ComplaintComment
      .where({
        complaintId,
      })
      .all();

  // USER tidak boleh melihat INTERNAL.
  if (role === 'USER') {
    return comments.filter(
      (comment) => comment.visibility === 'PUBLIC',
    );
  }

  return comments;
}

async uploadAttachment(
  complaintId: string,
  userId: string,
  file: Express.Multer.File,
) {
  if (!file) {
    throw new BadRequestException(
      'File wajib diupload.',
    );
  }

  const complaint =
    await this.prisma.db.orm.public.Complaint
      .where({
        id: complaintId,
        userId,
        deletedAt: null,
      })
      .first();

  if (!complaint) {
    throw new NotFoundException(
      'Pengaduan tidak ditemukan.',
    );
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException(
      'Format file tidak didukung. Gunakan JPG, PNG, atau PDF.',
    );
  }

  return this.prisma.db.orm.public.ComplaintAttachment
    .create({
      complaintId,
      fileName: file.originalname,
      fileUrl: `/uploads/complaints/${file.filename}`,
      mimeType: file.mimetype,
      fileSize: file.size,
    });
}

}
