import { prisma } from "@/lib/prisma";
import { conversationIntelligenceService } from "@/services/conversations/conversationIntelligenceService";
import { contentScoringService } from "@/services/scoring/contentScoringService";
import { contentGenerationService } from "@/services/content/contentGenerationService";

/**
 * Radar de oportunidades: detecta picos de consultas, objeciones repetidas e
 * intención de compra, y arma alertas + oportunidades de contenido accionables.
 */
export class OpportunityRadarService {
  async detectDailyOpportunities(businessProfileId: string, date?: Date) {
    const summary = await conversationIntelligenceService.analyzeBusinessConversations(
      businessProfileId,
      date
    );

    // Regeneramos las alertas "new" para no acumular duplicados.
    await prisma.opportunityAlert.deleteMany({
      where: { businessProfileId, status: "new" },
    });

    const created = [];

    const topQuestion = summary.topQuestions[0];
    if (topQuestion) {
      const alert = await prisma.opportunityAlert.create({
        data: {
          businessProfileId,
          type: "faq",
          title: `Consultas frecuentes por ${topQuestion.toLowerCase()}`,
          description: `"${topQuestion}" fue de lo más preguntado. Aclararlo en contenido baja la fricción.`,
          source: "conversaciones",
          priority: "high",
          recommendedAction: `Crear un carrusel o historia que responda "${topQuestion}".`,
          status: "new",
        },
      });
      created.push(alert);

      // Oportunidad de contenido + score.
      const opp = await prisma.contentOpportunity.create({
        data: {
          businessProfileId,
          title: `Carrusel: dudas sobre ${topQuestion.toLowerCase()}`,
          contentType: "carousel",
          angle: "Educativo, responde la duda más frecuente",
          suggestedCopy: `Lo que más nos preguntan: ${topQuestion} 👇`,
          priority: "high",
          status: "pending",
        },
      });
      const score = contentScoringService.score({ frequency: summary.totalMessages, basedOnConversationsCount: summary.totalConversations });
      await prisma.contentScore.create({
        data: {
          contentOpportunityId: opp.id,
          salesPotential: score.salesPotential,
          urgency: score.urgency,
          confidence: score.confidence,
          reason: score.reason,
          basedOnConversationsCount: score.basedOnConversationsCount,
        },
      });
    }

    const topObjection = summary.topObjections[0];
    if (topObjection) {
      created.push(
        await prisma.opportunityAlert.create({
          data: {
            businessProfileId,
            type: "objection",
            title: `Objeción repetida: "${topObjection}"`,
            description: "Conviene una pieza que la responda antes de que frene la venta.",
            source: "conversaciones",
            priority: "medium",
            recommendedAction: `Reel o historia respondiendo "${topObjection}".`,
            status: "new",
          },
        })
      );
    }

    if (summary.purchaseIntentCount > 0) {
      created.push(
        await prisma.opportunityAlert.create({
          data: {
            businessProfileId,
            type: "urgency",
            title: `${summary.purchaseIntentCount} cliente(s) con intención de compra`,
            description: "Hay señales de compra sin cerrar. Seguimiento recomendado.",
            source: "conversaciones",
            priority: "critical",
            recommendedAction: "Enviar respuesta de cierre y coordinar la venta.",
            status: "new",
          },
        })
      );
    }

    return created;
  }

  /** Crea un pedido de contenido a partir de una alerta y lo genera. */
  async createContentOrderFromAlert(alertId: string) {
    const alert = await prisma.opportunityAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new Error("Oportunidad no encontrada");

    const order = await prisma.contentOrder.create({
      data: {
        businessProfileId: alert.businessProfileId,
        type: "insight_based_content_pack",
        status: "ready_to_generate",
        objective: alert.title,
        notes: alert.recommendedAction,
      },
    });
    await prisma.opportunityAlert.update({ where: { id: alertId }, data: { status: "used" } });
    return contentGenerationService.generateForOrder(order.id);
  }
}

export const opportunityRadarService = new OpportunityRadarService();
