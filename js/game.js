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
  difficultyScaling: 0.15,

  // ------------------------------
  // 反馈/手感
  // ------------------------------
  // 命中停顿（Hit Stop）会在击中/击杀时短暂“减速时间”，
  // 这是一个爽感特效，但会让“移动感觉卡一下”，即使 FPS 仍然是 60。
  // 为了保证操作丝滑 & 不会出现你描述的“敌人一死就卡”的问题，默认关闭。
  // 如果你后续想要更强的打击感，可以改成 true 自行体验。
  hitStopEnabled: false
};

// ID 序列生成器
let _idSeq = 1;
function nextId() { return _idSeq++; }

// 导出游戏模块
window.GameConfig = GameConfig;
window.nextId = nextId;
