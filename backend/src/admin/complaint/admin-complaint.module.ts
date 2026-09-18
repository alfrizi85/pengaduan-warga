import { Module } from '@nestjs/common';

import { AdminComplaintController } from './admin-complaint.controller';
import { AdminComplaintService } from './admin-complaint.service';
import { AdminAuditModule } from '../audit/admin-audit.module';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [AdminAuditModule, NotificationModule],
  controllers: [AdminComplaintController],
  providers: [AdminComplaintService],
})
export class AdminComplaintModule {}
