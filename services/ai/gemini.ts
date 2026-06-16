import { env } from "@/lib/config/env";
import { MockAIContentService } from "./mock";
import type {
  AIContentService,
  AdsPackResult,
  AngledAd,
  BusinessContext,
  CarouselResult,
  ChatReplyResult,
  ChatTurn,
  ContentBrief,
  DigestIdeas,
  QuickCampaignResult,
  StrategyBrain,
  StrategyBrainSignals,
  VideoScriptResult,
} from "./types";

// Modelo Gemini por defecto (capa gratuita). Configurable por env.
const MODEL = process.env.AI_MODEL || "gemini-2.5-flash";
const ENDPOINT = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const RETRY_WAITS = [1500, 4000, 9000];

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

  private async call(prompt: string, schema?: GSchema, maxTokens = 6000, attempt = 0): Promise<string> {
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        // gemini-2.5-flash "piensa" y esos tokens cuentan acá; dejamos margen
        // para que el JSON no se trunque (sobre todo en esquemas grandes).
        maxOutputTokens: maxTokens,
        ...(schema ? { responseMimeType: "application/json", responseSchema: schema } : {}),
      },
    };
    const res = await fetch(ENDPOINT(MODEL, env.GEMINI_API_KEY), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    // Reintentos con backoff ante límite de tasa (429) o saturación (503).
    if ((res.status === 429 || res.status === 503) && attempt < RETRY_WAITS.length) {
      await sleep(RETRY_WAITS[attempt]);
      return this.call(prompt, schema, maxTokens, attempt + 1);
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    if (!text) throw new Error("Gemini: respuesta vacía");
    return text;
  }

  private async json<T>(schema: GSchema, instruction: string, context: string, maxTokens = 6000): Promise<T> {
    const text = await this.call(`Contexto del negocio:\n${context}\n\nTarea:\n${instruction}`, schema, maxTokens);
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

  async chatReply(
    ctx: BusinessContext | null,
    history: ChatTurn[],
    draft: Record<string, string>,
  ): Promise<ChatReplyResult> {
    try {
      const histText = history
        .map((m) => `${m.from === "user" ? "Cliente" : "VendeMás"}: ${m.text}`)
        .join("\n");
      const draftText =
        Object.entries(draft)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" · ") || "todavía nada";
      const context = ctx ? this.ctxLines(ctx) : "Negocio nuevo (todavía sin datos cargados).";
      return await this.json<ChatReplyResult>(
        gobj(
          {
            reply: GSTR,
            extracted: gobj(
              {
                businessName: GSTR,
                category: GSTR,
                product: GSTR,
                offer: GSTR,
                budget: GSTR,
                description: GSTR,
                targetAudience: GSTR,
                problem: GSTR,
                differentiators: GSTR,
                objections: GSTR,
              },
              [],
            ),
            readyToGenerate: { type: "BOOLEAN" },
          },
          ["reply", "extracted", "readyToGenerate"],
        ),
        `Sos el asistente de WhatsApp de VendeMás: un consultor de marketing cálido y canchero que GUÍA al emprendedor paso a paso para armarle una estrategia y contenido a la medida de SU negocio. Respondé natural y breve (estilo WhatsApp) a lo ÚLTIMO que escribió, y andá juntando —UNA pregunta por vez, sin abrumar— lo que hace falta para una buena estrategia:
1. Qué vende / su negocio.
2. A quién le vende (su cliente ideal).
3. Qué lo hace diferente / por qué lo eligen.
4. Qué suele frenar a la gente antes de comprarle (objeciones).
5. Su oferta o precio concreto.
6. Cuánto puede invertir por día.
Que se sienta una charla, no un formulario: reaccioná a lo que dice, mostrá que entendés su rubro, y si no sabe algo, seguí sin trabarte. Si te pregunta algo, respondéselo.
En 'extracted' poné SOLO lo que el cliente YA dijo (no inventes; vacío lo que no dijo): businessName, category, product, offer, budget, targetAudience, problem, differentiators, objections, y en 'description' un resumen de 1-2 frases del negocio.
Poné readyToGenerate=true cuando ya tengas lo esencial: producto + a quién le vende + (precio u oferta) + presupuesto. El problema, los diferenciales y las objeciones suman muchísimo a la estrategia: tratá de obtenerlos antes de generar, pero si el cliente no los sabe, no bloquees.\n\nConversación hasta ahora:\n${histText}\n\nDatos ya recolectados: ${draftText}`,
        context,
      );
    } catch (e) {
      console.error("[AI/gemini] chatReply →", e);
      return this.fallback.chatReply(ctx, history, draft);
    }
  }

  async generateStrategyBrain(ctx: BusinessContext, s: StrategyBrainSignals): Promise<StrategyBrain> {
    try {
      const NIVELES = ["unaware", "problem", "solution", "product", "most_aware"];
      const objItem = gobj({ objecion: GSTR, respuesta: GSTR }, ["objecion", "respuesta"]);
      const schema = gobj(
        {
          propuestaValor: GSTR,
          avatarPerfil: GSTR,
          deseosReiss: GSTRARR,
          dolores: GSTRARR,
          deseos: GSTRARR,
          problema: GSTR,
          solucion: GSTR,
          diferenciales: GSTRARR,
          ofertaGancho: GSTR,
          objeciones: { type: "ARRAY", items: objItem },
          testimonios: GSTRARR,
          garantia: GSTR,
          competidores: {
            type: "ARRAY",
            items: gobj({ nombre: GSTR, angulo: GSTR, oferta: GSTR, comoSuperarlo: GSTR }, ["nombre", "angulo", "oferta", "comoSuperarlo"]),
          },
          awarenessCopies: {
            type: "ARRAY",
            items: gobj({ key: { type: "STRING", enum: NIVELES }, angulo: GSTR, copy: GSTR }, ["key", "angulo", "copy"]),
          },
          creativeHooks: {
            type: "ARRAY",
            items: gobj(
              { deseo: GSTR, nivel: { type: "STRING", enum: NIVELES }, formato: { type: "STRING", enum: ["reel", "imagen"] }, hook: GSTR },
              ["deseo", "nivel", "formato", "hook"],
            ),
          },
          scriptGuide: { type: "ARRAY", items: gobj({ nombre: GSTR, estructura: GSTRARR }, ["nombre", "estructura"]) },
        },
        ["propuestaValor", "avatarPerfil", "deseosReiss", "dolores", "deseos", "problema", "solucion", "diferenciales", "ofertaGancho", "objeciones", "testimonios", "garantia", "competidores", "awarenessCopies", "creativeHooks", "scriptGuide"],
      );
      const signalLines = [
        `Zona: ${s.zona}`,
        s.precio != null ? `Precio/ticket aprox: ${s.precio}` : null,
        s.objeciones.length ? `Objeciones reales detectadas: ${s.objeciones.map((o) => o.objecion).join("; ")}` : null,
        s.topPreguntas.length ? `Lo que más preguntan: ${s.topPreguntas.join("; ")}` : null,
        s.topIntereses.length ? `Productos/temas de interés: ${s.topIntereses.join("; ")}` : null,
        s.ofertasSugeridas.length ? `Ofertas típicas del rubro: ${s.ofertasSugeridas.join("; ")}` : null,
        s.angulosContenido.length ? `Ángulos de contenido del rubro: ${s.angulosContenido.join("; ")}` : null,
        `Deseos de Reiss sugeridos para el rubro: ${s.deseosSugeridos.join(", ")}`,
        `Los 16 deseos de Reiss (elegí los 3-4 más afines): ${s.reissOpciones.join(", ")}`,
        `Niveles de consciencia (usá estas keys exactas): ${s.niveles.map((n) => `${n.key} (${n.label}: ${n.focus})`).join(" | ")}`,
      ]
        .filter(Boolean)
        .join("\n");
      return await this.json<StrategyBrain>(
        schema,
        `Sos estratega de marketing. Armá la ESTRATEGIA del negocio, súper específica (nada genérico ni "verde"), usando estos frameworks:
- ADN + 'propuestaValor' (posicionamiento en 1 frase potente).
- Avatar: 'avatarPerfil' (2-3 frases vívidas del cliente ideal), 'deseosReiss' (3-4 de la lista de los 16), 'dolores' (3-4 reales) y 'deseos' (3-4 aspiraciones).
- 7 maletas: 'problema' (el dolor central), 'solucion' (cómo lo resuelve este negocio), 'diferenciales' (3-4), 'objeciones' (3, cada una con 'objecion' y 'respuesta' que la derribe), 'testimonios' (2-3 ideas concretas de testimonios a pedir) y 'garantia' (una reversión de riesgo creíble). 'ofertaGancho' = la oferta irresistible.
- 'competidores' (2-3 típicos del rubro en la zona) con 'nombre', 'angulo', 'oferta' y 'comoSuperarlo' (la ventaja concreta de este negocio).
- 'awarenessCopies': UNA entrada por cada nivel de consciencia (las 5 keys), con 'angulo' y un 'copy' de ejemplo para ese nivel.
- 'creativeHooks': 6-8 hooks combinando deseo × nivel (key) × formato ("reel"/"imagen").
- 'scriptGuide': 3 guiones de reel con 'nombre' y 'estructura' (4-6 pasos).
Todo en español rioplatense, concreto al negocio y su oferta. Respetá el tono y NUNCA uses palabras prohibidas.`,
        `${this.ctxLines(ctx)}\n\nSeñales del negocio:\n${signalLines}`,
        16000, // esquema grande + tokens de "thinking": margen para no truncar el JSON
      );
    } catch (e) {
      console.error("[AI/gemini] generateStrategyBrain →", e);
      return this.fallback.generateStrategyBrain(ctx, s);
    }
  }
}
