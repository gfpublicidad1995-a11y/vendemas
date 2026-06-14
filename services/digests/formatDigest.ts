import { asStringArray } from "@/lib/json";

export interface DigestLike {
  date: Date | string;
  topQuestions: unknown;
  topObjections?: unknown;
  contentIdeas: unknown;
  campaignIdeas: unknown;
  recommendedAction: string | null;
}

/**
 * Arma el mensaje de WhatsApp "Ideas para mañana" a partir de un DailyDigest.
 * Función pura: la usan tanto la UI (preview) como el endpoint de envío.
 */
export function formatDigestForWhatsApp(d: DigestLike): string {
  const questions = asStringArray(d.topQuestions);
  const contentIdeas = asStringArray(d.contentIdeas);
  const campaignIdeas = asStringArray(d.campaignIdeas);

  const lines: string[] = ["📊 Resumen de consultas de hoy", ""];

  if (questions.length) {
    lines.push("Hoy tus clientes preguntaron principalmente por:");
    questions.slice(0, 5).forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    lines.push("");
  }

  const ideas = [...contentIdeas, ...campaignIdeas];
  if (ideas.length) {
    lines.push("💡 Ideas de contenido para mañana:");
    ideas.slice(0, 4).forEach((idea, i) => lines.push(`${i + 1}. ${idea}`));
    lines.push("");
  }

  if (d.recommendedAction) {
    lines.push("🔥 Recomendación:");
    lines.push(d.recommendedAction);
    lines.push("");
  }

  lines.push("¿Querés que te cree estas piezas?");
  lines.push("Respondé:");
  lines.push("1 - Crear carrusel");
  lines.push("2 - Crear historia");
  lines.push("3 - Crear anuncio");
  lines.push("4 - Crear todo");

  return lines.join("\n");
}
