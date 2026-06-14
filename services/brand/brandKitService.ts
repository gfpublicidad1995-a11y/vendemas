import { prisma } from "@/lib/prisma";
import { asStringArray } from "@/lib/json";

export interface BrandGuidelines {
  toneOfVoice: string;
  visualStyle: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  preferredWords: string[];
  forbiddenWords: string[];
}

/**
 * Gestión del Brand Kit y aplicación del tono/estilo de marca a copies y prompts.
 */
export class BrandKitService {
  async getBrandGuidelines(businessProfileId: string): Promise<BrandGuidelines | null> {
    const kit = await prisma.brandKit.findUnique({ where: { businessProfileId } });
    const business = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      select: { toneOfVoice: true },
    });
    if (!kit && !business) return null;
    return {
      toneOfVoice: kit?.toneOfVoice ?? business?.toneOfVoice ?? "Cercano, simple y vendedor",
      visualStyle: kit?.visualStyle ?? "Limpio y comercial",
      primaryColor: kit?.primaryColor,
      secondaryColor: kit?.secondaryColor,
      preferredWords: asStringArray(kit?.preferredWords),
      forbiddenWords: asStringArray(kit?.forbiddenWords),
    };
  }

  /** Quita palabras prohibidas del copy. */
  applyBrandToneToCopy(copy: string, guidelines: BrandGuidelines): string {
    let result = copy;
    for (const w of guidelines.forbiddenWords) {
      result = result.replace(new RegExp(`\\b${escapeRegExp(w)}\\b`, "gi"), "").replace(/\s{2,}/g, " ");
    }
    return result.trim();
  }

  async createBrandKitFromBusinessProfile(businessProfileId: string) {
    const business = await prisma.businessProfile.findUnique({ where: { id: businessProfileId } });
    if (!business) throw new Error("Negocio no encontrado");
    return prisma.brandKit.upsert({
      where: { businessProfileId },
      update: {},
      create: {
        businessProfileId,
        toneOfVoice: business.toneOfVoice ?? "Cercano, simple y vendedor",
        visualStyle: "Limpio y comercial",
      },
    });
  }

  async suggestBrandImprovements(businessProfileId: string): Promise<string[]> {
    const kit = await prisma.brandKit.findUnique({ where: { businessProfileId } });
    const tips: string[] = [];
    if (!kit) return ["Crear un Brand Kit con logo, colores y tono de voz."];
    if (!kit.logoUrl) tips.push("Subí un logo para reforzar la marca en cada pieza.");
    if (!kit.primaryColor) tips.push("Definí un color primario de marca.");
    if (asStringArray(kit.exampleCaptions).length === 0)
      tips.push("Agregá captions de ejemplo para afinar el tono.");
    if (tips.length === 0) tips.push("Tu Brand Kit está completo 👌");
    return tips;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const brandKitService = new BrandKitService();
