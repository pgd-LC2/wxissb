/**
 * 职业和武器选择系统
 * Class and Weapon Selection System
 *
 * 职业（Classes）：
 * - 法师（Mage）: 高伤害、低血量，魔法增强
 * - 战士（Warrior）: 高血量、高防御，近战增强
 * - 刺客（Assassin）: 高暴击、高速度，灵活
 *
 * 武器（Weapons）：
 * - 狙击枪（Sniper）: 高伤害、低射速、高穿透
 * - 突击步枪（Assault Rifle）: 平衡型、中等射速
 * - 冲锋枪（SMG）: 低伤害、高射速、高散射
 */
(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  // ========================================
  // 职业定义 (Class Definitions)
  // ========================================
  const CLASSES = {
    mage: {
      id: "mage",
      name: "法师",
      nameEn: "Mage",
      icon: "🔮",
      description: "魔法的化身，掌控元素之力",
      descDetail: "伤害+30% | 血量-20% | 暴击率+10%",
      color: "#bf5af2", // 紫色
      stats: {
        bulletDamage: 1.30,         // 子弹伤害 +30%
        playerMaxHealth: 0.80,       // 血量 -20%
        critRate: 0.10,              // 暴击率 +10%
        critDamageMulti: 0.20,       // 暴击伤害 +20%
        burnChance: 0.05,            // 5% 燃烧几率
        burnDamage: 5,               // 燃烧伤害
        burnDuration: 2.0,           // 燃烧持续时间
        expMultiplier: 1.10          // 经验获取 +10%
      },
      passiveSkills: [
        { name: "元素亲和", description: "所有元素伤害 +15%" }
      ]
    },
    warrior: {
      id: "warrior",
      name: "战士",
      nameEn: "Warrior",
      icon: "⚔️",
      description: "坚不可摧的钢铁意志",
      descDetail: "血量+40% | 伤害-10% | 减伤+15%",
      color: "#ff3b30", // 红色
      stats: {
        playerMaxHealth: 1.40,       // 血量 +40%
        bulletDamage: 0.90,          // 伤害 -10%
        damageReduction: 0.15,       // 减伤 +15%
        regenRate: 0.5,              // 每秒回血
        knockbackForce: 20,          // 击退力 +20
        thornsDamagePercent: 0.10    // 反伤 10%
      },
      passiveSkills: [
        { name: "铁壁", description: "低血量时额外减伤" }
      ]
    },
    assassin: {
      id: "assassin",
      name: "刺客",
      nameEn: "Assassin",
      icon: "🗡️",
      description: "暗影中的致命猎手",
      descDetail: "暴击+20% | 速度+25% | 血量-15%",
      color: "#34c759", // 绿色
      stats: {
        critRate: 0.20,              // 暴击率 +20%
        critDamageMulti: 0.50,       // 暴击伤害 +50%
        playerSpeedMulti: 1.25,      // 移动速度 +25%
        playerMaxHealth: 0.85,       // 血量 -15%
        dodgeChance: 0.08,           // 闪避 8%
        shootInterval: 0.90,         // 射速 +10% (乘数越小越快)
        killHealAmount: 3            // 击杀回血
      },
      passiveSkills: [
        { name: "致命一击", description: "背刺额外伤害" }
      ]
    }
  };

  // ========================================
  // 武器定义 (Weapon Definitions)
  // ========================================
  const WEAPONS = {
    sniper: {
      id: "sniper",
      name: "狙击枪",
      nameEn: "Sniper Rifle",
      icon: "🎯",
      description: "一击必杀的远程利器",
      descDetail: "伤害+80% | 射速-50% | 穿透+2",
      color: "#4aa3ff", // 蓝色
      stats: {
        bulletDamage: 1.80,          // 伤害 +80%
        shootInterval: 1.50,         // 射速 -50% (乘数越大越慢)
        pierceCount: 2,              // 穿透 +2
        bulletSpeedMulti: 1.40,      // 子弹速度 +40%
        bulletScale: 0.8,            // 子弹大小 -20%
        bulletLifetime: 2.5,         // 子弹存活时间 +
        knockbackForce: 30           // 击退 +30
      },
      visual: {
        bulletColor: "#00d7ff",
        bulletTrail: true,
        shootEffect: "sniper"
      }
    },
    assault: {
      id: "assault",
      name: "突击步枪",
      nameEn: "Assault Rifle",
      icon: "🔫",
      description: "攻守兼备的全能武器",
      descDetail: "伤害+15% | 射速+20% | 平衡型",
      color: "#ffd60a", // 黄色
      stats: {
        bulletDamage: 1.15,          // 伤害 +15%
        shootInterval: 0.80,         // 射速 +20%
        bulletCount: 1,              // 子弹数量
        spreadAngle: 0.10,           // 散布角度较小
        bulletSpeedMulti: 1.15,      // 子弹速度 +15%
        pierceCount: 1               // 穿透 +1
      },
      visual: {
        bulletColor: "#ffd60a",
        bulletTrail: false,
        shootEffect: "assault"
      }
    },
    smg: {
      id: "smg",
      name: "冲锋枪",
      nameEn: "SMG",
      icon: "💨",
      description: "弹幕覆盖的火力压制",
      descDetail: "伤害-30% | 射速+100% | 子弹+1",
      color: "#ff9500", // 橙色
      stats: {
        bulletDamage: 0.70,          // 伤害 -30%
        shootInterval: 0.50,         // 射速 +100% (乘数=0.5表示翻倍)
        bulletCount: 2,              // 每次发射 2 颗子弹
        spreadAngle: 0.25,           // 散布角度较大
        bulletSpeedMulti: 0.90,      // 子弹速度 -10%
        bulletScale: 0.85            // 子弹略小
      },
      visual: {
        bulletColor: "#ff9500",
        bulletTrail: false,
        shootEffect: "smg"
      }
    }
  };

  // ========================================
  // 选择状态管理
  // ========================================
  const SelectionState = {
    selectedClass: null,
    selectedWeapon: null,
    isSelectionComplete: false,
    callbacks: {
      onComplete: null
    }
  };

  // ========================================
  // 核心函数：应用职业属性到游戏对象
  // ========================================
  function applyClassToGame(game, classId) {
    const classData = CLASSES[classId];
    if (!classData) {
      console.warn(`[ClassWeaponSystem] 未知职业: ${classId}`);
      return false;
    }

    const stats = classData.stats;

    // 应用乘法属性（基于基础值的百分比调整）
    if (stats.bulletDamage !== undefined) {
      game.bulletDamage = Math.round(game.bulletDamage * stats.bulletDamage);
    }
    if (stats.playerMaxHealth !== undefined) {
      game.playerMaxHealth = Math.round(game.playerMaxHealth * stats.playerMaxHealth);
      game.playerHealth = game.playerMaxHealth; // 重置到满血
    }
    if (stats.playerSpeedMulti !== undefined) {
      game.playerSpeedMulti *= stats.playerSpeedMulti;
    }
    if (stats.shootInterval !== undefined) {
      game.shootInterval *= stats.shootInterval;
    }

    // 应用加法属性
    if (stats.critRate !== undefined) {
      game.critRate += stats.critRate;
    }
    if (stats.critDamageMulti !== undefined) {
      game.critDamageMulti += stats.critDamageMulti;
    }
    if (stats.damageReduction !== undefined) {
      game.damageReduction += stats.damageReduction;
    }
    if (stats.regenRate !== undefined) {
      game.regenRate += stats.regenRate;
    }
    if (stats.knockbackForce !== undefined) {
      game.knockbackForce += stats.knockbackForce;
    }
    if (stats.thornsDamagePercent !== undefined) {
      game.thornsDamagePercent += stats.thornsDamagePercent;
    }
    if (stats.dodgeChance !== undefined) {
      game.dodgeChance += stats.dodgeChance;
    }
    if (stats.killHealAmount !== undefined) {
      game.killHealAmount += stats.killHealAmount;
    }
    if (stats.expMultiplier !== undefined) {
      game.expMultiplier *= stats.expMultiplier;
    }
    if (stats.burnChance !== undefined) {
      game.burnChance += stats.burnChance;
    }
    if (stats.burnDamage !== undefined) {
      game.burnDamage += stats.burnDamage;
    }
    if (stats.burnDuration !== undefined) {
      game.burnDuration = Math.max(game.burnDuration, stats.burnDuration);
    }

    // 记录已选职业
    game.selectedClass = classData;
    game.player.color = classData.color;

    console.log(`[ClassWeaponSystem] 已应用职业: ${classData.name}`);
    return true;
  }

  // ========================================
  // 核心函数：应用武器属性到游戏对象
  // ========================================
  function applyWeaponToGame(game, weaponId) {
    const weaponData = WEAPONS[weaponId];
    if (!weaponData) {
      console.warn(`[ClassWeaponSystem] 未知武器: ${weaponId}`);
      return false;
    }

    const stats = weaponData.stats;

    // 应用乘法属性
    if (stats.bulletDamage !== undefined) {
      game.bulletDamage = Math.round(game.bulletDamage * stats.bulletDamage);
    }
    if (stats.shootInterval !== undefined) {
      game.shootInterval *= stats.shootInterval;
    }
    if (stats.bulletSpeedMulti !== undefined) {
      game.bulletSpeedMulti *= stats.bulletSpeedMulti;
    }
    if (stats.bulletScale !== undefined) {
      game.bulletScale *= stats.bulletScale;
    }

    // 应用加法/替换属性
    if (stats.bulletCount !== undefined) {
      game.bulletCount = Math.max(game.bulletCount, stats.bulletCount);
    }
    if (stats.pierceCount !== undefined) {
      game.pierceCount += stats.pierceCount;
    }
    if (stats.spreadAngle !== undefined) {
      game.spreadAngle = stats.spreadAngle;
    }
    if (stats.bulletLifetime !== undefined) {
      game.bulletLifetime = stats.bulletLifetime;
    }
    if (stats.knockbackForce !== undefined) {
      game.knockbackForce += stats.knockbackForce;
    }

    // 记录已选武器
    game.selectedWeapon = weaponData;

    // 应用视觉效果配置
    if (weaponData.visual) {
      game.weaponVisual = weaponData.visual;
    }

    console.log(`[ClassWeaponSystem] 已应用武器: ${weaponData.name}`);
    return true;
  }

  // ========================================
  // UI 创建函数
  // ========================================
  function createSelectionUI() {
    // 检查是否已存在
    if (document.getElementById("classWeaponOverlay")) {
      return document.getElementById("classWeaponOverlay");
    }

    const overlay = document.createElement("div");
    overlay.id = "classWeaponOverlay";
    overlay.className = "cw-overlay";
    overlay.innerHTML = `
      <div class="cw-panel">
        <div class="cw-header">
          <h1 class="cw-title">选择职业和武器</h1>
          <p class="cw-subtitle">开始你的冒险之旅</p>
        </div>

        <!-- 步骤指示器 -->
        <div class="cw-steps">
          <div class="cw-step active" data-step="1">
            <span class="cw-step-num">1</span>
            <span class="cw-step-text">选择职业</span>
          </div>
          <div class="cw-step-line"></div>
          <div class="cw-step" data-step="2">
            <span class="cw-step-num">2</span>
            <span class="cw-step-text">选择武器</span>
          </div>
        </div>

        <!-- 职业选择面板 -->
        <div id="classSelection" class="cw-selection-panel">
          <div class="cw-options" id="classOptions"></div>
        </div>

        <!-- 武器选择面板 -->
        <div id="weaponSelection" class="cw-selection-panel hidden">
          <div class="cw-options" id="weaponOptions"></div>
        </div>

        <!-- 确认面板 -->
        <div id="confirmPanel" class="cw-confirm-panel hidden">
          <div class="cw-selection-summary">
            <div class="cw-summary-item" id="summaryClass"></div>
            <div class="cw-summary-item" id="summaryWeapon"></div>
          </div>
          <button id="cwConfirmBtn" class="cw-confirm-btn">开始战斗！</button>
          <button id="cwBackBtn" class="cw-back-btn">返回修改</button>
        </div>
      </div>
    `;

    document.getElementById("root").appendChild(overlay);
    return overlay;
  }

  // ========================================
  // 渲染职业选项
  // ========================================
  function renderClassOptions() {
    const container = document.getElementById("classOptions");
    if (!container) return;

    container.innerHTML = "";

    Object.values(CLASSES).forEach((cls) => {
      const card = document.createElement("div");
      card.className = "cw-card";
      card.dataset.id = cls.id;
      card.style.setProperty("--card-color", cls.color);

      card.innerHTML = `
        <div class="cw-card-icon" style="background: ${cls.color}20; color: ${cls.color}">
          ${cls.icon}
        </div>
        <div class="cw-card-content">
          <div class="cw-card-header">
            <span class="cw-card-name">${cls.name}</span>
            <span class="cw-card-name-en">${cls.nameEn}</span>
          </div>
          <div class="cw-card-desc">${cls.description}</div>
          <div class="cw-card-stats">${cls.descDetail}</div>
        </div>
        <div class="cw-card-select">
          <span class="cw-select-indicator">›</span>
        </div>
      `;

      card.addEventListener("click", () => selectClass(cls.id));
      container.appendChild(card);
    });
  }

  // ========================================
  // 渲染武器选项
  // ========================================
  function renderWeaponOptions() {
    const container = document.getElementById("weaponOptions");
    if (!container) return;

    container.innerHTML = "";

    Object.values(WEAPONS).forEach((weapon) => {
      const card = document.createElement("div");
      card.className = "cw-card";
      card.dataset.id = weapon.id;
      card.style.setProperty("--card-color", weapon.color);

      card.innerHTML = `
        <div class="cw-card-icon" style="background: ${weapon.color}20; color: ${weapon.color}">
          ${weapon.icon}
        </div>
        <div class="cw-card-content">
          <div class="cw-card-header">
            <span class="cw-card-name">${weapon.name}</span>
            <span class="cw-card-name-en">${weapon.nameEn}</span>
          </div>
          <div class="cw-card-desc">${weapon.description}</div>
          <div class="cw-card-stats">${weapon.descDetail}</div>
        </div>
        <div class="cw-card-select">
          <span class="cw-select-indicator">›</span>
        </div>
      `;

      card.addEventListener("click", () => selectWeapon(weapon.id));
      container.appendChild(card);
    });
  }

  // ========================================
  // 选择职业
  // ========================================
  function selectClass(classId) {
    SelectionState.selectedClass = classId;

    // 更新卡片选中状态
    document.querySelectorAll("#classOptions .cw-card").forEach(card => {
      card.classList.toggle("selected", card.dataset.id === classId);
    });

    // 进入武器选择
    setTimeout(() => {
      document.getElementById("classSelection").classList.add("hidden");
      document.getElementById("weaponSelection").classList.remove("hidden");

      // 更新步骤指示器
      document.querySelector('.cw-step[data-step="1"]').classList.remove("active");
      document.querySelector('.cw-step[data-step="1"]').classList.add("completed");
      document.querySelector('.cw-step[data-step="2"]').classList.add("active");
    }, 200);
  }

  // ========================================
  // 选择武器
  // ========================================
  function selectWeapon(weaponId) {
    SelectionState.selectedWeapon = weaponId;

    // 更新卡片选中状态
    document.querySelectorAll("#weaponOptions .cw-card").forEach(card => {
      card.classList.toggle("selected", card.dataset.id === weaponId);
    });

    // 显示确认面板
    setTimeout(() => {
      showConfirmPanel();
    }, 200);
  }

  // ========================================
  // 显示确认面板
  // ========================================
  function showConfirmPanel() {
    const cls = CLASSES[SelectionState.selectedClass];
    const weapon = WEAPONS[SelectionState.selectedWeapon];

    // 更新摘要
    document.getElementById("summaryClass").innerHTML = `
      <span class="cw-summary-icon" style="color: ${cls.color}">${cls.icon}</span>
      <span class="cw-summary-text">${cls.name}</span>
    `;
    document.getElementById("summaryWeapon").innerHTML = `
      <span class="cw-summary-icon" style="color: ${weapon.color}">${weapon.icon}</span>
      <span class="cw-summary-text">${weapon.name}</span>
    `;

    document.getElementById("weaponSelection").classList.add("hidden");
    document.getElementById("confirmPanel").classList.remove("hidden");

    document.querySelector('.cw-step[data-step="2"]').classList.remove("active");
    document.querySelector('.cw-step[data-step="2"]').classList.add("completed");
  }

  // ========================================
  // 返回修改选择
  // ========================================
  function goBackToSelection() {
    SelectionState.selectedClass = null;
    SelectionState.selectedWeapon = null;

    // 重置所有卡片
    document.querySelectorAll(".cw-card").forEach(card => {
      card.classList.remove("selected");
    });

    // 重置步骤指示器
    document.querySelectorAll(".cw-step").forEach(step => {
      step.classList.remove("active", "completed");
    });
    document.querySelector('.cw-step[data-step="1"]').classList.add("active");

    // 显示职业选择
    document.getElementById("confirmPanel").classList.add("hidden");
    document.getElementById("weaponSelection").classList.add("hidden");
    document.getElementById("classSelection").classList.remove("hidden");
  }

  // ========================================
  // 确认选择并开始游戏
  // ========================================
  function confirmSelection() {
    if (!SelectionState.selectedClass || !SelectionState.selectedWeapon) {
      console.warn("[ClassWeaponSystem] 选择不完整");
      return;
    }

    SelectionState.isSelectionComplete = true;

    // 隐藏选择界面
    const overlay = document.getElementById("classWeaponOverlay");
    if (overlay) {
      overlay.classList.add("hiding");
      setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.classList.remove("hiding");
      }, 300);
    }

    // 触发回调
    if (typeof SelectionState.callbacks.onComplete === "function") {
      SelectionState.callbacks.onComplete(
        SelectionState.selectedClass,
        SelectionState.selectedWeapon
      );
    }
  }

  // ========================================
  // 初始化绑定事件
  // ========================================
  function initializeEvents() {
    const confirmBtn = document.getElementById("cwConfirmBtn");
    const backBtn = document.getElementById("cwBackBtn");

    if (confirmBtn) {
      confirmBtn.addEventListener("click", confirmSelection);
    }
    if (backBtn) {
      backBtn.addEventListener("click", goBackToSelection);
    }
  }

  // ========================================
  // 主入口：显示选择界面
  // ========================================
  function showSelectionScreen(onComplete) {
    // 重置状态
    SelectionState.selectedClass = null;
    SelectionState.selectedWeapon = null;
    SelectionState.isSelectionComplete = false;
    SelectionState.callbacks.onComplete = onComplete;

    // 创建UI
    const overlay = createSelectionUI();

    // 渲染选项
    renderClassOptions();
    renderWeaponOptions();

    // 绑定事件
    initializeEvents();

    // 重置面板状态
    document.getElementById("classSelection").classList.remove("hidden");
    document.getElementById("weaponSelection").classList.add("hidden");
    document.getElementById("confirmPanel").classList.add("hidden");

    // 重置步骤
    document.querySelectorAll(".cw-step").forEach(step => {
      step.classList.remove("active", "completed");
    });
    document.querySelector('.cw-step[data-step="1"]').classList.add("active");

    // 显示界面
    overlay.classList.remove("hidden", "hiding");
  }

  // ========================================
  // 导出到 GameApp
  // ========================================
  GameApp.ClassWeaponSystem = {
    CLASSES,
    WEAPONS,
    SelectionState,
    showSelectionScreen,
    applyClassToGame,
    applyWeaponToGame,
    getSelectedClass: () => CLASSES[SelectionState.selectedClass],
    getSelectedWeapon: () => WEAPONS[SelectionState.selectedWeapon]
  };

})();
