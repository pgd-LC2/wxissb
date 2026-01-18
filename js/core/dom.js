(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });

  GameApp.DOM = {
    canvas,
    ctx,

    levelBadge: document.getElementById("levelBadge"),
    hpFill: document.getElementById("hpFill"),
    expFill: document.getElementById("expFill"),
    skillCountEl: document.getElementById("skillCount"),
    powerBadgeEl: document.getElementById("powerBadge"),

    overlay: document.getElementById("overlay"),
    overlayTitle: document.getElementById("overlayTitle"),
    overlaySubtitle: document.getElementById("overlaySubtitle"),
    choicesEl: document.getElementById("choices"),
    gameoverStatsEl: document.getElementById("gameoverStats"),
    restartRow: document.getElementById("restartRow"),
    restartBtn: document.getElementById("restartBtn"),
    homeBtn: document.getElementById("homeBtn"),

    joystickEl: document.getElementById("joystick"),
    joyKnob: document.getElementById("joyKnob"),
    soundToggle: document.getElementById("soundToggle"),
    shakeToggle: document.getElementById("shakeToggle"),
    pauseBtn: document.getElementById("pauseBtn"),
    pauseOverlay: document.getElementById("pauseOverlay"),
    pauseStats: document.getElementById("pauseStats"),
    pauseSubmitNameInput: document.getElementById("pauseSubmitNameInput"),
    pauseSubmitScoreBtn: document.getElementById("pauseSubmitScoreBtn"),
    pauseSubmitStatus: document.getElementById("pauseSubmitStatus"),
    resumeBtn: document.getElementById("resumeBtn"),
    quitBtn: document.getElementById("quitBtn"),

    leaderboardToggle: document.getElementById("leaderboardToggle"),
    globalLeaderboard: document.getElementById("globalLeaderboard"),
    globalLeaderboardContent: document.getElementById("globalLeaderboardContent"),
    closeLeaderboard: document.getElementById("closeLeaderboard")
  };
})();
