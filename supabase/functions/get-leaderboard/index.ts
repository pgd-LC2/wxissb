import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface LeaderboardRecord {
  id: string;
  player_name: string;
  score: number;
  level: number;
  kills: number;
  survival_time: number;
  tier: string | null;
  created_at: string;
  last: boolean;
}

interface LeaderboardParams {
  sort_by?: "score" | "level" | "survival_time" | "kills";
  include_last?: boolean;
  limit?: number;
  offset?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse parameters from query string or body
    let params: LeaderboardParams = {};
    
    if (req.method === "GET") {
      const url = new URL(req.url);
      params = {
        sort_by: (url.searchParams.get("sort_by") as LeaderboardParams["sort_by"]) || "score",
        include_last: url.searchParams.get("include_last") === "true",
        limit: parseInt(url.searchParams.get("limit") || "50"),
        offset: parseInt(url.searchParams.get("offset") || "0"),
      };
    } else if (req.method === "POST") {
      const body = await req.json();
      params = {
        sort_by: body.sort_by || "score",
        include_last: body.include_last === true,
        limit: body.limit || 50,
        offset: body.offset || 0,
      };
    }

    // Validate sort_by parameter
    const validSortFields = ["score", "level", "survival_time", "kills"];
    const sortField = validSortFields.includes(params.sort_by || "") 
      ? params.sort_by! 
      : "score";

    // Validate limit and offset
    const limit = Math.min(Math.max(1, params.limit || 50), 100);
    const offset = Math.max(0, params.offset || 0);
    const includeLast = params.include_last === true;

    // Create Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all records (we need to deduplicate in memory)
    // For better performance with large datasets, consider creating a database view
    const { data: rawData, error: fetchError } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    // Filter by last field if needed
    const filtered: LeaderboardRecord[] = includeLast 
      ? (rawData || [])
      : (rawData || []).filter((r: LeaderboardRecord) => !r.last);

    // Deduplicate by player_name, keeping highest score for each player
    const playerMap = new Map<string, LeaderboardRecord>();
    for (const record of filtered) {
      const playerName = record.player_name || "";
      const existing = playerMap.get(playerName);
      if (!existing || record.score > existing.score) {
        playerMap.set(playerName, record);
      }
    }

    // Convert to array and sort by specified field
    const deduplicated = Array.from(playerMap.values());
    deduplicated.sort((a: LeaderboardRecord, b: LeaderboardRecord) => {
      const fieldA = (a[sortField as keyof LeaderboardRecord] as number) || 0;
      const fieldB = (b[sortField as keyof LeaderboardRecord] as number) || 0;
      return fieldB - fieldA;
    });

    // Apply pagination
    const paginated = deduplicated.slice(offset, offset + limit);

    // Return response with total count for pagination info
    return new Response(
      JSON.stringify({ 
        data: paginated, 
        total: deduplicated.length,
        error: null 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ data: null, total: 0, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
