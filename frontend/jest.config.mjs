import nextJest from 'next/jest.js';

/**
 * Next.js için hazırda gelen Jest konfigürasyonu. SWC ile transform eder,
 * next/font ve next/image'ı mock'lar.
 *
 * Environment: jsdom (DOM'a ihtiyaç duyan component testleri için).
 * Path alias: `@/*` → projenin root'u — tsconfig ile eşleşir.
 */
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  // `.next/standalone` içinde Next build'i package.json kopyalıyor; haste
  // map collision uyarısını engellemek için bu dizini modulePathIgnore'e al.
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
};

export default createJestConfig(customConfig);
