import { Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  HealthIndicatorService,
} from '@nestjs/terminus';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthIndicator: HealthIndicatorService,
  ) {}

  async check() {
    return this.health.check([
      async () => this.healthIndicator.check('application').up(),
    ]);
  }
}