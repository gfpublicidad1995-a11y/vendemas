import { features } from "@/lib/config/env";

/**
 * Servicio de WhatsApp. Mock por defecto; preparado para WhatsApp Cloud API.
 * Nota: los mensajes fuera de la ventana de 24h requieren plantillas aprobadas
 * (a implementar con la API real). Por ahora queda documentado y mockeado.
 */

export interface WhatsAppSendResult {
  id: string;
  to: string;
  status: "sent" | "queued" | "failed";
  preview: string;
}

export interface WhatsAppService {
  sendText(phone: string, text: string): Promise<WhatsAppSendResult>;
  sendTemplate(
    phone: string,
    template: string,
    params: Record<string, string>
  ): Promise<WhatsAppSendResult>;
}

class MockWhatsAppService implements WhatsAppService {
  async sendText(phone: string, text: string): Promise<WhatsAppSendResult> {
    console.log(`[WhatsApp mock] → ${phone}: ${text.slice(0, 60)}…`);
    return { id: `wamid_mock_${Date.now()}`, to: phone, status: "sent", preview: text };
  }
  async sendTemplate(
    phone: string,
    template: string,
    params: Record<string, string>
  ): Promise<WhatsAppSendResult> {
    const preview = `[plantilla:${template}] ${Object.values(params).join(" · ")}`;
    console.log(`[WhatsApp mock] → ${phone}: ${preview}`);
    return { id: `wamid_tpl_${Date.now()}`, to: phone, status: "sent", preview };
  }
}

function createWhatsAppService(): WhatsAppService {
  if (features.useRealWhatsApp) {
    console.warn("[VendeMás] WHATSAPP_PROVIDER=cloud aún no implementado. Usando mock.");
  }
  return new MockWhatsAppService();
}

export const whatsappService: WhatsAppService = createWhatsAppService();

/**
 * Plantillas de WhatsApp (mockeadas). Devuelven el texto que se enviaría.
 * Con la API real, cada una mapea a una plantilla aprobada por Meta.
 */
export const whatsappTemplates = {
  welcome: (name: string) =>
    `¡Hola ${name}! 👋 Soy VendeMás, tu agencia de contenido y anuncios por WhatsApp. ¿Querés que te arme algo para vender más?`,
  deliveryLink: (businessName: string, url: string) =>
    `✅ Listo ${businessName}! Te dejé el contenido acá: ${url}\n\nRespondé:\n1 Aprobar · 2 Pedir cambios · 3 Hacerlo más vendedor · 4 Más versiones`,
  contentApproval: (url: string) =>
    `Tu contenido está listo 🙌 Miralo acá: ${url}\nRespondé 1 para aprobar o 2 para pedir cambios.`,
  campaignApproval: (objective: string) =>
    `Tu campaña "${objective}" está en borrador (no gastamos nada todavía). ¿La aprobás? Respondé SÍ para dejarla lista.`,
  weeklyReport: (summary: string) => `📈 Tu resumen semanal:\n${summary}`,
} as const;
