import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { ComplaintModule } from './complaint/complaint.module';
import { AdminComplaintModule } from './admin/complaint/admin-complaint.module';
import { AdminUserModule } from './admin/user/admin-user.module';
import { AdminCategoryModule } from './admin/category/admin-category.module';
import { AdminDashboardModule } from './admin/dashboard/admin-dashboard.module';
import { NotificationModule } from './notification/notification.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CategoryModule,
    ComplaintModule,
    AdminComplaintModule,
    AdminUserModule,
    AdminCategoryModule,
    AdminDashboardModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
