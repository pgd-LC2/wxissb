(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  function applyClassToGame(game, classId) {
    const classData = GameApp.Content && GameApp.Content.Classes
      ? GameApp.Content.Classes.CLASSES[classId]
      : null;
    if (!classData) {
      console.warn(`[ClassWeaponSystem] 未知职业: ${classId}`);
      return false;
    }

    const stats = classData.stats;

    if (stats.bulletDamage !== undefined) {
      game.bulletDamage = Math.round(game.bulletDamage * stats.bulletDamage);
    }
    if (stats.playerMaxHealth !== undefined) {
      game.playerMaxHealth = Math.round(game.playerMaxHealth * stats.playerMaxHealth);
      game.playerHealth = game.playerMaxHealth;
    }
    if (stats.playerSpeedMulti !== undefined) {
      game.playerSpeedMulti *= stats.playerSpeedMulti;
    }
    if (stats.shootInterval !== undefined) {
      game.shootInterval *= stats.shootInterval;
    }
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

    game.selectedClass = classData;
    game.player.color = classData.color;
    return true;
  }

  function applyWeaponToGame(game, weaponId) {
    const weaponData = GameApp.Content && GameApp.Content.Classes
      ? GameApp.Content.Classes.WEAPONS[weaponId]
      : null;
    if (!weaponData) {
      console.warn(`[ClassWeaponSystem] 未知武器: ${weaponId}`);
      return false;
    }

    const stats = weaponData.stats;

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

    game.selectedWeapon = weaponData;
    if (weaponData.visual) {
      game.weaponVisual = weaponData.visual;
    }

    return true;
  }

  GameApp.LoadoutApplier = {
    applyClassToGame,
    applyWeaponToGame
  };
})();
