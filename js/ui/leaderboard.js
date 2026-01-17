(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { leaderboardToggle, globalLeaderboard, globalLeaderboardContent, closeLeaderboard } = GameApp.DOM;
  const { escapeHtml, formatTime } = GameApp.Helpers;

  async function loadGlobalLeaderboard() {
    if (!globalLeaderboardContent) return;
    globalLeaderboardContent.innerHTML = '<div class="lb-loading">加载中...</div>';

    if (!window.SupabaseAPI) {
      globalLeaderboardContent.innerHTML = '<div class="lb-loading">Supabase 未初始化</div>';
      return;
    }

    const result = await window.SupabaseAPI.getLeaderboard(50);
    if (result.error) {
      globalLeaderboardContent.innerHTML = '<div class="lb-loading">加载失败</div>';
      return;
    }

    if (result.data.length === 0) {
      globalLeaderboardContent.innerHTML = '<div class="lb-loading">暂无数据</div>';
      return;
    }

    const rows = result.data.map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(r.player_name)}</td>
        <td style="font-weight:900;">${r.score}</td>
        <td>${r.tier || ""}</td>
        <td>${formatTime(r.survival_time)}</td>
        <td>Lv.${r.level}</td>
        <td>${r.kills}</td>
      </tr>
    `).join("");

    globalLeaderboardContent.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>玩家</th>
            <th>分数</th>
            <th>段位</th>
            <th>时间</th>
            <th>等级</th>
            <th>击杀</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  if (leaderboardToggle) {
    leaderboardToggle.addEventListener("click", () => {
      if (globalLeaderboard) {
        globalLeaderboard.classList.toggle("hidden");
        if (!globalLeaderboard.classList.contains("hidden")) {
          loadGlobalLeaderboard();
        }
      }
    });
  }

  if (closeLeaderboard) {
    closeLeaderboard.addEventListener("click", () => {
      if (globalLeaderboard) {
        globalLeaderboard.classList.add("hidden");
      }
    });
  }

  // Auto-open via query string
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "leaderboard") {
    if (globalLeaderboard) {
      globalLeaderboard.classList.remove("hidden");
      loadGlobalLeaderboard();
    }
  }
})();
