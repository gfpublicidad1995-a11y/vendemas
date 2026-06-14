import { prisma } from "@/lib/prisma";

/**
 * Conversation Intelligence (reglas simples en el MVP).
 * Detecta preguntas frecuentes, objeciones e intención de compra a partir de
 * las conversaciones. No usa datos personales: trabaja sobre el texto.
 */

const CATEGORY_KEYWORDS: Record<string, { label: string; words: string[] }> = {
  price: { label: "Precio", words: ["precio", "cuánto sale", "cuanto sale", "cuánto cuesta", "vale", "sale "] },
  delivery: { label: "Envíos", words: ["envío", "envios", "envían", "mandás", "mandas", "delivery", "llega"] },
  payment: { label: "Formas de pago", words: ["transferencia", "mercado pago", "tarjeta", "efectivo", "pago", "cuotas"] },
  stock: { label: "Stock", words: ["stock", "tienen", "hay ", "disponible"] },
  location: { label: "Ubicación", words: ["dónde están", "donde estan", "ubicad", "dirección", "local"] },
  schedule: { label: "Horarios", words: ["horario", "abren", "cierran", "atienden"] },
};

const OBJECTION_PATTERNS: { label: string; words: string[] }[] = [
  { label: "Me parece caro", words: ["caro", "carísimo", "mucha plata"] },
  { label: "Después veo", words: ["después veo", "despues veo", "lo pienso", "más adelante"] },
  { label: "Algo más barato", words: ["más barato", "mas barato", "más económico"] },
  { label: "No estoy seguro", words: ["no sé si", "no se si", "no estoy seguro"] },
];

const PURCHASE_INTENT_WORDS = [
  "quiero comprar",
  "me interesa",
  "cómo hago",
  "como hago",
  "pasame",
  "coordinar",
  "me lo mandás",
  "me lo mandas",
  "quiero contratar",
  "te transfiero",
  "reservame",
  "lo quiero",
];

export interface ConversationSummary {
  totalConversations: number;
  totalMessages: number;
  topQuestions: string[];
  topObjections: string[];
  topProductInterests: string[];
  purchaseIntentCount: number;
}

export type DetectedKind = "faq" | "objection" | "purchase_intent" | "general";

export class ConversationIntelligenceService {
  classify(text: string): { kind: DetectedKind; category: string } {
    const t = text.toLowerCase();
    if (PURCHASE_INTENT_WORDS.some((w) => t.includes(w)))
      return { kind: "purchase_intent", category: "purchase_intent" };
    for (const o of OBJECTION_PATTERNS) {
      if (o.words.some((w) => t.includes(w))) return { kind: "objection", category: o.label };
    }
    for (const [key, cfg] of Object.entries(CATEGORY_KEYWORDS)) {
      if (cfg.words.some((w) => t.includes(w))) return { kind: "faq", category: key };
    }
    return { kind: "general", category: "general" };
  }

  summarize(texts: string[]): Omit<ConversationSummary, "totalConversations"> {
    const questionCounts = new Map<string, number>();
    const objectionCounts = new Map<string, number>();
    let purchaseIntentCount = 0;

    for (const text of texts) {
      const { kind, category } = this.classify(text);
      if (kind === "purchase_intent") purchaseIntentCount++;
      else if (kind === "objection")
        objectionCounts.set(category, (objectionCounts.get(category) ?? 0) + 1);
      else if (kind === "faq") {
        const label = CATEGORY_KEYWORDS[category]?.label ?? category;
        questionCounts.set(label, (questionCounts.get(label) ?? 0) + 1);
      }
    }

    const sortDesc = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

    return {
      totalMessages: texts.length,
      topQuestions: sortDesc(questionCounts),
      topObjections: sortDesc(objectionCounts),
      topProductInterests: sortDesc(questionCounts).slice(0, 2),
      purchaseIntentCount,
    };
  }

  async analyzeBusinessConversations(
    businessProfileId: string,
    since?: Date,
    until?: Date
  ): Promise<ConversationSummary> {
    const messages = await prisma.conversationMessage.findMany({
      where: {
        direction: "inbound",
        thread: { businessProfileId },
        ...(since ? { createdAt: { gte: since, lt: until ?? new Date() } } : {}),
      },
      select: { content: true, conversationThreadId: true },
    });

    const texts = messages.map((m) => m.content ?? "");
    const threads = new Set(messages.map((m) => m.conversationThreadId));
    const summary = this.summarize(texts);
    return { ...summary, totalConversations: threads.size };
  }

  /** Persiste insights derivados del análisis (usado por acciones/endpoints). */
  async persistInsights(businessProfileId: string, summary: ConversationSummary) {
    for (const q of summary.topQuestions) {
      await prisma.conversationInsight.create({
        data: {
          businessProfileId,
          type: "faq",
          title: `Preguntan por: ${q}`,
          description: `Detectamos consultas frecuentes sobre ${q.toLowerCase()}.`,
          frequency: 1,
          confidence: 0.7,
        },
      });
    }
  }
}

export const conversationIntelligenceService = new ConversationIntelligenceService();
