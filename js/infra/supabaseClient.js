import { GameApp as __GameApp } from '../legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const Infra = GameApp.Infra = GameApp.Infra || {};
  const Api = Infra.Api = Infra.Api || {};

  let supabaseClient = null;

  function getSupabaseConfig() {
    return (GameApp.Config && GameApp.Config.supabase) || null;
  }

  function getEdgeFunctionUrl() {
    const config = getSupabaseConfig();
    if (!config) return null;
    return `${config.url}/functions/v1`;
  }

  function getSupabaseClient() {
    const config = getSupabaseConfig();
    if (!supabaseClient && window.supabase && config) {
      supabaseClient = window.supabase.createClient(config.url, config.publicKey);
    }
    return supabaseClient;
  }

  Api.getSupabaseConfig = getSupabaseConfig;
  Api.getEdgeFunctionUrl = getEdgeFunctionUrl;
  Api.getSupabaseClient = getSupabaseClient;
})();
