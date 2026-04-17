import { GameApp as __GameApp } from '../legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const Infra = GameApp.Infra = GameApp.Infra || {};
  const Api = Infra.Api = Infra.Api || {};

  async function submitSkillReport(reports) {
    const client = Api.getSupabaseClient ? Api.getSupabaseClient() : null;
    if (!client) {
      return { error: "Supabase client not initialized" };
    }

    const rows = (reports || []).map((report) => ({
      skill_name: report.skill_name,
      skill_tier: report.skill_tier || 1,
      reason: report.reason || "没用",
      reason_text: report.reason_text || "",
      player_name: report.player_name || "匿名",
      game_level: report.game_level || 1,
      game_score: report.game_score || 0
    }));

    const { error } = await client.from("skill_reports").insert(rows);
    if (error) return { error };
    return { data: rows };
  }

  Api.skillReport = { submitSkillReport };
})();
