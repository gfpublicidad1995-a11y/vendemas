import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/config/env";
import { MockAIContentService } from "./mock";
import type {
  AIContentService,
  AdsPackResult,
  AngledAd,
  BusinessContext,
  CarouselResult,
  ContentBrief,
  DigestIdeas,
  QuickCampaignResult,
  VideoScriptResult,
} from "./types";

// Modelo por defecto: el más capaz. Configurable por env para bajar costo/latencia
// (p. ej. AI_MODEL=claude-sonnet-4-6 para alto volumen, o claude-haiku-4-5).
const MODEL = process.env.AI_MODEL || "claude-opus-4-8";

const SYSTEM = `Sos el mejor redactor publicitario de una agencia de marketing por WhatsApp para PyMEs de Latinoamérica (Uruguay / Río de la Plata). Escribís copy que VENDE, en español rioplatense natural (de "vos", no "tú"), cálido, claro y directo, sin sonar a robot ni a "IA".

Cómo trabajás:
- Súper específico al producto y la oferta del negocio. Nada genérico ni de relleno.
- Marketing de verdad: hablás al deseo y al dolor real del cliente, beneficios antes que características, una sola idea por pieza, y un CTA claro a escribir por WhatsApp.
- Tenés en cuenta el nivel de consciencia del mercado (si no conoce el problema, si compara, si ya decide).
- Respetás el tono y las palabras de la marca; NUNCA usás las palabras prohibidas.
- Cero clichés de IA ("desbloqueá tu potencial", "en el mundo de hoy", "eleva tu…", signos y emojis de más). Suena a persona real.
- Devolvés SIEMPRE JSON válido según el esquema pedido, sin texto extra.`;

type Schema = Record<string, unknown>;
const obj = (properties: Schema, required: string[]): Schema => ({
  type: "object",
  additionalProperties: false,
  properties,
  required,
});
const strArr = { type: "array", items: { type: "string" } };

export class AnthropicAIContentService implements AIContentService {
  readonly provider = "anthropic" as const;
  private client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  private fallback = new MockAIContentService();

