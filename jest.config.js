const config = {
    preset: 'ts-jest/presets/default-esm',
    collectCoverageFrom: ['src/*.ts', '!**/node_modules/**', '!**/tests/**'],
    moduleNameMapper: {
        'deepl-node(.*)': '<rootDir>/src$1',
        axios: 'axios/dist/node/axios.cjs',
    },
    setupFiles: ['<rootDir>/jest.setup.js'],
};
module.exports = config;
