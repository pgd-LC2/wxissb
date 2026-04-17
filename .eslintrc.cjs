module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: {
    'no-restricted-globals': ['error', { name: 'GameApp', message: '禁止使用浏览器全局 GameApp。' }],
  },
};
