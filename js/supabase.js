/**
 * Supabase 客户端模块
 * 封装 Supabase 客户端和 API 调用
 * 
 * 配置从 config.js 加载，包含公开的客户端密钥。
 * 数据安全通过 Row Level Security (RLS) 策略来保护。
 * 
 * 排行榜数据通过 Edge Function 获取，支持：
 * - 多种排序方式（战力、等级、存活时间、击杀数）
 * - 数据库层面去重（每个玩家只保留最高分记录）
 * - 版本过滤（可选择是否显示旧版本数据）
 */

let supabaseClient = null;

/**
 * Edge Function 基础 URL
 */
function getEdgeFunctionUrl() {
  if (!window.SUPABASE_CONFIG) return null;
  return window.SUPABASE_CONFIG.url + '/functions/v1';
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
  /**
   * 提交分数到排行榜
   * 新提交的分数 last 字段默认为 false（当前版本数据）
   */
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
        tier: tier,
        last: false  // 新数据标记为当前版本
      }])
      .select();

    if (error) {
      console.error('Error submitting score:', error);
      return { error };
    }

    return { data };
  },

  /**
   * 通过 Edge Function 获取排行榜数据
   * @param {Object} options - 查询选项
   * @param {string} options.sortBy - 排序字段: 'score'|'level'|'survival_time'|'kills'
   * @param {boolean} options.includeLast - 是否包含旧版本数据
   * @param {number} options.limit - 返回数量限制
   * @param {number} options.offset - 分页偏移
   * @returns {Promise<{data: Array, total: number, error: any}>}
   */
  async getLeaderboardAdvanced(options = {}) {
    const {
      sortBy = 'score',
      includeLast = false,
      limit = 50,
      offset = 0
    } = options;

    const baseUrl = getEdgeFunctionUrl();
    if (!baseUrl) {
      console.error('Supabase config not initialized');
      return { error: 'Supabase config not initialized', data: [], total: 0 };
    }

    const params = new URLSearchParams({
      sort_by: sortBy,
      include_last: includeLast.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    });

    try {
      const response = await fetch(`${baseUrl}/get-leaderboard?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': window.SUPABASE_CONFIG.publicKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.error) {
        console.error('Error fetching leaderboard:', result.error);
        return { error: result.error, data: [], total: 0 };
      }

      return { data: result.data || [], total: result.total || 0, error: null };
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      return { error: err.message, data: [], total: 0 };
    }
  },

  /**
   * 获取排行榜（兼容旧接口）
   * 默认按战力排序，不包含旧版本数据
   */
  async getLeaderboard(limit = 50) {
    return this.getLeaderboardAdvanced({
      sortBy: 'score',
      includeLast: false,
      limit: limit,
      offset: 0
    });
  },

  /**
   * 分页获取排行榜（兼容旧接口）
   * 默认按战力排序，不包含旧版本数据
   */
  async getLeaderboardPage(limit = 50, offset = 0) {
    return this.getLeaderboardAdvanced({
      sortBy: 'score',
      includeLast: false,
      limit: limit,
      offset: offset
    });
  }
};

window.SupabaseAPI = SupabaseAPI;
window.getSupabaseClient = getSupabaseClient;
