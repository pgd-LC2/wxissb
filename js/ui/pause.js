(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const {
    pauseBtn,
    pauseOverlay,
    pauseStats,
    pauseSubmitNameInput,
    pauseSubmitScoreBtn,
    pauseSubmitStatus,
    resumeBtn,
    quitBtn,
    quitConfirmDialog,
    quitCancelBtn,
    quitConfirmBtn,
    pauseSkillsLeft,
    pauseSkillsRight,
    pauseParticleCanvas,
    pauseMainView,
    reportSkillBtn,
    reportSkillView,
    reportSkillList,
    reportReasonText,
    reportSubmitStatus,
    reportBackBtn,
    reportSubmitBtn
  } = GameApp.DOM;
  const { nowSec } = GameApp.Deps.utils;
  const { formatTime, getStoredPlayerName, storePlayerName, escapeHtml } = GameApp.Helpers;
  const Shared = GameApp.UIShared || {};
  const getSharedSkillCards = Shared.getSkillCards || (() => []);
  const computeRunSummary = Shared.computeRunSummary || (() => ({
    timeAlive: 0,
    score: 0,
    tierObj: { tier: "", color: "#fff" },
    kills: 0,
    skillCount: 0,
    level: 1
  }));
  const submitSharedSkillReports = Shared.submitSkillReports || (async () => ({ error: "submitSkillReports unavailable" }));
  const Api = GameApp.Infra && GameApp.Infra.Api ? GameApp.Infra.Api : {};
  const runtime = GameApp.Runtime;

  let game = null;
  runtime.onGameChange((g) => { game = g; });

  /* ================================================
     粒子系统 - 暂停背景粒子特效
     ================================================ */
  let particleCtx = null;
  let particles = [];
  let particleAnimId = null;

  function initParticles() {
    if (!pauseParticleCanvas) return;
    const rect = pauseOverlay.getBoundingClientRect();
    pauseParticleCanvas.width = rect.width;
    pauseParticleCanvas.height = rect.height;
    particleCtx = pauseParticleCanvas.getContext("2d");
    particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.4 + 0.1,
        hue: Math.random() * 60 + 30
      });
    }
  }

  function animateParticles() {
    if (!particleCtx || !pauseParticleCanvas) return;
    const w = pauseParticleCanvas.width;
    const h = pauseParticleCanvas.height;
    particleCtx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      particleCtx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha})`;
      particleCtx.fill();

      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      particleCtx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha * 0.15})`;
      particleCtx.fill();
    }

    particleAnimId = requestAnimationFrame(animateParticles);
  }

  function startParticles() {
    initParticles();
    if (particleAnimId) cancelAnimationFrame(particleAnimId);
    animateParticles();
  }

  function stopParticles() {
    if (particleAnimId) {
      cancelAnimationFrame(particleAnimId);
      particleAnimId = null;
    }
  }

  /* ================================================
     左右技能滚动列 - 酷炫动画
     ================================================ */
  function getSkillCards() {
    return getSharedSkillCards(game);
  }

  function buildScrollColumn(container, cards) {
    if (!container || cards.length === 0) {
      if (container) container.innerHTML = "";
      return;
    }

    const items = [...cards, ...cards];
    let html = '<div class="pause-skill-scroll-track">';
    for (const c of items) {
      html += `<div class="pause-skill-card tier${c.tier}">
        <div class="sk-icon">${c.icon}</div>
        <div class="sk-info">
          <div class="sk-name">${escapeHtml(c.name)}</div>
          <div class="sk-tier">${escapeHtml(c.tierLabel)}</div>
        </div>
      </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function populateScrollColumns() {
    const cards = getSkillCards();
    if (cards.length === 0) {
      if (pauseSkillsLeft) pauseSkillsLeft.innerHTML = "";
      if (pauseSkillsRight) pauseSkillsRight.innerHTML = "";
      return;
    }
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    buildScrollColumn(pauseSkillsLeft, shuffled.slice(0, mid));
    buildScrollColumn(pauseSkillsRight, shuffled.slice(mid));
  }

  /* ================================================
     举报技能面板
     ================================================ */
  const selectedSkills = new Set();

  function showReportPanel() {
    if (!pauseMainView || !reportSkillView) return;
    pauseMainView.classList.add("hidden");
    reportSkillView.classList.remove("hidden");
    selectedSkills.clear();
    populateReportSkillList();
    updateSubmitBtnCount();
    if (reportSubmitStatus) {
      reportSubmitStatus.textContent = "";
      reportSubmitStatus.className = "submit-status";
    }
    if (reportSubmitBtn) {
      reportSubmitBtn.disabled = true;
    }
    const chips = reportSkillView.querySelectorAll(".report-reason-chip");
    chips.forEach((chip, i) => {
      if (i === 0) chip.classList.add("selected");
      else chip.classList.remove("selected");
    });
    const firstRadio = reportSkillView.querySelector('input[name="reportReason"][value="没用"]');
    if (firstRadio) firstRadio.checked = true;
    if (reportReasonText) {
      reportReasonText.classList.add("hidden");
      reportReasonText.value = "";
    }
  }

  function hideReportPanel() {
    if (!pauseMainView || !reportSkillView) return;
    reportSkillView.classList.add("hidden");
    pauseMainView.classList.remove("hidden");
  }

  function populateReportSkillList() {
    if (!reportSkillList) return;
    const cards = getSkillCards();
    if (cards.length === 0) {
      reportSkillList.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,.4);padding:20px;">你还没有获得任何技能</div>';
      return;
    }
    let html = "";
    for (const c of cards) {
      html += `<div class="report-skill-item" data-skill="${escapeHtml(c.name)}" data-tier="${c.tier}">
        <div class="rsi-check">✓</div>
        <div class="rsi-icon">${c.icon}</div>
        <div class="rsi-info">
          <div class="rsi-name">${escapeHtml(c.name)}</div>
          <div class="rsi-desc">${escapeHtml(c.description)}</div>
        </div>
      </div>`;
    }
    reportSkillList.innerHTML = html;

    reportSkillList.querySelectorAll(".report-skill-item").forEach(item => {
      item.addEventListener("click", () => {
        const name = item.getAttribute("data-skill");
        if (selectedSkills.has(name)) {
          selectedSkills.delete(name);
          item.classList.remove("selected");
        } else {
          selectedSkills.add(name);
          item.classList.add("selected");
        }
        updateSubmitBtnCount();
      });
    });
  }

  function updateSubmitBtnCount() {
    if (!reportSubmitBtn) return;
    const count = selectedSkills.size;
    reportSubmitBtn.textContent = `提交举报 (${count})`;
    reportSubmitBtn.disabled = count === 0;
  }

  if (reportSkillView) {
    reportSkillView.addEventListener("click", (e) => {
      const chip = e.target.closest(".report-reason-chip");
      if (!chip) return;
      const radio = chip.querySelector("input[type=radio]");
      if (radio) radio.checked = true;
      reportSkillView.querySelectorAll(".report-reason-chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");

      if (reportReasonText) {
        if (radio && radio.value === "其他") {
          reportReasonText.classList.remove("hidden");
        } else {
          reportReasonText.classList.add("hidden");
        }
      }
    });
  }

  if (reportBackBtn) {
    reportBackBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hideReportPanel();
    });
  }

  if (reportSkillBtn) {
    reportSkillBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showReportPanel();
    });
  }

  if (reportSubmitBtn) {
    reportSubmitBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (selectedSkills.size === 0) return;

      const reasonRadio = reportSkillView ? reportSkillView.querySelector('input[name="reportReason"]:checked') : null;
      const reason = reasonRadio ? reasonRadio.value : "没用";
      const reasonText = (reportReasonText && reason === "其他") ? reportReasonText.value.trim().slice(0, 200) : "";

      const playerName = pauseSubmitNameInput ? pauseSubmitNameInput.value.trim() : getStoredPlayerName();
      const cards = getSkillCards();

      const t = nowSec();
      const summary = computeRunSummary(game, t);

      reportSubmitBtn.disabled = true;
      if (reportSubmitStatus) {
        reportSubmitStatus.textContent = "提交中...";
        reportSubmitStatus.className = "submit-status";
      }

      try {
        const result = await submitSharedSkillReports(
          selectedSkills,
          cards,
          reason,
          reasonText,
          playerName || "匿名",
          summary.level,
          summary.score
        );
        if (result.error) {
          if (reportSubmitStatus) {
            reportSubmitStatus.textContent = "提交失败，请重试";
            reportSubmitStatus.className = "submit-status error";
          }
          reportSubmitBtn.disabled = false;
        } else {
          if (reportSubmitStatus) {
            reportSubmitStatus.textContent = "举报成功，感谢反馈！";
            reportSubmitStatus.className = "submit-status success";
          }
          reportSubmitBtn.textContent = "已提交";
        }
      } catch (err) {
        if (reportSubmitStatus) {
          reportSubmitStatus.textContent = "提交失败，请重试";
          reportSubmitStatus.className = "submit-status error";
        }
        reportSubmitBtn.disabled = false;
      }
    });
  }

  /* ================================================
     暂停菜单核心逻辑
     ================================================ */

  function showPauseOverlay() {
    if (!game || game.isGameOver || game.isLevelingUp) return;

    runtime.isPausedByUser = true;
    game.isPausedGame = true;
    const input = GameApp.Input;
    if (input && input.clearMovementInputs) input.clearMovementInputs();

    const t = nowSec();
    const summary = computeRunSummary(game, t);

    if (pauseStats) {
      pauseStats.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div>战力评分: <strong>${summary.score}</strong></div>
          <div>段位: <strong style="color:${summary.tierObj.color}">${escapeHtml(summary.tierObj.tier)}</strong></div>
          <div>存活时间: <strong>${formatTime(summary.timeAlive)}</strong></div>
          <div>等级: <strong>Lv.${summary.level}</strong></div>
          <div>击杀: <strong>${summary.kills}</strong></div>
          <div>技能: <strong>${summary.skillCount}</strong></div>
        </div>
      `;
    }

    if (pauseSubmitNameInput) {
      pauseSubmitNameInput.value = getStoredPlayerName();
    }

    if (pauseSubmitStatus) {
      pauseSubmitStatus.textContent = "";
      pauseSubmitStatus.className = "submit-status";
    }
    if (pauseSubmitScoreBtn) {
      pauseSubmitScoreBtn.disabled = false;
      pauseSubmitScoreBtn.textContent = "提交当前分数";
    }

    if (quitConfirmDialog) {
      quitConfirmDialog.classList.add("hidden");
    }

    if (pauseMainView) pauseMainView.classList.remove("hidden");
    if (reportSkillView) reportSkillView.classList.add("hidden");

    populateScrollColumns();

    if (pauseOverlay) {
      pauseOverlay.classList.remove("hidden");
    }

    requestAnimationFrame(() => { startParticles(); });
  }

  function hidePauseOverlay() {
    runtime.isPausedByUser = false;
    if (game) game.isPausedGame = false;
    stopParticles();
    if (pauseOverlay) {
      pauseOverlay.classList.add("hidden");
    }
  }

  function resetPauseState() {
    runtime.pauseScoreSubmitted = false;
    runtime.isPausedByUser = false;
    if (pauseSubmitScoreBtn) {
      pauseSubmitScoreBtn.disabled = false;
      pauseSubmitScoreBtn.textContent = "提交当前分数";
    }
    if (pauseSubmitStatus) {
      pauseSubmitStatus.textContent = "";
      pauseSubmitStatus.className = "submit-status";
    }
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!game || game.isGameOver) return;

      if (runtime.isPausedByUser) {
        hidePauseOverlay();
      } else {
        showPauseOverlay();
      }
    });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePauseOverlay();
    });
  }

  if (quitBtn) {
    quitBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (quitConfirmDialog) {
        quitConfirmDialog.classList.remove("hidden");
      }
    });
  }

  if (quitCancelBtn) {
    quitCancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (quitConfirmDialog) {
        quitConfirmDialog.classList.add("hidden");
      }
    });
  }

  if (quitConfirmBtn) {
    quitConfirmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePauseOverlay();
      window.location.href = "../index.html";
    });
  }

  if (pauseSubmitScoreBtn) {
    pauseSubmitScoreBtn.addEventListener("click", async (e) => {
      e.stopPropagation();

      const leaderboardApi = Api.leaderboard;

      if (!game || !leaderboardApi || !leaderboardApi.submitScore) {
        if (pauseSubmitStatus) {
          pauseSubmitStatus.textContent = "无法连接到服务器";
          pauseSubmitStatus.className = "submit-status error";
        }
        return;
      }

      const playerName = pauseSubmitNameInput ? pauseSubmitNameInput.value.trim() : "";
      if (!playerName) {
        if (pauseSubmitStatus) {
          pauseSubmitStatus.textContent = "请输入你的名字";
          pauseSubmitStatus.className = "submit-status error";
        }
        return;
      }

      storePlayerName(playerName);

      const summary = computeRunSummary(game, nowSec());

      if (pauseSubmitStatus) {
        pauseSubmitStatus.textContent = "提交中...";
        pauseSubmitStatus.className = "submit-status";
      }

      try {
        const result = await leaderboardApi.submitScore(
          playerName,
          summary.score,
          summary.level,
          summary.kills,
          Math.round(summary.timeAlive),
          summary.tierObj.tier
        );

        if (result.error) {
          if (pauseSubmitStatus) {
            pauseSubmitStatus.textContent = "提交失败，请重试";
            pauseSubmitStatus.className = "submit-status error";
          }
        } else {
          runtime.pauseScoreSubmitted = true;
          if (pauseSubmitStatus) {
            pauseSubmitStatus.textContent = "提交成功！";
            pauseSubmitStatus.className = "submit-status success";
          }
          if (pauseSubmitScoreBtn) {
            pauseSubmitScoreBtn.disabled = true;
            pauseSubmitScoreBtn.textContent = "已提交";
          }
        }
      } catch (err) {
        if (pauseSubmitStatus) {
          pauseSubmitStatus.textContent = "提交失败，请重试";
          pauseSubmitStatus.className = "submit-status error";
        }
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!game || game.isGameOver || game.isLevelingUp) return;

      if (runtime.isPausedByUser && reportSkillView && !reportSkillView.classList.contains("hidden")) {
        hideReportPanel();
        e.preventDefault();
        return;
      }

      if (runtime.isPausedByUser) {
        hidePauseOverlay();
      } else {
        showPauseOverlay();
      }
      e.preventDefault();
    }
  });

  const ui = GameApp.UI = GameApp.UI || {};
  ui.resetPauseState = resetPauseState;
})();
