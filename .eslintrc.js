module.exports = exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig-eslint.json'],
    },
    plugins: ['@typescript-eslint', 'import'],
    extends: [
        'eslint:recommended',
        'airbnb-typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:eslint-comments/recommended',
        'plugin:promise/recommended',
        'prettier',
    ],
    env: {
        node: true,
    },
    ignorePatterns: ['node_modules/**', 'dist/**', 'examples/**', '**/*.js'],
    rules: {
        eqeqeq: 'error',
        '@typescript-eslint/lines-between-class-members': 'off',
        'react/jsx-filename-extension': 'off',
    },
};
