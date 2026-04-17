import { GameApp as __GameApp } from '../legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const Infra = GameApp.Infra = GameApp.Infra || {};
  const Api = Infra.Api = Infra.Api || {};

  function getById(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTime(sec) {
    const value = Math.max(0, Math.floor(sec || 0));
    const minute = Math.floor(value / 60);
    const second = value % 60;
    return `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  }

  function getSortLabel(sortBy) {
    const map = {
      score: "战力",
      level: "等级",
      survival_time: "存活时间",
      kills: "击杀数"
    };
    return map[sortBy] || "战力";
  }

  function createState() {
    return {
      pageSize: 50,
      offset: 0,
      isLoading: false,
      reachedEnd: false,
      currentSortBy: "score",
      currentIncludeLast: false
    };
  }

  function createDom() {
    return {
      statusText: getById("statusText"),
      tbody: getById("lbBody"),
      podium1: getById("podium1"),
      podium2: getById("podium2"),
      podium3: getById("podium3"),
      loadMoreBtn: getById("loadMoreBtn"),
      sortButtons: getById("sortButtons"),
      showOldToggle: getById("showOldToggle"),
      backBtn: getById("backBtn"),
      refreshBtn: getById("refreshBtn")
    };
  }

  function renderPodium(rankEl, data, rank) {
    if (!rankEl) return;
    if (!data) {
      rankEl.querySelector(".podium-name").textContent = "—";
      rankEl.querySelector(".podium-score").textContent = "0";
      rankEl.querySelector(".podium-meta").textContent = "段位 — · Lv.1 · 击杀 0";
      return;
    }

    rankEl.querySelector(".podium-name").textContent = data.player_name || "匿名";
    rankEl.querySelector(".podium-score").textContent = Math.round(data.score || 0);
    rankEl.querySelector(".podium-meta").textContent = `段位 ${data.tier || "—"} · Lv.${data.level || 1} · 击杀 ${data.kills || 0}`;
    rankEl.querySelector(".podium-rank").textContent = `#${rank}`;
  }

  async function loadLeaderboardPage(dom, state, reset = false) {
    const leaderboardApi = Api.leaderboard;
    if (state.isLoading || (!reset && state.reachedEnd)) return;

    if (!leaderboardApi) {
      dom.statusText.textContent = "Supabase 未初始化";
      dom.tbody.innerHTML = '<tr><td colspan="7">无法连接到排行榜服务</td></tr>';
      if (dom.loadMoreBtn) dom.loadMoreBtn.disabled = true;
      return;
    }

    state.isLoading = true;
    if (dom.loadMoreBtn) dom.loadMoreBtn.disabled = true;

    if (reset) {
      state.offset = 0;
      state.reachedEnd = false;
      dom.tbody.innerHTML = '<tr><td colspan="7">加载中...</td></tr>';
    }

    dom.statusText.textContent = "正在读取排行榜...";

    const result = await leaderboardApi.getLeaderboardAdvanced({
      sortBy: state.currentSortBy,
      includeLast: state.currentIncludeLast,
      limit: state.pageSize,
      offset: state.offset
    });

    if (result.error) {
      dom.statusText.textContent = "加载失败，请稍后重试";
      if (reset) dom.tbody.innerHTML = '<tr><td colspan="7">加载失败</td></tr>';
      state.isLoading = false;
      if (dom.loadMoreBtn) dom.loadMoreBtn.disabled = false;
      return;
    }

    const list = result.data || [];
    const total = result.total || 0;

    if (reset) {
      if (list.length === 0) {
        dom.statusText.textContent = "暂无数据";
        dom.tbody.innerHTML = '<tr><td colspan="7">暂无排行数据</td></tr>';
        state.reachedEnd = true;
        state.isLoading = false;
        if (dom.loadMoreBtn) dom.loadMoreBtn.disabled = true;
        renderPodium(dom.podium1, null, 1);
        renderPodium(dom.podium2, null, 2);
        renderPodium(dom.podium3, null, 3);
        return;
      }

      renderPodium(dom.podium1, list[0], 1);
      renderPodium(dom.podium2, list[1], 2);
      renderPodium(dom.podium3, list[2], 3);
      dom.tbody.innerHTML = "";
    }

    if (state.offset + list.length >= total || list.length < state.pageSize) {
      state.reachedEnd = true;
    }

    const rows = list.map((record, index) => {
      const rank = state.offset + index + 1;
      const oldBadge = record.last ? '<span class="old-version-badge">旧版</span>' : "";
      return `
        <tr>
          <td>${rank}</td>
          <td>${escapeHtml(record.player_name || "匿名")}${oldBadge}</td>
          <td style="font-weight:900;">${Math.round(record.score || 0)}</td>
          <td><span class="tier">${escapeHtml(record.tier || "")}</span></td>
          <td>${formatTime(record.survival_time)}</td>
          <td>Lv.${record.level || 1}</td>
          <td>${record.kills || 0}</td>
        </tr>
      `;
    }).join("");

    dom.tbody.insertAdjacentHTML("beforeend", rows);
    state.offset += list.length;

    const sortLabel = getSortLabel(state.currentSortBy);
    const versionLabel = state.currentIncludeLast ? "（含旧版本）" : "";

    if (state.reachedEnd) {
      dom.statusText.textContent = `按${sortLabel}排序${versionLabel} · 已加载 ${state.offset} 条记录（已到底）`;
      if (dom.loadMoreBtn) {
        dom.loadMoreBtn.textContent = "没有更多了";
        dom.loadMoreBtn.disabled = true;
      }
    } else {
      dom.statusText.textContent = `按${sortLabel}排序${versionLabel} · 已加载 ${state.offset}/${total} 条记录`;
      if (dom.loadMoreBtn) dom.loadMoreBtn.disabled = false;
    }

    state.isLoading = false;
  }

  function bindEvents(dom, state) {
    if (dom.backBtn) {
      dom.backBtn.addEventListener("click", () => {
        window.location.href = "../index.html";
      });
    }

    if (dom.refreshBtn) {
      dom.refreshBtn.addEventListener("click", () => {
        if (dom.loadMoreBtn) {
          dom.loadMoreBtn.textContent = "加载更多";
          dom.loadMoreBtn.disabled = false;
        }
        loadLeaderboardPage(dom, state, true);
      });
    }

    if (dom.sortButtons) {
      dom.sortButtons.addEventListener("click", (event) => {
        const button = event.target.closest(".sort-tab");
        if (!button) return;
        const sortValue = button.dataset.sort;
        if (sortValue === state.currentSortBy) return;

        dom.sortButtons.querySelectorAll(".sort-tab").forEach((tab) => tab.classList.remove("active"));
        button.classList.add("active");
        state.currentSortBy = sortValue;

        if (dom.loadMoreBtn) {
          dom.loadMoreBtn.textContent = "加载更多";
          dom.loadMoreBtn.disabled = false;
        }

        loadLeaderboardPage(dom, state, true);
      });
    }

    if (dom.showOldToggle) {
      dom.showOldToggle.addEventListener("change", (event) => {
        state.currentIncludeLast = event.target.checked;
        if (dom.loadMoreBtn) {
          dom.loadMoreBtn.textContent = "加载更多";
          dom.loadMoreBtn.disabled = false;
        }
        loadLeaderboardPage(dom, state, true);
      });
    }

    if (dom.loadMoreBtn) {
      dom.loadMoreBtn.addEventListener("click", () => {
        loadLeaderboardPage(dom, state, false);
      });
    }
  }

  async function init() {
    const dom = createDom();
    const state = createState();

    bindEvents(dom, state);

    if (Api.leaderboard && Api.leaderboard.ensureLegacyReset) {
      await Api.leaderboard.ensureLegacyReset();
    }

    loadLeaderboardPage(dom, state, true);
  }

  GameApp.LeaderboardPage = { init };
})();
