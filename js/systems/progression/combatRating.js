import { GameApp as __GameApp } from '../../legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const Progression = GameApp.Progression = GameApp.Progression || {};

  function attachCombatRating(game, helpers) {
    const { clamp, lerp, safeNumber, safeNonNeg } = helpers;

    game.stats = {
      startTime: 0,
      kills: 0,
      dmgDealt: 0,
      dmgTaken: 0,
      expGained: 0
    };

    game.combat = {
      window: 30.0,
      events: { kills: [], dmgDealt: [], dmgTaken: [], exp: [], levelUps: [] },
      _acc: { kills: 0, dmgDealt: 0, dmgTaken: 0, exp: 0, levelUps: 0 },
      rating: 0,
      ratingSmooth: 0,
      tier: "D",
      tierColor: "rgba(255,255,255,.92)",
      peak: 0,
      integral: 0,
      lastEval: 0
    };

    game._pushCombatEvent = (arr, t, value) => {
      if (!arr) return;
      arr.push({ t, v: safeNonNeg(value, 0) });
    };

    game._pruneCombatEvents = (arr, t, windowSec) => {
      const cutoff = t - windowSec;
      while (arr.length > 0 && arr[0].t < cutoff) arr.shift();
    };

    game._sumCombatEvents = (arr, t, windowSec) => {
      game._pruneCombatEvents(arr, t, windowSec);
      let sum = 0;
      for (let i = 0; i < arr.length; i++) sum += arr[i].v;
      return safeNonNeg(sum, 0);
    };

    game.estimateBuildDps = () => {
      const crit = 1 + clamp(game.critRate, 0, 1) * (safeNumber(game.critDamageMulti, 2.0) - 1);
      const shootInterval = Math.max(0.06, safeNumber(game.shootInterval, 0.6));
      const shotsPerSecond = 1 / shootInterval;
      const bulletDps = safeNonNeg(safeNumber(game.bulletDamage, 0) * crit * safeNumber(game.bulletCount, 1) * shotsPerSecond, 0);

      const droneCount = safeNumber(game.droneCount, 0);
      const droneSps = droneCount > 0 ? (droneCount * (1 / 0.8) * 0.65) : 0;
      const droneDps = safeNonNeg(safeNumber(game.bulletDamage, 0) * crit * droneSps, 0);

      const bladeDps = safeNonNeg(safeNumber(game.bladeOrbitCount, 0) * safeNumber(game.bladeOrbitDamage, 0) * safeNumber(game.bladeOrbitSpeed, 1.0) * 0.55, 0);
      const shieldDps = safeNonNeg(safeNumber(game.orbitalShieldCount, 0) * safeNumber(game.orbitalShieldDamage, 0) * safeNumber(game.orbitalShieldSpeed, 1.0) * 0.35, 0);
      const auraDps = game.lightningAuraEnabled ? safeNonNeg(safeNumber(game.lightningAuraDamage, 0) * 1.2, 0) : 0;

      return safeNonNeg(bulletDps + droneDps + bladeDps + shieldDps + auraDps, 0);
    };

    game.estimateSkillScore = () => {
      const meta = game.acquiredSkillMeta || [];
      if (!meta || meta.length === 0) return safeNonNeg(game.acquiredSkills.length, 0) * 1.0;

      let score = 0;
      const tierScore = [0, 1.0, 1.6, 2.3, 3.2, 4.2];
      for (let i = 0; i < meta.length; i++) {
        const tier = meta[i].tier || 1;
        const level = Math.max(1, Math.min(5, tier));
        score += tierScore[level] || 1.0;
      }
      return safeNonNeg(score, 0);
    };

    game._combatTierFromScore = (score) => {
      if (score >= 5000) return { tier: "X", color: "#ff00ff" };
      if (score >= 3000) return { tier: "EX", color: "#00ffff" };
      if (score >= 2000) return { tier: "SSSS", color: "#ff1493" };
      if (score >= 1500) return { tier: "SSS+", color: "#ff6b6b" };
      if (score >= 920) return { tier: "SSS", color: "#ff3b30" };
      if (score >= 820) return { tier: "SS", color: "#ff9f0a" };
      if (score >= 700) return { tier: "S", color: "#ffd60a" };
      if (score >= 560) return { tier: "A", color: "#34c759" };
      if (score >= 420) return { tier: "B", color: "#4aa3ff" };
      if (score >= 280) return { tier: "C", color: "#9ca3af" };
      return { tier: "D", color: "rgba(255,255,255,.92)" };
    };

    game.computeCombatRating = (t) => {
      const combat = game.combat;
      const windowSec = combat.window;

      const kills = game._sumCombatEvents(combat.events.kills, t, windowSec);
      const damage = game._sumCombatEvents(combat.events.dmgDealt, t, windowSec);
      const damageTaken = game._sumCombatEvents(combat.events.dmgTaken, t, windowSec);
      const exp = game._sumCombatEvents(combat.events.exp, t, windowSec);
      const levelUps = game._sumCombatEvents(combat.events.levelUps, t, windowSec);

      const kpm = kills * 60 / windowSec;
      const dps = damage / windowSec;
      const dtps = damageTaken / windowSec;
      const xps = exp / windowSec;
      const lpm = levelUps * 60 / windowSec;

      const buildDps = game.estimateBuildDps();
      const skillScore = game.estimateSkillScore();
      const hpRatio = clamp(game.playerHealth / Math.max(1, game.playerMaxHealth), 0, 1);
      const sinceHit = game.lastDamageTime ? (t - game.lastDamageTime) : windowSec;
      const calm = clamp(sinceHit / windowSec, 0, 1);
      const efficiency = dps / Math.max(1, dtps);

      const nK = Math.max(0, kpm / 80);
      const nD = Math.max(0, dps / 900);
      const nB = Math.max(0, buildDps / 1200);
      const nX = Math.max(0, xps / 120);
      const nL = Math.max(0, lpm / 10);
      const nS = Math.max(0, skillScore / 120);
      const nE = Math.max(0, efficiency / 12);

      const raw =
        0.18 * nB +
        0.18 * nD +
        0.16 * nK +
        0.12 * nX +
        0.10 * nL +
        0.10 * nS +
        0.08 * nE +
        0.05 * calm +
        0.03 * hpRatio;

      const rating = Math.min(100000, Math.max(0, 1000 * raw));
      const tier = game._combatTierFromScore(rating);

      return {
        rating,
        kpm,
        dps,
        xps,
        buildDps,
        hpRatio,
        tier: tier.tier,
        tierColor: tier.color
      };
    };

    game.updateCombatRating = (t) => {
      const combat = game.combat;
      if (!combat) return;

      const acc = combat._acc;
      if (acc.kills > 0) { game._pushCombatEvent(combat.events.kills, t, acc.kills); acc.kills = 0; }
      if (acc.dmgDealt > 0) { game._pushCombatEvent(combat.events.dmgDealt, t, acc.dmgDealt); acc.dmgDealt = 0; }
      if (acc.dmgTaken > 0) { game._pushCombatEvent(combat.events.dmgTaken, t, acc.dmgTaken); acc.dmgTaken = 0; }
      if (acc.exp > 0) { game._pushCombatEvent(combat.events.exp, t, acc.exp); acc.exp = 0; }
      if (acc.levelUps > 0) { game._pushCombatEvent(combat.events.levelUps, t, acc.levelUps); acc.levelUps = 0; }

      if (combat.lastEval && (t - combat.lastEval) < 0.15) return;

      const dt = combat.lastEval ? Math.min(0.25, Math.max(0, t - combat.lastEval)) : 0;
      combat.lastEval = t;

      const result = game.computeCombatRating(t);
      combat.rating = result.rating;

      const alpha = clamp(dt * 2.2, 0.04, 0.25);
      combat.ratingSmooth = combat.ratingSmooth === 0 ? combat.rating : lerp(combat.ratingSmooth, combat.rating, alpha);
      combat.peak = Math.max(combat.peak, combat.ratingSmooth);
      combat.integral = safeNonNeg(combat.integral + combat.ratingSmooth * dt, 0);
      combat.tier = result.tier;
      combat.tierColor = result.tierColor;
      combat.snapshot = result;
    };
  }

  Progression.attachCombatRating = attachCombatRating;
})();
