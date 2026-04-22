// db/client.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
if (!URL || !KEY) console.warn("[db] ADVERTENCIA: SUPABASE_URL o SUPABASE_KEY no definidos.");
export const supabase = createClient(URL || "", KEY || "");

const REQUIRED = ["leda_agents","leda_users","leda_api_keys","leda_user_facts","leda_story_states","leda_sessions"];
export async function runMigrations() {
  console.log("[db] Verificando tablas...");
  const missing = [];
  for (const t of REQUIRED) {
    const { error } = await supabase.from(t).select("*").limit(1).maybeSingle();
    const isMissing = error && (error.message.includes("does not exist") || error.message.includes("relation") || error.message.includes("schema cache"));
    if (isMissing) { missing.push(t); console.warn(`[db] FALTA: ${t}`); }
    else console.log(`[db] OK: ${t}`);
  }
  if (missing.length) console.warn(`[db] Tablas faltantes: ${missing.join(", ")}. Ejecuta schema-leda.sql en Supabase.`);
  return { ok: missing.length === 0, missing };
}
