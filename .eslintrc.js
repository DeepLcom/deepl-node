module.exports = exports = {
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    'parser': '@typescript-eslint/parser',
    'plugins': ['@typescript-eslint'],
    'root': true,
    'env': {
        'node': true
    },
    'ignorePatterns': [
        'node_modules/**',
        'dist/**',
        'examples/commonjs/index.js'
    ],
    'rules': {
        'eqeqeq': 'error',
        'quotes': ['error', 'single']
    },
};
