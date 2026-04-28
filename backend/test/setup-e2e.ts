/**
 * Jest globalSetup — tüm e2e testlerden ÖNCE bir kez çalışır.
 *
 * Sorumlulukları:
 *  1. .env.test'i yükle
 *  2. krontech_test database'ini oluştur (yoksa)
 *  3. Migrations'ı deploy et
 *
 * Bu sayede developer sadece `npm run test:e2e` derse yeter.
 */
import { execSync } from 'child_process';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

const TEST_DB_NAME = 'krontech_test';
const POSTGRES_CONTAINER = 'krontech_postgres';

function run(cmd: string, opts: { silent?: boolean } = {}): string {
  try {
    return execSync(cmd, {
      stdio: opts.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
    });
  } catch (err) {
    if (!opts.silent) throw err;
    return '';
  }
}

function isContainerRunning(name: string): boolean {
  try {
    const out = execSync(`docker ps --format '{{.Names}}'`, { encoding: 'utf-8' });
    return out.split('\n').some((n) => n.trim() === name);
  } catch {
    return false;
  }
}

export default async function globalSetup(): Promise<void> {
  // 1. .env.test'i yükle
  loadEnv({ path: resolve(__dirname, '..', '.env.test'), override: true });
  process.env.NODE_ENV = 'test';

  console.log('\n[e2e] Test DB setup başlıyor...');

  // 2. Postgres container çalışıyor mu kontrol et
  if (!isContainerRunning(POSTGRES_CONTAINER)) {
    throw new Error(
      `Postgres container "${POSTGRES_CONTAINER}" çalışmıyor. Önce \`docker compose up -d postgres redis\` çalıştır.`,
    );
  }

  // 3. Test DB yoksa yarat (idempotent)
  console.log(`[e2e] "${TEST_DB_NAME}" database hazırlanıyor...`);
  run(
    `docker exec ${POSTGRES_CONTAINER} psql -U krontech -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='${TEST_DB_NAME}'" | grep -q 1 || docker exec ${POSTGRES_CONTAINER} psql -U krontech -d postgres -c "CREATE DATABASE ${TEST_DB_NAME}"`,
    { silent: true },
  );

  // 4. Migrations deploy (prisma migrate deploy — dev mode'un aksine prompt yok)
  console.log('[e2e] Prisma migrations deploy ediliyor...');
  run('npx prisma migrate deploy', { silent: false });

  console.log('[e2e] Setup tamam ✓\n');
}
