import { GameApp as __GameApp } from './legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const CLASSES = GameApp.Content && GameApp.Content.Classes ? GameApp.Content.Classes.CLASSES : {};
  const WEAPONS = GameApp.Content && GameApp.Content.Classes ? GameApp.Content.Classes.WEAPONS : {};
  const SelectionState = GameApp.State ? GameApp.State.Selection : null;
  const applier = GameApp.LoadoutApplier || {};

  function createSelectionUI() {
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

        <div id="classSelection" class="cw-selection-panel">
          <div class="cw-options" id="classOptions"></div>
        </div>

        <div id="weaponSelection" class="cw-selection-panel hidden">
          <div class="cw-options" id="weaponOptions"></div>
        </div>

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
        <div class="cw-card-icon" style="background: ${cls.color}20; color: ${cls.color}">${cls.icon}</div>
        <div class="cw-card-content">
          <div class="cw-card-header">
            <span class="cw-card-name">${cls.name}</span>
            <span class="cw-card-name-en">${cls.nameEn}</span>
          </div>
          <div class="cw-card-desc">${cls.description}</div>
          <div class="cw-card-stats">${cls.descDetail}</div>
        </div>
        <div class="cw-card-select"><span class="cw-select-indicator">›</span></div>
      `;
      card.addEventListener("click", () => selectClass(cls.id));
      container.appendChild(card);
    });
  }

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
        <div class="cw-card-icon" style="background: ${weapon.color}20; color: ${weapon.color}">${weapon.icon}</div>
        <div class="cw-card-content">
          <div class="cw-card-header">
            <span class="cw-card-name">${weapon.name}</span>
            <span class="cw-card-name-en">${weapon.nameEn}</span>
          </div>
          <div class="cw-card-desc">${weapon.description}</div>
          <div class="cw-card-stats">${weapon.descDetail}</div>
        </div>
        <div class="cw-card-select"><span class="cw-select-indicator">›</span></div>
      `;
      card.addEventListener("click", () => selectWeapon(weapon.id));
      container.appendChild(card);
    });
  }

  function selectClass(classId) {
    SelectionState.selectedClass = classId;

    document.querySelectorAll("#classOptions .cw-card").forEach((card) => {
      card.classList.toggle("selected", card.dataset.id === classId);
    });

    setTimeout(() => {
      document.getElementById("classSelection").classList.add("hidden");
      document.getElementById("weaponSelection").classList.remove("hidden");
      document.querySelector('.cw-step[data-step="1"]').classList.remove("active");
      document.querySelector('.cw-step[data-step="1"]').classList.add("completed");
      document.querySelector('.cw-step[data-step="2"]').classList.add("active");
    }, 200);
  }

  function selectWeapon(weaponId) {
    SelectionState.selectedWeapon = weaponId;

    document.querySelectorAll("#weaponOptions .cw-card").forEach((card) => {
      card.classList.toggle("selected", card.dataset.id === weaponId);
    });

    setTimeout(showConfirmPanel, 200);
  }

  function showConfirmPanel() {
    const cls = CLASSES[SelectionState.selectedClass];
    const weapon = WEAPONS[SelectionState.selectedWeapon];

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

  function goBackToSelection() {
    SelectionState.selectedClass = null;
    SelectionState.selectedWeapon = null;

    document.querySelectorAll(".cw-card").forEach((card) => {
      card.classList.remove("selected");
    });
    document.querySelectorAll(".cw-step").forEach((step) => {
      step.classList.remove("active", "completed");
    });

    document.querySelector('.cw-step[data-step="1"]').classList.add("active");
    document.getElementById("confirmPanel").classList.add("hidden");
    document.getElementById("weaponSelection").classList.add("hidden");
    document.getElementById("classSelection").classList.remove("hidden");
  }

  function confirmSelection() {
    if (!SelectionState.selectedClass || !SelectionState.selectedWeapon) {
      console.warn("[ClassWeaponSystem] 选择不完整");
      return;
    }

    SelectionState.isSelectionComplete = true;
    const overlay = document.getElementById("classWeaponOverlay");
    if (overlay) {
      overlay.classList.add("hiding");
      setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.classList.remove("hiding");
      }, 300);
    }

    if (typeof SelectionState.callbacks.onComplete === "function") {
      SelectionState.callbacks.onComplete(SelectionState.selectedClass, SelectionState.selectedWeapon);
    }
  }

  function initializeEvents() {
    const confirmBtn = document.getElementById("cwConfirmBtn");
    const backBtn = document.getElementById("cwBackBtn");
    if (confirmBtn) confirmBtn.addEventListener("click", confirmSelection);
    if (backBtn) backBtn.addEventListener("click", goBackToSelection);
  }

  function showSelectionScreen(onComplete) {
    SelectionState.selectedClass = null;
    SelectionState.selectedWeapon = null;
    SelectionState.isSelectionComplete = false;
    SelectionState.callbacks.onComplete = onComplete;

    const overlay = createSelectionUI();
    renderClassOptions();
    renderWeaponOptions();
    initializeEvents();

    document.getElementById("classSelection").classList.remove("hidden");
    document.getElementById("weaponSelection").classList.add("hidden");
    document.getElementById("confirmPanel").classList.add("hidden");

    document.querySelectorAll(".cw-step").forEach((step) => {
      step.classList.remove("active", "completed");
    });
    document.querySelector('.cw-step[data-step="1"]').classList.add("active");
    overlay.classList.remove("hidden", "hiding");
  }

  GameApp.ClassWeaponSystem = {
    CLASSES,
    WEAPONS,
    SelectionState,
    showSelectionScreen,
    applyClassToGame: applier.applyClassToGame,
    applyWeaponToGame: applier.applyWeaponToGame,
    getSelectedClass: () => CLASSES[SelectionState.selectedClass],
    getSelectedWeapon: () => WEAPONS[SelectionState.selectedWeapon]
  };
})();

