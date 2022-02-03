module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
    },
    parserOptions: {
        parser: 'babel-eslint',
    },
    extends: [
        'eslint:recommended',
        'plugin:vue/recommended',
        'plugin:prettier/recommended',
    ],
    // required to lint *.vue files
    plugins: ['vue'],
    // add your custom rules here
    rules: {
        // Custom indenting
        indent: ['error', 4, { SwitchCase: 1 }],
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'vue/no-v-html': 'off',
        'vue/html-indent': [
            'error',
            4,
            {
                attribute: 1,
                baseIndent: 1,
                closeBracket: 0,
                alignAttributesVertically: true,
                ignores: [],
            },
        ],
        'vue/max-attributes-per-line': 'off',
        'vue/html-self-closing': 'off',
    },
};
