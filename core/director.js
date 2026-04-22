// core/director.js
import { supabase } from "../db/client.js";
export async function loadStoryState(userId, agentId) {
  const { data, error } = await supabase.from("leda_story_states").select("*").eq("user_id", userId).eq("agent_id", agentId).maybeSingle();
  if (error) { console.warn("[director]", error.message); return { userId, agentId, arc: "intro", events: [] }; }
  return data || { userId, agentId, arc: "intro", events: [] };
}
export async function advanceStory(userId, agentId, newArc, eventData = {}) {
  const { error } = await supabase.from("leda_story_states").upsert({ user_id: userId, agent_id: agentId, arc: newArc, last_event: eventData, updated_at: new Date().toISOString() }, { onConflict: "user_id,agent_id" });
  if (error) console.warn("[director] advance:", error.message);
}
