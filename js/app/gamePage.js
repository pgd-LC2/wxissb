import { bootGame } from './bootGame.js';

bootGame(document.getElementById('app')).catch((error) => {
  console.error('游戏页面启动失败', error);
});
