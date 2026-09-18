import { Test, TestingModule } from '@nestjs/testing';
import { ComplaintService } from './complaint.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from '../admin/audit/admin-audit.service';
import { NotificationService } from '../notification/notification.service';

describe('ComplaintService', () => {
  let service: ComplaintService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: AdminAuditService,
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ComplaintService>(ComplaintService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
