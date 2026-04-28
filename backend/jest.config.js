/**
 * Unit test konfigürasyonu.
 * Spec dosyaları: src/**\/*.spec.ts
 *
 * Unit testler hiç DB/Redis'e gitmez — Prisma ve Redis mocklanır.
 * Bu yüzden çok hızlıdır (~1s/dosya) ve CI'da paralel çalışabilir.
 *
 * E2E testleri için test/jest-e2e.config.js'e bak.
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  // Unit testler iş mantığını kapsar: service'ler + pure utility fonksiyonlar.
  // Controller, guard, strategy, decorator, module, DTO → e2e testlerle kapsanır.
  // Bu ayrım test piramidini düzgün temsil eder ve yapay coverage şişmesini önler.
  // Unit coverage yalnızca business logic service'larını ölçer.
  // - PrismaService / RedisService: thin wrapper, e2e'de dolaylı test ediliyor.
  // - Controller/guard/strategy: e2e kapsamında.
  collectCoverageFrom: [
    'modules/**/*.service.ts',
    'common/utils/**/*.ts',
    'common/cache/**/*.ts',
    'common/audit/**/*.ts',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.d.ts',
  ],
  coverageDirectory: '../coverage/unit',
  // Unit testler tek başına %100 hedefi gerçekçi değil — service'lerin önemli
  // kısmı read-path'leri gerçek DB ile doğrulayan e2e testlerde kapsanır.
  // Bu threshold yalnızca "service unit mantığı düşmesin" için guard rail.
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
};
