(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const Infra = GameApp.Infra = GameApp.Infra || {};
  const Api = Infra.Api = Infra.Api || {};
  const Storage = Infra.Storage = Infra.Storage || {};

  async function submitScore(playerName, score, level, kills, survivalTime, tier) {
    const client = Api.getSupabaseClient ? Api.getSupabaseClient() : null;
    if (!client) {
      return { error: "Supabase client not initialized" };
    }

    const { data, error } = await client
      .from("leaderboard")
      .insert([{
        player_name: playerName,
        score: Math.round(score),
        level,
        kills,
        survival_time: Math.round(survivalTime),
        tier,
        last: false
      }])
      .select();

    if (error) return { error };
    return { data };
  }

  async function getLeaderboardAdvanced(options = {}) {
    const {
      sortBy = "score",
      includeLast = false,
      limit = 50,
      offset = 0
    } = options;

    const baseUrl = Api.getEdgeFunctionUrl ? Api.getEdgeFunctionUrl() : null;
    const config = Api.getSupabaseConfig ? Api.getSupabaseConfig() : null;
    if (!baseUrl || !config) {
      return { error: "Supabase config not initialized", data: [], total: 0 };
    }

    const params = new URLSearchParams({
      sort_by: sortBy,
      include_last: String(includeLast),
      limit: String(limit),
      offset: String(offset)
    });

    try {
      const response = await fetch(`${baseUrl}/get-leaderboard?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: config.publicKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.error) {
        return { error: result.error, data: [], total: 0 };
      }

      return { data: result.data || [], total: result.total || 0, error: null };
    } catch (error) {
      return { error: error.message, data: [], total: 0 };
    }
  }

  async function markAllAsLast() {
    const client = Api.getSupabaseClient ? Api.getSupabaseClient() : null;
    if (!client) {
      return { error: "Supabase client not initialized" };
    }

    const cutoff = "2026-03-19T00:00:00Z";
    const { data, error } = await client
      .from("leaderboard")
      .update({ last: true })
      .eq("last", false)
      .lt("created_at", cutoff);

    if (error) return { error };
    return { data };
  }

  async function ensureLegacyReset() {
    const resetKey = "bigear_lb_reset_v170";
    if (Storage.safeGet && Storage.safeGet(resetKey, "") === "1") {
      return { data: true };
    }

    const result = await markAllAsLast();
    if (!result.error && Storage.safeSet) {
      Storage.safeSet(resetKey, "1");
    }
    return result;
  }

  async function getLeaderboard(limit = 50) {
    return getLeaderboardAdvanced({
      sortBy: "score",
      includeLast: false,
      limit,
      offset: 0
    });
  }

  async function getLeaderboardPage(limit = 50, offset = 0) {
    return getLeaderboardAdvanced({
      sortBy: "score",
      includeLast: false,
      limit,
      offset
    });
  }

  Api.leaderboard = {
    submitScore,
    getLeaderboard,
    getLeaderboardPage,
    getLeaderboardAdvanced,
    markAllAsLast,
    ensureLegacyReset
  };
})();
