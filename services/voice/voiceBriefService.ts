import { prisma } from "@/lib/prisma";
import { contentGenerationService } from "@/services/content/contentGenerationService";

export interface ExtractedBrief {
  producto?: string;
  oferta?: string;
  presupuesto?: string;
  objetivo?: string;
}

/**
 * Modo voz: recibe un audio, lo transcribe (mock) y arma un brief para generar
 * contenido. La transcripción real se conecta más adelante.
 */
export class VoiceBriefService {
  /** Transcripción mock (el proveedor real se enchufa después). */
  async transcribeAudio(_audioUrl: string): Promise<string> {
    return "Hola, quiero promocionar la sanitaria de 25 litros esta semana, tengo envío gratis en Florida, el presupuesto es como diez dólares por día.";
  }

  extractBriefFromTranscription(transcription: string): ExtractedBrief {
    const t = transcription.toLowerCase();
    const budgetMatch = t.match(/(\d+|diez|veinte|treinta)\s*(d[oó]lares|usd|pesos)[^.]*?(d[ií]a|diario)?/);
    const presupuesto = budgetMatch ? budgetMatch[0].trim() : undefined;
    return {
      producto: /sanitaria/.test(t) ? "Sanitaria 25L" : transcription.split(" ").slice(3, 8).join(" "),
      oferta: /env[ií]o gratis/.test(t) ? "Envío gratis" : undefined,
      presupuesto,
      objetivo: "Promoción de la semana",
    };
  }

  /** Crea (o usa) un VoiceBrief desde un audio y lo deja procesado. */
  async receiveVoiceMessage(businessProfileId: string, audioUrl: string) {
    const transcription = await this.transcribeAudio(audioUrl);
    const extractedBrief = this.extractBriefFromTranscription(transcription);
    return prisma.voiceBrief.create({
      data: {
        businessProfileId,
        audioUrl,
        transcription,
        extractedBrief: JSON.parse(JSON.stringify(extractedBrief)),
        status: "processed",
      },
    });
  }

  async createContentOrderFromVoiceBrief(voiceBriefId: string) {
    const vb = await prisma.voiceBrief.findUnique({ where: { id: voiceBriefId } });
    if (!vb) throw new Error("VoiceBrief no encontrado");
    const brief = (vb.extractedBrief ?? {}) as ExtractedBrief;
    const order = await prisma.contentOrder.create({
      data: {
        businessProfileId: vb.businessProfileId,
        type: "quick_campaign",
        status: "ready_to_generate",
        objective: brief.objetivo ?? "Promoción de la semana",
        offer: brief.oferta ?? null,
        productOrService: brief.producto ?? null,
        notes: brief.presupuesto ? `Presupuesto: ${brief.presupuesto}` : null,
      },
    });
    return contentGenerationService.generateForOrder(order.id);
  }
}

export const voiceBriefService = new VoiceBriefService();
