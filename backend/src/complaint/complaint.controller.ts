import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  diskStorage,
} from 'multer';

import { extname } from 'path';

import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { CreateComplaintCommentDto } from './dto/create-complaint-comment.dto';

@Controller('complaints')
export class ComplaintController {
  constructor(
    private readonly complaintService: ComplaintService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateComplaintDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.complaintService.create(
      dto,
      user.sub,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.complaintService.findAll(user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.complaintService.findOne(
      id,
      user.sub,
    );
  }

  @Patch(':id')
@UseGuards(JwtAuthGuard)
update(
  @Param('id') id: string,
  @Body() dto: UpdateComplaintDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.complaintService.update(
    id,
    user.sub,
    dto,
  );
}

@Delete(':id')
@UseGuards(JwtAuthGuard)
remove(
  @Param('id') id: string,
  @CurrentUser() user: JwtPayload,
) {
  return this.complaintService.remove(
    id,
    user.sub,
  );
}

@Patch(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
updateStatus(
  @Param('id') id: string,
  @Body() dto: UpdateComplaintStatusDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.complaintService.updateStatus(
    id,
    user.sub,
    dto,
  );
}

@Get(':id/history')
@UseGuards(JwtAuthGuard)
getStatusHistory(
  @Param('id') id: string,
  @CurrentUser() user: JwtPayload,
) {
  return this.complaintService.getStatusHistory(
    id,
    user.sub,
    user.role,
  );
}

@Post(':id/comments')
@UseGuards(JwtAuthGuard)
createComment(
  @Param('id') id: string,
  @Body() dto: CreateComplaintCommentDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.complaintService.createComment(
    id,
    user.sub,
    user.role,
    dto,
  );
}

@Get(':id/comments')
@UseGuards(JwtAuthGuard)
getComments(
  @Param('id') id: string,
  @CurrentUser() user: JwtPayload,
) {
  return this.complaintService.getComments(
    id,
    user.sub,
    user.role,
  );
}

@Post(':id/attachments')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/complaints',

      filename: (_req, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();

        const uniqueName = `${crypto.randomUUID()}${extension}`;

        callback(null, uniqueName);
      },
    }),

    // Maksimal 5 MB.
    limits: {
      fileSize: 5 * 1024 * 1024,
    },

    // Validasi format SEBELUM file ditulis ke disk.
    fileFilter: (_req, file, callback) => {
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException(
            'Format file tidak didukung. Gunakan JPG, PNG, atau PDF.',
          ),
          false,
        );
      }

      callback(null, true);
    },
  }),
)
uploadAttachment(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: JwtPayload,
) {
  return this.complaintService.uploadAttachment(
    id,
    user.sub,
    file,
  );
}

}3