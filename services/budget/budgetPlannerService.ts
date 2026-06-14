import { prisma } from "@/lib/prisma";

/**
 * Planificador de pauta. Recomienda cómo repartir el presupuesto.
 * Regla: nunca activa campañas ni gasta sin aprobación explícita.
 */
export class BudgetPlannerService {
  recommendCampaignDistribution(objective?: string | null): Record<string, number> {
    const obj = (objective ?? "").toLowerCase();
    if (obj.includes("venta") || obj.includes("conversión") || obj.includes("conversion")) {
      return { "Ventas (conversión)": 0.55, Remarketing: 0.3, Prospección: 0.15 };
    }
    if (obj.includes("alcance") || obj.includes("reconocimiento")) {
      return { Alcance: 0.5, "Mensajes": 0.3, Remarketing: 0.2 };
    }
    return { "Mensajes (prospección)": 0.6, Remarketing: 0.25, "Alcance local": 0.15 };
  }

  recommendDailyBudget(monthlyBudget: number): number {
    return Math.round((monthlyBudget / 30) * 100) / 100;
  }

  explainBudgetPlan(monthlyBudget: number, currency: string, objective?: string | null): string {
    const daily = this.recommendDailyBudget(monthlyBudget);
    return `Con ${currency} ${monthlyBudget}/mes (~${currency} ${daily}/día) priorizamos ${
      (objective ?? "generar conversaciones").toLowerCase()
    }. Empezá conservador y escalá lo que funcione; nunca gastamos sin tu OK.`;
  }

  async generateBudgetPlan(businessProfileId: string, monthlyBudget: number, objective?: string) {
    const business = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      select: { id: true },
    });
    if (!business) throw new Error("Negocio no encontrado");

    const currency = "USD";
    const distribution = this.recommendCampaignDistribution(objective);

    // Un solo plan en borrador a la vez.
    await prisma.budgetPlan.deleteMany({ where: { businessProfileId, status: "draft" } });

    return prisma.budgetPlan.create({
      data: {
        businessProfileId,
        monthlyBudget,
        currency,
        objective: objective ?? "Mensajes a WhatsApp",
        recommendedDistribution: distribution,
        explanation: this.explainBudgetPlan(monthlyBudget, currency, objective),
        status: "draft",
      },
    });
  }
}

export const budgetPlannerService = new BudgetPlannerService();
