import { prisma } from "@/lib/prisma";
import type { Level } from "@/lib/validators/enums";

export interface ScoreInput {
  frequency?: number;
  purchaseIntent?: boolean;
  basedOnConversationsCount?: number;
}

export interface ScoreResult {
  salesPotential: Level;
  urgency: Level;
  confidence: number;
  reason: string;
  basedOnConversationsCount: number;
}

/**
 * Puntúa oportunidades / ideas según señales de venta y urgencia.
 * Reglas simples en el MVP, explicables.
 */
export class ContentScoringService {
  calculateSalesPotential(input: ScoreInput): Level {
    if (input.purchaseIntent || (input.frequency ?? 0) >= 5) return "high";
    if ((input.frequency ?? 0) >= 2) return "medium";
    return "low";
  }

  calculateUrgency(input: ScoreInput): Level {
    if (input.purchaseIntent) return "high";
    if ((input.frequency ?? 0) >= 4) return "high";
    if ((input.frequency ?? 0) >= 2) return "medium";
    return "low";
  }

  score(input: ScoreInput): ScoreResult {
    const salesPotential = this.calculateSalesPotential(input);
    const urgency = this.calculateUrgency(input);
    const freq = input.frequency ?? 0;
    const confidence = Math.min(0.95, 0.5 + freq * 0.06 + (input.purchaseIntent ? 0.2 : 0));
    const reason = input.purchaseIntent
      ? "Hay señales de intención de compra; conviene actuar rápido."
      : `Detectado ${freq}× en conversaciones. ${salesPotential === "high" ? "Alta" : salesPotential === "medium" ? "Media" : "Baja"} oportunidad de venta.`;
    return {
      salesPotential,
      urgency,
      confidence: Number(confidence.toFixed(2)),
      reason,
      basedOnConversationsCount: input.basedOnConversationsCount ?? freq,
    };
  }

  async scoreContentOpportunity(opportunityId: string) {
    const opp = await prisma.contentOpportunity.findUnique({
      where: { id: opportunityId },
      include: { sourceInsight: true },
    });
    if (!opp) throw new Error("Oportunidad no encontrada");
    const result = this.score({
      frequency: opp.sourceInsight?.frequency ?? 0,
      purchaseIntent: opp.sourceInsight?.type === "purchase_intent",
    });
    return prisma.contentScore.create({
      data: {
        contentOpportunityId: opportunityId,
        salesPotential: result.salesPotential,
        urgency: result.urgency,
        confidence: result.confidence,
        reason: result.reason,
        basedOnConversationsCount: result.basedOnConversationsCount,
      },
    });
  }

  explainScore(result: ScoreResult): string {
    return `Potencial de venta ${result.salesPotential} y urgencia ${result.urgency} (confianza ${Math.round(
      result.confidence * 100
    )}%). ${result.reason}`;
  }
}

export const contentScoringService = new ContentScoringService();
