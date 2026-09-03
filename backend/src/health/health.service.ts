import { Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  HealthIndicatorService,
} from '@nestjs/terminus';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthIndicator: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  async check() {
    return this.health.check([
      async () => this.healthIndicator.check('application').up(),

      async () => {
        try {
          // Query ringan untuk memastikan PostgreSQL benar-benar bisa diakses.
          await this.prisma.db.orm.public.User
            .where({})
            .first();

          return this.healthIndicator.check('database').up();
        } catch {
          return this.healthIndicator
            .check('database')
            .down();
        }
      },
    ]);
  }
}