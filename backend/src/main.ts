import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix utama seluruh REST API.
  app.setGlobalPrefix('api');

  // API versioning menggunakan URL.
  // Contoh: /api/v1/users
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validasi request secara global.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filter exception secara global.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Ambil konfigurasi dari .env
  const configService = app.get(ConfigService);

  // Origin frontend yang diizinkan mengakses API.
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  // Aktifkan CORS hanya untuk frontend yang kita izinkan.
  app.enableCors({
    origin: frontendUrl,
  });

  const port = Number(configService.get<string>('PORT')) || 3000;

  await app.listen(port);
}

bootstrap();