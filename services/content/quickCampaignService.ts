import { prisma } from "@/lib/prisma";
import { contentGenerationService } from "./contentGenerationService";
import { whatsappTemplates } from "@/services/whatsapp";

export interface QuickCampaignBrief {
  productOrService?: string;
  offer?: string;
  objective?: string;
  budget?: string;
  city?: string;
  validUntil?: string;
}

const INTENT_PATTERNS = [
  /vender m[aá]s/i,
  /quiero vender/i,
  /necesito vender/i,
  /promocion/i,
  /promo\b/i,
  /mover (este |el )?producto/i,
  /campa[ñn]a/i,
  /oferta/i,
  /para el finde/i,
  /fin de semana/i,
];

/**
 * Campaña Rápida: "Mandás una frase y te armamos contenido + anuncios".
 */
export class QuickCampaignService {
  detectQuickCampaignIntent(message: string): boolean {
    return INTENT_PATTERNS.some((re) => re.test(message));
  }

  async generateQuickCampaignOrder(businessProfileId: string, brief: QuickCampaignBrief) {
    return prisma.contentOrder.create({
      data: {
        businessProfileId,
        type: "quick_campaign",
        status: "ready_to_generate",
        objective: brief.objective ?? "Vender más esta semana",
        offer: brief.offer ?? null,
        productOrService: brief.productOrService ?? null,
        notes: [
          brief.budget ? `Presupuesto: ${brief.budget}` : null,
          brief.validUntil ? `Vigencia: ${brief.validUntil}` : null,
          brief.city ? `Zona: ${brief.city}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
      },
    });
  }

  /** Genera todo el contenido + visuales + campaña + entrega. */
  async generateQuickCampaignContent(orderId: string) {
    return contentGenerationService.generateForOrder(orderId);
  }

  formatQuickCampaignDeliveryMessage(businessName: string, url: string): string {
    return whatsappTemplates.deliveryLink(businessName, url);
  }
}

export const quickCampaignService = new QuickCampaignService();
