import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    'pdfjs-dist': '<rootDir>/__mocks__/pdfjs-dist.ts',
  },
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!pdfjs-dist).+\\.js$',
  ],
  testTimeout: 15000,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov']
};

export default createJestConfig(config);