import { GameApp as __GameApp } from '../legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const Storage = GameApp.Infra && GameApp.Infra.Storage ? GameApp.Infra.Storage : null;

  const BG_PLAYBACK_RATE = 0.7;
  const BG_VIDEOS = [
    "/public/background/HomeScreen_CN_OB.mp4",
    "/public/background/Contract%20Glitches.webm"
  ];

  let bgVideoIndex = 0;
  let bgVideoEl = null;
  let musicSettingsBound = false;

  function getMusicPlayer() {
    const audio = GameApp.Infra && GameApp.Infra.Audio ? GameApp.Infra.Audio : null;
    return audio && audio.musicPlayer ? audio.musicPlayer : null;
  }

  function getById(id) {
    return document.getElementById(id);
  }

  function createParticles() {
    const container = getById("particles");
    if (!container) return;

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.setProperty("--drift", `${(Math.random() - 0.5) * 100}px`);
      particle.style.animationDuration = `${15 + Math.random() * 15}s`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      container.appendChild(particle);
    }
  }

  function playSound() {
    try {
      new Audio();
    } catch {}
  }

  function navigateTo(url) {
    const loading = getById("loading");
    if (loading) loading.classList.add("show");
    playSound();
    setTimeout(() => {
      window.location.href = url;
    }, 800);
  }

  function startGame() {
    navigateTo("pages/game.html?play=1");
  }

  function openMinecraft() {
    navigateTo("pages/minecraft/index.html");
  }

  function showLeaderboard() {
    playSound();
    navigateTo("pages/leaderboard.html");
  }

  function openModal(title, html) {
    const modal = getById("modal");
    const modalTitle = getById("modalTitle");
    const modalBody = getById("modalBody");
    if (!modal || !modalTitle || !modalBody) return;
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.classList.add("show");
  }

  function closeModal() {
    const modal = getById("modal");
    if (modal) modal.classList.remove("show");
  }

  function getPref(key, fallback) {
    return Storage && Storage.safeGet ? Storage.safeGet(key, fallback) : fallback;
  }

  function setPref(key, value) {
    if (Storage && Storage.safeSet) Storage.safeSet(key, value);
  }

  function getGameInstructionsHtml() {
    return [
      '<div class="setting-section">',
      '  <div class="setting-section-title">🎮 游戏说明</div>',
      '  <div class="setting-text"><strong>操作方式：</strong>WASD 或摇杆移动，自动射击最近的敌人，M 键静音/取消静音。</div>',
      '  <div class="setting-text"><strong>游戏目标：</strong>击败敌人获得经验值，升级后选择强大技能，尽可能存活更长时间并挑战全球排行榜。</div>',
      '  <div class="setting-text"><strong>肉鸽特色：</strong>每局技能随机、永久死亡机制、技能组合有策略深度。</div>',
      '</div>'
    ].join("");
  }

  function renderMusicState() {
    const player = getMusicPlayer();
    const musicVolume = getById("settingMusicVolume");
    const musicCurrent = getById("musicCurrent");
    if (!player) {
      if (musicCurrent) musicCurrent.textContent = "音乐系统未初始化";
      return;
    }

    const state = player.getState();
    if (musicVolume) musicVolume.value = Math.round(player.getVolume() * 100);
    if (!musicCurrent) return;

    if (!state.list.length || !state.current) {
      musicCurrent.textContent = "未找到音乐文件";
      return;
    }

    musicCurrent.textContent = state.current.replace(/\.[^/.]+$/, "");
  }

  function setupMusicSettings() {
    const player = getMusicPlayer();
    const musicVolume = getById("settingMusicVolume");
    const musicPrev = getById("musicPrev");
    const musicNext = getById("musicNext");

    renderMusicState();
    if (!player) return;

    if (musicVolume) {
      musicVolume.oninput = () => {
        const volume = Math.max(0, Math.min(100, Number(musicVolume.value || 0)));
        player.setVolume(volume / 100);
      };
    }

    if (musicPrev) musicPrev.onclick = () => player.prev();
    if (musicNext) musicNext.onclick = () => player.next();

    if (!musicSettingsBound) {
      player.onUpdate(renderMusicState);
      musicSettingsBound = true;
    }
  }

  function showSettings() {
    playSound();
    const soundMutedKey = Storage && Storage.keys ? Storage.keys.soundMuted : "bigear_pref_muted";
    const shakeEnabledKey = Storage && Storage.keys ? Storage.keys.shakeEnabled : "bigear_pref_shake";

    openModal("设置", `
      <div class="setting-row">
        <span>音效</span>
        <label class="switch">
          <input type="checkbox" id="settingSound">
          <span class="slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <span>屏幕震动</span>
        <label class="switch">
          <input type="checkbox" id="settingShake">
          <span class="slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <span>当前歌曲</span>
        <span class="music-current" id="musicCurrent">-</span>
      </div>
      <div class="setting-row">
        <span>音乐音量</span>
        <input type="range" class="range" id="settingMusicVolume" min="0" max="100" value="60">
      </div>
      <div class="setting-row">
        <span>播放控制</span>
        <div class="music-actions">
          <button class="btn btn-mini" id="musicPrev">上一首</button>
          <button class="btn btn-mini" id="musicNext">下一首</button>
        </div>
      </div>
      ${getGameInstructionsHtml()}
      <div style="margin-top:10px; font-size:12px; opacity:.7;">
        设置将同步到游戏内（可在游戏里随时修改）。
      </div>
    `);

    const soundToggle = getById("settingSound");
    const shakeToggle = getById("settingShake");
    const muted = getPref(soundMutedKey, "0") === "1";
    const shakeEnabled = getPref(shakeEnabledKey, "1") === "1";

    if (soundToggle) {
      soundToggle.checked = !muted;
      soundToggle.onchange = () => {
        const isMuted = !soundToggle.checked;
        setPref(soundMutedKey, isMuted ? "1" : "0");
      };
    }

    if (shakeToggle) {
      shakeToggle.checked = shakeEnabled;
      shakeToggle.onchange = () => {
        setPref(shakeEnabledKey, shakeToggle.checked ? "1" : "0");
      };
    }

    setupMusicSettings();
  }

  function setBackgroundVideo(index, autoplay) {
    if (!bgVideoEl || BG_VIDEOS.length === 0) return;
    bgVideoIndex = ((index % BG_VIDEOS.length) + BG_VIDEOS.length) % BG_VIDEOS.length;
    bgVideoEl.src = BG_VIDEOS[bgVideoIndex];
    bgVideoEl.load();
    if (autoplay) playBackgroundVideo();
  }

  function playBackgroundVideo() {
    if (!bgVideoEl) initBackgroundVideo();
    if (!bgVideoEl) return;
    bgVideoEl.playbackRate = BG_PLAYBACK_RATE;
    const promise = bgVideoEl.play();
    if (promise && typeof promise.then === "function") {
      promise.then(() => {
        bgVideoEl.dataset.playing = "1";
      }).catch(() => {});
    }
  }

  function nextBackgroundVideo() {
    setBackgroundVideo(bgVideoIndex + 1, true);
  }

  function initBackgroundVideo() {
    bgVideoEl = getById("bgVideo");
    if (!bgVideoEl) return;

    bgVideoEl.addEventListener("loadedmetadata", () => {
      bgVideoEl.playbackRate = BG_PLAYBACK_RATE;
    });
    bgVideoEl.addEventListener("ended", nextBackgroundVideo);
    bgVideoEl.addEventListener("error", nextBackgroundVideo);

    setBackgroundVideo(0, false);
  }

  function enterSite() {
    const gate = getById("entryGate");
    if (!gate || gate.classList.contains("hide")) return;

    gate.classList.add("hide");
    playBackgroundVideo();
    const player = getMusicPlayer();
    if (player && typeof player.play === "function") {
      player.play();
    }

    setTimeout(() => {
      gate.remove();
    }, 700);
  }

  function initResetBanner() {
    const banner = getById("resetBanner");
    if (!banner) return;
    const deadline = new Date("2026-03-21T23:59:59Z");
    if (new Date() <= deadline) {
      banner.style.display = "block";
    }
  }

  function bindEvents() {
    const entryGate = getById("entryGate");
    const modal = getById("modal");
    const startBtn = getById("startGameBtn");
    const leaderboardBtn = getById("leaderboardBtn");
    const settingsBtn = getById("settingsBtn");
    const minecraftBtn = getById("minecraftBtn");
    const modalCloseBtn = getById("modalCloseBtn");

    if (startBtn) startBtn.addEventListener("click", startGame);
    if (leaderboardBtn) leaderboardBtn.addEventListener("click", showLeaderboard);
    if (settingsBtn) settingsBtn.addEventListener("click", showSettings);
    if (minecraftBtn) minecraftBtn.addEventListener("click", openMinecraft);
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);

    if (entryGate) {
      entryGate.addEventListener("click", enterSite);
      entryGate.addEventListener("touchstart", enterSite, { passive: true });
    }

    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
      });
    }

    document.addEventListener("keydown", (event) => {
      const gate = getById("entryGate");
      const gateVisible = gate && !gate.classList.contains("hide");

      if (event.key === "Enter") {
        if (gateVisible) {
          enterSite();
          return;
        }
        startGame();
      }

      if ((event.code === "Space" || event.key === " ") && gateVisible) {
        enterSite();
      }
    });
  }

  function preloadGamePage() {
    setTimeout(() => {
      const image = new Image();
      image.src = "pages/game.html?play=1";
    }, 100);
  }

  function init() {
    createParticles();
    initBackgroundVideo();
    playBackgroundVideo();
    initResetBanner();
    bindEvents();
    preloadGamePage();
  }

  GameApp.HomePage = {
    init,
    closeModal,
    showSettings,
    startGame,
    showLeaderboard
  };
})();
