/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  moduleFileExtensions: ['js', 'svelte', 'ts'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/src/__mocks__/styleMock.ts',
  },
  testEnvironment: 'jsdom',
  transform: {
    '^.*esm.*/.+\\.js$': '@swc/jest',
    '^.+\\.esm.*js$': '@swc/jest',
    '^.+\\.svelte$': [
      'svelte-jester',
      {
        preprocess: true,
      },
    ],
    '^.+\\.tsx?$': '@swc/jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!@?firebase/)'],
}
