/**
 * Supabase 客户端模块
 * 封装 Supabase 客户端和 API 调用
 * 
 * 配置从 config.js 加载，包含公开的客户端密钥。
 * 数据安全通过 Row Level Security (RLS) 策略来保护。
 */

let supabaseClient = null;

/**
 * 按玩家名字去重，只保留每个玩家的最高分记录
 * 由于数据已按分数降序排列，第一次出现的记录就是最高分
 * @param {Array} data - 排行榜数据数组
 * @returns {Array} - 去重后的数据数组
 */
function deduplicateByPlayerName(data) {
  if (!data || data.length === 0) return [];
  
  const seen = new Set();
  const result = [];
  
  for (const record of data) {
    const name = record.player_name || '';
    if (!seen.has(name)) {
      seen.add(name);
      result.push(record);
    }
  }
  
  return result;
}

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

    // 获取更多记录以确保去重后有足够的数据
    const fetchLimit = limit * 3;
    const { data, error } = await client
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(fetchLimit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return { error, data: [] };
    }

    // 按玩家名字去重，只保留每个玩家的最高分记录
    const deduplicatedData = deduplicateByPlayerName(data || []);
    
    return { data: deduplicatedData.slice(0, limit) };
  },

  async getLeaderboardPage(limit = 50, offset = 0) {
    const client = getSupabaseClient();
    if (!client) {
      console.error('Supabase client not initialized');
      return { error: 'Supabase client not initialized', data: [] };
    }

    // 为了支持分页和去重，需要获取足够多的数据
    // 先获取所有数据进行去重，然后再分页
    const fetchLimit = (offset + limit) * 3;
    const { data, error } = await client
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(fetchLimit);

    if (error) {
      console.error('Error fetching leaderboard page:', error);
      return { error, data: [] };
    }

    // 按玩家名字去重，只保留每个玩家的最高分记录
    const deduplicatedData = deduplicateByPlayerName(data || []);
    
    // 应用分页
    const from = Math.max(0, offset);
    const to = from + Math.max(0, limit);
    return { data: deduplicatedData.slice(from, to) };
  }

};

window.SupabaseAPI = SupabaseAPI;
window.getSupabaseClient = getSupabaseClient;
