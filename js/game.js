/**
 * 游戏核心逻辑模块
 * 包含游戏配置和游戏对象创建
 */

// 游戏配置
const GameConfig = {
  basePlayerSpeed: 200,
  baseBulletSpeed: 600,
  baseEnemySpeed: 80,
  mapSize: 3000,
  difficultyScaling: 0.15
};

// ID 序列生成器
let _idSeq = 1;
function nextId() { return _idSeq++; }

// 导出游戏模块
window.GameConfig = GameConfig;
window.nextId = nextId;
