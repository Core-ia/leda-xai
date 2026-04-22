// core/profile.js
import { supabase } from "../db/client.js";
export async function buildUserProfile(userId, agentId = null) {
  const { data, error } = await supabase.from("leda_users").select("id,external_id,name,email,created_at").eq("external_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return { found: !!data, user: data || null, agentId, ts: Date.now() };
}
