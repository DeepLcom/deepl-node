const config = {
  preset: 'ts-jest/presets/default-esm',
  collectCoverageFrom: [
    'src/*.ts',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  moduleNameMapper: {
    'deepl-node(.*)': '<rootDir>/src$1'
  }
};
module.exports = config;
