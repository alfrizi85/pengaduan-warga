import { Injectable } from '@nestjs/common';
import {
  EmailNotification,
  EmailNotificationPort,
} from './email-notification.port';

@Injectable()
export class NoopEmailNotificationAdapter extends EmailNotificationPort {
  async send(_notification: EmailNotification): Promise<void> {}
}