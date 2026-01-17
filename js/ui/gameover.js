(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { overlay, overlayTitle, overlaySubtitle, choicesEl, gameoverStatsEl, restartRow } = GameApp.DOM;
  const { nowSec } = GameApp.Deps.utils;
  const { escapeHtml } = GameApp.Helpers;

  function clearMovementInputs() {
    const input = GameApp.Input;
    if (input && input.clearMovementInputs) input.clearMovementInputs();
  }

  // Local Leaderboard (by Combat Power)
  // ============================================================
  const LEADERBOARD_KEY = "bigear_leaderboard_v1";

  function formatTime(sec){
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`;
  }

  function loadLeaderboard(){
    try{
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.filter(x => x && typeof x.score === "number").slice(0, 50);
    }catch{
      return [];
    }
  }

  function saveLeaderboard(list){
    try{
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
    }catch{}
  }

  function addRunToLeaderboard(run, limit = 10){
    const list = loadLeaderboard();
    list.push(run);
    list.sort((a,b) =>
      (b.score - a.score) ||
      ((b.level || 0) - (a.level || 0)) ||
      ((b.time || 0) - (a.time || 0)) ||
      ((b.when || 0) - (a.when || 0))
    );
    const trimmed = list.slice(0, limit);
    saveLeaderboard(trimmed);
    const rank = trimmed.findIndex(r => r.id === run.id) + 1;
    return { list: trimmed, rank: rank > 0 ? rank : null };
  }

  function renderLocalLeaderboardRows(list, highlightId){
    if (!list || list.length === 0) return "";
    return list.map((r, idx) => {
      const hi = (r.id === highlightId);
      const rowClass = hi ? "highlight" : "";
      return `
        <tr class="${rowClass}">
          <td>${idx + 1}</td>
          <td style="font-weight:900;">${Math.round(r.score || 0)}</td>
          <td style="font-weight:900;">${r.tier || ""}</td>
          <td>${formatTime(r.time || 0)}</td>
          <td>Lv.${r.level || 1}</td>
          <td>${r.kills || 0}</td>
        </tr>`;
    }).join("");
  }

  function renderGlobalLeaderboardRows(list, highlightName){
    if (!list || list.length === 0) return "";

    // 对于重名玩家，找出最新的那条记录的索引
    let latestIndexForName = -1;
    if (highlightName) {
      let latestTime = null;
      list.forEach((r, idx) => {
        if (r.player_name === highlightName) {
          const createdAt = r.created_at ? new Date(r.created_at).getTime() : 0;
          if (latestTime === null || createdAt > latestTime) {
            latestTime = createdAt;
            latestIndexForName = idx;
          }
        }
      });
    }

    return list.map((r, idx) => {
      // 只高亮重名玩家中最新的那条记录
      const hi = highlightName && r.player_name === highlightName && idx === latestIndexForName;
      const rowClass = hi ? "highlight" : "";
      return `
        <tr class="${rowClass}">
          <td>${idx + 1}</td>
          <td style="font-weight:700; max-width:80px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(r.player_name || "匿名")}</td>
          <td style="font-weight:900;">${Math.round(r.score || 0)}</td>
          <td style="font-weight:900;">${r.tier || ""}</td>
          <td>Lv.${r.level || 1}</td>
          <td>${r.kills || 0}</td>
        </tr>`;
    }).join("");
  }

  function renderLeaderboardTable(list, highlightId){
    if (!list || list.length === 0) return "";
    const rows = list.map((r, idx) => {
      const hi = (r.id === highlightId);
      const bg = hi ? "rgba(255,214,10,.12)" : "transparent";
      const bd = hi ? "rgba(255,214,10,.28)" : "rgba(255,255,255,.08)";
      return `
        <tr style="background:${bg}; border-bottom: 1px solid ${bd};">
          <td style="padding:6px 6px; opacity:.9;">${idx + 1}</td>
          <td style="padding:6px 6px; font-weight:900;">${Math.round(r.score || 0)}</td>
          <td style="padding:6px 6px; font-weight:900;">${r.tier || ""}</td>
          <td style="padding:6px 6px;">${formatTime(r.time || 0)}</td>
          <td style="padding:6px 6px;">Lv.${r.level || 1}</td>
          <td style="padding:6px 6px;">${r.kills || 0}</td>
        </tr>`;
    }).join("");

    return `
      <div style="margin-top:14px; text-align:left;">
        <div style="font-weight:900; margin-bottom:6px; opacity:.92;">本地排行榜（战力评分）</div>
        <table style="width:100%; border-collapse:collapse; font-size:13px; border:1px solid rgba(255,255,255,.10); border-radius:10px; overflow:hidden;">
          <thead>
            <tr style="background: rgba(255,255,255,.06); border-bottom: 1px solid rgba(255,255,255,.10);">
              <th style="text-align:left; padding:6px 6px; font-weight:900; opacity:.85;">#</th>
              <th style="text-align:left; padding:6px 6px; font-weight:900; opacity:.85;">分</th>
              <th style="text-align:left; padding:6px 6px; font-weight:900; opacity:.85;">段位</th>
              <th style="text-align:left; padding:6px 6px; font-weight:900; opacity:.85;">时间</th>
              <th style="text-align:left; padding:6px 6px; font-weight:900; opacity:.85;">等级</th>
              <th style="text-align:left; padding:6px 6px; font-weight:900; opacity:.85;">击杀</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:8px; font-size:12px; opacity:.65; line-height:1.35;">
          评分 = 0.72×平均战力 + 0.28×峰值战力（平均战力来自 30秒滑窗系统的平滑积分）
        </div>
      </div>`;
  }

  async function fetchGlobalLeaderboard() {
    if (!window.SupabaseAPI) return [];
    const result = await window.SupabaseAPI.getLeaderboard(20);
    return result.data || [];
  }

  async function refreshGlobalLeaderboardInOverlay(highlightName) {
    const globalContent = document.getElementById("globalLeaderboardRows");
    if (!globalContent) return;

    globalContent.innerHTML = '<div class="leaderboard-loading">加载中...</div>';

    const globalData = await fetchGlobalLeaderboard();

    if (!globalData || globalData.length === 0) {
      globalContent.innerHTML = '<div class="leaderboard-empty">暂无数据</div>';
      return;
    }

    globalContent.innerHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>玩家</th>
            <th>分数</th>
            <th>段位</th>
            <th>等级</th>
            <th>击杀</th>
          </tr>
        </thead>
        <tbody>${renderGlobalLeaderboardRows(globalData, highlightName)}</tbody>
      </table>
    `;
  }

  async function showGameOverOverlay(g) {
    overlay.classList.add("show");
    overlay.classList.add("mode-gameover");
    overlay.classList.remove("mode-levelup");
    clearMovementInputs();
    overlayTitle.textContent = "GAME OVER";
    overlayTitle.style.color = "#ff3b30";
    overlaySubtitle.textContent = "";

    choicesEl.innerHTML = "";
    gameoverStatsEl.style.display = "block";

    const endT = nowSec();
    const timeAlive = g._startTime ? Math.max(0, endT - g._startTime) : 0;

    let run = g._lastRun || null;
    let board = { list: loadLeaderboard(), rank: null };

    if (!run) {
      const peak = Math.round((g.combat && g.combat.peak) ? g.combat.peak : 0);
      const avg = Math.round((g.combat && timeAlive > 0) ? (g.combat.integral / timeAlive) : ((g.combat && g.combat.ratingSmooth) ? g.combat.ratingSmooth : 0));
      const score = Math.round(0.72 * avg + 0.28 * peak);

      const tierObj = (g._combatTierFromScore ? g._combatTierFromScore(score) : { tier: "", color: "#fff" });

      run = {
        id: g._runId || `${Date.now()}_${Math.floor(Math.random()*1e9)}`,
        score,
        tier: tierObj.tier,
        time: timeAlive,
        level: g.level,
        kills: (g.stats && g.stats.kills) ? g.stats.kills : 0,
        peak,
        avg,
        when: Date.now()
      };

      if (!g._runRecorded) {
        board = addRunToLeaderboard(run, 10);
        g._runRecorded = true;
      }
      g._lastRun = run;
    }

    const rankText = board.rank ? `#${board.rank}` : "—";
    const tierColor = (g._combatTierFromScore ? g._combatTierFromScore(run.score).color : "#fff");

    const submitFormHtml = g._scoreSubmitted ? `
      <div class="submit-status success">分数已提交到全球排行榜!</div>
    ` : `
      <div class="gameover-submit-section">
        <input type="text" id="submitNameInput" placeholder="输入你的名字提交到全球排行榜" maxlength="20" value="${getStoredPlayerName()}" />
        <button id="submitScoreBtn">提交分数</button>
        <div id="submitStatus" class="submit-status"></div>
      </div>
    `;

    const localLeaderboardHtml = board.list.length > 0 ? `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>分数</th>
            <th>段位</th>
            <th>时间</th>
            <th>等级</th>
            <th>击杀</th>
          </tr>
        </thead>
        <tbody>${renderLocalLeaderboardRows(board.list, run.id)}</tbody>
      </table>
    ` : '<div class="leaderboard-empty">暂无本地记录</div>';

    gameoverStatsEl.innerHTML = `
      <div class="gameover-content">
        <div class="gameover-stats-section">
          <div style="display:flex; gap:12px; justify-content:center; align-items:baseline; flex-wrap:wrap;">
            <div>战力评分: <b style="color:${tierColor}; font-size:18px;">${run.score}</b></div>
            <div>段位: <b style="color:${tierColor}">${run.tier || ""}</b></div>
            <div>本地排名: <b>${rankText}</b></div>
          </div>
          <div style="margin-top:10px; display:flex; gap:16px; justify-content:center; flex-wrap:wrap; font-size:14px;">
            <div>存活: <b>${formatTime(run.time)}</b></div>
            <div>等级: <b>${g.level}</b></div>
            <div>击杀: <b>${(g.stats && g.stats.kills) ? g.stats.kills : 0}</b></div>
            <div>技能: <b>${g.acquiredSkills.length}</b></div>
          </div>
          <div style="margin-top:6px; font-size:12px; opacity:.7;">
            平均战力: ${run.avg} · 峰值战力: ${run.peak}
          </div>
        </div>

        ${submitFormHtml}

        <div class="dual-leaderboard-container">
          <div class="leaderboard-column">
            <div class="leaderboard-title local">
              <span class="icon">📊</span>
              <span>本地排行榜</span>
            </div>
            <div class="leaderboard-table-wrapper">
              ${localLeaderboardHtml}
            </div>
            <div class="leaderboard-note">
              评分 = 0.72×平均战力 + 0.28×峰值战力
            </div>
          </div>

          <div class="leaderboard-column">
            <div class="leaderboard-title global">
              <span class="icon">🌍</span>
              <span>全球排行榜</span>
            </div>
            <div class="leaderboard-table-wrapper" id="globalLeaderboardRows">
              <div class="leaderboard-loading">加载中...</div>
            </div>
            <div class="leaderboard-note">
              提交分数后自动更新
            </div>
          </div>
        </div>
      </div>
    `;

    refreshGlobalLeaderboardInOverlay(g._submittedPlayerName || null);

    if (!g._scoreSubmitted) {
      const submitBtn = document.getElementById("submitScoreBtn");
      const submitNameInput = document.getElementById("submitNameInput");
      const submitStatus = document.getElementById("submitStatus");

      if (submitBtn && submitNameInput) {
        submitBtn.addEventListener("click", async () => {
          const playerName = submitNameInput.value.trim();
          if (!playerName) {
            submitStatus.textContent = "请输入名字";
            submitStatus.className = "submit-status error";
            return;
          }

          submitBtn.disabled = true;
          submitStatus.textContent = "提交中...";
          submitStatus.className = "submit-status";

          storePlayerName(playerName);

          if (window.SupabaseAPI) {
            const result = await window.SupabaseAPI.submitScore(
              playerName,
              run.score,
              run.level,
              run.kills,
              run.time,
              run.tier
            );

            if (result.error) {
              submitStatus.textContent = "提交失败，请重试";
              submitStatus.className = "submit-status error";
              submitBtn.disabled = false;
            } else {
              submitStatus.textContent = "提交成功!";
              submitStatus.className = "submit-status success";
              g._scoreSubmitted = true;
              g._submittedPlayerName = playerName;
              submitBtn.style.display = "none";
              submitNameInput.style.display = "none";

              await refreshGlobalLeaderboardInOverlay(playerName);
            }
          } else {
            submitStatus.textContent = "Supabase 未初始化";
            submitStatus.className = "submit-status error";
            submitBtn.disabled = false;
          }
        });
      }
    }

    restartRow.style.display = "flex";
  }

  function getStoredPlayerName() {
    try {
      return localStorage.getItem("bigear_player_name") || "";
    } catch {
      return "";
    }
  }

  function storePlayerName(name) {
    try {
      localStorage.setItem("bigear_player_name", name);
    } catch {}
  }

  const ui = GameApp.UI = GameApp.UI || {};
  ui.showGameOverOverlay = showGameOverOverlay;
})();
