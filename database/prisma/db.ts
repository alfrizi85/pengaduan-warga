import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { Temporal } from '@js-temporal/polyfill';

Object.assign(globalThis, { Temporal });

import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import { fileURLToPath } from 'node:url';

const contractJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('./contract.json', import.meta.url)), 'utf8'),
);

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
