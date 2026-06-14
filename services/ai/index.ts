import { features } from "@/lib/config/env";
import { MockAIContentService } from "./mock";
import type { AIContentService } from "./types";

export * from "./types";

/**
 * Selector de proveedor de IA.
 * - AI_PROVIDER=mock (default): MockAIContentService.
 * - AI_PROVIDER=anthropic: cuando se implemente, instanciar el proveedor real
 *   acá (misma interface). Por ahora caemos al mock con un aviso.
 */
function createAIService(): AIContentService {
  if (features.useRealAI) {
    console.warn(
      "[VendeMás] AI_PROVIDER=anthropic pero el proveedor real aún no está implementado. Usando mock."
    );
  }
  return new MockAIContentService();
}

export const aiService: AIContentService = createAIService();
