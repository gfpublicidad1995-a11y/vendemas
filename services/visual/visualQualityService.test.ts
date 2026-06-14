import { describe, it, expect } from "vitest";
import { visualQualityService } from "@/services/visual/visualQualityService";

describe("VisualQualityService", () => {
  it("marca prompts muy cortos con issues y baja el score", () => {
    const q = visualQualityService.validatePromptQuality("foto");
    expect(q.issues.length).toBeGreaterThan(0);
    expect(q.score).toBeLessThan(1);
  });

  it("un prompt completo (fondo + CTA + estilo) puntúa mejor", () => {
    const good = visualQualityService.validatePromptQuality(
      "Foto comercial del producto sobre fondo limpio, iluminación natural, CTA claro a WhatsApp, estilo moderno"
    );
    expect(good.score).toBeGreaterThan(0.5);
  });

  it("detecta elementos visuales faltantes", () => {
    const missing = visualQualityService.detectMissingVisualElements("una foto linda");
    expect(missing).toContain("CTA");
  });
});
