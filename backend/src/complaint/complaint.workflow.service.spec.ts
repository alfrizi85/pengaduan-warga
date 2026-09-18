import { BadRequestException } from '@nestjs/common';
import { ComplaintService } from './complaint.service';

function createService() {
  const audit = { create: jest.fn() };
  const notifications = { create: jest.fn() };
  const prisma = {
    db: {
      orm: {
        public: {
          Complaint: { where: jest.fn() },
          ComplaintStatusHistory: { create: jest.fn(), where: jest.fn() },
          ComplaintComment: { create: jest.fn(), where: jest.fn() },
        },
      },
    },
  };

  return {
    service: new ComplaintService(prisma as never, audit as never, notifications as never),
    prisma,
    audit,
    notifications,
  };
}

describe('ComplaintService workflow rules', () => {
  it.each([
    ['SUBMITTED', 'PROCESSING'],
    ['SUBMITTED', 'REJECTED'],
    ['PROCESSING', 'RESOLVED'],
  ])('allows %s -> %s', async (currentStatus, nextStatus) => {
    const { service, prisma, audit } = createService();
    const complaint = { id: 'complaint-1', status: currentStatus, userId: 'user-1' };
    const update = jest.fn().mockResolvedValue({ ...complaint, status: nextStatus });
    prisma.db.orm.public.Complaint.where
      .mockReturnValueOnce({ first: jest.fn().mockResolvedValue(complaint) })
      .mockReturnValueOnce({ update });
    prisma.db.orm.public.ComplaintStatusHistory.create.mockResolvedValue({ id: 'history-1' });

    await service.updateStatus('complaint-1', 'admin-1', {
      status: nextStatus as never,
      note: 'workflow note',
    });

    expect(update).toHaveBeenCalledWith({ status: nextStatus });
    expect(prisma.db.orm.public.ComplaintStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: nextStatus, changedById: 'admin-1' }),
    );
    expect(audit.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'UPDATE_COMPLAINT_STATUS',
      metadata: expect.objectContaining({ fromStatus: currentStatus, toStatus: nextStatus }),
    }));
  });

  it.each([
    ['PROCESSING', 'SUBMITTED'],
    ['RESOLVED', 'PROCESSING'],
    ['REJECTED', 'PROCESSING'],
  ])('rejects terminal or invalid transition %s -> %s', async (currentStatus, nextStatus) => {
    const { service, prisma } = createService();
    prisma.db.orm.public.Complaint.where.mockReturnValueOnce({
      first: jest.fn().mockResolvedValue({ id: 'complaint-1', status: currentStatus }),
    });

    await expect(service.updateStatus('complaint-1', 'admin-1', {
      status: nextStatus as never,
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forces user comments to PUBLIC and filters internal comments', async () => {
    const { service, prisma } = createService();
    const complaint = { id: 'complaint-1', userId: 'user-1' };
    prisma.db.orm.public.Complaint.where.mockReturnValue({
      first: jest.fn().mockResolvedValue(complaint),
    });
    prisma.db.orm.public.ComplaintComment.create.mockResolvedValue({
      id: 'comment-1',
      visibility: 'PUBLIC',
    });
    prisma.db.orm.public.ComplaintComment.where.mockReturnValue({
      all: jest.fn().mockResolvedValue([
        { id: 'public-1', visibility: 'PUBLIC' },
        { id: 'internal-1', visibility: 'INTERNAL' },
      ]),
    });

    await service.createComment('complaint-1', 'user-1', 'USER', {
      content: 'public message',
      visibility: 'INTERNAL',
    });
    const comments = await service.getComments('complaint-1', 'user-1', 'USER');

    expect(prisma.db.orm.public.ComplaintComment.create).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: 'PUBLIC' }),
    );
    expect(comments).toEqual([{ id: 'public-1', visibility: 'PUBLIC' }]);
  });

  it('allows admins to create and read internal comments with an audit entry', async () => {
    const { service, prisma, audit } = createService();
    prisma.db.orm.public.Complaint.where.mockReturnValue({
      first: jest.fn().mockResolvedValue({ id: 'complaint-1', userId: 'user-1' }),
    });
    prisma.db.orm.public.ComplaintComment.create.mockResolvedValue({ id: 'comment-1' });
    prisma.db.orm.public.ComplaintComment.where.mockReturnValue({
      all: jest.fn().mockResolvedValue([{ id: 'internal-1', visibility: 'INTERNAL' }]),
    });

    await service.createComment('complaint-1', 'admin-1', 'ADMIN', {
      content: 'internal note',
      visibility: 'INTERNAL',
    });
    const comments = await service.getComments('complaint-1', 'admin-1', 'ADMIN');

    expect(comments).toHaveLength(1);
    expect(audit.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'CREATE_COMPLAINT_COMMENT',
      metadata: { complaintId: 'complaint-1', visibility: 'INTERNAL' },
    }));
  });
});