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

// Modelo Gemini por defecto (capa gratuita). Configurable por env.
const MODEL = process.env.AI_MODEL || "gemini-2.5-flash";
const ENDPOINT = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

const SYSTEM = `Sos el mejor redactor publicitario de una agencia de marketing por WhatsApp para PyMEs de Latinoamérica (Uruguay / Río de la Plata). Escribís copy que VENDE, en español rioplatense natural (de "vos", no "tú"), cálido, claro y directo, sin sonar a robot ni a "IA".

Cómo trabajás:
- Súper específico al producto y la oferta del negocio. Nada genérico ni de relleno.
- Marketing de verdad: hablás al deseo y al dolor real del cliente, beneficios antes que características, una sola idea por pieza, y un CTA claro a escribir por WhatsApp.
- Tenés en cuenta el nivel de consciencia del mercado (si no conoce el problema, si compara, si ya decide).
- Respetás el tono y las palabras de la marca; NUNCA usás las palabras prohibidas.
- Cero clichés de IA ("desbloqueá tu potencial", "en el mundo de hoy", "eleva tu…", signos y emojis de más). Suena a persona real.`;

// Esquemas estilo Gemini (Type enum en mayúsculas).
type GSchema = Record<string, unknown>;
const gobj = (properties: GSchema, required: string[]): GSchema => ({ type: "OBJECT", properties, required });
const GSTR = { type: "STRING" };
const GSTRARR = { type: "ARRAY", items: { type: "STRING" } };

export class GeminiAIContentService implements AIContentService {
  readonly provider = "gemini" as const;
  private fallback = new MockAIContentService();

