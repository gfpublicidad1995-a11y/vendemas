import { prisma } from "@/lib/prisma";
import { asStringArray } from "@/lib/json";

/**
 * Biblioteca por rubro. Devuelve ángulos, FAQs, objeciones, estilos visuales y
 * objetivos de campaña según la industria. Usa el IndustryPlaybook de la base y
 * cae a valores por defecto si el rubro no tiene playbook cargado.
 */

const DEFAULTS = {
  contentAngles: [
    "Resolver dudas frecuentes antes de comprar",
    "Mostrar el producto/servicio en uso real",
    "Prueba social de clientes",
    "Oferta o beneficio por tiempo limitado",
  ],
  faqs: ["¿Cuánto sale?", "¿Hacen envíos?", "¿Qué formas de pago aceptan?", "¿Tienen stock?"],
  campaignObjectives: ["Mensajes a WhatsApp", "Ventas", "Alcance local"],
  visualStyles: ["Limpio y comercial", "Producto protagonista", "Colores de marca"],
};

export class IndustryPlaybookService {
  async getPlaybookForBusiness(businessProfileId: string) {
    const b = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      select: { category: true },
    });
    if (!b) return null;
    return this.getPlaybookByIndustry(b.category);
  }

  getPlaybookByIndustry(industry: string) {
    return prisma.industryPlaybook.findFirst({ where: { industry } });
  }

  async suggestContentAngles(industry: string): Promise<string[]> {
    const p = await this.getPlaybookByIndustry(industry);
    const angles = asStringArray(p?.bestContentAngles);
    return angles.length ? angles : DEFAULTS.contentAngles;
  }

  async suggestFAQs(industry: string): Promise<string[]> {
    const p = await this.getPlaybookByIndustry(industry);
    const faqs = asStringArray(p?.commonQuestions);
    return faqs.length ? faqs : DEFAULTS.faqs;
  }

  async suggestObjectionResponses(industry: string): Promise<string[]> {
    const p = await this.getPlaybookByIndustry(industry);
    return asStringArray(p?.commonObjections);
  }

  async suggestVisualStyles(industry: string): Promise<string[]> {
    return DEFAULTS.visualStyles;
  }

  async suggestCampaignStrategy(industry: string): Promise<string[]> {
    const p = await this.getPlaybookByIndustry(industry);
    const objs = asStringArray(p?.bestCampaignObjectives);
    return objs.length ? objs : DEFAULTS.campaignObjectives;
  }
}

export const industryPlaybookService = new IndustryPlaybookService();
