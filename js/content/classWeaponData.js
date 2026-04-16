(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const Content = GameApp.Content = GameApp.Content || {};
  const Classes = Content.Classes = Content.Classes || {};

  const CLASSES = {
    mage: {
      id: "mage",
      name: "法师",
      nameEn: "Mage",
      icon: "🔮",
      description: "元素特化的远程爆发专家",
      descDetail: "伤害+30% | 血量-20% | 暴击率+10%",
      color: "#bf5af2",
      stats: {
        bulletDamage: 1.30,
        playerMaxHealth: 0.80,
        critRate: 0.10,
        critDamageMulti: 0.20,
        burnChance: 0.05,
        burnDamage: 5,
        burnDuration: 2.0,
        expMultiplier: 1.10
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
      color: "#ff3b30",
      stats: {
        playerMaxHealth: 1.40,
        bulletDamage: 0.90,
        damageReduction: 0.15,
        regenRate: 0.5,
        knockbackForce: 20,
        thornsDamagePercent: 0.10
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
      color: "#34c759",
      stats: {
        critRate: 0.20,
        critDamageMulti: 0.50,
        playerSpeedMulti: 1.25,
        playerMaxHealth: 0.85,
        dodgeChance: 0.08,
        shootInterval: 0.90,
        killHealAmount: 3
      },
      passiveSkills: [
        { name: "致命一击", description: "背刺额外伤害" }
      ]
    }
  };

  const WEAPONS = {
    sniper: {
      id: "sniper",
      name: "狙击枪",
      nameEn: "Sniper Rifle",
      icon: "🎯",
      description: "一击必杀的远程利器",
      descDetail: "伤害+80% | 射速-50% | 穿透+2",
      color: "#4aa3ff",
      stats: {
        bulletDamage: 1.80,
        shootInterval: 1.50,
        pierceCount: 2,
        bulletSpeedMulti: 1.40,
        bulletScale: 0.8,
        bulletLifetime: 2.5,
        knockbackForce: 30
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
      color: "#ffd60a",
      stats: {
        bulletDamage: 1.15,
        shootInterval: 0.80,
        bulletCount: 1,
        spreadAngle: 0.10,
        bulletSpeedMulti: 1.15,
        pierceCount: 1
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
      color: "#ff9500",
      stats: {
        bulletDamage: 0.70,
        shootInterval: 0.50,
        bulletCount: 2,
        spreadAngle: 0.25,
        bulletSpeedMulti: 0.90,
        bulletScale: 0.85
      },
      visual: {
        bulletColor: "#ff9500",
        bulletTrail: false,
        shootEffect: "smg"
      }
    }
  };

  Classes.CLASSES = CLASSES;
  Classes.WEAPONS = WEAPONS;
})();
