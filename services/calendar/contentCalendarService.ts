import { prisma } from "@/lib/prisma";
import { industryPlaybookService } from "@/services/industry/industryPlaybookService";
import { conversationIntelligenceService } from "@/services/conversations/conversationIntelligenceService";
import { contentGenerationService } from "@/services/content/contentGenerationService";

const ROTATION = ["story", "carousel", "reel", "feed_post", "story", "reel", "feed_post"] as const;

/**
 * Calendario automático de contenido: arma un plan semanal a partir de los
 * ángulos del rubro y las dudas reales de las conversaciones.
 */
export class ContentCalendarService {
  async generateWeeklyCalendar(businessProfileId: string, objective?: string) {
    const business = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      select: { category: true, mainOffer: true },
    });
    if (!business) throw new Error("Negocio no encontrado");

    const [angles, summary] = await Promise.all([
      industryPlaybookService.suggestContentAngles(business.category),
      conversationIntelligenceService.analyzeBusinessConversations(businessProfileId),
    ]);

    const ideas: string[] = [
      ...summary.topQuestions.map((q) => `Responder: ${q}`),
      ...angles,
    ];

    // Limpiamos calendarios en borrador previos para no acumular.
    await prisma.contentCalendar.deleteMany({ where: { businessProfileId, status: "draft" } });

    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const items = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const title = ideas[i % ideas.length] ?? "Contenido del día";
      return {
        date,
        contentType: ROTATION[i % ROTATION.length],
        title,
        angle: angles[i % angles.length] ?? null,
        suggestedCopy: `${title} — contalo simple y cerrá con un CTA a WhatsApp.`,
        cta: "Consultá por WhatsApp",
        status: "pending",
      };
    });

    return prisma.contentCalendar.create({
      data: {
        businessProfileId,
        startDate: start,
        endDate: end,
        objective: objective ?? "Vender más y bajar dudas frecuentes",
        status: "draft",
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async createContentOrderFromCalendarItem(calendarItemId: string) {
    const item = await prisma.contentCalendarItem.findUnique({
      where: { id: calendarItemId },
      include: { contentCalendar: true },
    });
    if (!item) throw new Error("Item de calendario no encontrado");
    const order = await prisma.contentOrder.create({
      data: {
        businessProfileId: item.contentCalendar.businessProfileId,
        type: item.contentType === "carousel" ? "carousel" : "content_pack",
        status: "ready_to_generate",
        objective: item.title,
        notes: item.suggestedCopy,
      },
    });
    await prisma.contentCalendarItem.update({ where: { id: calendarItemId }, data: { status: "generated" } });
    return contentGenerationService.generateForOrder(order.id);
  }

  markCalendarItemAsApproved(id: string) {
    return prisma.contentCalendarItem.update({ where: { id }, data: { status: "approved" } });
  }
  markCalendarItemAsPublished(id: string) {
    return prisma.contentCalendarItem.update({ where: { id }, data: { status: "published" } });
  }
}

export const contentCalendarService = new ContentCalendarService();
