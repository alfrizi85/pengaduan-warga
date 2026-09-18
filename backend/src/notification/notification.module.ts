import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NoopEmailNotificationAdapter } from './noop-email-notification.adapter';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailNotificationPort } from './email-notification.port';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NoopEmailNotificationAdapter,
    {
      provide: EmailNotificationPort,
      useExisting: NoopEmailNotificationAdapter,
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}