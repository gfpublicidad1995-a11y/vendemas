import { describe, it, expect } from "vitest";
import { conversationIntelligenceService } from "@/services/conversations/conversationIntelligenceService";

describe("ConversationIntelligence (reglas)", () => {
  it("clasifica intención de compra, objeción y pregunta frecuente", () => {
    expect(
      conversationIntelligenceService.classify("quiero comprar, ¿me lo mandás?").kind
    ).toBe("purchase_intent");
    expect(conversationIntelligenceService.classify("me parece caro").kind).toBe("objection");
    expect(conversationIntelligenceService.classify("¿cuánto sale?").kind).toBe("faq");
  });

  it("resume contando preguntas frecuentes y señales de compra", () => {
    const s = conversationIntelligenceService.summarize([
      "¿cuánto sale?",
      "¿hacen envíos?",
      "me parece caro",
      "quiero comprar",
    ]);
    expect(s.topQuestions).toContain("Precio");
    expect(s.topQuestions).toContain("Envíos");
    expect(s.purchaseIntentCount).toBe(1);
  });
});
