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

/**
 * Proveedor mockeado de IA. Devuelve contenido realista usando el contexto del
 * negocio (nombre, oferta, tono) para que se sienta "de verdad". Cuando se
 * conecte la IA real, se reemplaza por una implementación de la misma interface.
 */
export class MockAIContentService implements AIContentService {
  private subject(ctx: BusinessContext, brief?: ContentBrief): string {
    return brief?.productOrService || ctx.mainOffer || ctx.businessName;
  }

  async generateAdCopies(
    ctx: BusinessContext,
    brief: ContentBrief
  ): Promise<AdsPackResult> {
    const s = this.subject(ctx, brief);
    const offer = brief.offer || ctx.mainOffer || "nuestra oferta";
    const city = ctx.city ? ` en ${ctx.city}` : "";
    return {
      primaryTexts: [
        `${s}: la opción que estabas buscando${city}. Escribinos por WhatsApp y te asesoramos al toque. 📲`,
        `¿Buscás ${s}? Tenemos ${offer}. Consultanos sin compromiso.`,
        `Lo que tus vecinos${city} ya eligen 🙌 ${offer}. Pedí el tuyo hoy.`,
        `Calidad que rinde. ${offer}. Hacé tu consulta y coordinamos.`,
        `Hoy es buen día para resolverlo: ${offer}. Te respondemos rápido.`,
      ],
      headlines: [
        `${s} que sí rinde`,
        `${offer}`,
        `Consultá por WhatsApp`,
        `Pedilo${city} hoy`,
        `La mejor opción para vos`,
      ],
      descriptions: [
        "Atención rápida y cercana.",
        "Envíos y formas de pago flexibles.",
        "Asesoramiento honesto, sin vueltas.",
      ],
      imageIdeas: [
        `Foto del producto (${s}) sobre fondo limpio con el beneficio principal grande`,
        "Persona real usando o recibiendo el producto, estilo cercano",
        "Detalle del producto con etiqueta de precio/oferta visible",
      ],
      campaignStructure: `Objetivo: Mensajes a WhatsApp. 1 conjunto de anuncios con público ${ctx.targetAudience ?? "ideal"}${city}. 3-4 anuncios (directo, emocional, urgencia). Ubicaciones: Feed, Stories y Reels.`,
      audienceRecommendation: `${ctx.targetAudience ?? "Público objetivo"}${city ? `, radio de 10km de ${ctx.city}` : ""}, 25-55 años.`,
      budgetRecommendation: brief.budget
        ? `Empezar con ${brief.budget} y ajustar según resultados.`
        : "Empezar con USD 8-10/día durante 4-5 días y escalar lo que funcione.",
      cta: "Enviar mensaje",
    };
  }

  async generateAngledAds(
    ctx: BusinessContext,
    brief: ContentBrief,
    hooks: string[] = []
  ): Promise<AngledAd[]> {
    const s = this.subject(ctx, brief);
    const offer = brief.offer || ctx.mainOffer || "nuestra oferta";
    const city = ctx.city ? ` en ${ctx.city}` : "";
    const h = (i: number) => (hooks[i] ? ` ${hooks[i]}` : "");
    return [
      {
        angle: "directa",
        angleLabel: "Directa",
        primaryText: `${s}: ${offer}. Escribinos por WhatsApp y lo coordinamos hoy. 📲`,
        headline: `${s} — ${offer}`,
        visualAngle: "Producto protagonista sobre fondo limpio, beneficio y precio visibles.",
      },
      {
        angle: "emocional",
        angleLabel: "Emocional",
        primaryText: `Porque lo que más importa son los tuyos 💚 ${s} pensado para vos${city}.${h(0)}`,
        headline: "Lo mejor para los tuyos",
        visualAngle: "Escena cálida y humana, producto en uso real, tono cercano.",
      },
      {
        angle: "urgencia",
        angleLabel: "Urgencia",
        primaryText: `⏰ Solo esta semana: ${offer}. No te quedes sin el tuyo, consultá ya.`,
        headline: `Última semana: ${offer}`,
        visualAngle: "Etiqueta de oferta / tiempo limitado visible, colores que llaman la atención.",
      },
      {
        angle: "prueba_social",
        angleLabel: "Prueba social",
        primaryText: `Lo que ya eligen${city} 🙌 Sumate a quienes confían en ${ctx.businessName}.${h(1)}`,
        headline: `Elegido por muchos${city}`,
        visualAngle: "Mostrar varios clientes o uso real, sensación de comunidad y confianza.",
      },
    ];
  }

  async generateCarousel(
    ctx: BusinessContext,
    brief: ContentBrief
  ): Promise<CarouselResult> {
    const s = this.subject(ctx, brief);
    return {
      title: `${s}: lo que tenés que saber antes de comprar`,
      slides: [
        `Portada: "Todo sobre ${s}" 👇`,
        "Beneficio #1: por qué conviene",
        "Beneficio #2: cómo se usa / qué incluye",
        "Prueba social: lo que dicen otros clientes",
        `Cierre + CTA: "Consultá por WhatsApp" 📲`,
      ],
      caption: `Lo que más nos preguntan sobre ${s}. Te lo resumimos 👆 ¿Dudas? Escribinos.`,
      cta: "Consultá por WhatsApp",
    };
  }