  private ctxLines(ctx: BusinessContext, brief?: ContentBrief): string {
    return [
      `Negocio: ${ctx.businessName}`,
      `Rubro: ${ctx.category}`,
      ctx.city ? `Ciudad: ${ctx.city}` : null,
      ctx.targetAudience ? `Público objetivo: ${ctx.targetAudience}` : null,
      ctx.toneOfVoice ? `Tono de voz: ${ctx.toneOfVoice}` : null,
      ctx.mainOffer ? `Oferta principal: ${ctx.mainOffer}` : null,
      ctx.preferredWords?.length ? `Palabras preferidas: ${ctx.preferredWords.join(", ")}` : null,
      ctx.forbiddenWords?.length ? `Palabras PROHIBIDAS: ${ctx.forbiddenWords.join(", ")}` : null,
      brief?.productOrService ? `Producto/servicio a promocionar: ${brief.productOrService}` : null,
      brief?.offer ? `Oferta o promo concreta: ${brief.offer}` : null,
      brief?.objective ? `Objetivo: ${brief.objective}` : null,
      brief?.budget ? `Presupuesto: ${brief.budget}` : null,
      brief?.notes ? `Notas: ${brief.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  private async json<T>(schema: Schema, instruction: string, context: string): Promise<T> {
    const res = await this.client.messages.create({
      model: MODEL,
      max_tokens: 6000,
      system: SYSTEM,
      messages: [{ role: "user", content: `Contexto del negocio:\n${context}\n\nTarea:\n${instruction}` }],
      output_config: { format: { type: "json_schema", schema } },
    });
    const block = res.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("Respuesta sin texto");
    return JSON.parse(block.text) as T;
  }

  private async text(instruction: string, context: string, maxTokens = 1200): Promise<string> {
    const res = await this.client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: SYSTEM,
      messages: [{ role: "user", content: `Contexto del negocio:\n${context}\n\nTarea:\n${instruction}\n\nRespondé solo con el texto pedido, sin comillas ni encabezados.` }],
    });
    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : "";
  }

  async generateAdCopies(ctx: BusinessContext, brief: ContentBrief): Promise<AdsPackResult> {
    try {
      return await this.json<AdsPackResult>(
        obj(
          {
            primaryTexts: strArr,
            headlines: strArr,
            descriptions: strArr,
            imageIdeas: strArr,
            campaignStructure: { type: "string" },
            audienceRecommendation: { type: "string" },
            budgetRecommendation: { type: "string" },
            cta: { type: "string" },
          },
          ["primaryTexts", "headlines", "descriptions", "imageIdeas", "campaignStructure", "audienceRecommendation", "budgetRecommendation", "cta"],
        ),
        "Creá un pack de anuncios para Meta (Facebook/Instagram) que dirijan a conversar por WhatsApp. Devolvé: 5 'primaryTexts' (textos principales, variados en ángulo: directo, emocional, urgencia, prueba social, beneficio), 5 'headlines' (titulares cortos), 3 'descriptions', 3 'imageIdeas' (ideas de imagen concretas con el producto), 'campaignStructure' (1 párrafo), 'audienceRecommendation' (público y zona), 'budgetRecommendation' (según presupuesto si lo hay) y 'cta'.",
        this.ctxLines(ctx, brief),
      );
    } catch (e) {
      console.error("[AI] generateAdCopies →", e);
      return this.fallback.generateAdCopies(ctx, brief);
    }
  }

  async generateAngledAds(ctx: BusinessContext, brief: ContentBrief, hooks: string[] = []): Promise<AngledAd[]> {
    try {
      const out = await this.json<{ ads: AngledAd[] }>(
        obj(
          {
            ads: {
              type: "array",
              items: obj(
                {
                  angle: { type: "string", enum: ["directa", "emocional", "urgencia", "prueba_social"] },
                  angleLabel: { type: "string" },
                  primaryText: { type: "string" },
                  headline: { type: "string" },
                  visualAngle: { type: "string" },
                },
                ["angle", "angleLabel", "primaryText", "headline", "visualAngle"],
              ),
            },
          },
          ["ads"],
        ),
        `Creá 4 anuncios, uno por cada ángulo: "directa", "emocional", "urgencia" y "prueba_social". Para cada uno: 'angleLabel' (etiqueta linda en español), 'primaryText' (texto del anuncio), 'headline' (titular corto) y 'visualAngle' (cómo debería verse la imagen). ${hooks.length ? `Inspirate en estos hooks de la estrategia si sirven: ${hooks.join(" | ")}.` : ""}`,
        this.ctxLines(ctx, brief),
      );
      return out.ads;
    } catch (e) {
      console.error("[AI] generateAngledAds →", e);
      return this.fallback.generateAngledAds(ctx, brief, hooks);
    }
  }

  async generateCarousel(ctx: BusinessContext, brief: ContentBrief): Promise<CarouselResult> {
    try {
      return await this.json<CarouselResult>(
        obj(
          { title: { type: "string" }, slides: strArr, caption: { type: "string" }, cta: { type: "string" } },
          ["title", "slides", "caption", "cta"],
        ),
        "Creá un carrusel de Instagram de 5 slides para este producto. Devolvé 'title', 'slides' (5 textos, uno por slide: portada con gancho, beneficios, cómo se usa/qué incluye, prueba social, y cierre con CTA), 'caption' (epígrafe) y 'cta'.",
        this.ctxLines(ctx, brief),
      );
    } catch (e) {
      console.error("[AI] generateCarousel →", e);
      return this.fallback.generateCarousel(ctx, brief);
    }
  }

  async generateVideoScript(ctx: BusinessContext, brief: ContentBrief): Promise<VideoScriptResult> {
    try {
      return await this.json<VideoScriptResult>(
        obj(
          { hook: { type: "string" }, body: { type: "string" }, close: { type: "string" }, cta: { type: "string" }, visualNotes: { type: "string" }, estimatedDuration: { type: "string" } },
          ["hook", "body", "close", "cta", "visualNotes", "estimatedDuration"],
        ),
        "Escribí un guion de reel vertical (9:16) de 15-25 segundos. Devolvé 'hook' (primeros 2 segundos que frenan el scroll), 'body' (desarrollo), 'close' (cierre), 'cta', 'visualNotes' (indicaciones de cámara/texto en pantalla) y 'estimatedDuration'.",
        this.ctxLines(ctx, brief),
      );
    } catch (e) {
      console.error("[AI] generateVideoScript →", e);
      return this.fallback.generateVideoScript(ctx, brief);
    }
  }

  async generateQuickCampaign(ctx: BusinessContext, brief: ContentBrief): Promise<QuickCampaignResult> {
    try {
      return await this.json<QuickCampaignResult>(
        obj(
          {
            stories: strArr,
            carousel: obj({ title: { type: "string" }, slides: strArr, caption: { type: "string" }, cta: { type: "string" } }, ["title", "slides", "caption", "cta"]),
            ads: { type: "array", items: obj({ primaryText: { type: "string" }, headline: { type: "string" } }, ["primaryText", "headline"]) },
            copies: strArr,
            headlines: strArr,
            reelScript: obj({ hook: { type: "string" }, body: { type: "string" }, close: { type: "string" }, cta: { type: "string" }, visualNotes: { type: "string" }, estimatedDuration: { type: "string" } }, ["hook", "body", "close", "cta", "visualNotes", "estimatedDuration"]),
            campaignStructure: { type: "string" },
            audienceRecommendation: { type: "string" },
            budgetRecommendation: { type: "string" },
          },
          ["stories", "carousel", "ads", "copies", "headlines", "reelScript", "campaignStructure", "audienceRecommendation", "budgetRecommendation"],
        ),
        "Armá una Campaña Rápida COMPLETA para vender este producto esta semana. Devolvé: 'stories' (3 ideas de historias de Instagram), 'carousel' (title, 5 slides, caption, cta), 'ads' (2 anuncios con primaryText y headline), 'copies' (5 textos cortos para postear), 'headlines' (5 titulares), 'reelScript' (guion de reel: hook, body, close, cta, visualNotes, estimatedDuration), 'campaignStructure' (1 párrafo), 'audienceRecommendation' y 'budgetRecommendation'. Todo coherente entre sí y específico al producto.",
        this.ctxLines(ctx, brief),
      );
    } catch (e) {
      console.error("[AI] generateQuickCampaign →", e);
      return this.fallback.generateQuickCampaign(ctx, brief);
    }
  }

  async generateDailyDigestIdeas(ctx: BusinessContext, topQuestions: string[], topObjections: string[]): Promise<DigestIdeas> {
    try {
      return await this.json<DigestIdeas>(
        obj({ contentIdeas: strArr, campaignIdeas: strArr, recommendedAction: { type: "string" } }, ["contentIdeas", "campaignIdeas", "recommendedAction"]),
        `Basándote en lo que más preguntan y objetan los clientes, dame ideas para mañana. Preguntas frecuentes: ${topQuestions.join("; ") || "—"}. Objeciones: ${topObjections.join("; ") || "—"}. Devolvé 'contentIdeas' (3), 'campaignIdeas' (1-2) y 'recommendedAction' (la acción #1 concreta para mañana).`,
        this.ctxLines(ctx),
      );
    } catch (e) {
      console.error("[AI] generateDailyDigestIdeas →", e);
      return this.fallback.generateDailyDigestIdeas(ctx, topQuestions, topObjections);
    }
  }

