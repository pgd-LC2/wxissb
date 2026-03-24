/**
 * 魔法系统核心逻辑
 * 实现所有魔法技能的运行时逻辑
 */

(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  
  // ============================================
  // 魔法系统更新函数
  // ============================================
  function updateMagicSystem(g, dt, t) {
    if (!g.magic) return;
    const m = g.magic;
    const utils = GameApp.Deps?.utils || window.GameUtils || { rand: Math.random, TAU: Math.PI * 2, hypot: Math.hypot, clamp: (v,a,b) => Math.max(a, Math.min(b, v)) };
    const { rand, TAU, hypot, clamp } = utils;
    const nextId = GameApp.Deps?.nextId || (() => Date.now() + Math.random());
    
    // ----------------------------------------
    // 帮助函数
    // ----------------------------------------
    const getClosestEnemy = (pos) => {
      if (g.getClosestEnemy) return g.getClosestEnemy(pos);
      let best = null, bestD2 = Infinity;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        const dx = e.x - (pos?.x || g.player.x);
        const dy = e.y - (pos?.y || g.player.y);
        const d2 = dx*dx + dy*dy;
        if (d2 < bestD2) { bestD2 = d2; best = e; }
      }
      return best;
    };
    
    const findEnemyCluster = (radius = 200) => {
      if (g.findEnemyCluster) return g.findEnemyCluster(radius);
      const aliveEnemies = g.enemies.filter(e => !e._dead);
      if (aliveEnemies.length === 0) return null;
      if (aliveEnemies.length === 1) return { x: aliveEnemies[0].x, y: aliveEnemies[0].y };
      let bestPos = null, bestCount = 0;
      for (const center of aliveEnemies) {
        let count = 0;
        for (const e of aliveEnemies) {
          const dx = e.x - center.x, dy = e.y - center.y;
          if (dx*dx + dy*dy < radius*radius) count++;
        }
        if (count > bestCount) { bestCount = count; bestPos = { x: center.x, y: center.y }; }
      }
      return bestPos;
    };
    
    const applyDamageToEnemy = (enemy, damage, time, meta) => {
      if (g.applyDamageToEnemy) g.applyDamageToEnemy(enemy, damage, time, meta);
      else if (enemy && !enemy._dead) {
        enemy.hp -= damage;
        if (enemy.hp <= 0) { enemy.hp = 0; enemy._dead = true; }
      }
    };
    
    const heal = (amount) => {
      if (g.heal) g.heal(amount);
      else g.playerHealth = Math.min(g.playerMaxHealth, g.playerHealth + amount);
    };
    
    const createEffect = (kind, props) => {
      if (g.effects) g.effects.push({ kind, ...props, start: t, end: t + (props.duration || 0.2) });
    };
    
    const createExplosionEffect = (pos, radius, time) => {
      if (g.createExplosionEffect) g.createExplosionEffect(pos, radius, time);
      else createEffect('explosion', { x: pos.x, y: pos.y, r: radius });
    };
    
    const emitParticles = (pos, count, color) => {
      if (g.emitBurst) g.emitBurst(pos, count, color, t);
      else if (g.emitSparks) g.emitSparks(pos, count, color, t);
    };
    
    const shakeCamera = (duration, amp) => {
      if (g.shakeCamera) g.shakeCamera(duration, amp, t);
    };
    
    const createMagicProjectile = (type, x, y, vx, vy, damage, effect) => {
      if (!g.magicProjectiles) g.magicProjectiles = [];
      g.magicProjectiles.push({
        id: nextId(),
        type, x, y, vx, vy, damage, effect,
        born: t, die: t + 3,
        r: 8
      });
    };
    
    // ----------------------------------------
    // 初始化魔法实体数组
    // ----------------------------------------
    if (!g.magicProjectiles) g.magicProjectiles = [];
    if (!g.golems) g.golems = [];
    if (!g.phantoms) g.phantoms = [];
    if (!g.runeCircles) g.runeCircles = [];
    if (!g.magicBeams) g.magicBeams = [];
    if (!g.domains) g.domains = [];
    
    // ========================================
    // 1. 火焰魔法系统
    // ========================================
    
    // 火球术 - 射击时发射追踪火球
    if (m.fireballChance > 0 && !m._lastFireballCheck) m._lastFireballCheck = 0;
    if (m.fireballChance > 0 && m._fireballPending) {
      const target = getClosestEnemy();
      if (target) {
        const dx = target.x - g.player.x, dy = target.y - g.player.y;
        const dist = Math.max(1, hypot(dx, dy));
        const speed = 350;
        createMagicProjectile('fireball', g.player.x, g.player.y, 
          (dx/dist) * speed, (dy/dist) * speed,
          g.bulletDamage * 0.8 * (m.fireDamageBonus || 1),
          { burn: true, explode: m.fireballExplode, explodeRadius: m.fireballExplosionRadius || 50 }
        );
        emitParticles({ x: g.player.x, y: g.player.y }, 5, '#ff6600');
      }
      m._fireballPending = false;
    }
    
    // 火焰射线
    if (m.fireRayEnabled) {
      if (!m._fireRayNext) m._fireRayNext = t;
      if (t >= m._fireRayNext) {
        m._fireRayNext = t + 0.1;
        const target = getClosestEnemy();
        if (target && hypot(target.x - g.player.x, target.y - g.player.y) < 300) {
          applyDamageToEnemy(target, (m.fireRayDamage || 8) * (m.fireDamageBonus || 1) * dt * 10, t);
          createEffect('line', { x1: g.player.x, y1: g.player.y, x2: target.x, y2: target.y, color: '#ff4400' });
          // 燃烧效果
          if (!target.burnEnd || target.burnEnd < t) {
            target.burnEnd = t + 2;
            target.burnDmg = 5;
          }
        }
      }
    }
    
    // 火焰风暴
    if (m.fireStormEnabled) {
      if (!m._fireStormNext) m._fireStormNext = t + (m.fireStormInterval || 15);
      if (t >= m._fireStormNext) {
        m._fireStormNext = t + (m.fireStormInterval || 15);
        const cluster = findEnemyCluster(200);
        if (cluster) {
          const stormX = cluster.x + rand(-50, 50);
          const stormY = cluster.y + rand(-50, 50);
          const radius = 150;
          const damage = (m.fireStormDamage || 100) * (m.fireDamageBonus || 1);
          
          // 创建火焰风暴领域
          g.domains.push({
            id: nextId(),
            type: 'fireStorm',
            x: stormX, y: stormY,
            radius: radius,
            damage: damage / 30,  // 分散到30次tick
            born: t,
            end: t + 5,
            nextTick: t,
            color: '#ff4400'
          });
          
          createEffect('shockwave', { x: stormX, y: stormY, r: radius, color: '#ff4400', duration: 0.5 });
          shakeCamera(0.3, 8);
          emitParticles({ x: stormX, y: stormY }, 30, '#ff6600');
        }
      }
    }
    
    // 熔岩护甲 - 受击时喷发熔岩
    if (m.lavaArmorEnabled && g.player.lastHit && (t - g.player.lastHit) < 0.1) {
      if (!m._lavaArmorLast || (t - m._lavaArmorLast) > 0.5) {
        m._lavaArmorLast = t;
        const radius = 80;
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          const dx = e.x - g.player.x, dy = e.y - g.player.y;
          if (dx*dx + dy*dy < radius*radius) {
            applyDamageToEnemy(e, (m.lavaArmorDamage || 20) * (m.fireDamageBonus || 1), t);
            e.burnEnd = t + 3;
            e.burnDmg = 8;
          }
        }
        createExplosionEffect({ x: g.player.x, y: g.player.y }, radius, t);
        emitParticles({ x: g.player.x, y: g.player.y }, 20, '#ff3300');
      }
    }
    
    // 地狱火雨
    if (m.fireRainEnabled) {
      if (!m._fireRainNext) m._fireRainNext = t + (m.fireRainInterval || 10);
      if (t >= m._fireRainNext) {
        m._fireRainNext = t + (m.fireRainInterval || 10);
        const count = m.fireRainCount || 8;
        for (let i = 0; i < count; i++) {
          const fx = g.player.x + rand(-300, 300);
          const fy = g.player.y + rand(-300, 300);
          // 延迟落下
          setTimeout(() => {
            if (g.isGameOver) return;
            const damage = 60 * (m.fireDamageBonus || 1);
            const radius = 50;
            for (let j = 0; j < g.enemies.length; j++) {
              const e = g.enemies[j];
              if (e._dead) continue;
              const dx = e.x - fx, dy = e.y - fy;
              if (dx*dx + dy*dy < radius*radius) {
                applyDamageToEnemy(e, damage, t);
                e.burnEnd = t + 3;
                e.burnDmg = 10;
              }
            }
            createExplosionEffect({ x: fx, y: fy }, radius, t);
            emitParticles({ x: fx, y: fy }, 15, '#ff4400');
          }, i * 150);
        }
        shakeCamera(0.5, 10);
      }
    }
    
    // 小型太阳（太阳之怒）
    if (m.miniSunEnabled) {
      if (!m._miniSunAngle) m._miniSunAngle = 0;
      m._miniSunAngle += dt * 1.5;
      const sunX = g.player.x + Math.cos(m._miniSunAngle) * 100;
      const sunY = g.player.y + Math.sin(m._miniSunAngle) * 100;
      const radius = m.miniSunRadius || 150;
      const damage = (m.miniSunDamage || 15) * (m.fireDamageBonus || 1) * dt;
      
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        const dx = e.x - sunX, dy = e.y - sunY;
        if (dx*dx + dy*dy < radius*radius) {
          applyDamageToEnemy(e, damage, t);
          if (Math.random() < 0.1) {
            e.burnEnd = t + 2;
            e.burnDmg = 5;
          }
        }
      }
      
      // 太阳视觉效果
      if (!m._miniSunFx || t - m._miniSunFx > 0.1) {
        m._miniSunFx = t;
        createEffect('ring', { x: sunX, y: sunY, r: 30, color: '#ffaa00', duration: 0.1 });
      }
    }
    
    // ========================================
    // 2. 冰霜魔法系统
    // ========================================
    
    // 冰霜新星 (受伤触发)
    if (m.frostNovaOnHit && g.lastDamageTime && (t - g.lastDamageTime) < 0.1) {
      if (!m._frostNovaLast || (t - m._frostNovaLast) > 1) {
        m._frostNovaLast = t;
        const radius = m.frostNovaRadius || 120;
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          const dx = e.x - g.player.x, dy = e.y - g.player.y;
          if (dx*dx + dy*dy < radius*radius) {
            e.frozenUntil = t + 1.5;
            e.color = '#00d7ff';
            applyDamageToEnemy(e, 30 * (1 + (m.elementalAffinity?.ice || 0)), t);
          }
        }
        createEffect('shockwave', { x: g.player.x, y: g.player.y, r: radius, color: '#00d7ff', duration: 0.3 });
        emitParticles({ x: g.player.x, y: g.player.y }, 25, '#00d7ff');
      }
    }
    
    // 暴风雪
    if (m.blizzardEnabled) {
      if (!m._blizzardNext) m._blizzardNext = t + (m.blizzardInterval || 12);
      if (t >= m._blizzardNext) {
        m._blizzardNext = t + (m.blizzardInterval || 12);
        const radius = m.blizzardRadius || 200;
        
        g.domains.push({
          id: nextId(),
          type: 'blizzard',
          x: g.player.x, y: g.player.y,
          radius: radius,
          damage: 5 * (1 + (m.elementalAffinity?.ice || 0)),
          slowAmount: 0.5,
          freezeChance: 0.1,
          born: t,
          end: t + 6,
          nextTick: t,
          color: '#66ccff'
        });
        
        shakeCamera(0.2, 5);
      }
    }
    
    // 冰封结界
    if (m.frozenDomainEnabled) {
      if (!m._frozenDomainActive) {
        m._frozenDomainActive = true;
        const radius = m.frozenDomainRadius || 150;
        g.domains.push({
          id: nextId(),
          type: 'frozenDomain',
          x: g.player.x, y: g.player.y,
          radius: radius,
          damage: 3 * (1 + (m.elementalAffinity?.ice || 0)),
          slowAmount: 0.6,
          born: t,
          end: t + 9999,  // 永久
          nextTick: t,
          followPlayer: true,
          color: '#aaddff'
        });
      }
    }
    
    // 雷霆领域
    if (m.thunderDomainEnabled) {
      if (!m._thunderDomainActive) {
        m._thunderDomainActive = true;
        const radius = 140;
        g.domains.push({
          id: nextId(),
          type: 'thunderDomain',
          x: g.player.x, y: g.player.y,
          radius: radius,
          damage: m.thunderDomainDamage || 15,
          born: t,
          end: t + 9999,
          nextTick: t,
          followPlayer: true,
          color: '#ffff00'
        });
      }
    }
    
    // 衰弱领域
    if (m.weakenDomainEnabled) {
      if (!m._weakenDomainActive) {
        m._weakenDomainActive = true;
        const radius = 130;
        g.domains.push({
          id: nextId(),
          type: 'weakenDomain',
          x: g.player.x, y: g.player.y,
          radius: radius,
          damage: 0,
          attackReduction: m.weakenDomainAttackReduction || 0.35,
          defenseReduction: m.weakenDomainDefenseReduction || 0.25,
          born: t,
          end: t + 9999,
          nextTick: t,
          followPlayer: true,
          color: '#aa66aa'
        });
      }
    }
    
    // 极寒领域
    if (m.chillAuraEnabled) {
      const radius = m.chillAuraRadius || 180;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        const dx = e.x - g.player.x, dy = e.y - g.player.y;
        const dist = hypot(dx, dy);
        if (dist < radius) {
          const slowFactor = 1 - (1 - dist / radius) * 0.7;
          e._chillSlowFactor = slowFactor;
          e.slowed = true;
        }
      }
    }
    
    // 冰川坠落
    if (m.glacierEnabled) {
      if (!m._glacierNext) m._glacierNext = t + 20;
      if (t >= m._glacierNext) {
        m._glacierNext = t + 20;
        const cluster = findEnemyCluster(250);
        if (cluster) {
          const damage = (m.glacierDamage || 200) * (1 + (m.elementalAffinity?.ice || 0));
          const radius = 120;
          
          setTimeout(() => {
            if (g.isGameOver) return;
            for (let i = 0; i < g.enemies.length; i++) {
              const e = g.enemies[i];
              if (e._dead) continue;
              const dx = e.x - cluster.x, dy = e.y - cluster.y;
              if (dx*dx + dy*dy < radius*radius) {
                applyDamageToEnemy(e, damage, t);
                e.frozenUntil = t + 3;
                e.color = '#00d7ff';
              }
            }
            createExplosionEffect(cluster, radius, t);
            emitParticles(cluster, 40, '#88ddff');
            shakeCamera(0.5, 15);
          }, 1500);
          
          // 警告圈
          createEffect('ring', { x: cluster.x, y: cluster.y, r: radius, color: '#00d7ff', duration: 1.5 });
        }
      }
    }
    
    // ========================================
    // 3. 雷电魔法系统
    // ========================================
    
    // 雷云
    if (m.thunderCloudEnabled) {
      if (!m._thunderCloudNext) m._thunderCloudNext = t;
      if (t >= m._thunderCloudNext) {
        m._thunderCloudNext = t + (m.thunderCloudInterval || 1.5);
        const target = getClosestEnemy();
        if (target && hypot(target.x - g.player.x, target.y - g.player.y) < 400) {
          const damage = 35 * (1 + (m.elementalAffinity?.lightning || 0));
          applyDamageToEnemy(target, damage, t, { isCrit: Math.random() < 0.2 });
          createEffect('line', { 
            x1: g.player.x + rand(-50, 50), y1: g.player.y - 100,
            x2: target.x, y2: target.y, 
            color: '#ffff00', duration: 0.1 
          });
          emitParticles({ x: target.x, y: target.y }, 10, '#ffff00');
          
          // 连锁
          if (m.chainLightningChance > 0 && Math.random() < m.chainLightningChance) {
            if (g.triggerChainLightning) {
              g.triggerChainLightning(target, damage * 0.5, 2, t);
            }
          }
        }
      }
    }
    
    // 雷霆一击 (暴击触发) - 通过 flag 在子弹命中时检测
    
    // 静电力场
    if (m.staticFieldEnabled) {
      const radius = m.staticFieldRadius || 100;
      if (!m._staticFieldNext) m._staticFieldNext = t;
      if (t >= m._staticFieldNext) {
        m._staticFieldNext = t + 0.5;
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          const dx = e.x - g.player.x, dy = e.y - g.player.y;
          if (dx*dx + dy*dy < radius*radius) {
            if (Math.random() < 0.3) {
              e.frozenUntil = Math.max(e.frozenUntil || 0, t + 0.5);
              e.color = '#ffff00';
              emitParticles({ x: e.x, y: e.y }, 3, '#ffff00');
            }
          }
        }
      }
    }
    
    // 电磁脉冲
    if (m.empEnabled) {
      if (!m._empNext) m._empNext = t + (m.empInterval || 10);
      if (t >= m._empNext) {
        m._empNext = t + (m.empInterval || 10);
        const radius = 250;
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          const dx = e.x - g.player.x, dy = e.y - g.player.y;
          if (dx*dx + dy*dy < radius*radius) {
            e.frozenUntil = t + (m.empStunDuration || 1.5);
            e.color = '#00ffff';
            applyDamageToEnemy(e, 20 * (1 + (m.elementalAffinity?.lightning || 0)), t);
          }
        }
        createEffect('shockwave', { x: g.player.x, y: g.player.y, r: radius, color: '#00ffff', duration: 0.3 });
        emitParticles({ x: g.player.x, y: g.player.y }, 30, '#00ffff');
        shakeCamera(0.3, 8);
      }
    }
    
    // 随机雷击
    if (m.randomThunderEnabled) {
      if (!m._randomThunderNext) m._randomThunderNext = t + (m.randomThunderInterval || 5);
      if (t >= m._randomThunderNext) {
        m._randomThunderNext = t + (m.randomThunderInterval || 5);
        const aliveEnemies = g.enemies.filter(e => !e._dead);
        if (aliveEnemies.length > 0) {
          const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          const damage = 80 * (1 + (m.elementalAffinity?.lightning || 0));
          applyDamageToEnemy(target, damage, t, { isCrit: true, immediate: true });
          createEffect('line', { 
            x1: target.x, y1: target.y - 500,
            x2: target.x, y2: target.y, 
            color: '#ffff00', duration: 0.2 
          });
          emitParticles({ x: target.x, y: target.y }, 20, '#ffff00');
          shakeCamera(0.2, 6);
        }
      }
    }
    
    // 离子风暴
    if (m.ionStormEnabled) {
      if (!m._ionStormActive) {
        m._ionStormActive = true;
        g.domains.push({
          id: nextId(),
          type: 'ionStorm',
          x: g.player.x, y: g.player.y,
          radius: m.ionStormRadius || 200,
          damage: 8 * (1 + (m.elementalAffinity?.lightning || 0)),
          born: t,
          end: t + 9999,
          nextTick: t,
          followPlayer: true,
          color: '#8800ff'
        });
      }
    }
    
    // ========================================
    // 4. 召唤系统
    // ========================================
    
    // 傀儡系统
    const golemTypes = ['stone', 'iron', 'crystal', 'lava', 'bone', 'wood', 'ice'];
    for (const golemType of golemTypes) {
      const countKey = `${golemType}GolemCount`;
      const targetCount = m[countKey] || 0;
      const currentCount = g.golems.filter(g => g.type === golemType && !g._dead).length;
      
      while (currentCount < targetCount) {
        const angle = rand(0, TAU);
        const dist = rand(100, 180);
        let hp = 200;
        let damage = 30;
        let size = 40;
        let color = '#888888';
        
        switch (golemType) {
          case 'iron': hp = 400; damage = 50; color = '#aaaaaa'; break;
          case 'crystal': hp = 150; damage = 20; color = '#aaddff'; break;
          case 'lava': hp = 250; damage = 40; color = '#ff6600'; break;
          case 'bone': hp = 120; damage = 25; size = 30; color = '#ddddcc'; break;
          case 'wood': hp = 100; damage = 15; size = 35; color = '#886644'; break;
          case 'ice': hp = 180; damage = 25; color = '#88ddff'; break;
        }
        
        if (m.stoneGolemHealthBonus) hp += m.stoneGolemHealthBonus;
        if (m.giantGolem) { hp *= 2; damage *= 2; size *= 1.5; }
        
        g.golems.push({
          id: nextId(),
          type: golemType,
          x: g.player.x + Math.cos(angle) * dist,
          y: g.player.y + Math.sin(angle) * dist,
          hp: hp,
          maxHp: hp,
          damage: damage,
          size: size,
          color: color,
          lastAttack: 0,
          attackInterval: 1.5,
          born: t
        });
        break;
      }
    }
    
    // 更新傀儡
    for (let i = g.golems.length - 1; i >= 0; i--) {
      const golem = g.golems[i];
      if (golem._dead) {
        // 傀儡爆炸
        if (m.golemExplosion) {
          const radius = 80;
          const damage = m.golemExplosionDamage || 100;
          for (let j = 0; j < g.enemies.length; j++) {
            const e = g.enemies[j];
            if (e._dead) continue;
            const dx = e.x - golem.x, dy = e.y - golem.y;
            if (dx*dx + dy*dy < radius*radius) {
              applyDamageToEnemy(e, damage, t);
            }
          }
          createExplosionEffect({ x: golem.x, y: golem.y }, radius, t);
        }
        g.golems.splice(i, 1);
        continue;
      }
      
      // 傀儡回复
      if (m.golemRegen) {
        golem.hp = Math.min(golem.maxHp, golem.hp + golem.maxHp * m.golemRegen * dt);
      }
      
      // 寻找并攻击敌人
      const target = getClosestEnemy({ x: golem.x, y: golem.y });
      if (target) {
        const dx = target.x - golem.x, dy = target.y - golem.y;
        const dist = hypot(dx, dy);
        
        // 移动向敌人
        if (dist > golem.size + 30) {
          const speed = 80;
          golem.x += (dx / dist) * speed * dt;
          golem.y += (dy / dist) * speed * dt;
        } else {
          // 攻击
          if (t - golem.lastAttack > golem.attackInterval) {
            golem.lastAttack = t;
            let damage = golem.damage;
            if (m.golemFrenzy) damage *= 1.5;
            applyDamageToEnemy(target, damage, t, { immediate: true });
            
            // 击退
            if (m.stoneGolemKnockback) {
              target.x += (dx / dist) * 50;
              target.y += (dy / dist) * 50;
            }
            
            // 特殊效果
            if (golem.type === 'lava') {
              target.burnEnd = t + 3;
              target.burnDmg = 10;
            }
            if (golem.type === 'ice') {
              target.slowed = true;
              target._chillSlowFactor = 0.5;
            }
            
            emitParticles({ x: target.x, y: target.y }, 8, golem.color);
          }
        }
      } else {
        // 回到玩家身边
        const dx = g.player.x - golem.x, dy = g.player.y - golem.y;
        const dist = hypot(dx, dy);
        if (dist > 150) {
          const speed = 60;
          golem.x += (dx / dist) * speed * dt;
          golem.y += (dy / dist) * speed * dt;
        }
      }
    }
    
    // 幻影分身
    const phantomCount = m.phantomCount || 0;
    const currentPhantoms = g.phantoms.filter(p => !p._dead).length;
    while (currentPhantoms < phantomCount) {
      const angle = rand(0, TAU);
      g.phantoms.push({
        id: nextId(),
        x: g.player.x + Math.cos(angle) * 80,
        y: g.player.y + Math.sin(angle) * 80,
        lifetime: m.eternalPhantom ? Infinity : 30,
        attackRate: 0.8,
        lastAttack: 0,
        born: t,
        damageMulti: m.perfectPhantom ? 1.0 : 0.5
      });
      break;
    }
    
    // 更新幻影
    for (let i = g.phantoms.length - 1; i >= 0; i--) {
      const phantom = g.phantoms[i];
      if (phantom._dead || (!m.eternalPhantom && t - phantom.born > phantom.lifetime)) {
        if (m.phantomExplosion) {
          const radius = 60;
          for (let j = 0; j < g.enemies.length; j++) {
            const e = g.enemies[j];
            if (e._dead) continue;
            const dx = e.x - phantom.x, dy = e.y - phantom.y;
            if (dx*dx + dy*dy < radius*radius) {
              applyDamageToEnemy(e, g.bulletDamage * 0.5, t);
            }
          }
          createExplosionEffect({ x: phantom.x, y: phantom.y }, radius, t);
        }
        g.phantoms.splice(i, 1);
        continue;
      }
      
      // 跟随玩家
      const offset = (i * TAU / Math.max(1, g.phantoms.length));
      const targetX = g.player.x + Math.cos(t * 0.5 + offset) * 60;
      const targetY = g.player.y + Math.sin(t * 0.5 + offset) * 60;
      phantom.x += (targetX - phantom.x) * 0.1;
      phantom.y += (targetY - phantom.y) * 0.1;
      
      // 复制玩家攻击
      if (t - phantom.lastAttack > phantom.attackRate) {
        const target = getClosestEnemy({ x: phantom.x, y: phantom.y });
        if (target) {
          phantom.lastAttack = t;
          const dx = target.x - phantom.x, dy = target.y - phantom.y;
          const dist = Math.max(1, hypot(dx, dy));
          const speed = 400;
          createMagicProjectile('phantom', phantom.x, phantom.y,
            (dx/dist) * speed, (dy/dist) * speed,
            g.bulletDamage * phantom.damageMulti, {}
          );
        }
      }
    }
    
    // ========================================
    // 5. 领域系统更新（原图腾系统已移除）
    // ========================================
    for (let i = g.domains.length - 1; i >= 0; i--) {
      const domain = g.domains[i];
      
      // 检查是否过期
      if (t >= domain.end && !m.permanentDomain) {
        if (m.domainExplosion) {
          const radius = domain.radius;
          for (let j = 0; j < g.enemies.length; j++) {
            const e = g.enemies[j];
            if (e._dead) continue;
            const dx = e.x - domain.x, dy = e.y - domain.y;
            if (dx*dx + dy*dy < radius*radius) {
              applyDamageToEnemy(e, 80, t);
            }
          }
          createExplosionEffect({ x: domain.x, y: domain.y }, radius, t);
        }
        g.domains.splice(i, 1);
        continue;
      }
      
      // 跟随玩家
      if (domain.followPlayer) {
        domain.x = g.player.x;
        domain.y = g.player.y;
      }
      
      // 领域效果
      if (t >= domain.nextTick) {
        domain.nextTick = t + 0.2;
        const powerBonus = 1 + (m.domainPowerBonus || 0);
        
        switch (domain.type) {
          case 'fireStorm':
          case 'ionStorm':
            for (let j = 0; j < g.enemies.length; j++) {
              const e = g.enemies[j];
              if (e._dead) continue;
              const dx = e.x - domain.x, dy = e.y - domain.y;
              if (dx*dx + dy*dy < domain.radius*domain.radius) {
                applyDamageToEnemy(e, domain.damage * powerBonus, t);
              }
            }
            break;
            
          case 'blizzard':
            for (let j = 0; j < g.enemies.length; j++) {
              const e = g.enemies[j];
              if (e._dead) continue;
              const dx = e.x - domain.x, dy = e.y - domain.y;
              if (dx*dx + dy*dy < domain.radius*domain.radius) {
                applyDamageToEnemy(e, domain.damage * powerBonus, t);
                e.slowed = true;
                if (domain.freezeChance && Math.random() < domain.freezeChance) {
                  e.frozenUntil = t + 1;
                  e.color = '#00d7ff';
                }
              }
            }
            break;
            
          case 'frozenDomain':
            for (let j = 0; j < g.enemies.length; j++) {
              const e = g.enemies[j];
              if (e._dead) continue;
              const dx = e.x - domain.x, dy = e.y - domain.y;
              if (dx*dx + dy*dy < domain.radius*domain.radius) {
                applyDamageToEnemy(e, domain.damage * powerBonus, t);
                e.slowed = true;
              }
            }
            break;
          
          case 'thunderDomain':
            // 雷霆领域：持续电击并减速敌人
            for (let j = 0; j < g.enemies.length; j++) {
              const e = g.enemies[j];
              if (e._dead) continue;
              const dx = e.x - domain.x, dy = e.y - domain.y;
              if (dx*dx + dy*dy < domain.radius*domain.radius) {
                applyDamageToEnemy(e, domain.damage * powerBonus, t);
                e.slowed = true;
                e._ghostSlowUntil = t + 0.5;
                // 闪电视觉效果
                if (Math.random() < 0.15 && g.effects) {
                  g.effects.push({ kind:'line', x1:domain.x, y1:domain.y, x2:e.x, y2:e.y, color:'#ffff00', start:t, end:t+0.1 });
                }
              }
            }
            break;
          
          case 'weakenDomain':
            // 衰弱领域：削弱敌人攻击力和防御力
            for (let j = 0; j < g.enemies.length; j++) {
              const e = g.enemies[j];
              if (e._dead) continue;
              const dx = e.x - domain.x, dy = e.y - domain.y;
              if (dx*dx + dy*dy < domain.radius*domain.radius) {
                e._weakened = true;
                e._weakenEnd = t + 0.5;
                if (!e._baseDamageMul) e._baseDamageMul = e.damageMul || 1.0;
                e.damageMul = Math.max(0.3, e._baseDamageMul * (1 - (domain.attackReduction || 0.35)));
                if (e.armor) {
                  if (!e._baseArmor) e._baseArmor = e.armor;
                  e.armor = Math.max(0, e._baseArmor * (1 - (domain.defenseReduction || 0.25)));
                }
              }
            }
            break;
        }
      }
    }
    
    // ========================================
    // 7. 魔法弹幕更新
    // ========================================
    for (let i = g.magicProjectiles.length - 1; i >= 0; i--) {
      const proj = g.magicProjectiles[i];
      
      // 过期检测
      if (t >= proj.die || proj._dead) {
        g.magicProjectiles.splice(i, 1);
        continue;
      }
      
      // 移动
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      
      // 碰撞检测
      for (let j = 0; j < g.enemies.length; j++) {
        const e = g.enemies[j];
        if (e._dead) continue;
        
        const dx = e.x - proj.x, dy = e.y - proj.y;
        const dist = hypot(dx, dy);
        const hitDist = proj.r + Math.max(e.w, e.h) / 2;
        
        if (dist < hitDist) {
          // 命中
          applyDamageToEnemy(e, proj.damage, t, { immediate: true });
          
          // 特殊效果
          if (proj.effect) {
            if (proj.effect.burn) {
              e.burnEnd = t + 3;
              e.burnDmg = 8;
            }
            if (proj.effect.slow) {
              e.slowed = true;
            }
            if (proj.effect.freezeChance && Math.random() < proj.effect.freezeChance) {
              e.frozenUntil = t + 1.5;
              e.color = '#00d7ff';
            }
            if (proj.effect.chain && g.triggerChainLightning) {
              g.triggerChainLightning(e, proj.damage * 0.5, proj.effect.chainCount || 2, t);
            }
            if (proj.effect.lifesteal) {
              heal(proj.damage * proj.effect.lifesteal);
            }
            if (proj.effect.heal) {
              heal(proj.effect.heal);
            }
            if (proj.effect.explode) {
              const radius = proj.effect.explodeRadius || 50;
              for (let k = 0; k < g.enemies.length; k++) {
                const ne = g.enemies[k];
                if (ne._dead || ne === e) continue;
                const ndx = ne.x - e.x, ndy = ne.y - e.y;
                if (ndx*ndx + ndy*ndy < radius*radius) {
                  applyDamageToEnemy(ne, proj.damage * 0.5, t);
                }
              }
              createExplosionEffect({ x: e.x, y: e.y }, radius, t);
            }
          }
          
          emitParticles({ x: e.x, y: e.y }, 5, '#ffffff');
          proj._dead = true;
          break;
        }
      }
    }
    
    // ========================================
    // 8. 时空魔法系统
    // ========================================
    
    // 时间减速领域
    if (m.timeSlowEnabled) {
      const slowAmount = m.timeSlowAmount || 0.30;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        const dx = e.x - g.player.x, dy = e.y - g.player.y;
        if (dx*dx + dy*dy < 300*300) {
          e.slowed = true;
          e._timeSlowFactor = 1 - slowAmount;
        }
      }
    }
    
    // 时间停止
    if (m.timeStopEnabled) {
      if (!m._timeStopNext) m._timeStopNext = t + (m.timeStopInterval || 30);
      if (t >= m._timeStopNext) {
        m._timeStopNext = t + (m.timeStopInterval || 30);
        m._timeStopActive = true;
        m._timeStopEnd = t + (m.timeStopDuration || 3);
        createEffect('shockwave', { x: g.player.x, y: g.player.y, r: 500, color: '#8800ff', duration: 0.5 });
      }
      
      if (m._timeStopActive && t < m._timeStopEnd) {
        // 冻结所有敌人
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          e.frozenUntil = m._timeStopEnd;
          e.color = '#8800ff';
        }
      } else {
        m._timeStopActive = false;
      }
    }
    
    // 空间折叠 (闪现)
    if (m.blinkEnabled && m._blinkTrigger) {
      m._blinkTrigger = false;
      if (!m._blinkCooldownEnd || t >= m._blinkCooldownEnd) {
        m._blinkCooldownEnd = t + (m.blinkCooldown || 5);
        // 找到安全位置
        let bestX = g.player.x, bestY = g.player.y;
        let bestScore = 0;
        for (let i = 0; i < 10; i++) {
          const tx = g.player.x + rand(-200, 200);
          const ty = g.player.y + rand(-200, 200);
          let score = 0;
          for (let j = 0; j < g.enemies.length; j++) {
            const e = g.enemies[j];
            if (e._dead) continue;
            const dx = e.x - tx, dy = e.y - ty;
            score += Math.sqrt(dx*dx + dy*dy);
          }
          if (score > bestScore) {
            bestScore = score;
            bestX = tx;
            bestY = ty;
          }
        }
        g.player.x = bestX;
        g.player.y = bestY;
        createEffect('shockwave', { x: bestX, y: bestY, r: 50, color: '#8800ff', duration: 0.2 });
      }
    }
    
    // ========================================
    // 9. 诅咒系统
    // ========================================
    
    // 应用诅咒效果到敌人
    for (let i = 0; i < g.enemies.length; i++) {
      const e = g.enemies[i];
      if (e._dead) continue;
      
      // 虚弱诅咒
      if (m.weaknessCurse) {
        e._weaknessDebuff = m.weaknessAmount || 0.20;
      }
      
      // 脆弱诅咒
      if (m.vulnerableCurse) {
        e._vulnerableDebuff = m.vulnerableAmount || 0.20;
      }
      
      // 腐蚀诅咒
      if (m.corrosionCurse) {
        if (!e._corrosionNext || t >= e._corrosionNext) {
          e._corrosionNext = t + 1;
          applyDamageToEnemy(e, m.corrosionDamage || 5, t);
        }
      }
      
      // 恐惧诅咒
      if (m.fearCurse && Math.random() < (m.fearChance || 0.15) * dt) {
        e._feared = true;
        e._fearEnd = t + 2;
      }
      
      // 诅咒标记已被举报移除
      
      // 死亡诅咒
      if (m.deathCurse && Math.random() < (m.deathCurseChance || 0.02) * dt) {
        applyDamageToEnemy(e, e.hp + 1, t);
      }
      
      // 恐惧行为
      if (e._feared && t < e._fearEnd) {
        const dx = e.x - g.player.x, dy = e.y - g.player.y;
        const dist = Math.max(1, hypot(dx, dy));
        e.x += (dx / dist) * e.speed * dt;
        e.y += (dy / dist) * e.speed * dt;
      }
    }
    
    // ========================================
    // 10. 治愈系统
    // ========================================
    
    // 瞬间治愈 (受伤触发)
    if (m.instantHeal && g.lastDamageTime && (t - g.lastDamageTime) < 0.1) {
      if (!m._instantHealLast || (t - m._instantHealLast) > 1) {
        m._instantHealLast = t;
        heal(g.playerMaxHealth * (m.instantHealPercent || 0.15));
      }
    }
    
    // 强化再生
    if (m.enhancedRegen && (g.playerHealth / g.playerMaxHealth) < 0.5) {
      heal(g.regenRate * dt);  // 额外再生一次
    }
    
    // 治愈光环 (给召唤物回血)
    if (m.healAura) {
      const healRate = m.healAuraRate || 2;
      for (const golem of g.golems) {
        if (!golem._dead) golem.hp = Math.min(golem.maxHp, golem.hp + healRate * dt);
      }
    }
    
    // 治愈波
    if (m.healWave) {
      if (!m._healWaveNext) m._healWaveNext = t + (m.healWaveInterval || 10);
      if (t >= m._healWaveNext) {
        m._healWaveNext = t + (m.healWaveInterval || 10);
        heal(g.playerMaxHealth * 0.2);
        createEffect('shockwave', { x: g.player.x, y: g.player.y, r: 100, color: '#00ff00', duration: 0.3 });
      }
    }
    
    // 庇护所
    if (m.sanctuaryEnabled) {
      if (!m._sanctuaryActive) {
        m._sanctuaryActive = true;
        g.domains.push({
          id: nextId(),
          type: 'sanctuary',
          x: g.player.x, y: g.player.y,
          radius: 150,
          healRate: m.sanctuaryHeal || 3,
          born: t,
          end: t + 9999,
          nextTick: t,
          followPlayer: true,
          color: '#88ff88'
        });
      }
    }
    
    // ========================================
    // 11. 符文系统
    // ========================================
    
    // 自动部署符文
    if (m.autoRune) {
      if (!m._autoRuneNext) m._autoRuneNext = t + 3;
      if (t >= m._autoRuneNext) {
        m._autoRuneNext = t + 3;
        
        const runeTypes = [];
        if (m.explosionRuneEnabled) runeTypes.push('explosion');
        if (m.fireRuneEnabled) runeTypes.push('fire');
        if (m.iceRuneEnabled) runeTypes.push('ice');
        if (m.lightningRuneEnabled) runeTypes.push('lightning');
        if (m.poisonRuneEnabled) runeTypes.push('poison');
        
        if (runeTypes.length > 0) {
          const type = runeTypes[Math.floor(Math.random() * runeTypes.length)];
          const cluster = findEnemyCluster(200);
          const x = cluster ? cluster.x : g.player.x + rand(-150, 150);
          const y = cluster ? cluster.y : g.player.y + rand(-150, 150);
          
          g.runeCircles.push({
            id: nextId(),
            type: type,
            x: x, y: y,
            radius: 60 * (1 + (m.runeRadiusBonus || 0)),
            damage: 80 * (1 + (m.runeDamageBonus || 0)),
            duration: m.eternalRune ? 9999 : (10 * (1 + (m.runeDurationBonus || 0))),
            born: t,
            nextTick: t,
            triggered: false
          });
        }
      }
    }
    
    // 更新符文
    for (let i = g.runeCircles.length - 1; i >= 0; i--) {
      const rune = g.runeCircles[i];
      
      // 过期检测
      if (t - rune.born > rune.duration) {
        g.runeCircles.splice(i, 1);
        continue;
      }
      
      // 检测敌人踩中
      let triggered = false;
      for (let j = 0; j < g.enemies.length; j++) {
        const e = g.enemies[j];
        if (e._dead) continue;
        const dx = e.x - rune.x, dy = e.y - rune.y;
        if (dx*dx + dy*dy < rune.radius*rune.radius) {
          triggered = true;
          
          // 符文效果
          if (!rune.triggered || t >= rune.nextTick) {
            rune.nextTick = t + 0.5;
            rune.triggered = true;
            
            const powerBonus = m.runeMaster ? 1.5 : 1;
            const damage = rune.damage * powerBonus * (m.runeKing ? 2 : 1);
            
            switch (rune.type) {
              case 'explosion':
                applyDamageToEnemy(e, damage, t, { immediate: true });
                createExplosionEffect({ x: rune.x, y: rune.y }, rune.radius, t);
                if (!m.eternalRune) {
                  g.runeCircles.splice(i, 1);
                }
                break;
                
              case 'fire':
                applyDamageToEnemy(e, damage * 0.3, t);
                e.burnEnd = t + 3;
                e.burnDmg = 10;
                break;
                
              case 'ice':
                applyDamageToEnemy(e, damage * 0.2, t);
                if (Math.random() < 0.3) {
                  e.frozenUntil = t + 1.5;
                  e.color = '#00d7ff';
                } else {
                  e.slowed = true;
                }
                break;
                
              case 'lightning':
                applyDamageToEnemy(e, damage * 0.4, t);
                if (g.triggerChainLightning) {
                  g.triggerChainLightning(e, damage * 0.2, 2, t);
                }
                break;
                
              case 'poison':
                e.poisonEnd = t + 5;
                e.poisonDmg = damage * 0.1;
                break;
            }
            
            // 连环符文
            if (m.chainRune) {
              for (let k = 0; k < g.runeCircles.length; k++) {
                if (k === i) continue;
                const otherRune = g.runeCircles[k];
                const rdx = otherRune.x - rune.x, rdy = otherRune.y - rune.y;
                if (rdx*rdx + rdy*rdy < 200*200) {
                  otherRune.nextTick = t;  // 立即触发
                }
              }
            }
          }
        }
      }
    }
    
    // ========================================
    // 12. 护盾系统
    // ========================================
    
    // 魔法护盾
    if (m.magicShieldEnabled) {
      if (!m._magicShield) {
        m._magicShield = {
          current: m.magicShieldAmount || 50,
          max: m.magicShieldAmount || 50
        };
      }
      
      // 护盾回复
      if (m.shieldRegen && m._magicShield.current < m._magicShield.max) {
        m._magicShield.current = Math.min(
          m._magicShield.max,
          m._magicShield.current + (m.shieldRegen || 5) * dt
        );
      }
      
      // 击杀回复护盾
      if (m.killShield && m._lastKillCount !== g.stats?.kills) {
        m._lastKillCount = g.stats?.kills || 0;
        m._magicShield.current = Math.min(
          m._magicShield.max,
          m._magicShield.current + (m.killShieldAmount || 10)
        );
      }
    }
    
    // ========================================
    // 13. 附魔系统集成
    // ========================================
    
    // 这些效果主要通过修改基础属性实现，已在技能effect中完成
    // 这里处理一些需要运行时更新的附魔效果
    
    // 混沌附魔 - 随机元素效果
    if (m.chaosEnchant) {
      m._chaosElement = ['fire', 'ice', 'lightning', 'poison'][Math.floor(Math.random() * 4)];
    }
    
    // ========================================
    // 14. 射击时触发的魔法效果
    // ========================================
    // 这些在主游戏循环的射击函数中调用
    
  }
  
  // ============================================
  // 魔法系统 - 射击时调用的函数
  // ============================================
  function onMagicShoot(g, t) {
    if (!g.magic) return;
    const m = g.magic;
    
    // 火球术
    if (m.fireballChance > 0 && Math.random() < m.fireballChance) {
      m._fireballPending = true;
    }
    
    // 寒冰箭
    if (m.iceArrowChance > 0 && Math.random() < m.iceArrowChance) {
      m._iceArrowPending = true;
    }
    
    // 连锁闪电几率
    if (m.chainLightningChance > 0 && Math.random() < m.chainLightningChance) {
      m._chainLightningPending = true;
    }
  }
  
  // ============================================
  // 魔法系统 - 子弹命中时调用
  // ============================================
  function onMagicBulletHit(g, bullet, enemy, t, isCrit) {
    if (!g.magic) return;
    const m = g.magic;
    
    // 雷霆一击 (暴击触发)
    if (m.thunderStrikeOnCrit && isCrit) {
      const damage = m.thunderStrikeDamage || 50;
      if (g.applyDamageToEnemy) {
        g.applyDamageToEnemy(enemy, damage * (1 + (m.elementalAffinity?.lightning || 0)), t);
      }
      if (g.effects) {
        g.effects.push({
          kind: 'line',
          x1: enemy.x, y1: enemy.y - 300,
          x2: enemy.x, y2: enemy.y,
          color: '#ffff00',
          start: t, end: t + 0.15
        });
      }
      if (g.emitSparks) g.emitSparks({ x: enemy.x, y: enemy.y }, 10, '#ffff00', t);
    }
    
    // 冰霜之触
    if (m.frostTouch) {
      enemy.slowed = true;
      enemy._frostTouchUntil = t + 1;
    }
    
    // 诅咒标记已被举报移除
    
    // 火焰印记
    if (m.flameMarkEnabled && enemy.burnEnd && t < enemy.burnEnd) {
      const bonusDamage = g.bulletDamage * (m.flameMarkBonus || 0.20);
      if (g.applyDamageToEnemy) {
        g.applyDamageToEnemy(enemy, bonusDamage, t);
      }
    }
    
    // 棱镜结界 - 子弹命中时折射出多道光线攻击附近敌人
    if (m.prismDomainEnabled) {
      const splitCount = m.prismDomainSplitCount || 3;
      const damageMult = m.prismDomainDamageMult || 0.6;
      const prismDmg = g.bulletDamage * damageMult;
      const prismRange = 120;
      let hits = 0;
      for (let i = 0; i < g.enemies.length && hits < splitCount; i++) {
        const e = g.enemies[i];
        if (e._dead || e === enemy) continue;
        const dx = e.x - enemy.x, dy = e.y - enemy.y;
        if (dx * dx + dy * dy < prismRange * prismRange) {
          if (g.applyDamageToEnemy) {
            g.applyDamageToEnemy(e, prismDmg, t);
          }
          // 折射光线视觉效果
          if (g.effects) {
            g.effects.push({
              kind: 'line',
              x1: enemy.x, y1: enemy.y,
              x2: e.x, y2: e.y,
              color: '#e0aaff',
              start: t, end: t + 0.12
            });
          }
          hits++;
        }
      }
    }

    // 绝对零度
    if (m.absoluteZero && enemy.frozenUntil && t < enemy.frozenUntil) {
      const bonusDamage = g.bulletDamage * (m.frozenDamageBonus || 0.50);
      if (g.applyDamageToEnemy) {
        g.applyDamageToEnemy(enemy, bonusDamage, t);
      }
    }
  }
  
  // ============================================
  // 魔法系统 - 击杀敌人时调用
  // ============================================
  function onMagicKill(g, enemy, t) {
    if (!g.magic) return;
    const m = g.magic;
    
    // 凤凰之焰 - 燃烧敌人死亡爆炸
    if (m.phoenixFlame && enemy.burnEnd && t < enemy.burnEnd) {
      const radius = 60;
      const damage = 40 * (m.fireDamageBonus || 1);
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead || e === enemy) continue;
        const dx = e.x - enemy.x, dy = e.y - enemy.y;
        if (dx*dx + dy*dy < radius*radius) {
          if (g.applyDamageToEnemy) {
            g.applyDamageToEnemy(e, damage, t);
          }
          e.burnEnd = t + 2;
          e.burnDmg = 8;
        }
      }
      if (g.createExplosionEffect) g.createExplosionEffect({ x: enemy.x, y: enemy.y }, radius, t);
    }
    
    // 碎冰 - 冻结敌人死亡爆炸
    if (m.shatterIce && enemy.frozenUntil && t < enemy.frozenUntil) {
      const radius = m.shatterRadius || 80;
      const damage = 50 * (1 + (m.elementalAffinity?.ice || 0));
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead || e === enemy) continue;
        const dx = e.x - enemy.x, dy = e.y - enemy.y;
        if (dx*dx + dy*dy < radius*radius) {
          if (g.applyDamageToEnemy) {
            g.applyDamageToEnemy(e, damage, t);
          }
        }
      }
      if (g.createExplosionEffect) g.createExplosionEffect({ x: enemy.x, y: enemy.y }, radius, t);
      if (g.emitBurst) g.emitBurst({ x: enemy.x, y: enemy.y }, 20, '#88ddff', t);
    }
    
    // 暗黑祭坛 - 击杀回复
    if (m.darkAltarEnabled) {
      if (g.heal) g.heal(m.darkAltarHeal || 5);
    }
    
    // 连锁诅咒传播
    if (m.spreadingCurse && enemy._cursed) {
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead || e === enemy) continue;
        const dx = e.x - enemy.x, dy = e.y - enemy.y;
        if (dx*dx + dy*dy < 150*150) {
          e._cursed = true;
          e._curseBonus = enemy._curseBonus || 0.3;
        }
      }
    }
    
    // 灵魂诅咒回复
    if (m.soulCurse && enemy._cursed) {
      if (g.heal) g.heal(m.soulCurseHeal || 20);
    }
    
    // 灵魂烙印：被标记敌人死亡时引发连锁爆炸（首次击杀也触发，后续仅烙印敌人触发）
    if (m.soulBrand && (enemy._soulBranded || !m._soulBrandFirstTriggered)) {
      m._soulBrandFirstTriggered = true;
      const sbRadius = m.soulBrandExplosionRadius || 60;
      const sbDamage = m.soulBrandDamage || 40;
      let chainCount = 0;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead || e === enemy) continue;
        const dx = e.x - enemy.x, dy = e.y - enemy.y;
        if (dx*dx + dy*dy < sbRadius*sbRadius) {
          if (g.applyDamageToEnemy) g.applyDamageToEnemy(e, sbDamage, t);
          e._soulBranded = true; // 标记被烙印，下次死亡也会爆炸
          chainCount++;
        }
      }
      if (chainCount > 0) {
        if (g.createExplosionEffect) g.createExplosionEffect({ x: enemy.x, y: enemy.y }, sbRadius, t);
        if (g.emitBurst) g.emitBurst({ x: enemy.x, y: enemy.y }, 15, '#ff66ff', t, 400);
      }
    }
    
    // 诅咒爆炸
    if (m.explosiveCurse && enemy._cursed) {
      const radius = m.explosiveCurseRadius || 60;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead || e === enemy) continue;
        const dx = e.x - enemy.x, dy = e.y - enemy.y;
        if (dx*dx + dy*dy < radius*radius) {
          if (g.applyDamageToEnemy) g.applyDamageToEnemy(e, 60, t);
        }
      }
      if (g.createExplosionEffect) g.createExplosionEffect({ x: enemy.x, y: enemy.y }, radius, t);
    }
    
    // 亡灵召唤
    if (m.undeadSummonChance && Math.random() < m.undeadSummonChance) {
      const maxUndead = m.undeadMaxCount || 5;
      const currentUndead = g.golems.filter(g => g.type === 'undead' && !g._dead).length;
      if (currentUndead < maxUndead) {
        g.golems.push({
          id: (GameApp.Deps?.nextId || (() => Date.now()))(),
          type: 'undead',
          x: enemy.x,
          y: enemy.y,
          hp: 80,
          maxHp: 80,
          damage: 20,
          size: 30,
          color: '#886688',
          lastAttack: 0,
          attackInterval: 1.2,
          born: t
        });
      }
    }
  }
  
  // ============================================
  // 魔法系统 - 受伤时调用
  // ============================================
  function onMagicTakeDamage(g, damage, t) {
    if (!g.magic) return damage;
    const m = g.magic;
    
    let finalDamage = damage;
    
    // 魔法护盾吸收
    if (m._magicShield && m._magicShield.current > 0) {
      const absorbed = Math.min(m._magicShield.current, finalDamage);
      m._magicShield.current -= absorbed;
      finalDamage -= absorbed;
      
      // 护盾破碎爆炸
      if (m._magicShield.current <= 0 && m.shieldBurst) {
        const radius = 100;
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          const dx = e.x - g.player.x, dy = e.y - g.player.y;
          if (dx*dx + dy*dy < radius*radius) {
            if (g.applyDamageToEnemy) {
              g.applyDamageToEnemy(e, m.shieldBurstDamage || 100, t);
            }
          }
        }
        if (g.createExplosionEffect) g.createExplosionEffect({ x: g.player.x, y: g.player.y }, radius, t);
      }
    }
    
    // 闪电护盾反击
    if (m.lightningShieldEnabled) {
      const radius = 100;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e._dead) continue;
        const dx = e.x - g.player.x, dy = e.y - g.player.y;
        if (dx*dx + dy*dy < radius*radius) {
          if (g.applyDamageToEnemy) {
            g.applyDamageToEnemy(e, m.lightningShieldDamage || 25, t);
          }
        }
      }
    }
    
    // 生命脉冲：生命低于10%时释放脉冲，回复生命并击退周围敌人
    if (m.lifePulse && (g.playerHealth - finalDamage) <= g.playerMaxHealth * 0.10 && (g.playerHealth - finalDamage) > 0) {
      if (!m._lifePulseLastUse || (t - m._lifePulseLastUse) >= (m.lifePulseCooldown || 60)) {
        m._lifePulseLastUse = t;
        // 回复生命
        const healAmt = g.playerMaxHealth * (m.lifePulseHealPercent || 0.5);
        if (g.heal) g.heal(healAmt);
        // 击退周围敌人
        const pulseRadius = 180;
        const knockStr = m.lifePulseKnockback || 200;
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e._dead) continue;
          const dx = e.x - g.player.x, dy = e.y - g.player.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < pulseRadius * pulseRadius && d2 > 1) {
            const d = Math.sqrt(d2);
            e.x += (dx / d) * knockStr;
            e.y += (dy / d) * knockStr;
          }
        }
        // 视觉效果
        if (g.effects) {
          g.effects.push({ kind: 'shockwave', x: g.player.x, y: g.player.y, r: pulseRadius, color: '#00ff88', start: t, end: t + 0.4 });
        }
        if (g.emitBurst) g.emitBurst({ x: g.player.x, y: g.player.y }, 25, '#00ff88', t, 500);
        if (g.flash) g.flash('#00ff88', 0.30, 0.20, t);
        finalDamage = 0; // 免疫此次伤害
      }
    }

    // 闪电逃脱
    if (m.lightningEscape && finalDamage >= g.playerHealth) {
      if (!m._lightningEscapeUsed) {
        m._lightningEscapeUsed = true;
        // 传送到安全位置
        const angle = Math.random() * Math.PI * 2;
        g.player.x += Math.cos(angle) * 200;
        g.player.y += Math.sin(angle) * 200;
        finalDamage = 0;
        if (g.effects) {
          g.effects.push({
            kind: 'shockwave',
            x: g.player.x, y: g.player.y,
            r: 50, color: '#ffff00',
            start: t, end: t + 0.2
          });
        }
      }
    }
    
    return finalDamage;
  }
  
  // ============================================
  // 导出
  // ============================================
  GameApp.MagicSystem = {
    updateMagicSystem,
    onMagicShoot,
    onMagicBulletHit,
    onMagicKill,
    onMagicTakeDamage
  };
  
  // 全局导出
  window.MagicSystemLogic = GameApp.MagicSystem;
  
})();
