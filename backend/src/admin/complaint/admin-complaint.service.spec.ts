import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminComplaintService } from './admin-complaint.service';

const complaint = {
  id: 'complaint-1',
  assignedToId: null as string | null,
  deletedAt: null,
};

function createService() {
  const audit = { create: jest.fn() };
  const notifications = { create: jest.fn() };
  const prisma = {
    db: {
      orm: {
        public: {
          Complaint: {
            where: jest.fn(),
          },
          User: {
            where: jest.fn(),
          },
        },
      },
    },
  };

  return {
    service: new AdminComplaintService(prisma as never, audit as never, notifications as never),
    prisma,
    audit,
    notifications,
  };
}

describe('AdminComplaintService assignment workflow', () => {
  it('assigns an admin and records the assignment audit', async () => {
    const { service, prisma, audit } = createService();
    const update = jest.fn().mockResolvedValue({ ...complaint, assignedToId: 'admin-2' });
    prisma.db.orm.public.Complaint.where
      .mockReturnValueOnce({ first: jest.fn().mockResolvedValue(complaint) })
      .mockReturnValueOnce({ update });
    prisma.db.orm.public.User.where.mockReturnValue({
      first: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
    });

    await service.assign('complaint-1', 'admin-1', { assignedToId: 'admin-2' });

    expect(update).toHaveBeenCalledWith({ assignedToId: 'admin-2' });
    expect(audit.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'ASSIGN_COMPLAINT',
      metadata: { previousAssignedToId: null, assignedToId: 'admin-2' },
    }));
  });

  it('records a changed assignment when another admin is already assigned', async () => {
    const { service, prisma, audit } = createService();
    const current = { ...complaint, assignedToId: 'admin-2' };
    prisma.db.orm.public.Complaint.where
      .mockReturnValueOnce({ first: jest.fn().mockResolvedValue(current) })
      .mockReturnValueOnce({ update: jest.fn().mockResolvedValue(current) });
    prisma.db.orm.public.User.where.mockReturnValue({
      first: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
    });

    await service.assign('complaint-1', 'admin-1', { assignedToId: 'admin-3' });

    expect(audit.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'CHANGE_COMPLAINT_ASSIGNMENT',
      metadata: { previousAssignedToId: 'admin-2', assignedToId: 'admin-3' },
    }));
  });

  it('rejects non-admin assignment targets', async () => {
    const { service, prisma } = createService();
    prisma.db.orm.public.Complaint.where.mockReturnValueOnce({
      first: jest.fn().mockResolvedValue(complaint),
    });
    prisma.db.orm.public.User.where.mockReturnValueOnce({
      first: jest.fn().mockResolvedValue({ role: 'USER' }),
    });

    await expect(
      service.assign('complaint-1', 'admin-1', { assignedToId: 'user-2' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('unassigns and records the previous officer', async () => {
    const { service, prisma, audit } = createService();
    const current = { ...complaint, assignedToId: 'admin-2' };
    const update = jest.fn().mockResolvedValue({ ...current, assignedToId: null });
    prisma.db.orm.public.Complaint.where
      .mockReturnValueOnce({ first: jest.fn().mockResolvedValue(current) })
      .mockReturnValueOnce({ update });

    await service.unassign('complaint-1', 'admin-1');

    expect(update).toHaveBeenCalledWith({ assignedToId: null });
    expect(audit.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'UNASSIGN_COMPLAINT',
      metadata: { previousAssignedToId: 'admin-2', assignedToId: null },
    }));
  });

  it('rejects unassigning an unassigned complaint', async () => {
    const { service, prisma } = createService();
    prisma.db.orm.public.Complaint.where.mockReturnValueOnce({
      first: jest.fn().mockResolvedValue(complaint),
    });

    await expect(service.unassign('complaint-1', 'admin-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns not found for a missing complaint', async () => {
    const { service, prisma } = createService();
    prisma.db.orm.public.Complaint.where.mockReturnValueOnce({
      first: jest.fn().mockResolvedValue(null),
    });

    await expect(service.unassign('missing', 'admin-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});