import { AdminCategoryService } from './admin-category.service';

describe('AdminCategoryService', () => {
  it('audits category creation and active state changes', async () => {
    const prisma = {
      db: { orm: { public: { Category: { where: jest.fn(), create: jest.fn() } } } },
    };
    const audit = { create: jest.fn() };
    const service = new AdminCategoryService(prisma as never, audit as never);
    prisma.db.orm.public.Category.where
      .mockReturnValueOnce({ first: jest.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({ first: jest.fn().mockResolvedValue({ id: 'cat-1', isActive: true }) })
      .mockReturnValueOnce({ update: jest.fn().mockResolvedValue({ id: 'cat-1', isActive: false }) });
    prisma.db.orm.public.Category.create.mockResolvedValue({ id: 'cat-1', name: 'Road' });

    await service.create({ name: 'Road', description: 'Road issues' }, 'admin-1');
    await service.setActive('cat-1', false, 'admin-1');

    expect(audit.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE_CATEGORY' }));
    expect(audit.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'UPDATE_CATEGORY_STATUS',
      metadata: { fromIsActive: true, toIsActive: false },
    }));
  });
});