(() => {
  "use strict";

  const GameApp = __GameApp;
  const dom = GameApp.DOM || {};
  const { soundToggle, musicToggle, shakeToggle } = dom;
  const fallbackRuntime = { shakeEnabled: true };
  const getRuntime = () => GameApp.Runtime || fallbackRuntime;
  const Audio = GameApp.Infra && GameApp.Infra.Audio ? GameApp.Infra.Audio : {};
  const SFX = Audio.sfx || (GameApp.Deps && GameApp.Deps.SFX ? GameApp.Deps.SFX : null);
  const Storage = GameApp.Infra && GameApp.Infra.Storage ? GameApp.Infra.Storage : null;
  const keys = Storage && Storage.keys ? Storage.keys : {
    soundMuted: "bigear_pref_muted",
    shakeEnabled: "bigear_pref_shake",
    musicMuted: "bigear_pref_music_muted"
  };

  const getMusicPlayer = () => {
    const audio = GameApp.Infra && GameApp.Infra.Audio ? GameApp.Infra.Audio : null;
    return audio && audio.musicPlayer ? audio.musicPlayer : null;
  };
  let musicMuted = false;

  function refreshSoundIcon() {
    if (!soundToggle || !SFX) return;
    if (SFX.isMuted()) {
      soundToggle.classList.add("muted");
      soundToggle.textContent = "🔇";
    } else {
      soundToggle.classList.remove("muted");
      soundToggle.textContent = "🔊";
    }
  }

  function refreshMusicIcon() {
    if (!musicToggle) return;
    if (musicMuted) {
      musicToggle.classList.add("muted");
      musicToggle.textContent = "🔇";
      musicToggle.title = "音乐已禁用（点击开启）";
    } else {
      musicToggle.classList.remove("muted");
      musicToggle.textContent = "🎵";
      musicToggle.title = "禁用音乐（点击关闭）";
    }
  }

  function refreshShakeIcon() {
    if (!shakeToggle) return;
    if (getRuntime().shakeEnabled) {
      shakeToggle.classList.remove("disabled");
      shakeToggle.textContent = "📳";
      shakeToggle.title = "屏幕震动：开启（点击关闭）";
    } else {
      shakeToggle.classList.add("disabled");
      shakeToggle.textContent = "📴";
      shakeToggle.title = "屏幕震动：关闭（点击开启）";
    }
  }

  function setMusicMuted(muted) {
    musicMuted = !!muted;
    const player = getMusicPlayer();
    if (player) {
      if (musicMuted) player.pause();
      else player.play();
    }
    if (Storage && Storage.safeSet) Storage.safeSet(keys.musicMuted, musicMuted ? "1" : "0");
    refreshMusicIcon();
  }

  function initSoundState() {
    if (!SFX || !Storage) return;
    const muted = Storage.safeGet(keys.soundMuted, "0") === "1";
    SFX.setMuted(muted);
    const player = getMusicPlayer();
    if (player) {
      if (muted) player.pause();
      else player.play();
    }
  }

  function initMusicState() {
    if (!Storage) return;
    musicMuted = Storage.safeGet(keys.musicMuted, "0") === "1";
    const player = getMusicPlayer();
    if (musicMuted && player && player.pause) player.pause();
  }

  function initShakeState() {
    if (!Storage) return;
    getRuntime().shakeEnabled = Storage.safeGet(keys.shakeEnabled, "1") === "1";
  }

  function bindSound() {
    if (!soundToggle || !SFX) return;
    soundToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      SFX.unlock();
      const muted = !SFX.isMuted();
      SFX.setMuted(muted);
      const player = getMusicPlayer();
      if (player) {
        if (muted) player.pause();
        else if (!musicMuted) player.play();
      }
      if (Storage && Storage.safeSet) Storage.safeSet(keys.soundMuted, muted ? "1" : "0");
      refreshSoundIcon();
    });

    window.addEventListener("pointerdown", () => { SFX.unlock(); }, { once: true, passive: true });
  }

  function bindMusic() {
    if (!musicToggle) return;
    musicToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setMusicMuted(!musicMuted);
    });
  }

  function bindShake() {
    if (!shakeToggle) return;
    shakeToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const runtime = getRuntime();
      runtime.shakeEnabled = !runtime.shakeEnabled;
      if (Storage && Storage.safeSet) Storage.safeSet(keys.shakeEnabled, runtime.shakeEnabled ? "1" : "0");
      refreshShakeIcon();
    });
  }

  initSoundState();
  initMusicState();
  initShakeState();
  bindSound();
  bindMusic();
  bindShake();
  refreshSoundIcon();
  refreshMusicIcon();
  refreshShakeIcon();

  const ui = GameApp.UI = GameApp.UI || {};
  ui.refreshSoundIcon = refreshSoundIcon;
  ui.isShakeEnabled = () => getRuntime().shakeEnabled;

  GameApp.MusicToggle = GameApp.MusicToggle || {};
  GameApp.MusicToggle.isMuted = () => musicMuted;
  GameApp.MusicToggle.setMuted = setMusicMuted;
  GameApp.MusicToggle.toggle = () => setMusicMuted(!musicMuted);
  GameApp.MusicToggle.refreshMusicIcon = refreshMusicIcon;
})();
