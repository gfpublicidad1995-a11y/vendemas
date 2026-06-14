import { prisma } from "@/lib/prisma";
import { industryPlaybookService } from "@/services/industry/industryPlaybookService";
import { conversationIntelligenceService } from "@/services/conversations/conversationIntelligenceService";
import { asStringArray } from "@/lib/json";

/**
 * Reporte semanal: resume la semana (consultas, objeciones, señales de compra)
 * y propone plan de contenido y campañas.
 */
export class WeeklyReportService {
  async generateWeeklyReport(businessProfileId: string, weekStartDate?: Date) {
    const business = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      select: { businessName: true, category: true },
    });
    if (!business) throw new Error("Negocio no encontrado");

    const start = weekStartDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    const [summary, angles, objectives] = await Promise.all([
      conversationIntelligenceService.analyzeBusinessConversations(businessProfileId, start, end),
      industryPlaybookService.suggestContentAngles(business.category),
      industryPlaybookService.suggestCampaignStrategy(business.category),
    ]);

    const purchaseSignals = summary.purchaseIntentCount > 0 ? ["Quiero comprar", "¿Me lo mandás?"] : [];

    // Evitamos duplicar el reporte de la misma semana.
    await prisma.weeklyReport.deleteMany({ where: { businessProfileId, weekStartDate: start } });

    const topQ = summary.topQuestions[0] ?? "sus productos";
    const summaryText = `Semana con ${summary.totalConversations} conversaciones. La consulta dominante fue "${topQ}". ${
      summary.topObjections[0] ? `Objeción frecuente: "${summary.topObjections[0]}". ` : ""
    }Conviene reforzar contenido que responda esas dudas y una campaña de mensajes.`;

    return prisma.weeklyReport.create({
      data: {
        businessProfileId,
        weekStartDate: start,
        weekEndDate: end,
        totalConversations: summary.totalConversations,
        totalMessages: summary.totalMessages,
        topQuestions: summary.topQuestions,
        topObjections: summary.topObjections,
        topProductInterests: summary.topProductInterests,
        topPurchaseSignals: purchaseSignals,
        recommendedContentPlan: angles.slice(0, 4),
        recommendedCampaigns: objectives.slice(0, 2),
        summary: summaryText,
        status: "generated",
      },
    });
  }

  formatForWhatsApp(report: {
    summary: string | null;
    recommendedContentPlan: unknown;
    recommendedCampaigns: unknown;
  }): string {
    const plan = asStringArray(report.recommendedContentPlan);
    const camps = asStringArray(report.recommendedCampaigns);
    const lines = ["📈 Tu resumen semanal", "", report.summary ?? ""];
    if (plan.length) {
      lines.push("", "💡 Plan de contenido:");
      plan.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    }
    if (camps.length) {
      lines.push("", "🎯 Campañas sugeridas:");
      camps.forEach((c) => lines.push(`• ${c}`));
    }
    return lines.join("\n");
  }
}

export const weeklyReportService = new WeeklyReportService();
