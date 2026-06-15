import { env } from "@/lib/config/env";
import { MockAIContentService } from "./mock";
import { AnthropicAIContentService } from "./anthropic";
import { GeminiAIContentService } from "./gemini";
import type { AIContentService } from "./types";

export * from "./types";

/**
 * Selector de proveedor de IA según AI_PROVIDER:
 * - mock (default): plantillas.
 * - anthropic + ANTHROPIC_API_KEY: Claude real.
 * - gemini + GEMINI_API_KEY: Google Gemini real (capa gratuita).
 * Si falta la key del proveedor elegido, cae al mock con un aviso.
 */
function createAIService(): AIContentService {
  if (env.AI_PROVIDER === "anthropic" && env.ANTHROPIC_API_KEY) {
    return new AnthropicAIContentService();
  }
  if (env.AI_PROVIDER === "gemini" && env.GEMINI_API_KEY) {
    return new GeminiAIContentService();
  }
  if (env.AI_PROVIDER !== "mock") {
    console.warn(`[VendeMás] AI_PROVIDER=${env.AI_PROVIDER} pero falta la API key. Usando mock.`);
  }
  return new MockAIContentService();
}

export const aiService: AIContentService = createAIService();
