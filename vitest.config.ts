import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    env: {
      VANITY_INDEX_PATH: './layers/vanity-index/vanity-index.json',
      CALLER_RECORD_TABLE_NAME: 'test-vanity-numbers',
      VANITY_NUMBERS_TO_SAVE: '5',
      VANITY_NUMBERS_TO_RETURN: '3',
      STRIPE_SECRET: 'sk_test_placeholder',
      ENVIRONMENT: 'development',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
});
