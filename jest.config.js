/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  testEnvironment: 'node',
  transform: {
    "^.+\\.tsx?$": "esbuild-jest"
  },
}
