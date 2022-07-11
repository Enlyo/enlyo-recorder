module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
    },
    parserOptions: {
        parser: 'babel-eslint',
    },
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    // add your custom rules here
    rules: {
        // Custom indenting
        indent: ['error', 4, { SwitchCase: 1 }],
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'prettier/prettier': [
            'error',
            {
                endOfLine: 'auto',
            },
        ],
    },
};
