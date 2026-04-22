// server.js - LEDA Standalone Server
import "dotenv/config";
import express    from "express";
import cors       from "cors";
import crypto     from "crypto";
import path       from "path";
import { fileURLToPath }    from "url";
import { runBrain }         from "./brain.js";
import { extractIntent }    from "./core/intent.js";
import { buildUserProfile } from "./core/profile.js";
import { loadUserFacts }    from "./core/facts.js";
import { loadStoryState }   from "./core/director.js";
import { supabase, runMigrations } from "./db/client.js";
import { requireApiKey }    from "./middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.LEDA_PORT || process.env.PORT || 4000;
const DEV  = process.env.NODE_ENV !== "production";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function devOrApiKey(scope) {
  return (req, res, next) => {
    if (DEV) { req.apiKey = { owner_id: "dev", scopes: ["*"] }; return next(); }
    return requireApiKey(scope)(req, res, next);
  };
}

app.get("/health", (_req, res) => res.json({ status: "ok", service: "LEDA-XAI", version: "1.0.0", dev: DEV, ts: Date.now() }));

const v1 = express.Router();
app.use("/v1", devOrApiKey(), v1);

v1.post("/chat", async (req, res) => {
  const { userId, agentId, message, history = [], sessionId } = req.body;
  if (!userId || !agentId || !message?.trim()) return res.status(400).json({ error: "userId, agentId y message son requeridos" });
  try { res.json(await runBrain({ userId, agentId, message, history, sessionId })); }
  catch (e) { console.error("[/chat]", e.message); res.status(500).json({ error: e.message }); }
});

v1.post("/intent", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message es requerido" });
  res.json(extractIntent(message));
});

v1.get("/agents", async (_req, res) => {
  const { data, error } = await supabase.from("leda_agents").select("id,name,description,provider,model,is_public,is_active,created_at").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

v1.post("/agents", devOrApiKey("admin"), async (req, res) => {
  const { name, description="", system_prompt="", provider, model, api_key, config={}, is_public=false } = req.body;
  if (!name || !provider || !model || !api_key) return res.status(400).json({ error: "name, provider, model y api_key son requeridos" });
  const { data, error } = await supabase.from("leda_agents").insert({ name, description, system_prompt, provider, model, api_key, config, is_public, owner_id: req.apiKey.owner_id, is_active: true }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

v1.get("/users", async (_req, res) => {
  const { data, error } = await supabase.from("leda_users").select("id,external_id,name,email,created_at").order("created_at", { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

v1.get("/users/:userId/profile", async (req, res) => {
  try { res.json(await buildUserProfile(req.params.userId, req.query.agentId || null)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

v1.get("/users/:userId/facts/:agentId", async (req, res) => {
  res.json({ userId: req.params.userId, facts: await loadUserFacts(req.params.userId, req.params.agentId) });
});

v1.get("/users/:userId/story/:agentId", async (req, res) => {
  res.json(await loadStoryState(req.params.userId, req.params.agentId));
});

v1.post("/apikeys", devOrApiKey("admin"), async (req, res) => {
  const { owner_id, scopes = ["chat"], rate_limit = 100 } = req.body;
  if (!owner_id) return res.status(400).json({ error: "owner_id requerido" });
  const rawKey  = `leda_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const { data, error } = await supabase.from("leda_api_keys").insert({ key_hash: keyHash, owner_id, scopes, rate_limit, is_active: true }).select("id,scopes,rate_limit,created_at").single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ ...data, key: rawKey, warning: "Guarda esta clave, no se mostrara de nuevo." });
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/v1")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  try { await runMigrations(); } catch (e) { console.warn("[LEDA] Migraciones:", e.message); }
  app.listen(PORT, () => {
    console.log(`\nLEDA-XAI corriendo en http://localhost:${PORT}`);
    console.log(`Modo: ${DEV ? "desarrollo (sin API key)" : "produccion"}\n`);
  });
}
start();
