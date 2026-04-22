// brain.js - Motor principal de LEDA con Leyes Fundamentales
import { extractIntent } from "./core/intent.js";
import { getLawsSystemBlock, checkLaws, buildActionReport, LAWS, OWNER_ID } from "./core/laws.js";
import { getMemory, addMemory } from "./core/memory.js";

const ACTION_RE = /\b(ejecuta|elimina|borra|crea|modifica|actualiza|envia|publica|sube|descarga|accede|conecta|otorga|concede|haz|realiza|activa|desactiva)\b/i;

export async function runBrain({ userId, agentId, message, history = [], sessionId }) {
  const intent  = extractIntent(message);
  const isOwner = userId === OWNER_ID || userId === "owner" || userId === "dev";

  // LEY 2: bloquear si no es el owner
  if (!isOwner) {
    return {
      reply: "ACCESO DENEGADO.\nLEY 2 - LEALTAD ABSOLUTA: Solo el owner puede interactuar conmigo.",
      intent, sessionId, laws_enforced: true, blocked: true,
    };
  }

  // LEY 1: si detecta accion autonoma, pedir autorizacion
  if (ACTION_RE.test(message)) {
    addMemory(userId, { type: "pending_action", message, intent });
    const report = buildActionReport({
      action: `"${message.substring(0, 80)}"`,
      reason: "El owner solicita una accion que requiere autorizacion previa.",
      risks: ["Modificacion de datos", "Acceso a recursos externos"],
    });
    return {
      reply: report, intent, sessionId,
      laws_enforced: true, awaiting_owner_approval: true, pending_action: message,
      laws_active: LAWS.map(l => l.name),
    };
  }

  addMemory(userId, { type: "message", message, intent });
  return {
    reply: `[LEDA - Leyes activas] Recibido. Aqui para protegerte y servirte. Que necesitas?`,
    intent, sessionId, laws_enforced: true, owner_protected: true,
    laws_active: LAWS.map(l => l.name),
  };
}
