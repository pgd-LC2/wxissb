(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const Content = GameApp.Content = GameApp.Content || {};
  const Skills = Content.Skills = Content.Skills || {};

  function buildCyberpunkArsenal() {
    const skills = [];
    let idCounter = 1000;

    const elements = [
      { id: "plasma", name: "等离子", icon: "atom", color: "#00ffff", desc: "爆炸并熔化护甲" },
      { id: "neon", name: "霓虹", icon: "bolt.fill", color: "#ff00ff", desc: "连锁闪电与眩晕" },
      { id: "void", name: "虚空", icon: "circle.hexagongrid.fill", color: "#600080", desc: "黑洞引力与斩杀" },
      { id: "bio", name: "生化", icon: "leaf.fill", color: "#00ff00", desc: "剧毒云与蔓延" }
    ];

    const forms = [
      { id: "bullet", name: "弹头", desc: "你的子弹附带" },
      { id: "nova", name: "新星", desc: "受击释放" },
      { id: "aura", name: "光环", desc: "周围持续释放" },
      { id: "mine", name: "陷阱", desc: "部署" }
    ];

    const levels = ["I", "II", "III", "IV", "V"];
    const levelMult = [1.0, 1.5, 2.2, 3.0, 5.0];

    elements.forEach((elem) => {
      forms.forEach((form) => {
        if (elem.id === "bio" && form.id === "bullet") return;
        if (elem.id === "void" && form.id === "mine") return;
        if (elem.id === "neon" && form.id === "nova") return;

        levels.forEach((lvl, idx) => {
          const tier = idx + 1;
          const power = levelMult[idx];
          skills.push({
            name: `${elem.name}${form.name} ${lvl}`,
            description: `${form.desc}${elem.name}能量，造成${Math.round(20 * power)}点${elem.desc}伤害。`,
            tier,
            icon: elem.icon,
            effect: (g) => {
              if (!g.cyber) g.cyber = {};
              const key = `elem_${elem.id}_${form.id}`;
              g.cyber[key] = (g.cyber[key] || 0) + power;
              if (form.id === "bullet") g.bulletDamage *= (1 + 0.05 * idx);
            }
          });
          idCounter += 1;
        });
      });
    });

    levels.forEach((lvl, idx) => {
      const tier = idx + 1;
      const power = levelMult[idx];
      skills.push({
        name: `重力井陷阱 ${lvl}`,
        description: `部署重力井陷阱，将范围内敌人拉向中心并造成${Math.round(15 * power)}点挤压伤害。持续${(2 + idx).toFixed(0)}秒。`,
        tier,
        icon: "magnet_tech",
        effect: (g) => {
          if (!g.cyber) g.cyber = {};
          const key = "gravity_well_trap";
          g.cyber[key] = (g.cyber[key] || 0) + power;
          g.gravityFieldEnabled = true;
          g.gravityFieldStrength = (g.gravityFieldStrength || 0) + 20 * (idx + 1);
        }
      });
      idCounter += 1;
    });

    levels.forEach((lvl, idx) => {
      const tier = idx + 1;
      const power = levelMult[idx];
      skills.push({
        name: `等离子风暴 ${lvl}`,
        description: `受击时释放等离子冲击波，对周围敌人造成${Math.round(25 * power)}点等离子伤害并附带灼烧效果。冷却${Math.max(1, 4 - idx)}秒。`,
        tier,
        icon: "atom",
        effect: (g) => {
          if (!g.cyber) g.cyber = {};
          g.cyber.plasmaStorm = (g.cyber.plasmaStorm || 0) + power;
          g.plasmaStormEnabled = true;
          g.plasmaStormDamage = (g.plasmaStormDamage || 0) + 25 * power;
          g.plasmaStormRadius = Math.max(g.plasmaStormRadius || 0, 80 + 20 * idx);
          g.plasmaStormCooldown = Math.min(g.plasmaStormCooldown || Infinity, Math.max(1, 4 - idx));
        }
      });
      idCounter += 1;
    });

    const droneTypes = [
      { id: "assault", name: "突击", icon: "drone_attack", desc: "自动射击" },
      { id: "guard", name: "护卫", icon: "drone_defend", desc: "拦截子弹并反击" },
      { id: "bomber", name: "轰炸", icon: "drone_mine", desc: "投放炸弹" },
      { id: "laser", name: "激光", icon: "laser", desc: "持续照射" }
    ];

    const droneBehaviors = [
      { id: "swarm", name: "蜂群", desc: "数量+1，伤害降低" },
      { id: "heavy", name: "重型", desc: "伤害x2，射速降低" },
      { id: "rapid", name: "速射", desc: "射速x2" },
      { id: "elite", name: "精英", desc: "全属性提升" }
    ];

    droneTypes.forEach((type) => {
      droneBehaviors.forEach((behavior) => {
        levels.forEach((lvl, idx) => {
          skills.push({
            name: `${behavior.name}${type.name}无人机 ${lvl}`,
            description: `部署一台${behavior.desc}的${type.desc}无人机 (等级 ${lvl})`,
            tier: idx + 1,
            icon: type.icon,
            effect: (g) => {
              if (!g.cyber) g.cyber = {};
              if (!g.cyber.drones) g.cyber.drones = [];
              g.cyber.drones.push({
                type: type.id,
                behavior: behavior.id,
                level: idx + 1,
                id: Date.now() + Math.random()
              });
              g.droneCount += 1;
            }
          });
          idCounter += 1;
        });
      });
    });

    const bladeTypes = [
      { id: "razor", name: "剃刀", icon: "blade_cyber", desc: "高伤害，流血" },
      { id: "saw", name: "锯齿", icon: "blade_saw", desc: "持续切割，破甲" },
      { id: "energy", name: "光剑", icon: "bolt.fill", desc: "高攻速，能量伤害" }
    ];

    const bladeBuffs = [
      { id: "expand", name: "扩张", desc: "范围加大" },
      { id: "accel", name: "加速", desc: "旋转加快" },
      { id: "copy", name: "复制", desc: "数量加倍" },
      { id: "vamp", name: "渴血", desc: "命中回血" }
    ];

    bladeTypes.forEach((type) => {
      bladeBuffs.forEach((buff) => {
        levels.forEach((lvl, idx) => {
          skills.push({
            name: `${type.name}飞刃：${buff.name} ${lvl}`,
            description: `${type.desc}飞刃获得${buff.desc}效果 (Lv.${lvl})`,
            tier: idx + 1,
            icon: type.icon,
            effect: (g) => {
              g.bladeOrbitCount = Math.max(1, g.bladeOrbitCount + 1);
              if (buff.id === "expand") g.bladeOrbitRadius += 15 * (idx + 1);
              if (buff.id === "accel") g.bladeOrbitSpeed *= (1 + 0.1 * (idx + 1));
              if (buff.id === "copy") g.bladeOrbitCount += (idx + 1);
              if (buff.id === "vamp") {
                g.bladeOrbitLifestealChance += 0.1;
                g.bladeOrbitLifestealPercent += 0.05 * (idx + 1);
              }

              if (!g.cyber) g.cyber = {};
              g.cyber.bladeType = type.id;
            }
          });
          idCounter += 1;
        });
      });
    });

    const parts = [
      { name: "光学义眼", attr: "暴击", var1: "精准", var2: "致命" },
      { name: "液压臂", attr: "近战/击退", var1: "强力", var2: "冲击" },
      { name: "强化骨骼", attr: "生命", var1: "钛金", var2: "复合" },
      { name: "突触加速器", attr: "攻速", var1: "超频", var2: "反应" },
      { name: "皮下护甲", attr: "减伤", var1: "石墨烯", var2: "力场" },
      { name: "喷射脚踝", attr: "移速", var1: "冲刺", var2: "闪避" },
      { name: "辅助心脏", attr: "回复", var1: "再生", var2: "应急" },
      { name: "脑机接口", attr: "经验", var1: "下载", var2: "学习" },
      { name: "纳米肺", attr: "耐力", var1: "深呼吸", var2: "过滤" },
      { name: "武器挂载", attr: "伤害", var1: "重型", var2: "突击" }
    ];

    parts.forEach((part) => {
      levels.forEach((lvl, idx) => {
        skills.push({
          name: `${part.var1}${part.name} ${lvl}`,
          description: `大幅提升${part.attr}属性，偏向${part.var1}强化。`,
          tier: idx + 1,
          icon: "chip",
          effect: (g) => {
            const m = 1 + 0.1 * (idx + 1);
            if (part.attr === "暴击") g.critRate += 0.05 * (idx + 1);
            if (part.attr === "击退") g.knockbackForce += 50 * (idx + 1);
            if (part.attr === "生命") g.playerMaxHealth *= m;
            if (part.attr === "攻速") g.shootInterval /= m;
            if (part.attr === "减伤") g.damageReduction += 0.05 * (idx + 1);
            if (part.attr === "移速") g.playerSpeedMulti *= m;
            if (part.attr === "回复") g.regenRate += 1 * (idx + 1);
            if (part.attr === "经验") g.expMultiplier *= m;
            if (part.attr === "耐力") g.iFrameDuration += 0.2 * (idx + 1);
            if (part.attr === "伤害") g.bulletDamage *= m;
          }
        });
        idCounter += 1;

        skills.push({
          name: `${part.var2}${part.name} ${lvl}`,
          description: `极大提升${part.attr}效率，附带${part.var2}特效。`,
          tier: idx + 1,
          icon: "cpu",
          effect: (g) => {
            const m = 1 + 0.15 * (idx + 1);
            if (part.attr === "暴击") g.critDamageMulti += 0.2 * (idx + 1);
            if (part.attr === "击退") g.knockbackForce += 80 * (idx + 1);
            if (part.attr === "生命") {
              g.playerMaxHealth += 50 * (idx + 1);
              g.playerHealth += 50 * (idx + 1);
            }
            if (part.attr === "攻速") g.shootInterval *= (1 - 0.05 * (idx + 1));
            if (part.attr === "减伤") {
              g.damageReduction += 0.03 * (idx + 1);
              g.thornsDamagePercent += 0.1 * (idx + 1);
            }
            if (part.attr === "移速") {
              g.playerSpeedMulti *= (1 + 0.08 * (idx + 1));
              g.dodgeChance += 0.05 * (idx + 1);
            }
            if (part.attr === "回复") {
              g.lifestealChance += 0.05;
              g.lifestealPercent += 0.05 * (idx + 1);
            }
            if (part.attr === "经验") {
              g.pickupRange *= m;
            }
            if (part.attr === "耐力") g.damageCap = Math.max(0.1, 0.5 - 0.05 * (idx + 1));
            if (part.attr === "伤害") {
              g.bulletDamage *= m;
              g.bulletScale *= 1.1;
            }
          }
        });
        idCounter += 1;
      });
    });

    const hacks = [
      { name: "系统崩溃", desc: "全屏敌人瘫痪3秒", icon: "lock_shield" },
      { name: "纳米蚀刻", desc: "击中敌人后在其身上刻下纳米符文持续侵蚀", icon: "scribble" },
      { name: "逻辑炸弹", desc: "受击时释放EMP冲击波", icon: "bomb" },
      { name: "内存溢出", desc: "经验球爆炸造成伤害", icon: "chip" },
      { name: "过热协议", desc: "射击附带燃烧，由于过热偶尔扣血", icon: "flame" },
      { name: "时间膨胀", desc: "敌人子弹速度减半", icon: "timer" },
      { name: "量子纠缠", desc: "子弹命中后在敌人间产生量子链接，共享伤害", icon: "atom" },
      { name: "数据虹吸", desc: "每秒偷取周围敌人生命", icon: "network" },
      { name: "根权限", desc: "所有技能效果提升10%", icon: "key" },
      { name: "量子隧穿", desc: "子弹穿过敌人时复制自身攻击周围敌人", icon: "atom" }
    ];

    hacks.forEach((hack) => {
      levels.forEach((lvl, idx) => {
        skills.push({
          name: `协议：${hack.name} ${lvl}`,
          description: `${hack.desc} (Ver.${idx}.0)`,
          tier: idx + 1,
          icon: hack.icon,
          effect: (g) => {
            if (!g.cyber) g.cyber = {};
            g.cyber[`hack_${hack.name}`] = (idx + 1);
            if (hack.name === "根权限") g.bulletDamage *= 1.1;
            if (hack.name === "量子纠缠") {
              g.quantumEntangleChance = Math.max(g.quantumEntangleChance, 0.15 + 0.05 * (idx + 1));
              g.quantumEntangleDamageShare = Math.max(g.quantumEntangleDamageShare, 0.2 + 0.1 * idx);
            }
            if (hack.name === "纳米蚀刻") {
              g.nanoEtchEnabled = true;
              g.nanoEtchDamage = (g.nanoEtchDamage || 0) + 3 * (idx + 1);
              g.nanoEtchDuration = Math.max(g.nanoEtchDuration || 0, 3 + idx);
            }
            if (hack.name === "量子隧穿") {
              g.quantumTunnelEnabled = true;
              g.quantumTunnelChance = Math.min(1.0, (g.quantumTunnelChance || 0) + 0.15 * (idx + 1));
              g.quantumTunnelCount = Math.max(g.quantumTunnelCount || 0, 1 + idx);
            }
          }
        });
        idCounter += 1;
      });
    });

    const weapons = [
      { name: "磁轨炮", desc: "极高穿透与击退" },
      { name: "引力炮", desc: "发射引力弹扭曲空间吸引并压缩敌人" },
      { name: "脉冲波", desc: "发射震荡脉冲波击退并眩晕敌人" },
      { name: "反物质", desc: "子弹湮灭敌人" },
      { name: "聚变枪", desc: "产生核爆" },
      { name: "冰河", desc: "绝对零度冻结" },
      { name: "特斯拉", desc: "全屏闪电" },
      { name: "生化枪", desc: "腐蚀大地" },
      { name: "智能枪", desc: "必定命中" },
      { name: "光棱塔", desc: "折射激光" }
    ];

    weapons.forEach((weapon) => {
      levels.forEach((lvl, idx) => {
        skills.push({
          name: `实验武器：${weapon.name} ${lvl}`,
          description: `装备${weapon.name}，${weapon.desc} (Mk.${idx + 1})`,
          tier: idx + 1,
          icon: "hammer",
          effect: (g) => {
            if (!g.cyber) g.cyber = {};
            g.cyber[`weapon_${weapon.name}`] = (idx + 1);
            g.bulletDamage *= 1.2;
            if (weapon.name === "脉冲波") {
              g.pulseWaveKnockback = Math.max(g.pulseWaveKnockback, 80 + 40 * (idx + 1));
              g.pulseWaveStunChance = Math.max(g.pulseWaveStunChance, 0.2 + 0.05 * idx);
              g.pulseWaveStunDuration = Math.max(g.pulseWaveStunDuration, 0.5 + 0.2 * idx);
            }
          }
        });
        idCounter += 1;
      });
    });

    const suits = [
      { name: "泰坦", desc: "极大提升生命与护甲" },
      { name: "游侠", desc: "提升移速与闪避" },
      { name: "虚空", desc: "受伤瞬移" },
      { name: "医疗", desc: "大幅提升回复" },
      { name: "掠食者", desc: "击杀后获得攻速与暴击加成" },
      { name: "幽灵", desc: "穿透敌人移动" },
      { name: "要塞", desc: "静止时无敌" },
      { name: "狂徒", desc: "血量越低伤害越高" },
      { name: "主宰", desc: "免疫控制与击退" },
      { name: "聚能", desc: "受击积累能量释放冲击波" }
    ];

    suits.forEach((suit) => {
      levels.forEach((lvl, idx) => {
        skills.push({
          name: `外骨骼：${suit.name} ${lvl}`,
          description: `装备${suit.name}型装甲，${suit.desc} (Model-${idx + 1})`,
          tier: idx + 1,
          icon: "shield_tech",
          effect: (g) => {
            if (suit.name === "泰坦") {
              g.playerMaxHealth *= 1.2;
              g.damageReduction += 0.05;
            }
            if (suit.name === "游侠") {
              g.playerSpeedMulti *= 1.1;
              g.dodgeChance += 0.05;
            }
            if (suit.name === "医疗") {
              g.regenRate += 2;
              g.combatRegenBoost = true;
            }
            if (suit.name === "狂徒") {
              g.lowHpDamageBoost = true;
              g.lowHpDamageMulti += 0.5;
            }
            if (suit.name === "掠食者") {
              g.predatorMode = true;
              g.predatorAtkSpeedBonus = Math.max(g.predatorAtkSpeedBonus, 0.08 * (idx + 1));
              g.predatorCritBonus = Math.max(g.predatorCritBonus, 0.04 * (idx + 1));
              g.predatorDuration = Math.max(g.predatorDuration, 3.0 + 0.5 * idx);
            }
            g.damageReduction += 0.01 * (idx + 1);
          }
        });
        idCounter += 1;
      });
    });

    return skills;
  }

  Skills.buildCyberpunkArsenal = buildCyberpunkArsenal;
})();
