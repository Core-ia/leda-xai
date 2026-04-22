// core/facts.js
import { supabase } from "../db/client.js";
export async function loadUserFacts(userId, agentId) {
  const { data, error } = await supabase.from("leda_user_facts").select("fact_key,fact_value,confidence,created_at").eq("user_id", userId).eq("agent_id", agentId).order("created_at", { ascending: false }).limit(50);
  if (error) { console.warn("[facts]", error.message); return []; }
  return data || [];
}
export async function saveUserFact(userId, agentId, factKey, factValue, confidence = 1.0) {
  const { error } = await supabase.from("leda_user_facts").upsert({ user_id: userId, agent_id: agentId, fact_key: factKey, fact_value: factValue, confidence }, { onConflict: "user_id,agent_id,fact_key" });
  if (error) console.warn("[facts] save:", error.message);
}