  private ctxLines(ctx: BusinessContext, brief?: ContentBrief): string {
    return [
      `Negocio: ${ctx.businessName}`,
      `Rubro: ${ctx.category}`,
      ctx.city ? `Ciudad: ${ctx.city}` : null,
      ctx.targetAudience ? `Público objetivo: ${ctx.targetAudience}` : null,
      ctx.toneOfVoice ? `Tono de voz: ${ctx.toneOfVoice}` : null,
      ctx.mainOffer ? `Oferta principal: ${ctx.mainOffer}` : null,
      ctx.description ? `Sobre la marca (contexto, problema, diferenciales, objeciones): ${ctx.description}` : null,
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

  private async call(prompt: string, schema?: GSchema): Promise<string> {
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 6000,
        ...(schema ? { responseMimeType: "application/json", responseSchema: schema } : {}),
      },
    };
    const res = await fetch(ENDPOINT(MODEL, env.GEMINI_API_KEY), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    if (!text) throw new Error("Gemini: respuesta vacía");
    return text;
  }

  private async json<T>(schema: GSchema, instruction: string, context: string): Promise<T> {
    const text = await this.call(`Contexto del negocio:\n${context}\n\nTarea:\n${instruction}`, schema);
    return JSON.parse(text) as T;
  }

  private async text(instruction: string, context: string): Promise<string> {
    const text = await this.call(
      `Contexto del negocio:\n${context}\n\nTarea:\n${instruction}\n\nRespondé solo con el texto pedido, sin comillas ni encabezados.`,
    );
    return text.trim();
  }

  async generateAdCopies(ctx: BusinessContext, brief: ContentBrief): Promise<AdsPackResult> {
    try {
      return await this.json<AdsPackResult>(
        gobj(
          {
            primaryTexts: GSTRARR,
            headlines: GSTRARR,
            descriptions: GSTRARR,
            imageIdeas: GSTRARR,
            campaignStructure: GSTR,
            audienceRecommendation: GSTR,
            budgetRecommendation: GSTR,
            cta: GSTR,
          },
          ["primaryTexts", "headlines", "descriptions", "imageIdeas", "campaignStructure", "audienceRecommendation", "budgetRecommendation", "cta"],
        ),
        "Creá un pack de anuncios para Meta que lleven a conversar por WhatsApp. Devolvé: 5 'primaryTexts' (variados en ángulo: directo, emocional, urgencia, prueba social, beneficio), 5 'headlines' cortos, 3 'descriptions', 3 'imageIdeas' concretas con el producto, 'campaignStructure' (1 párrafo), 'audienceRecommendation', 'budgetRecommendation' y 'cta'.",
        this.ctxLines(ctx, brief),
      );
    } catch (e) {
      console.error("[AI/gemini] generateAdCopies →", e);
      return this.fallback.generateAdCopies(ctx, brief);
    }
  }

  async generateAngledAds(ctx: BusinessContext, brief: ContentBrief, hooks: string[] = []): Promise<AngledAd[]> {
    try {
      const out = await this.json<{ ads: AngledAd[] }>(
        gobj(
          {
            ads: {
              type: "ARRAY",
              items: gobj(
                {
                  angle: { type: "STRING", enum: ["directa", "emocional", "urgencia", "prueba_social"] },
                  angleLabel: GSTR,
                  primaryText: GSTR,
                  headline: GSTR,
                  visualAngle: GSTR,
                },
                ["angle", "angleLabel", "primaryText", "headline", "visualAngle"],
              ),
            },
          },
          ["ads"],
        ),
        `Creá 4 anuncios, uno por cada ángulo: "directa", "emocional", "urgencia" y "prueba_social". Para cada uno: 'angleLabel' (etiqueta linda en español), 'primaryText', 'headline' y 'visualAngle' (cómo debería verse la imagen). ${hooks.length ? `Inspirate en estos hooks si sirven: ${hooks.join(" | ")}.` : ""}`,
        this.ctxLines(ctx, brief),
      );
      return out.ads;
    } catch (e) {
      console.error("[AI/gemini] generateAngledAds →", e);
      return this.fallback.generateAngledAds(ctx, brief, hooks);
    }
  }

  async generateCarousel(ctx: BusinessContext, brief: ContentBrief): Promise<CarouselResult> {
    try {
      return await this.json<CarouselResult>(
        gobj({ title: GSTR, slides: GSTRARR, caption: GSTR, cta: GSTR }, ["title", "slides", "caption", "cta"]),
        "Creá un carrusel de Instagram de 5 slides. Devolvé 'title', 'slides' (5: portada con gancho, beneficios, cómo se usa/qué incluye, prueba social, cierre con CTA), 'caption' y 'cta'.",
        this.ctxLines(ctx, brief),
      );
    } catch (e) {
      console.error("[AI/gemini] generateCarousel →", e);
      return this.fallback.generateCarousel(ctx, brief);
    }
  }

  async generateVideoScript(ctx: BusinessContext, brief: ContentBrief): Promise<VideoScriptResult> {
    try {
      return await this.json<VideoScriptResult>(
        gobj({ hook: GSTR, body: GSTR, close: GSTR, cta: GSTR, visualNotes: GSTR, estimatedDuration: GSTR }, ["hook", "body", "close", "cta", "visualNotes", "estimatedDuration"]),
        "Escribí un guion de reel vertical (9:16) de 15-25s. Devolvé 'hook' (primeros 2s que frenan el scroll), 'body', 'close', 'cta', 'visualNotes' y 'estimatedDuration'.",
        this.ctxLines(ctx, brief),
      );
    } catch (e) {
      console.error("[AI/gemini] generateVideoScript →", e);
      return this.fallback.generateVideoScript(ctx, brief);
    }
  }

  async generateQuickCampaign(ctx: BusinessContext, brief: ContentBrief): Promise<QuickCampaignResult> {
    try {
      return await this.json<QuickCampaignResult>(
        gobj(
          {
            stories: GSTRARR,
            carousel: gobj({ title: GSTR, slides: GSTRARR, caption: GSTR, cta: GSTR }, ["title", "slides", "caption", "cta"]),
            ads: { type: "ARRAY", items: gobj({ primaryText: GSTR, headline: GSTR }, ["primaryText", "headline"]) },
            copies: GSTRARR,
            headlines: GSTRARR,
            reelScript: gobj({ hook: GSTR, body: GSTR, close: GSTR, cta: GSTR, visualNotes: GSTR, estimatedDuration: GSTR }, ["hook", "body", "close", "cta", "visualNotes", "estimatedDuration"]),
            campaignStructure: GSTR,
            audienceRecommendation: GSTR,
            budgetRecommendation: GSTR,
          },
          ["stories", "carousel", "ads", "copies", "headlines", "reelScript", "campaignStructure", "audienceRecommendation", "budgetRecommendation"],
        ),
        "Armá una Campaña Rápida COMPLETA para vender este producto esta semana. Devolvé: 'stories' (3), 'carousel' (title, 5 slides, caption, cta), 'ads' (2 con primaryText y headline), 'copies' (5 textos cortos), 'headlines' (5), 'reelScript' (hook, body, close, cta, visualNotes, estimatedDuration), 'campaignStructure', 'audienceRecommendation' y 'budgetRecommendation'. Todo coherente y específico al producto.",
        this.ctxLines(ctx, brief),
      );
    } catch (e) {
      console.error("[AI/gemini] generateQuickCampaign →", e);
      return this.fallback.generateQuickCampaign(ctx, brief);
    }
  }

  async generateDailyDigestIdeas(ctx: BusinessContext, topQuestions: string[], topObjections: string[]): Promise<DigestIdeas> {
    try {
      return await this.json<DigestIdeas>(
        gobj({ contentIdeas: GSTRARR, campaignIdeas: GSTRARR, recommendedAction: GSTR }, ["contentIdeas", "campaignIdeas", "recommendedAction"]),
        `Ideas para mañana según lo que más preguntan/objetan. Preguntas: ${topQuestions.join("; ") || "—"}. Objeciones: ${topObjections.join("; ") || "—"}. Devolvé 'contentIdeas' (3), 'campaignIdeas' (1-2) y 'recommendedAction' (la acción #1 concreta).`,
        this.ctxLines(ctx),
      );
    } catch (e) {
      console.error("[AI/gemini] generateDailyDigestIdeas →", e);
      return this.fallback.generateDailyDigestIdeas(ctx, topQuestions, topObjections);
    }
  }

  async generateWhatsAppReplies(ctx: BusinessContext, customerMessage: string): Promise<string[]> {
    try {
      const out = await this.json<{ replies: string[] }>(
        gobj({ replies: GSTRARR }, ["replies"]),
        `Un cliente escribió por WhatsApp: "${customerMessage}". Dame 2 respuestas sugeridas, cálidas y vendedoras, listas para enviar.`,
        this.ctxLines(ctx),
      );
      return out.replies;
    } catch (e) {
      console.error("[AI/gemini] generateWhatsAppReplies →", e);
      return this.fallback.generateWhatsAppReplies(ctx, customerMessage);
    }
  }

  async generateCampaignStrategy(ctx: BusinessContext, brief: ContentBrief): Promise<string> {
    try {
      return await this.text("Escribí en 2-3 frases la estrategia de campaña de Meta Ads recomendada (objetivo, a quién y con qué foco).", this.ctxLines(ctx, brief));
    } catch (e) {
      console.error("[AI/gemini] generateCampaignStrategy →", e);
      return this.fallback.generateCampaignStrategy(ctx, brief);
    }
  }

  async generateBrandTone(ctx: BusinessContext): Promise<string> {
    try {
      return await this.text("Describí en 1-2 frases el tono de voz de marca recomendado.", this.ctxLines(ctx));
    } catch (e) {
      console.error("[AI/gemini] generateBrandTone →", e);
      return this.fallback.generateBrandTone(ctx);
    }
  }

  async analyzeBusinessProfile(ctx: BusinessContext): Promise<string> {
    try {
      return await this.text("Mini-análisis (2-3 frases): a quién le vende, su oferta fuerte y qué conviene destacar.", this.ctxLines(ctx));
    } catch (e) {
      console.error("[AI/gemini] analyzeBusinessProfile →", e);
      return this.fallback.analyzeBusinessProfile(ctx);
    }
  }

  async generateRevision(original: string, instruction: string): Promise<string> {
    try {
      return await this.text(
        `Reescribí este texto según el pedido. Original: "${original}". Pedido: "${instruction}". Mantené el sentido y mejoralo.`,
        "Ajuste de un texto ya entregado.",
      );
    } catch (e) {
      console.error("[AI/gemini] generateRevision →", e);
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
      console.error("[AI/gemini] generateVisualPromptBase →", e);
      return this.fallback.generateVisualPromptBase(ctx, subject);
    }
  }
}
