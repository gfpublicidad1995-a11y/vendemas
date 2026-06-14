import type { MetaPlacement } from "@/lib/validators/enums";
import {
  getSafeZoneForPlacement,
  placementPromptGuidance,
  humanPlacement,
} from "@/services/meta-creative-specs/metaCreativeSpecs";

export interface BrandStyle {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  visualStyle?: string | null;
  forbiddenWords?: string[];
}

/**
 * Construye prompts visuales profesionales por ubicación, aplicando zona segura,
 * buenas prácticas de Meta y estilo de marca. Funciones puras: reciben contexto,
 * no tocan la base. Listas para alimentar el VisualGenerationService.
 */
export class VisualPromptService {
  buildPlacementAwarePrompt(
    basePrompt: string,
    placement: MetaPlacement,
    brand?: BrandStyle
  ): string {
    let prompt = `${basePrompt} ${placementPromptGuidance(placement)}`;
    prompt = this.applyMetaBestPractices(prompt, placement);
    if (brand) prompt = this.applyBrandStyleToPrompt(prompt, brand);
    return prompt.trim();
  }

  createFeedAdPrompt(basePrompt: string, brand?: BrandStyle): string {
    return this.buildPlacementAwarePrompt(basePrompt, "INSTAGRAM_FEED", brand);
  }
  createStoryAdPrompt(basePrompt: string, brand?: BrandStyle): string {
    return this.buildPlacementAwarePrompt(basePrompt, "INSTAGRAM_STORIES", brand);
  }
  createReelAdPrompt(basePrompt: string, brand?: BrandStyle): string {
    return this.buildPlacementAwarePrompt(basePrompt, "INSTAGRAM_REELS", brand);
  }
  createMarketplaceAdPrompt(basePrompt: string, brand?: BrandStyle): string {
    return this.buildPlacementAwarePrompt(basePrompt, "FACEBOOK_MARKETPLACE", brand);
  }
  createCarouselPrompt(basePrompt: string, brand?: BrandStyle): string {
    return `${this.buildPlacementAwarePrompt(basePrompt, "INSTAGRAM_FEED", brand)} Mantener coherencia visual entre slides: misma paleta y composición, una idea por slide, slide final con CTA.`;
  }

  applySafeZoneInstructions(prompt: string, placement: MetaPlacement): string {
    const zone = getSafeZoneForPlacement(placement);
    if (!zone) return prompt;
    return `${prompt} Respetar zona segura de ${humanPlacement(placement)}: dejar libre ${zone.topPercent}% arriba, ${zone.bottomPercent}% abajo y ${zone.sidePercent}% a cada lado.`;
  }

  applyMetaBestPractices(prompt: string, placement: MetaPlacement): string {
    const withSafe = this.applySafeZoneInstructions(prompt, placement);
    return `${withSafe} Una sola idea principal, texto breve y legible, beneficio entendible en menos de 2 segundos, sin saturar de texto.`;
  }

  applyBrandStyleToPrompt(prompt: string, brand: BrandStyle): string {
    const parts: string[] = [prompt];
    if (brand.visualStyle) parts.push(`Estilo de marca: ${brand.visualStyle}.`);
    if (brand.primaryColor)
      parts.push(`Usar la paleta de marca (primario ${brand.primaryColor}${brand.secondaryColor ? `, secundario ${brand.secondaryColor}` : ""}).`);
    return parts.join(" ");
  }

  applyIndustryStyleToPrompt(prompt: string, industry: string): string {
    return `${prompt} Estética adecuada para el rubro ${industry}.`;
  }
}

export const visualPromptService = new VisualPromptService();
