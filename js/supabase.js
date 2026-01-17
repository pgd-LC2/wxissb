/**
 * Supabase 客户端模块
 * 封装 Supabase 客户端和 API 调用
 * 
 * 配置从 config.js 加载，包含公开的客户端密钥。
 * 数据安全通过 Row Level Security (RLS) 策略来保护。
 */

let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient && window.supabase && window.SUPABASE_CONFIG) {
    supabaseClient = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.publicKey
    );
  }
  return supabaseClient;
}

const SupabaseAPI = {
  async submitScore(playerName, score, level, kills, survivalTime, tier) {
    const client = getSupabaseClient();
    if (!client) {
      console.error('Supabase client not initialized');
      return { error: 'Supabase client not initialized' };
    }

    const { data, error } = await client
      .from('leaderboard')
      .insert([{
        player_name: playerName,
        score: Math.round(score),
        level: level,
        kills: kills,
        survival_time: Math.round(survivalTime),
        tier: tier
      }])
      .select();

    if (error) {
      console.error('Error submitting score:', error);
      return { error };
    }

    return { data };
  },

  async getLeaderboard(limit = 50) {
    const client = getSupabaseClient();
    if (!client) {
      console.error('Supabase client not initialized');
      return { error: 'Supabase client not initialized', data: [] };
    }

    const { data, error } = await client
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return { error, data: [] };
    }

    return { data: data || [] };
  },

  async getLeaderboardPage(limit = 50, offset = 0) {
    const client = getSupabaseClient();
    if (!client) {
      console.error('Supabase client not initialized');
      return { error: 'Supabase client not initialized', data: [] };
    }

    const from = Math.max(0, offset);
    const to = from + Math.max(0, limit) - 1;
    const { data, error } = await client
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching leaderboard page:', error);
      return { error, data: [] };
    }

    return { data: data || [] };
  }

};

window.SupabaseAPI = SupabaseAPI;
window.getSupabaseClient = getSupabaseClient;
