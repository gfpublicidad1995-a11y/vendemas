import { prisma } from "@/lib/prisma";
import { aiService } from "@/services/ai";
import { whatsappService } from "@/services/whatsapp";
import { conversationIntelligenceService } from "@/services/conversations/conversationIntelligenceService";
import { contentGenerationService } from "@/services/content/contentGenerationService";
import { formatDigestForWhatsApp } from "./formatDigest";
import { asStringArray } from "@/lib/json";

export interface DigestRunResult {
  status: "generated" | "skipped_no_consent" | "skipped_disabled" | "skipped_empty";
  digestId?: string;
}

/**
 * Daily Digest "Ideas para mañana".
 * Respeta consentimientos: si no hay permiso para analizar conversaciones o el
 * digest está deshabilitado, no hace nada.
 */
export class DailyDigestService {
  async generateDailyDigest(businessProfileId: string, date?: Date): Promise<DigestRunResult> {
    const business = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      include: { brandKit: true, user: true },
    });
    if (!business) throw new Error("Negocio no encontrado");

    if (!business.dailyDigestEnabled) return { status: "skipped_disabled" };
    if (!business.consentToAnalyzeConversations) return { status: "skipped_no_consent" };

    const day = date ?? new Date();
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const summary = await conversationIntelligenceService.analyzeBusinessConversations(
      businessProfileId,
      start,
      end
    );

    if (summary.totalMessages === 0) return { status: "skipped_empty" };

    const ideas = await aiService.generateDailyDigestIdeas(
      {
        businessName: business.businessName,
        category: business.category,
        city: business.city,
        toneOfVoice: business.toneOfVoice,
        mainOffer: business.mainOffer,
        targetAudience: business.targetAudience,
      },
      summary.topQuestions,
      summary.topObjections
    );

    const digest = await prisma.dailyDigest.create({
      data: {
        businessProfileId,
        date: start,
        totalConversations: summary.totalConversations,
        totalMessages: summary.totalMessages,
        topQuestions: summary.topQuestions,
        topObjections: summary.topObjections,
        topProductInterests: summary.topProductInterests,
        contentIdeas: ideas.contentIdeas,
        campaignIdeas: ideas.campaignIdeas,
        recommendedAction: ideas.recommendedAction,
        status: "generated",
        items: {
          create: [
            ...summary.topQuestions.slice(0, 3).map((q) => ({
              type: "faq",
              title: q,
              description: `Consulta frecuente: ${q}`,
              priority: "high",
            })),
            ...ideas.contentIdeas.map((idea) => ({
              type: "content_idea",
              title: idea,
              priority: "medium",
            })),
            { type: "recommendation", title: "Recomendación del día", description: ideas.recommendedAction, priority: "high" },
          ],
        },
      },
    });

    return { status: "generated", digestId: digest.id };
  }

  formatForWhatsApp(digest: {
    date: Date;
    topQuestions: unknown;
    topObjections: unknown;
    contentIdeas: unknown;
    campaignIdeas: unknown;
    recommendedAction: string | null;
  }): string {
    return formatDigestForWhatsApp(digest);
  }

  async sendDigestToBusinessOwner(digestId: string): Promise<boolean> {
    const digest = await prisma.dailyDigest.findUnique({
      where: { id: digestId },
      include: { businessProfile: { include: { user: true } } },
    });
    if (!digest) return false;
    if (!digest.businessProfile.digestWhatsappOptIn) return false;

    const message = this.formatForWhatsApp(digest);
    const phone = digest.businessProfile.whatsappNumber ?? digest.businessProfile.user.phone;
    await whatsappService.sendText(phone, message);
    await prisma.dailyDigest.update({
      where: { id: digestId },
      data: { status: "sent", sentAt: new Date() },
    });
    return true;
  }

  /** Crea un pedido de contenido a partir de un item del digest y lo genera. */
  async createContentOrderFromDigestItem(digestItemId: string) {
    const item = await prisma.dailyDigestItem.findUnique({
      where: { id: digestItemId },
      include: { dailyDigest: true },
    });
    if (!item) throw new Error("Item de digest no encontrado");

    const order = await prisma.contentOrder.create({
      data: {
        businessProfileId: item.dailyDigest.businessProfileId,
        sourceDigestItemId: item.id,
        type: "daily_digest_content_pack",
        status: "ready_to_generate",
        objective: "Contenido a partir del reporte diario",
        notes: item.title,
      },
    });
    return contentGenerationService.generateForOrder(order.id);
  }
}

export const dailyDigestService = new DailyDigestService();