  async generateVideoScript(
    ctx: BusinessContext,
    brief: ContentBrief
  ): Promise<VideoScriptResult> {
    const s = this.subject(ctx, brief);
    return {
      hook: `"¿Sabías que con ${s} podés resolver esto en minutos?"`,
      body: `Mostrar el producto en uso real, destacar el beneficio principal y responder la duda más común de ${ctx.businessName}.`,
      close: `"${brief.offer || ctx.mainOffer || "Aprovechá hoy"}"`,
      cta: "Escribinos por WhatsApp",
      visualNotes: "Formato vertical 9:16, texto grande arriba (zona segura), música simple, ritmo ágil.",
      estimatedDuration: "15-25 segundos",
    };
  }

  async generateCampaignStrategy(
    ctx: BusinessContext,
    brief: ContentBrief
  ): Promise<string> {
    return (
      `Estrategia para ${ctx.businessName}: campaña de Mensajes para generar conversaciones por WhatsApp. ` +
      `Foco en ${brief.objective || "vender más esta semana"}. Mantener el contenido enfocado en una sola idea por pieza.`
    );
  }

  async generateBrandTone(ctx: BusinessContext): Promise<string> {
    return `Tono ${ctx.toneOfVoice ?? "cercano y directo"} para ${ctx.businessName}: cálido, claro y vendedor sin ser agresivo.`;
  }

  async analyzeBusinessProfile(ctx: BusinessContext): Promise<string> {
    return `${ctx.businessName} (${ctx.category}) apunta a ${ctx.targetAudience ?? "su público"}. Oferta fuerte: ${ctx.mainOffer ?? "—"}. Conviene destacar cercanía y atención rápida.`;
  }

  async generateDailyDigestIdeas(
    ctx: BusinessContext,
    topQuestions: string[],
    topObjections: string[]
  ): Promise<DigestIdeas> {
    const q = topQuestions[0] ?? "tus productos";
    return {
      contentIdeas: [
        `Carrusel: las ${topQuestions.length || 5} dudas más frecuentes antes de comprar`,
        `Historia respondiendo: "${q}"`,
        "Reel mostrando el producto en uso real",
      ],
      campaignIdeas: [`Anuncio a Mensajes destacando la respuesta a "${q}"`],
      recommendedAction: topObjections.length
        ? `Mañana publicá una historia que responda la objeción "${topObjections[0]}".`
        : `Mañana publicá contenido que aclare "${q}".`,
    };
  }

  async generateWhatsAppReplies(
    ctx: BusinessContext,
    customerMessage: string
  ): Promise<string[]> {
    return [
      `¡Hola! Gracias por escribir a ${ctx.businessName} 😊 Sobre "${customerMessage}", te cuento…`,
      `Buenísima pregunta. Te respondo enseguida y, si querés, coordinamos. 📲`,
    ];
  }

  async generateQuickCampaign(
    ctx: BusinessContext,
    brief: ContentBrief
  ): Promise<QuickCampaignResult> {
    const ads = await this.generateAdCopies(ctx, brief);
    const carousel = await this.generateCarousel(ctx, brief);
    const reelScript = await this.generateVideoScript(ctx, brief);
    const s = this.subject(ctx, brief);
    return {
      stories: [
        `Historia 1: "${brief.offer || ctx.mainOffer || s}" con sticker de WhatsApp`,
        "Historia 2: encuesta '¿Lo querías saber?' para generar interacción",
        "Historia 3: cuenta regresiva si la oferta tiene fecha límite",
      ],
      carousel,
      ads: ads.primaryTexts.slice(0, 2).map((primaryText, i) => ({
        primaryText,
        headline: ads.headlines[i] ?? ads.headlines[0],
      })),
      copies: ads.primaryTexts,
      headlines: ads.headlines,
      reelScript,
      campaignStructure: ads.campaignStructure,
      audienceRecommendation: ads.audienceRecommendation,
      budgetRecommendation: ads.budgetRecommendation,
    };
  }

  async generateRevision(original: string, instruction: string): Promise<string> {
    const trimmed = instruction.toLowerCase();
    if (trimmed.includes("corto")) return original.split(".")[0] + ". 📲";
    if (trimmed.includes("vendedor") || trimmed.includes("directo"))
      return `🔥 ${original} ¡Escribinos ya y lo coordinamos!`;
    if (trimmed.includes("emocional"))
      return `Porque lo que más importa sos vos y los tuyos 💚 ${original}`;
    return `${original} (ajustado: ${instruction})`;
  }

  async generateVisualPromptBase(
    ctx: BusinessContext,
    subject: string
  ): Promise<string> {
    return `Foto comercial de ${subject} para ${ctx.businessName}, estilo ${
      ctx.toneOfVoice ?? "limpio y cercano"
    }, fondo prolijo, producto protagonista, iluminación natural.`;
  }
}
