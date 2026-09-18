import { BadRequestException } from '@nestjs/common';
import { AdminUserService } from './admin-user.service';

describe('AdminUserService', () => {
  function createService() {
    const prisma = {
      db: { orm: { public: { User: { where: jest.fn() } } } },
    };
    const audit = { create: jest.fn() };
    return {
      service: new AdminUserService(prisma as never, audit as never),
      prisma,
      audit,
    };
  }

  it('searches and filters users', async () => {
    const { service, prisma } = createService();
    prisma.db.orm.public.User.where.mockReturnValue({
      all: jest.fn().mockResolvedValue([
        { id: '1', name: 'Alice', email: 'alice@example.test', username: 'alice', role: 'USER', createdAt: { epochMilliseconds: 1 } },
        { id: '2', name: 'Bob', email: 'bob@example.test', username: 'bob', role: 'ADMIN', createdAt: { epochMilliseconds: 2 } },
      ]),
    });

    const result = await service.findAll({ search: 'alice', role: 'USER' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('1');
  });

  it('prevents an admin from lowering their own role and audits other role changes', async () => {
    const { service, prisma, audit } = createService();
    prisma.db.orm.public.User.where
      .mockReturnValueOnce({ first: jest.fn().mockResolvedValue({ id: 'admin-1', role: 'ADMIN' }) });

    await expect(service.updateRole('admin-1', { role: 'USER' }, 'admin-1'))
      .rejects.toBeInstanceOf(BadRequestException);

    prisma.db.orm.public.User.where
      .mockReturnValueOnce({ first: jest.fn().mockResolvedValue({ id: 'user-1', role: 'USER' }) })
      .mockReturnValueOnce({ update: jest.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' }) });

    await service.updateRole('user-1', { role: 'ADMIN' }, 'admin-1');

    expect(audit.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'UPDATE_USER_ROLE',
      metadata: { fromRole: 'USER', toRole: 'ADMIN' },
    }));
  });
});