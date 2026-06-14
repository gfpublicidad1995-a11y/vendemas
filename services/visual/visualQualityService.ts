export interface PromptQuality {
  score: number; // 0..1
  issues: string[];
  suggestions: string[];
}

/**
 * Calidad de prompts y creativos (heurísticas en el MVP).
 * Cuando haya generación real, se suman validaciones sobre la imagen producida.
 */
export class VisualQualityService {
  validatePromptQuality(prompt: string): PromptQuality {
    const issues: string[] = [];
    const suggestions: string[] = [];
    if (prompt.length < 40) {
      issues.push("Prompt muy corto.");
      suggestions.push("Agregá producto, beneficio y estilo visual.");
    }
    if (!/cta|whatsapp|consult|escrib|ped[ií]/i.test(prompt)) {
      suggestions.push("Considerá incluir un CTA claro.");
    }
    if (!/fondo|estilo|composici|luz|ilumina/i.test(prompt)) {
      suggestions.push("Indicá fondo/estilo/iluminación para mejor resultado.");
    }
    const score = Math.max(0, Math.min(1, 1 - issues.length * 0.3 - suggestions.length * 0.1));
    return { score, issues, suggestions };
  }

  checkBrandConsistency(creative: { prompt: string }, brand: { forbiddenWords?: string[] }): PromptQuality {
    const issues: string[] = [];
    for (const w of brand.forbiddenWords ?? []) {
      if (creative.prompt.toLowerCase().includes(w.toLowerCase())) {
        issues.push(`Contiene palabra prohibida por la marca: "${w}".`);
      }
    }
    return { score: issues.length ? 0.5 : 1, issues, suggestions: [] };
  }

  checkFormatCompatibility(creative: { width: number; height: number; aspectRatio: string }): PromptQuality {
    const issues: string[] = [];
    if (creative.width < 1080 || creative.height < 1080) {
      issues.push("Resolución por debajo del mínimo recomendado (1080px).");
    }
    return { score: issues.length ? 0.6 : 1, issues, suggestions: [] };
  }

  suggestVisualImprovements(prompt: string): string[] {
    return this.validatePromptQuality(prompt).suggestions;
  }

  detectMissingVisualElements(prompt: string): string[] {
    const missing: string[] = [];
    if (!/precio|\$/i.test(prompt)) missing.push("precio/oferta");
    if (!/logo/i.test(prompt)) missing.push("logo");
    if (!/cta|whatsapp/i.test(prompt)) missing.push("CTA");
    return missing;
  }
}

export const visualQualityService = new VisualQualityService();
