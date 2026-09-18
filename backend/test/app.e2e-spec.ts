import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('protects complaint business endpoints', () => {
    return request(app.getHttpServer())
      .get('/complaints')
      .expect(401);
  });

  it('protects admin workflow endpoints', () => {
    return request(app.getHttpServer())
      .get('/admin/complaints')
      .expect(401);
  });

  it('protects notification endpoints', async () => {
    await request(app.getHttpServer())
      .get('/notifications')
      .expect(401);

    await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .expect(401);

    await request(app.getHttpServer())
      .patch('/notifications/notification-1/read')
      .expect(401);

    await request(app.getHttpServer())
      .post('/notifications/admin')
      .send({
        userId: '00000000-0000-0000-0000-000000000001',
        title: 'Test',
        message: 'Test',
        type: 'TEST',
      })
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
