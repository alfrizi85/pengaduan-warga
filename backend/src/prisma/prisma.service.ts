import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit {
  private prismaDb: typeof import('@civicresolve/database').db | null = null;

  async onModuleInit() {
    const database = await import('@civicresolve/database');
    this.prismaDb = database.db;
  }

  get db() {
    if (!this.prismaDb) {
      throw new Error('Prisma database client is not initialized.');
    }

    return this.prismaDb;
  }
}
