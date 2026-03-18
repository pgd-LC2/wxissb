(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const {
    overlay, overlayTitle, overlaySubtitle, choicesEl, gameoverStatsEl, restartRow
  } = GameApp.DOM;
  const { nowSec } = GameApp.Deps.utils;
  const { escapeHtml, formatTime, getStoredPlayerName, storePlayerName } = GameApp.Helpers;

  function clearMovementInputs() {
    const input = GameApp.Input;
    if (input && input.clearMovementInputs) input.clearMovementInputs();
  }

  // Local Leaderboard (by Combat Power)
  // ============================================================
  const LEADERBOARD_KEY = "bigear_leaderboard_v1";

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

  /* ================================================
     获取技能卡片数据
     ================================================ */
  function getSkillCards(g) {
    if (!g) return [];
    const allSkills = window.SkillSystem ? window.SkillSystem.generateAllSkills() : [];
    const cyberSkills = (window.SkillSystem && window.SkillSystem.generateCyberpunkArsenal) ? window.SkillSystem.generateCyberpunkArsenal() : [];
    const skillPool = allSkills.concat(cyberSkills);

    const acquired = g.acquiredSkills || [];
    const meta = g.acquiredSkillMeta || [];
    const cards = [];

    for (let i = 0; i < acquired.length; i++) {
      const name = acquired[i];
      const tierVal = (meta[i] && meta[i].tier) ? meta[i].tier : 1;
      const def = skillPool.find(s => s.name === name);
      const icon = def ? (window.SkillSystem.iconFallback ? window.SkillSystem.iconFallback(def.icon) : def.icon) : "✦";
      const tierLabel = (window.SkillSystem && window.SkillSystem.tierName) ? window.SkillSystem.tierName(tierVal) : "";
      cards.push({ name, tier: tierVal, icon, tierLabel, description: def ? def.description : "" });
    }
    return cards;
  }

  /* ================================================
     死亡界面举报技能面板（动态创建，避免污染 level-up）
     ================================================ */
  const goSelectedSkills = new Set();
  let _currentGame = null;

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
    _currentGame = g;
    overlay.classList.add("show");
    overlay.classList.add("mode-gameover");
    overlay.classList.remove("mode-levelup");
    clearMovementInputs();
    overlayTitle.textContent = "";
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
    const kills = (g.stats && g.stats.kills) ? g.stats.kills : 0;
    const skillCount = g.acquiredSkills ? g.acquiredSkills.length : 0;

    const submitFormHtml = g._scoreSubmitted ? `
      <div class="submit-status success" style="padding:8px 0;">分数已提交到全球排行榜!</div>
    ` : `
      <div class="go-submit-section">
        <input type="text" id="submitNameInput" placeholder="输入你的名字提交到全球排行榜" maxlength="20" value="${escapeHtml(getStoredPlayerName())}" />
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
      <div class="go-container">
        <div class="go-header">
          <div class="go-skull">💀</div>
          <h2 class="go-title">GAME OVER</h2>
          <div class="go-tier-badge" style="color:${tierColor}; border-color:${tierColor};">
            ${escapeHtml(run.tier || "—")}
          </div>
        </div>

        <div class="go-score-hero">
          <div class="go-score-value" style="color:${tierColor}">${run.score}</div>
          <div class="go-score-label">战力评分</div>
        </div>

        <div class="go-stats-grid">
          <div class="go-stat-card">
            <div class="go-stat-icon">⏱️</div>
            <div class="go-stat-val">${formatTime(run.time)}</div>
            <div class="go-stat-lbl">存活时间</div>
          </div>
          <div class="go-stat-card">
            <div class="go-stat-icon">⚔️</div>
            <div class="go-stat-val">${kills}</div>
            <div class="go-stat-lbl">击杀数</div>
          </div>
          <div class="go-stat-card">
            <div class="go-stat-icon">📈</div>
            <div class="go-stat-val">Lv.${g.level}</div>
            <div class="go-stat-lbl">等级</div>
          </div>
          <div class="go-stat-card">
            <div class="go-stat-icon">✨</div>
            <div class="go-stat-val">${skillCount}</div>
            <div class="go-stat-lbl">技能</div>
          </div>
        </div>

        <div class="go-detail-row">
          <span>平均战力: <b>${run.avg}</b></span>
          <span>峰值战力: <b>${run.peak}</b></span>
          <span>本地排名: <b>${rankText}</b></span>
        </div>

        ${submitFormHtml}

        <button id="goReportSkillBtn" class="go-report-btn">🚩 举报技能</button>

        <div id="goReportPanel" style="display:none;">
          <h2 class="go-report-title">🚩 举报技能</h2>
          <p class="go-report-subtitle">选择你认为有问题的技能</p>
          <div id="goReportSkillList" class="report-skill-list"></div>
          <div class="report-reason-section">
            <div class="report-reason-label">举报理由</div>
            <div class="report-reason-options">
              <label class="report-reason-chip selected"><input type="radio" name="goReportReason" value="没用" checked /><span>没用</span></label>
              <label class="report-reason-chip"><input type="radio" name="goReportReason" value="太弱" /><span>太弱</span></label>
              <label class="report-reason-chip"><input type="radio" name="goReportReason" value="效果不明显" /><span>效果不明显</span></label>
              <label class="report-reason-chip"><input type="radio" name="goReportReason" value="其他" /><span>其他</span></label>
            </div>
            <textarea id="goReportReasonText" class="go-report-textarea" placeholder="补充说明（可选）" maxlength="200" style="display:none;"></textarea>
          </div>
          <div id="goReportSubmitStatus" class="submit-status"></div>
          <div class="report-buttons">
            <button id="goReportBackBtn">返回</button>
            <button id="goReportSubmitBtn" disabled>提交举报 (0)</button>
          </div>
        </div>

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

    // 获取动态创建的举报面板元素
    const goReportPanel = document.getElementById("goReportPanel");
    const goReportSkillBtn = document.getElementById("goReportSkillBtn");
    const goReportSkillList = document.getElementById("goReportSkillList");
    const goReportReasonText = document.getElementById("goReportReasonText");
    const goReportSubmitStatus = document.getElementById("goReportSubmitStatus");
    const goReportBackBtn = document.getElementById("goReportBackBtn");
    const goReportSubmitBtn = document.getElementById("goReportSubmitBtn");

    function populateGoSkillList() {
      if (!goReportSkillList) return;
      goSelectedSkills.clear();
      const cards = getSkillCards(g);
      if (cards.length === 0) {
        goReportSkillList.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,.4);padding:20px;">你还没有获得任何技能</div>';
        return;
      }
      var html = "";
      for (var ci = 0; ci < cards.length; ci++) {
        var c = cards[ci];
        html += '<div class="report-skill-item" data-skill="' + escapeHtml(c.name) + '" data-tier="' + c.tier + '">'
          + '<div class="rsi-check">✓</div>'
          + '<div class="rsi-icon">' + c.icon + '</div>'
          + '<div class="rsi-info">'
          + '<div class="rsi-name">' + escapeHtml(c.name) + '</div>'
          + '<div class="rsi-desc">' + escapeHtml(c.description) + '</div>'
          + '</div></div>';
      }
      goReportSkillList.innerHTML = html;

      goReportSkillList.querySelectorAll(".report-skill-item").forEach(function(item) {
        item.addEventListener("click", function() {
          var name = item.getAttribute("data-skill");
          if (goSelectedSkills.has(name)) {
            goSelectedSkills.delete(name);
            item.classList.remove("selected");
          } else {
            goSelectedSkills.add(name);
            item.classList.add("selected");
          }
          if (goReportSubmitBtn) {
            var count = goSelectedSkills.size;
            goReportSubmitBtn.textContent = "提交举报 (" + count + ")";
            goReportSubmitBtn.disabled = count === 0;
          }
        });
      });
    }

    // 举报技能入口按钮
    if (goReportSkillBtn && goReportPanel) {
      goReportSkillBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        // 显示举报面板，隐藏主内容
        goReportPanel.style.display = "block";
        goReportSkillBtn.style.display = "none";
        populateGoSkillList();
        if (goReportSubmitStatus) {
          goReportSubmitStatus.textContent = "";
          goReportSubmitStatus.className = "submit-status";
        }
        if (goReportSubmitBtn) {
          goReportSubmitBtn.disabled = true;
          goReportSubmitBtn.textContent = "提交举报 (0)";
        }
        if (goReportReasonText) goReportReasonText.style.display = "none";
      });
    }

    // 返回按钮
    if (goReportBackBtn && goReportPanel) {
      goReportBackBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        goReportPanel.style.display = "none";
        if (goReportSkillBtn) goReportSkillBtn.style.display = "";
      });
    }

    // 举报理由选择
    if (goReportPanel) {
      goReportPanel.addEventListener("click", function(e) {
        var chip = e.target.closest(".report-reason-chip");
        if (!chip) return;
        var radio = chip.querySelector("input[type=radio]");
        if (radio) radio.checked = true;
        goReportPanel.querySelectorAll(".report-reason-chip").forEach(function(c) { c.classList.remove("selected"); });
        chip.classList.add("selected");
        if (goReportReasonText) {
          goReportReasonText.style.display = (radio && radio.value === "其他") ? "block" : "none";
        }
      });
    }

    // 提交举报
    if (goReportSubmitBtn) {
      goReportSubmitBtn.addEventListener("click", async function(e) {
        e.stopPropagation();
        if (goSelectedSkills.size === 0) return;

        var reasonRadio = goReportPanel ? goReportPanel.querySelector('input[name="goReportReason"]:checked') : null;
        var reason = reasonRadio ? reasonRadio.value : "没用";
        var reasonText = (goReportReasonText && reason === "其他") ? goReportReasonText.value.trim().slice(0, 200) : "";

        var playerName = getStoredPlayerName() || "匿名";
        var cards = getSkillCards(g);

        var lastRun = g._lastRun || null;
        var peak = lastRun ? lastRun.peak : 0;
        var avg = lastRun ? lastRun.avg : 0;
        var score = lastRun ? lastRun.score : Math.round(0.72 * avg + 0.28 * peak);
        var level = lastRun ? lastRun.level : g.level;

        var reports = [];
        goSelectedSkills.forEach(function(skillName) {
          var card = cards.find(function(c) { return c.name === skillName; });
          reports.push({
            skill_name: skillName,
            skill_tier: card ? card.tier : 1,
            reason: reason,
            reason_text: reasonText,
            player_name: playerName,
            game_level: level,
            game_score: score
          });
        });

        goReportSubmitBtn.disabled = true;
        if (goReportSubmitStatus) {
          goReportSubmitStatus.textContent = "提交中...";
          goReportSubmitStatus.className = "submit-status";
        }

        try {
          if (!window.SupabaseAPI || !window.SupabaseAPI.submitSkillReport) {
            throw new Error("Supabase not available");
          }
          var result = await window.SupabaseAPI.submitSkillReport(reports);
          if (result.error) {
            if (goReportSubmitStatus) {
              goReportSubmitStatus.textContent = "提交失败，请重试";
              goReportSubmitStatus.className = "submit-status error";
            }
            goReportSubmitBtn.disabled = false;
          } else {
            if (goReportSubmitStatus) {
              goReportSubmitStatus.textContent = "举报成功，感谢反馈！";
              goReportSubmitStatus.className = "submit-status success";
            }
            goReportSubmitBtn.textContent = "已提交";
          }
        } catch (err) {
          if (goReportSubmitStatus) {
            goReportSubmitStatus.textContent = "提交失败，请重试";
            goReportSubmitStatus.className = "submit-status error";
          }
          goReportSubmitBtn.disabled = false;
        }
      });
    }

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

  const ui = GameApp.UI = GameApp.UI || {};
  ui.showGameOverOverlay = showGameOverOverlay;
})();
