import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from 'pg';

// Per-suite Postgres isolation: each test suite (file) gets a freshly created
// database off the devcontainer's `postgres` service, migrations are applied
// via `prisma migrate deploy`, and the database is dropped on teardown.
//
// This replaces Testcontainers (which needs a Docker daemon) — DECISIONS.md
// `Backend Test Isolation — Per-Suite Postgres Database`.

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = resolve(__dirname, '..');

export interface TestDatabase {
  databaseUrl: string;
  databaseName: string;
}

function adminUrl(): string {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL is not set — test setup is misconfigured');
  }
  return url;
}

function buildSuiteUrl(baseUrl: string, databaseName: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const suffix = randomBytes(6).toString('hex');
  const databaseName = `alpfit_test_${suffix}`;

  const admin = new Client({ connectionString: adminUrl() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await admin.end();
  }

  const databaseUrl = buildSuiteUrl(adminUrl(), databaseName);

  execSync('pnpm exec prisma migrate deploy', {
    cwd: BACKEND_ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  return { databaseUrl, databaseName };
}

export async function dropTestDatabase(databaseName: string): Promise<void> {
  const admin = new Client({ connectionString: adminUrl() });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
  } finally {
    await admin.end();
  }
}
