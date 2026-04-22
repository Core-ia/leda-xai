// core/intent.js
const PATTERNS = [
  { type: "greeting",   re: /\b(hola|buenas|hello|hey|saludos)\b/i },
  { type: "question",   re: /[?]/i },
  { type: "order",      re: /\b(ejecuta|elimina|borra|crea|modifica|actualiza|envia|publica|sube|descarga|accede|conecta|otorga|concede|haz|realiza|activa|desactiva)\b/i },
  { type: "status",     re: /\b(estado|status|reporte|diagnostico|que sabes|que recuerdas)\b/i },
  { type: "permission", re: /\b(autorizo|permito|procede|adelante|si|ok|aprobado|dale|confirmado)\b/i },
  { type: "denial",     re: /\b(no|deniega|rechaza|cancela|detente|para|stop)\b/i },
];

export function extractIntent(text) {
  if (!text) return { type: "unknown", raw: "" };
  for (const { type, re } of PATTERNS) {
    if (re.test(text)) return { type, raw: text.trim() };
  }
  return { type: "statement", raw: text.trim() };
}
export const detectIntent = extractIntent;
