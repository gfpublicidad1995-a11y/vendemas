import { prisma } from "@/lib/prisma";
import { conversationIntelligenceService } from "@/services/conversations/conversationIntelligenceService";
import type { ReplyTriggerType } from "@/lib/validators/enums";

interface ReplyContext {
  businessName: string;
  mainOffer?: string | null;
}

const TRIGGER_BY_CATEGORY: Record<string, ReplyTriggerType> = {
  price: "general_question",
  delivery: "delivery_question",
  payment: "payment_question",
  stock: "stock_question",
  location: "general_question",
  schedule: "general_question",
  purchase_intent: "purchase_intent",
  general: "general_question",
};

function replyText(trigger: ReplyTriggerType, ctx: ReplyContext): string {
  switch (trigger) {
    case "delivery_question":
      return "¡Sí, hacemos envíos! 🚚 Contanos tu zona y te coordinamos al toque.";
    case "payment_question":
      return "Aceptamos transferencia y Mercado Pago 💳 ¿Cómo te queda más cómodo?";
    case "stock_question":
      return "¡Sí, tenemos stock! ¿Te lo reservo? 🙌";
    case "purchase_intent":
      return "¡Genial! 🙌 Pasame tu dirección y zona y coordinamos. ¿Pagás por transferencia o Mercado Pago?";
    case "price_objection":
      return `Te entiendo 🙂 ${ctx.mainOffer ?? "Nuestra opción"} rinde más de lo que parece, así que el costo por uso es menor. ¿Te coordino una con envío?`;
    default:
      return `¡Hola! Gracias por escribir a ${ctx.businessName} 😊 Contame un poco más y te ayudo enseguida.`;
  }
}

/**
 * Respuestas sugeridas para WhatsApp. En el MVP se sugieren y se aprueban; no
 * se envían automáticamente.
 */
export class SuggestedReplyService {
  private async ctx(businessProfileId: string): Promise<ReplyContext> {
    const b = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      select: { businessName: true, mainOffer: true },
    });
    return { businessName: b?.businessName ?? "tu negocio", mainOffer: b?.mainOffer };
  }

  /** Genera respuestas para los últimos mensajes entrantes del negocio. */
  async generateRepliesForBusiness(businessProfileId: string) {
    const ctx = await this.ctx(businessProfileId);

    // Regeneramos las "suggested" (las usadas/descartadas se conservan).
    await prisma.suggestedReply.deleteMany({
      where: { businessProfileId, status: "suggested" },
    });

    const messages = await prisma.conversationMessage.findMany({
      where: { direction: "inbound", thread: { businessProfileId } },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    const created = [];
    for (const m of messages) {
      const { category } = conversationIntelligenceService.classify(m.content ?? "");
      const isObjection = /caro|barato|después|despues/i.test(m.content ?? "");
      const trigger: ReplyTriggerType = isObjection ? "price_objection" : TRIGGER_BY_CATEGORY[category] ?? "general_question";
      created.push(
        await prisma.suggestedReply.create({
          data: {
            businessProfileId,
            conversationMessageId: m.id,
            triggerType: trigger,
            customerMessage: m.content,
            suggestedReply: replyText(trigger, ctx),
            tone: trigger === "price_objection" ? "persuasive" : "friendly",
            status: "suggested",
          },
        })
      );
    }
    return created;
  }

  async generateRepliesForObjections(businessProfileId: string) {
    const ctx = await this.ctx(businessProfileId);
    const objections = await prisma.objectionInsight.findMany({ where: { businessProfileId } });
    const created = [];
    for (const o of objections) {
      created.push(
        await prisma.suggestedReply.create({
          data: {
            businessProfileId,
            triggerType: "price_objection",
            customerMessage: o.objection,
            suggestedReply: o.suggestedResponse,
            tone: "persuasive",
            status: "suggested",
          },
        })
      );
    }
    return created;
  }

  markReplyAsUsed(replyId: string) {
    return prisma.suggestedReply.update({ where: { id: replyId }, data: { status: "used" } });
  }

  markReplyAsDismissed(replyId: string) {
    return prisma.suggestedReply.update({ where: { id: replyId }, data: { status: "dismissed" } });
  }
}

export const suggestedReplyService = new SuggestedReplyService();
