import { ConfigService } from '@nestjs/config';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix utama seluruh REST API.
  // Contoh: /api/users, /api/complaints
  app.setGlobalPrefix('api');

  // API versioning menggunakan URL.
  // Contoh: /api/v1/users
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Ambil PORT dari environment melalui ConfigService.
  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('PORT')) || 3000;

  await app.listen(port);
}

bootstrap();