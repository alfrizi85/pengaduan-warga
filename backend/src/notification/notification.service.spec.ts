import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  function createService() {
    const prisma = {
      db: { orm: { public: { Notification: { create: jest.fn(), where: jest.fn() } } } },
    };
    const email = { send: jest.fn().mockResolvedValue(undefined) };
    return {
      service: new NotificationService(prisma as never, email as never),
      prisma,
      email,
    };
  }

  it('creates a notification and delegates email delivery', async () => {
    const { service, prisma, email } = createService();
    prisma.db.orm.public.Notification.create.mockResolvedValue({ id: 'notification-1' });

    await service.create({
      userId: 'user-1',
      title: 'Status berubah',
      message: 'Pengaduan diproses.',
      type: 'COMPLAINT_STATUS_CHANGED',
    });

    expect(prisma.db.orm.public.Notification.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      type: 'COMPLAINT_STATUS_CHANGED',
    }));
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
  });

  it('scopes listing and unread count to the requesting user', async () => {
    const { service, prisma } = createService();
    prisma.db.orm.public.Notification.where
      .mockReturnValueOnce({ all: jest.fn().mockResolvedValue([{ id: 'n-1' }]) })
      .mockReturnValueOnce({ all: jest.fn().mockResolvedValue([{ id: 'n-1' }, { id: 'n-2' }]) });

    await expect(service.listForUser('user-1')).resolves.toEqual([{ id: 'n-1' }]);
    await expect(service.unreadCount('user-1')).resolves.toEqual({ count: 2 });

    expect(prisma.db.orm.public.Notification.where).toHaveBeenNthCalledWith(1, { userId: 'user-1' });
    expect(prisma.db.orm.public.Notification.where).toHaveBeenNthCalledWith(2, {
      userId: 'user-1',
      readAt: null,
    });
  });

  it('marks only an owned notification as read', async () => {
    const { service, prisma } = createService();
    const update = jest.fn().mockResolvedValue({ id: 'n-1' });
    prisma.db.orm.public.Notification.where
      .mockReturnValueOnce({ first: jest.fn().mockResolvedValue({ id: 'n-1', userId: 'user-1' }) })
      .mockReturnValueOnce({ update });

    await service.markAsRead('n-1', 'user-1');

    expect(prisma.db.orm.public.Notification.where).toHaveBeenNthCalledWith(1, {
      id: 'n-1',
      userId: 'user-1',
    });
    expect(update).toHaveBeenCalledWith({ readAt: expect.anything() });
  });

  it('does not reveal another user notification', async () => {
    const { service, prisma } = createService();
    prisma.db.orm.public.Notification.where.mockReturnValueOnce({
      first: jest.fn().mockResolvedValue(null),
    });

    await expect(service.markAsRead('n-1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});