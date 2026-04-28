/**
 * E2E (integration) test konfigürasyonu.
 * Spec dosyaları: test/**\/*.e2e-spec.ts
 *
 * - Gerçek PostgreSQL'e (krontech_test DB) ve gerçek Redis'e (db=1) bağlanır.
 * - NODE_ENV=test set edilir → AppModule .env.test yükler.
 * - globalSetup → test DB'yi yaratır + migrate eder.
 * - runInBand ile sıralı çalışır (DB state birbirini etkilemez).
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  globalSetup: '<rootDir>/setup-e2e.ts',
  globalTeardown: '<rootDir>/teardown-e2e.ts',
  testTimeout: 30_000,
  clearMocks: true,
  restoreMocks: true,
};