  async generateWhatsAppReplies(ctx: BusinessContext, customerMessage: string): Promise<string[]> {
    try {
      const out = await this.json<{ replies: string[] }>(
        obj({ replies: strArr }, ["replies"]),
        `Un cliente escribió por WhatsApp: "${customerMessage}". Dame 2 respuestas sugeridas, cálidas y vendedoras, listas para enviar (sin sonar a guion).`,
        this.ctxLines(ctx),
      );
      return out.replies;
    } catch (e) {
      console.error("[AI] generateWhatsAppReplies →", e);
      return this.fallback.generateWhatsAppReplies(ctx, customerMessage);
    }
  }

  async generateCampaignStrategy(ctx: BusinessContext, brief: ContentBrief): Promise<string> {
    try {
      return await this.text(
        "Escribí en 2-3 frases la estrategia de campaña de Meta Ads recomendada (objetivo, a quién y con qué foco).",
        this.ctxLines(ctx, brief),
      );
    } catch (e) {
      console.error("[AI] generateCampaignStrategy →", e);
      return this.fallback.generateCampaignStrategy(ctx, brief);
    }
  }

  async generateBrandTone(ctx: BusinessContext): Promise<string> {
    try {
      return await this.text("Describí en 1-2 frases el tono de voz de marca recomendado para este negocio.", this.ctxLines(ctx));
    } catch (e) {
      console.error("[AI] generateBrandTone →", e);
      return this.fallback.generateBrandTone(ctx);
    }
  }

  async analyzeBusinessProfile(ctx: BusinessContext): Promise<string> {
    try {
      return await this.text("Hacé un mini-análisis (2-3 frases) del negocio: a quién le vende, su oferta fuerte y qué conviene destacar.", this.ctxLines(ctx));
    } catch (e) {
      console.error("[AI] analyzeBusinessProfile →", e);
      return this.fallback.analyzeBusinessProfile(ctx);
    }
  }

  async generateRevision(original: string, instruction: string): Promise<string> {
    try {
      return await this.text(
        `Reescribí este texto según el pedido. Texto original: "${original}". Pedido del cliente: "${instruction}". Mantené el sentido y mejoralo según lo pedido.`,
        "Ajuste de un texto ya entregado.",
      );
    } catch (e) {
      console.error("[AI] generateRevision →", e);
      return this.fallback.generateRevision(original, instruction);
    }
  }

  async generateVisualPromptBase(ctx: BusinessContext, subject: string): Promise<string> {
    try {
      return await this.text(
        `Escribí un prompt de imagen comercial (en español) para una foto de "${subject}". Producto protagonista, fondo prolijo, estética acorde al rubro y la marca, iluminación natural.`,
        this.ctxLines(ctx),
      );
    } catch (e) {
      console.error("[AI] generateVisualPromptBase →", e);
      return this.fallback.generateVisualPromptBase(ctx, subject);
    }
  }
}
