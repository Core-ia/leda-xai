-- ══════════════════════════════════════════════════════════
-- LEDA-XAI — Schema de base de datos (Supabase / PostgreSQL)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ══════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Agentes LEDA
CREATE TABLE IF NOT EXISTS leda_agents (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  description   TEXT        DEFAULT '',
  system_prompt TEXT        DEFAULT '',
  provider      TEXT        NOT NULL,
  model         TEXT        NOT NULL,
  api_key       TEXT        NOT NULL,
  config        JSONB       DEFAULT '{}',
  is_public     BOOLEAN     DEFAULT false,
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leda_agents DISABLE ROW LEVEL SECURITY;

-- Usuarios LEDA
CREATE TABLE IF NOT EXISTS leda_users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT        NOT NULL UNIQUE,
  name        TEXT        DEFAULT '',
  email       TEXT        DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leda_users DISABLE ROW LEVEL SECURITY;

-- API Keys
CREATE TABLE IF NOT EXISTS leda_api_keys (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash   TEXT        NOT NULL UNIQUE,
  owner_id   TEXT        NOT NULL,
  scopes     TEXT[]      DEFAULT '{"chat"}',
  rate_limit INT         DEFAULT 100,
  is_active  BOOLEAN     DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leda_api_keys DISABLE ROW LEVEL SECURITY;

-- Sesiones
CREATE TABLE IF NOT EXISTS leda_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  agent_id   UUID        REFERENCES leda_agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leda_sessions DISABLE ROW LEVEL SECURITY;

-- Hechos aprendidos por usuario
CREATE TABLE IF NOT EXISTS leda_user_facts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  agent_id   UUID        REFERENCES leda_agents(id) ON DELETE CASCADE,
  fact_key   TEXT        NOT NULL,
  fact_value TEXT        DEFAULT '',
  confidence NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_id, fact_key)
);
ALTER TABLE leda_user_facts DISABLE ROW LEVEL SECURITY;

-- Estado narrativo
CREATE TABLE IF NOT EXISTS leda_story_states (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  agent_id   UUID        REFERENCES leda_agents(id) ON DELETE CASCADE,
  arc        TEXT        DEFAULT 'intro',
  last_event JSONB       DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);
ALTER TABLE leda_story_states DISABLE ROW LEVEL SECURITY;
