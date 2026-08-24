import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

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

  // Ambil PORT dari environment melalui ConfigService.
  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('PORT')) || 3000;

  await app.listen(port);
}

bootstrap();