(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  async function init() {
    // 初始化桌面端摇杆设置
    if (GameApp.JoystickDialog && GameApp.JoystickDialog.initJoystickForDesktop) {
      await GameApp.JoystickDialog.initJoystickForDesktop();
    }

    // 启动游戏
    if (GameApp.Boot && GameApp.Boot.start) {
      GameApp.Boot.start();
    }
  }

  // 检查技能是否是移速技能（开挂模式需要过滤掉）
  function isSpeedSkill(skill) {
    const name = skill.name || "";
    const desc = skill.description || "";
    // 过滤掉所有增加移动速度的技能
    if (name.includes("疾风") || name.includes("移速") || name.includes("速度")) return true;
    if (desc.includes("移动速度") || desc.includes("移速")) return true;
    return false;
  }

  // NB Mode - 开挂模式
  // 在控制台输入 nbmode() 即可启用
  function nbmode() {
    const game = GameApp.Runtime && GameApp.Runtime.getGame
      ? GameApp.Runtime.getGame()
      : null;
    
    if (!game) {
      console.log("❌ 游戏未启动，无法开挂");
      return;
    }

    // 获取所有技能
    const allSkills = game.allSkills || [];
    
    if (allSkills.length === 0) {
      console.log("❌ 技能列表为空");
      return;
    }

    // 标记开挂模式已启用
    game.nbModeActive = true;

    // 应用所有技能（排除移速技能）
    let appliedCount = 0;
    let skippedSpeedSkills = 0;
    const appliedSkills = [];
    
    for (const skill of allSkills) {
      // 跳过已经获取的技能
      if (game.acquiredSkills && game.acquiredSkills.includes(skill.name)) {
        continue;
      }
      
      // 跳过移速技能
      if (isSpeedSkill(skill)) {
        skippedSpeedSkills++;
        continue;
      }
      
      try {
        // 应用技能效果
        if (typeof skill.effect === 'function') {
          skill.effect(game);
          appliedCount++;
          appliedSkills.push(skill.name);
          
          // 记录技能
          if (!game.acquiredSkills) game.acquiredSkills = [];
          game.acquiredSkills.push(skill.name);
          
          if (!game.acquiredSkillMeta) game.acquiredSkillMeta = [];
          game.acquiredSkillMeta.push({ name: skill.name, tier: skill.tier || 1 });
        }
      } catch (e) {
        // 忽略技能应用错误，继续下一个
      }
    }

    // 更新UI
    game.updateUI();

    console.log("🎮 NB Mode 已启用！");
    console.log(`  ✓ 已获取 ${appliedCount} 个技能`);
    console.log(`  ✓ 跳过 ${skippedSpeedSkills} 个移速技能`);
    console.log("  ✓ 升级时将自动随机选择技能");
    console.log("  ✓ 僵尸围城模式：怪物刷新无上限！");
    console.log("");
    console.log("获取的技能列表：");
    appliedSkills.forEach((name, i) => {
      if (i < 20) console.log(`  ${i + 1}. ${name}`);
    });
    if (appliedSkills.length > 20) {
      console.log(`  ... 还有 ${appliedSkills.length - 20} 个技能`);
    }
    
    return `NB Mode Activated! 已获取 ${appliedCount} 个技能 🚀`;
  }

  const debug = GameApp.Debug = GameApp.Debug || {};
  debug.isSpeedSkill = isSpeedSkill;
  debug.nbmode = nbmode;

  // 保留控制台入口，方便本地调试。
  window.nbmode = nbmode;

  init();
})();
