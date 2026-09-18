import { Module } from '@nestjs/common';
import { ComplaintController } from './complaint.controller';
import { ComplaintService } from './complaint.service';
import { AdminAuditModule } from '../admin/audit/admin-audit.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [AdminAuditModule, NotificationModule],
  controllers: [ComplaintController],
  providers: [ComplaintService],
})
export class ComplaintModule {}
