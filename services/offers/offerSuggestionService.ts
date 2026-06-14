import { prisma } from "@/lib/prisma";
import { contentGenerationService } from "@/services/content/contentGenerationService";

/**
 * Ofertas y promociones inteligentes derivadas de objeciones e intereses.
 */
export class OfferSuggestionService {
  async generateOffersFromInsights(businessProfileId: string) {
    const business = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      select: { mainOffer: true },
    });
    const [objections, faqs] = await Promise.all([
      prisma.objectionInsight.findMany({ where: { businessProfileId } }),
      prisma.faqInsight.findMany({ where: { businessProfileId } }),
    ]);

    await prisma.offerSuggestion.deleteMany({ where: { businessProfileId, status: "pending" } });

    const offers: { title: string; offerType: string; suggestedCopy: string; reason: string; priority: string }[] = [];

    if (objections.some((o) => /caro|barato/i.test(o.objection))) {
      offers.push({
        title: "Envío gratis (en vez de bajar el precio)",
        offerType: "free_shipping",
        suggestedCopy: "🚚 Envío gratis llevando hoy. Misma calidad, más beneficio.",
        reason: "Responde la objeción de precio sin tocar el margen.",
        priority: "high",
      });
    }
    if (faqs.some((f) => /env[ií]o/i.test(f.question))) {
      offers.push({
        title: "Combo con envío incluido",
        offerType: "bundle",
        suggestedCopy: "Llevá el combo y te lo dejamos en tu casa 📦",
        reason: "Muchos preguntan por envíos: empaquetarlo sube el ticket.",
        priority: "medium",
      });
    }
    offers.push({
      title: "Oferta por tiempo limitado",
      offerType: "limited_time",
      suggestedCopy: `⏰ Solo esta semana: ${business?.mainOffer ?? "promo especial"}.`,
      reason: "La urgencia acelera la decisión de compra.",
      priority: "medium",
    });

    const created = [];
    for (const o of offers) {
      created.push(
        await prisma.offerSuggestion.create({ data: { businessProfileId, status: "pending", ...o } })
      );
    }
    return created;
  }

  async createCampaignFromOffer(offerSuggestionId: string) {
    const offer = await prisma.offerSuggestion.findUnique({ where: { id: offerSuggestionId } });
    if (!offer) throw new Error("Oferta no encontrada");
    const order = await prisma.contentOrder.create({
      data: {
        businessProfileId: offer.businessProfileId,
        type: "quick_campaign",
        status: "ready_to_generate",
        objective: offer.title,
        offer: offer.suggestedCopy,
      },
    });
    await prisma.offerSuggestion.update({ where: { id: offerSuggestionId }, data: { status: "used" } });
    return contentGenerationService.generateForOrder(order.id);
  }
}

export const offerSuggestionService = new OfferSuggestionService();
