module.exports = {
  'settings': {
    'react':{
      'pragma': 'React',
      'version': 'detect'
    },
  },
  'globals': {
    'NodeJS': true,
  },
  'root': true,
  'env': {
    'browser': true,
    'es2021': true,
    'node': true,
    'jest': true
  },
  'extends': [
    'eslint:recommended',
  ],
  'overrides': [
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'project': './tsconfig.json',
    'ecmaVersion': 'latest',
    'sourceType': 'module'
  },
  'plugins': [
    'react',
    '@typescript-eslint'
  ],
  'rules': {
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'no-unused-vars': 'off',
  }
};
