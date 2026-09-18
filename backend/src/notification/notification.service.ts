import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Temporal } from '@js-temporal/polyfill';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { EmailNotificationPort } from './email-notification.port';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailNotificationPort,
  ) {}

  async create(input: CreateNotificationDto) {
    const notification = await this.prisma.db.orm.public.Notification.create({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
    });

    await this.email.send({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
    });

    return notification;
  }

  listForUser(userId: string) {
    return this.prisma.db.orm.public.Notification
      .where({ userId })
      .all();
  }

  async unreadCount(userId: string) {
    const notifications = await this.prisma.db.orm.public.Notification
      .where({ userId, readAt: null })
      .all();

    return { count: notifications.length };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.db.orm.public.Notification
      .where({ id, userId })
      .first();

    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan.');
    }

    return this.prisma.db.orm.public.Notification
      .where({ id, userId })
      .update({ readAt: Temporal.Now.instant() });
  }
}