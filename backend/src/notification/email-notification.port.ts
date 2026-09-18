export interface EmailNotification {
  userId: string;
  title: string;
  message: string;
  type: string;
}

export abstract class EmailNotificationPort {
  abstract send(notification: EmailNotification): Promise<void>;
}