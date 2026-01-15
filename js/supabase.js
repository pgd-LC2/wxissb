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

  createRealtimeChannel(roomId) {
    const client = getSupabaseClient();
    if (!client) {
      console.error('Supabase client not initialized');
      return null;
    }

    return client.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: false }
      }
    });
  },

  broadcastPosition(channel, playerId, x, y, color, playerName) {
    if (!channel) return;

    channel.send({
      type: 'broadcast',
      event: 'player_position',
      payload: {
        playerId,
        x,
        y,
        color,
        playerName,
        timestamp: Date.now()
      }
    });
  },

  broadcastPlayerLeft(channel, playerId) {
    if (!channel) return;

    channel.send({
      type: 'broadcast',
      event: 'player_left',
      payload: {
        playerId,
        timestamp: Date.now()
      }
    });
  },

  subscribeToRoom(channel, onPlayerPosition, onPlayerLeft) {
    if (!channel) return null;

    return channel
      .on('broadcast', { event: 'player_position' }, (payload) => {
        if (onPlayerPosition) {
          onPlayerPosition(payload.payload);
        }
      })
      .on('broadcast', { event: 'player_left' }, (payload) => {
        if (onPlayerLeft) {
          onPlayerLeft(payload.payload);
        }
      })
      .subscribe();
  },

  unsubscribeFromRoom(channel) {
    if (channel) {
      channel.unsubscribe();
    }
  }
};

window.SupabaseAPI = SupabaseAPI;
window.getSupabaseClient = getSupabaseClient;
