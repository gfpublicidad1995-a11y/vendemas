// Mapeos valor → etiqueta en español + tono de color para badges.
// Mantiene la UI consistente y "sin jerga técnica".

export type Tone =
  | "gray"
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "purple"
  | "emerald";

function dict<T extends Record<string, string>>(d: T) {
  return (key: string | null | undefined) => (key ? d[key] ?? key : "—");
}

export const orderTypeLabel = dict({
  content_pack: "Pack de contenido",
  ads_pack: "Pack de anuncios",
  carousel: "Carrusel",
  video_script: "Guion de video",
  full_campaign: "Campaña completa",
  insight_based_content_pack: "Contenido desde insight",
  daily_digest_content_pack: "Contenido desde reporte",
  quick_campaign: "Campaña Rápida",
});

export const orderStatusLabel = dict({
  draft: "Borrador",
  collecting_info: "Juntando info",
  ready_to_generate: "Listo para generar",
  generating: "Generando",
  completed: "Completado",
  delivered: "Entregado",
  failed: "Falló",
});

export const campaignStatusLabel = dict({
  draft: "Borrador",
  pending_approval: "Esperando aprobación",
  approved: "Aprobada",
  rejected: "Rechazada",
  published: "Publicada",
  paused: "Pausada",
});

export const validationStatusLabel = dict({
  pending: "Pendiente",
  valid: "Listo",
  warning: "Revisar",
  invalid: "No recomendado",
});

export const priorityLabel = dict({
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
});

export const awarenessLevelLabel = dict({
  unaware: "Inconsciente",
  problem: "Consciente del problema",
  solution: "Consciente de la solución",
  product: "Consciente del producto",
  most_aware: "El más consciente",
});

export const insightTypeLabel = dict({
  faq: "Pregunta frecuente",
  objection: "Objeción",
  pain_point: "Dolor del cliente",
  purchase_intent: "Intención de compra",
  content_opportunity: "Oportunidad de contenido",
  campaign_opportunity: "Oportunidad de campaña",
  product_interest: "Interés en producto",
});

export const contentPieceTypeLabel = dict({
  feed_image: "Imagen de feed",
  story: "Historia",
  carousel_slide: "Slide de carrusel",
  carousel_pack: "Carrusel",
  ad_copy: "Copy de anuncio",
  video_script: "Guion de video",
  campaign_structure: "Estructura de campaña",
  whatsapp_reply: "Respuesta WhatsApp",
  content_idea: "Idea de contenido",
});

export const alertTypeLabel = dict({
  content: "Contenido",
  campaign: "Campaña",
  sales: "Ventas",
  objection: "Objeción",
  faq: "Pregunta frecuente",
  product_interest: "Interés en producto",
  urgency: "Urgencia",
});

export function toneForStatus(status: string | null | undefined): Tone {
  switch (status) {
    case "valid":
    case "approved":
    case "completed":
    case "delivered":
    case "published":
    case "generated":
      return "green";
    case "warning":
    case "pending":
    case "pending_approval":
    case "collecting_info":
    case "generating":
    case "draft":
    case "new":
    case "suggested":
      return "amber";
    case "invalid":
    case "failed":
    case "rejected":
    case "dismissed":
      return "red";
    default:
      return "gray";
  }
}

export function toneForPriority(p: string | null | undefined): Tone {
  switch (p) {
    case "critical":
      return "red";
    case "high":
      return "amber";
    case "medium":
      return "blue";
    default:
      return "gray";
  }
}
