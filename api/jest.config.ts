import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',

  testMatch: ['**/*.spec-unit.ts'],

  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
      },
    ],
  },

  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1'
  },

  moduleDirectories: ['node_modules', '<rootDir>'],

  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage'
};

export default config;