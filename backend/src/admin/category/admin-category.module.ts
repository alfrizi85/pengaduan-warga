import { Module } from '@nestjs/common';
import { AdminCategoryController } from './admin-category.controller';
import { AdminCategoryService } from './admin-category.service';
import { AdminAuditModule } from '../audit/admin-audit.module';

@Module({
  imports: [AdminAuditModule],
  controllers: [AdminCategoryController],
  providers: [AdminCategoryService],
})
export class AdminCategoryModule {}
