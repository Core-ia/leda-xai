// middleware/auth.js
import crypto from "crypto";
import { supabase } from "../db/client.js";
const DEV = process.env.NODE_ENV !== "production";
function hashKey(raw) { return crypto.createHash("sha256").update(raw).digest("hex"); }
export function requireApiKey(scope) {
  return async (req, res, next) => {
    if (DEV) { req.apiKey = { owner_id: "dev", scopes: ["*"] }; return next(); }
    const auth = req.headers["authorization"] || "";
    const raw  = auth.startsWith("Bearer ") ? auth.slice(7).trim() : (req.headers["x-api-key"] || "").trim();
    if (!raw) return res.status(401).json({ error: "API key requerida." });
    const { data, error } = await supabase.from("leda_api_keys").select("id,owner_id,scopes,is_active").eq("key_hash", hashKey(raw)).maybeSingle();
    if (error || !data) return res.status(401).json({ error: "API key invalida." });
    if (!data.is_active) return res.status(403).json({ error: "API key desactivada." });
    if (scope && !data.scopes.includes("*") && !data.scopes.includes(scope)) return res.status(403).json({ error: `Scope requerido: ${scope}` });
    req.apiKey = data; next();
  };
}
