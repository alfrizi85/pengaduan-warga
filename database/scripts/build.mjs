import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const tsc = resolve(root, 'node_modules', 'typescript', 'bin', 'tsc');
const result = spawnSync(process.execPath, [tsc], {
  cwd: root,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const outputDirectory = resolve(root, 'dist', 'prisma');
mkdirSync(outputDirectory, { recursive: true });
cpSync(resolve(root, 'prisma', 'contract.json'), resolve(outputDirectory, 'contract.json'));
cpSync(resolve(root, 'prisma', 'contract.d.ts'), resolve(outputDirectory, 'contract.d.ts'));