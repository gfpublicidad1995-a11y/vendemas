import { PrismaClient } from "../lib/generated/prisma/client";
import { createDbAdapter } from "../lib/dbAdapter";
import { DEFAULT_META_CREATIVE_SPECS } from "../services/meta-creative-specs/metaCreativeSpecs";
import { generateToken, hashPhone } from "../lib/ids";

const prisma = new PrismaClient({ adapter: createDbAdapter() });

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function clearAll() {
  // Orden hijo → padre para respetar las FKs.
  await prisma.marketStrategy.deleteMany();
  await prisma.contentScore.deleteMany();
  await prisma.creativeVariant.deleteMany();
  await prisma.visualGenerationJob.deleteMany();
  await prisma.visualCreative.deleteMany();
  await prisma.deliveryLink.deleteMany();
  await prisma.campaignDraft.deleteMany();
  await prisma.revisionRequest.deleteMany();
  await prisma.contentApproval.deleteMany();
  await prisma.contentPiece.deleteMany();
  await prisma.suggestedReply.deleteMany();
  await prisma.conversationMessage.deleteMany();
  await prisma.conversationThread.deleteMany();
  await prisma.contentOrder.deleteMany();
  await prisma.dailyDigestItem.deleteMany();
  await prisma.dailyDigest.deleteMany();
  await prisma.contentOpportunity.deleteMany();
  await prisma.conversationInsight.deleteMany();
  await prisma.faqInsight.deleteMany();
  await prisma.objectionInsight.deleteMany();
  await prisma.opportunityAlert.deleteMany();
  await prisma.offerSuggestion.deleteMany();
  await prisma.contentCalendarItem.deleteMany();
  await prisma.contentCalendar.deleteMany();
  await prisma.weeklyReport.deleteMany();
  await prisma.voiceBrief.deleteMany();
  await prisma.budgetPlan.deleteMany();
  await prisma.scheduledJob.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.brandKit.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.metaCreativeSpec.deleteMany();
  await prisma.industryPlaybook.deleteMany();
  await prisma.industryTemplate.deleteMany();
  await prisma.visualPromptTemplate.deleteMany();
}

async function seedMetaSpecs() {
  for (const s of DEFAULT_META_CREATIVE_SPECS) {
    await prisma.metaCreativeSpec.create({
      data: {
        placement: s.placement,
        format: s.format,
        recommendedAspectRatio: s.recommendedAspectRatio,
        recommendedWidth: s.recommendedWidth,
        recommendedHeight: s.recommendedHeight,
        premiumWidth: s.premiumWidth,
        premiumHeight: s.premiumHeight,
        minWidth: s.minWidth,
        minHeight: s.minHeight,
        maxFileSizeMb: s.maxFileSizeMb,
        supportedFileTypes: s.supportedFileTypes,
        safeZoneTopPercent: s.safeZoneTopPercent,
        safeZoneBottomPercent: s.safeZoneBottomPercent,
        safeZoneSidePercent: s.safeZoneSidePercent,
        primaryTextRecommendation: s.primaryTextRecommendation,
        headlineRecommendation: s.headlineRecommendation,
        descriptionRecommendation: s.descriptionRecommendation,
        notes: s.notes ?? [],
      },
    });
  }
}

async function main() {
  console.log("🌱 Limpiando datos previos…");
  await clearAll();

  console.log("🌱 Sembrando especificaciones de Meta Ads…");
  await seedMetaSpecs();

  console.log("🌱 Sembrando playbooks por rubro…");
  const PLAYBOOKS = [
    {
      industry: "Mascotas y agro",
      commonQuestions: ["¿Cuánto sale?", "¿Hacen envíos?", "¿Tienen stock?", "¿Aceptan transferencia?", "¿Dónde están ubicados?"],
      commonObjections: ["Me parece caro", "Después veo", "¿Tenés algo más barato?"],
      bestContentAngles: ["Resolver dudas frecuentes antes de comprar", "Mostrar el producto en uso real", "Prueba social de clientes locales"],
      bestCampaignObjectives: ["Mensajes a WhatsApp", "Ventas", "Alcance local"],
      suggestedAudiences: ["Dueños de gatos en Florida y alrededores", "Familias con mascotas"],
      suggestedOffers: ["Envío gratis por zona", "Combo sanitaria + alimento"],
    },
    {
      industry: "Ropa",
      commonQuestions: ["¿Tienen talle M?", "¿Cómo son los talles?", "¿Hacen envíos?", "¿Tienen cambios?", "¿Cuánto sale?"],
      commonObjections: ["Está caro", "No sé qué talle soy", "Lo veo y te aviso"],
      bestContentAngles: ["Mostrar el producto puesto (try-on)", "Combinaciones de looks", "Guía de talles", "Prueba social"],
      bestCampaignObjectives: ["Ventas", "Tráfico a la tienda", "Mensajes a WhatsApp"],
      suggestedAudiences: ["Mujeres 18-35 interesadas en moda", "Seguidores de la marca"],
      suggestedOffers: ["2x1 en temporada", "Envío gratis desde cierto monto", "Descuento primera compra"],
    },
    {
      industry: "Comida",
      commonQuestions: ["¿Hacen delivery?", "¿Cuánto tarda?", "¿Tienen menú del día?", "¿Aceptan tarjeta?", "¿Hasta qué hora abren?"],
      commonObjections: ["Está caro el delivery", "Tardan mucho", "Prefiero retirar"],
      bestContentAngles: ["Foto apetitosa del plato", "Detrás de escena de la cocina", "Promo del día", "Reseñas de clientes"],
      bestCampaignObjectives: ["Mensajes a WhatsApp", "Tráfico al pedido", "Alcance local"],
      suggestedAudiences: ["Personas a la hora del almuerzo cerca del local", "Familias del barrio"],
      suggestedOffers: ["Combo del día", "Envío gratis en la zona", "2x1 happy hour"],
    },
    {
      industry: "Belleza y estética",
      commonQuestions: ["¿Cómo saco turno?", "¿Cuánto dura?", "¿Qué incluye?", "¿Cuánto sale?", "¿Dónde están?"],
      commonObjections: ["Está caro", "No tengo tiempo", "Lo pienso"],
      bestContentAngles: ["Antes y después", "Resultado real de clientas", "Tips de cuidado", "Promo de temporada"],
      bestCampaignObjectives: ["Mensajes a WhatsApp", "Reservas", "Alcance local"],
      suggestedAudiences: ["Mujeres 20-45 de la zona", "Clientas recurrentes"],
      suggestedOffers: ["Primera sesión con descuento", "Pack de sesiones", "Combo servicios"],
    },
    {
      industry: "Gimnasios",
      commonQuestions: ["¿Cuánto sale la mensualidad?", "¿Tienen clases?", "¿Qué horarios?", "¿Hay matrícula?", "¿Puedo probar?"],
      commonObjections: ["Es caro", "No tengo tiempo", "Empiezo el lunes"],
      bestContentAngles: ["Transformaciones de socios", "Clase en vivo", "Tips de entrenamiento", "Comunidad"],
      bestCampaignObjectives: ["Mensajes a WhatsApp", "Inscripciones", "Alcance local"],
      suggestedAudiences: ["Personas 18-45 cerca del gimnasio", "Interesados en fitness"],
      suggestedOffers: ["Clase de prueba gratis", "Sin matrícula este mes", "Plan trimestral con descuento"],
    },
    {
      industry: "Servicios profesionales",
      commonQuestions: ["¿Cuánto cobrás?", "¿Cómo es el proceso?", "¿Tenés experiencia?", "¿Cuánto tarda?", "¿Hacés presupuesto?"],
      commonObjections: ["Es caro", "Lo tengo que pensar", "Estoy viendo opciones"],
      bestContentAngles: ["Caso de éxito", "Explicar el problema que resolvés", "Confianza y credenciales", "FAQ"],
      bestCampaignObjectives: ["Clientes potenciales", "Mensajes a WhatsApp"],
      suggestedAudiences: ["Negocios o personas con el problema que resolvés"],
      suggestedOffers: ["Diagnóstico inicial sin costo", "Presupuesto sin compromiso"],
    },
    {
      industry: "Tiendas online",
      commonQuestions: ["¿Hacen envíos a todo el país?", "¿Cuánto tarda el envío?", "¿Medios de pago?", "¿Tienen stock?", "¿Cambios y devoluciones?"],
      commonObjections: ["El envío es caro", "Prefiero verlo antes", "Lo dejo en el carrito"],
      bestContentAngles: ["Producto en detalle", "Unboxing", "Reseñas y prueba social", "Oferta por tiempo limitado"],
      bestCampaignObjectives: ["Ventas", "Remarketing", "Mensajes a WhatsApp"],
      suggestedAudiences: ["Visitantes del sitio (remarketing)", "Públicos similares a compradores"],
      suggestedOffers: ["Envío gratis desde cierto monto", "Descuento por carrito abandonado", "Cuotas sin interés"],
    },
  ];
  for (const p of PLAYBOOKS) {
    await prisma.industryPlaybook.create({ data: p });
  }

  await prisma.industryTemplate.create({
    data: {
      industry: "Mascotas y agro",
      contentType: "carousel",
      title: "5 dudas antes de comprar sanitaria para gatos",
      angle: "Educativo / resuelve objeciones",
      structure: ["Portada con gancho", "Duda 1", "Duda 2", "Duda 3", "CTA WhatsApp"],
      exampleCopy: "Todo lo que preguntás antes de comprar, respondido 👇",
      suggestedCTA: "Consultanos por WhatsApp",
    },
  });

  await prisma.visualPromptTemplate.create({
    data: {
      industry: "Mascotas y agro",
      contentType: "ad_image",
      title: "Producto sobre fondo limpio con beneficio",
      promptStructure:
        "Foto comercial de {producto} sobre fondo {color}, beneficio '{beneficio}' visible, etiqueta de precio {precio}, logo discreto, estética limpia y vendedora.",
      recommendedFormat: "vertical_4_5",
      styleTags: ["limpio", "comercial", "mobile-first"],
    },
  });

  console.log("🌱 Sembrando usuario y negocio…");
  const user = await prisma.user.create({
    data: {
      name: "Sofía Pereira",
      phone: "+59899123456",
      email: "sofia@agroymascotas.com",
      role: "owner",
    },
  });

  const business = await prisma.businessProfile.create({
    data: {
      userId: user.id,
      businessName: "Agro y Mascotas Centro",
      category: "Mascotas y agro",
      description:
        "Tienda de mascotas y productos de agro en el centro de Florida. Sanitaria, alimentos, accesorios y asesoramiento.",
      city: "Florida",
      country: "Uruguay",
      targetAudience: "Dueños de gatos, familias y personas con mascotas",
      toneOfVoice: "Cercano, simple, directo y vendedor",
      mainOffer: "Sanitaria aglomerante Cat Litter 25L a $890",
      instagramHandle: "@agroymascotascentro",
      facebookPage: "Agro y Mascotas Centro",
      whatsappNumber: "+59899123456",
      monthlyAdBudget: 300,
      dailyDigestEnabled: true,
      dailyDigestTime: "20:30",
      timezone: "America/Montevideo",
      digestWhatsappOptIn: true,
      consentToAnalyzeConversations: true,
    },
  });

  await prisma.brandKit.create({
    data: {
      businessProfileId: business.id,
      logoUrl: "https://placehold.co/200x200/166534/FFFFFF?text=A%26M",
      primaryColor: "#166534",
      secondaryColor: "#f59e0b",
      fontStyle: "Sans serif redondeada",
      toneOfVoice: "Cercano, simple, directo y vendedor",
      forbiddenWords: ["barato", "regalado"],
      preferredWords: ["calidad", "rinde", "tu mascota", "envío"],
      visualStyle: "Limpio, colores naturales, producto protagonista",
      exampleCaptions: [
        "Tu gato merece lo mejor 🐱 Sanitaria que rinde el doble.",
        "Hacemos envíos en Florida 🚚 Consultanos por WhatsApp.",
      ],
    },
  });

  await prisma.asset.createMany({
    data: [
      {
        businessProfileId: business.id,
        type: "logo",
        url: "https://placehold.co/400x400/166534/FFFFFF?text=A%26M",
        filename: "logo.png",
        mimeType: "image/png",
      },
      {
        businessProfileId: business.id,
        type: "product_photo",
        url: "https://d8j0ntlcm91z4.cloudfront.net/user_3BofPPcE8tCN4ZrIjUw3fYtNxpY/hf_20260613_210533_9edd8045-832c-4b6b-8819-ca0ea4950a1f.png",
        filename: "catlitter.jpg",
        mimeType: "image/jpeg",
      },
      {
        businessProfileId: business.id,
        type: "founder_photo",
        url: "https://placehold.co/800x800/e2e8f0/166534?text=Sofia",
        filename: "sofia.jpg",
        mimeType: "image/jpeg",
      },
    ],
  });

  console.log("🌱 Sembrando conversaciones de clientes…");
  const customerSamples: {
    name: string;
    phone: string;
    messages: { dir: "inbound" | "outbound"; text: string; intent?: string }[];
  }[] = [
    {
      name: "Carla",
      phone: "+59891111111",
      messages: [
        { dir: "inbound", text: "Hola! ¿Cuánto sale la sanitaria de 25L?", intent: "price" },
        { dir: "outbound", text: "Hola Carla! Sale $890 😊" },
        { dir: "inbound", text: "¿Hacen envíos?", intent: "delivery" },
      ],
    },
    {
      name: "Diego",
      phone: "+59892222222",
      messages: [
        { dir: "inbound", text: "¿Qué aromas tienen?", intent: "general_question" },
        { dir: "inbound", text: "¿Sirve para gatos chicos?", intent: "general_question" },
      ],
    },
    {
      name: "Lucía",
      phone: "+59893333333",
      messages: [
        { dir: "inbound", text: "¿Dónde están ubicados?", intent: "general_question" },
        { dir: "inbound", text: "¿Aceptan transferencia?", intent: "payment" },
        { dir: "inbound", text: "¿Tienen stock?", intent: "stock" },
      ],
    },
    {
      name: "Martín",
      phone: "+59894444444",
      messages: [
        { dir: "inbound", text: "Me parece caro", intent: "price_objection" },
        { dir: "inbound", text: "¿Tenés algo más barato?", intent: "price_objection" },
      ],
    },
    {
      name: "Valeria",
      phone: "+59895555555",
      messages: [
        { dir: "inbound", text: "Quiero comprar, ¿me lo mandás?", intent: "purchase_intent" },
        { dir: "outbound", text: "¡Genial! Coordinamos el envío 🚚" },
      ],
    },
    {
      name: "Andrés",
      phone: "+59896666666",
      messages: [{ dir: "inbound", text: "Después veo, gracias", intent: "objection" }],
    },
  ];

  for (const c of customerSamples) {
    const thread = await prisma.conversationThread.create({
      data: {
        businessProfileId: business.id,
        customerPhoneHash: hashPhone(c.phone),
        customerName: c.name,
        status: "open",
        lastMessageAt: daysAgo(0),
      },
    });
    for (const m of c.messages) {
      await prisma.conversationMessage.create({
        data: {
          conversationThreadId: thread.id,
          direction: m.dir,
          messageType: "text",
          content: m.text,
          normalizedContent: m.text.toLowerCase(),
          detectedIntent: m.intent,
          sentiment: m.dir === "inbound" ? "neutral" : "positive",
        },
      });
    }
  }

  console.log("🌱 Sembrando insights, FAQs y objeciones…");
  const faqPrice = await prisma.conversationInsight.create({
    data: {
      businessProfileId: business.id,
      type: "faq",
      title: "Preguntan mucho el precio",
      description: "La consulta más repetida es por el precio de la sanitaria.",
      frequency: 8,
      examples: ["¿Cuánto sale?", "¿Precio de la de 25L?"],
      confidence: 0.9,
      status: "new",
    },
  });
  await prisma.conversationInsight.create({
    data: {
      businessProfileId: business.id,
      type: "objection",
      title: "Objeción de precio",
      description: "Varios clientes dicen que les parece caro o piden algo más barato.",
      frequency: 4,
      examples: ["Me parece caro", "¿Tenés algo más barato?"],
      confidence: 0.8,
      status: "new",
    },
  });
  await prisma.conversationInsight.create({
    data: {
      businessProfileId: business.id,
      type: "product_interest",
      title: "Interés en envíos",
      description: "Muchos preguntan si hacen envíos: oportunidad de destacarlo.",
      frequency: 5,
      examples: ["¿Hacen envíos?", "¿Me lo mandás?"],
      confidence: 0.85,
      status: "new",
    },
  });

  await prisma.faqInsight.createMany({
    data: [
      {
        businessProfileId: business.id,
        question: "¿Cuánto sale la sanitaria de 25L?",
        suggestedAnswer: "Sale $890. Si querés, te coordino el envío 😊",
        frequency: 8,
        sourceExamples: ["¿Cuánto sale?", "¿Precio?"],
      },
      {
        businessProfileId: business.id,
        question: "¿Hacen envíos?",
        suggestedAnswer: "Sí, hacemos envíos en Florida y alrededores. Contanos tu zona.",
        frequency: 5,
      },
      {
        businessProfileId: business.id,
        question: "¿Aceptan transferencia?",
        suggestedAnswer: "Sí, aceptamos transferencia y también Mercado Pago.",
        frequency: 3,
      },
    ],
  });

  await prisma.objectionInsight.createMany({
    data: [
      {
        businessProfileId: business.id,
        objection: "Me parece caro",
        suggestedResponse:
          "Te entiendo. La de 25L rinde mucho más que las chicas: te dura el doble, así que el costo por uso es menor.",
        recommendedContentIdea: "Reel mostrando cuánto rinde vs una sanitaria común.",
        frequency: 4,
      },
      {
        businessProfileId: business.id,
        objection: "Después veo",
        suggestedResponse:
          "¡Sin problema! Te dejo el dato: hoy tenemos envío sin costo en Florida. Cuando quieras, te lo coordino.",
        recommendedContentIdea: "Historia con oferta por tiempo limitado.",
        frequency: 2,
      },
    ],
  });

  await prisma.contentOpportunity.create({
    data: {
      businessProfileId: business.id,
      sourceInsightId: faqPrice.id,
      title: "Carrusel: dudas frecuentes antes de comprar",
      contentType: "carousel",
      angle: "Educativo, responde precio + envío + pago",
      suggestedCopy: "Lo que más nos preguntan antes de comprar 👇",
      priority: "high",
      status: "pending",
    },
  });

  console.log("🌱 Sembrando pedido de Campaña Rápida + entrega…");
  const order = await prisma.contentOrder.create({
    data: {
      businessProfileId: business.id,
      type: "quick_campaign",
      status: "delivered",
      objective: "Vender más esta semana",
      offer: "Sanitaria Cat Litter 25L a $890 con envío gratis",
      productOrService: "Sanitaria aglomerante Cat Litter 25L",
      notes: "Generado desde 'Quiero vender más esta semana'",
    },
  });

  await prisma.contentPiece.createMany({
    data: [
      {
        contentOrderId: order.id,
        type: "ad_copy",
        title: "Copy directo",
        body: "Sanitaria 25L que rinde el doble — $890 con envío gratis en Florida. Escribinos 📲",
        format: "meta_ads",
      },
      {
        contentOrderId: order.id,
        type: "ad_copy",
        title: "Copy emocional",
        body: "Tu gato merece lo mejor 🐱 Sanitaria premium que cuida el olor y rinde más. Pedila por WhatsApp.",
        format: "meta_ads",
      },
      {
        contentOrderId: order.id,
        type: "video_script",
        title: "Guion de reel",
        body: "Hook: '¿Cansado de cambiar la sanitaria todo el tiempo?' · Desarrollo: muestra cuánto rinde la de 25L · Cierre: '$890 con envío' · CTA: 'Escribinos'.",
        format: "reel_9_16",
      },
      {
        contentOrderId: order.id,
        type: "carousel_pack",
        title: "Carrusel: 5 dudas antes de comprar",
        body: "Slide 1: Portada · 2: ¿Cuánto sale? · 3: ¿Hacen envíos? · 4: ¿Aceptan transferencia? · 5: CTA WhatsApp",
        format: "carousel_1_1",
      },
      {
        contentOrderId: order.id,
        type: "campaign_structure",
        title: "Estructura de campaña",
        body: "Objetivo: Mensajes · Público: dueños de gatos en Florida (+10km) · Presupuesto: $10/día · Ubicaciones: Feed, Stories, Reels.",
        format: "meta_ads",
      },
    ],
  });

  // Variantes visuales por ubicación (4:5, 1:1, 9:16).
  // Imágenes REALES generadas con Higgsfield (marketing_studio_image).
  const HF = {
    feed: {
      url: "https://d8j0ntlcm91z4.cloudfront.net/user_3BofPPcE8tCN4ZrIjUw3fYtNxpY/hf_20260613_210556_5de23fab-6e9a-4acf-b17a-7649503deabf.png",
      jobId: "5de23fab-6e9a-4acf-b17a-7649503deabf",
    },
    square: {
      url: "https://d8j0ntlcm91z4.cloudfront.net/user_3BofPPcE8tCN4ZrIjUw3fYtNxpY/hf_20260613_210533_9edd8045-832c-4b6b-8819-ca0ea4950a1f.png",
      jobId: "9edd8045-832c-4b6b-8819-ca0ea4950a1f",
    },
    story: {
      url: "https://d8j0ntlcm91z4.cloudfront.net/user_3BofPPcE8tCN4ZrIjUw3fYtNxpY/hf_20260613_210601_c9595290-0a28-423a-84de-c17e7270ae65.png",
      jobId: "c9595290-0a28-423a-84de-c17e7270ae65",
    },
    landscape: {
      url: "https://d8j0ntlcm91z4.cloudfront.net/user_3BofPPcE8tCN4ZrIjUw3fYtNxpY/hf_20260613_212035_a2f34a07-59a2-4c7e-83cf-65339e67c6d9.png",
      jobId: "a2f34a07-59a2-4c7e-83cf-65339e67c6d9",
    },
  };
  // Ángulo creativo por ratio (diversificación: directa / emocional / urgencia / prueba social)
  const ANGLE_BY_RATIO: Record<string, { k: string; l: string }> = {
    "4:5": { k: "directa", l: "Directa" },
    "1:1": { k: "prueba_social", l: "Prueba social" },
    "9:16": { k: "emocional", l: "Emocional" },
    "1.91:1": { k: "urgencia", l: "Urgencia" },
  };
  const visualSet = [
    {
      type: "ad_image" as const,
      placement: "INSTAGRAM_FEED",
      format: "vertical_4_5",
      aspectRatio: "4:5",
      width: 1080,
      height: 1350,
      validationStatus: "valid" as const,
      fileUrl: HF.feed.url,
      jobId: HF.feed.jobId,
    },
    {
      type: "ad_image" as const,
      placement: "FACEBOOK_MARKETPLACE",
      format: "square_1_1",
      aspectRatio: "1:1",
      width: 1080,
      height: 1080,
      validationStatus: "valid" as const,
      fileUrl: HF.square.url,
      jobId: HF.square.jobId,
    },
    {
      type: "story_image" as const,
      placement: "INSTAGRAM_STORIES",
      format: "story_9_16",
      aspectRatio: "9:16",
      width: 1080,
      height: 1920,
      validationStatus: "warning" as const,
      fileUrl: HF.story.url,
      jobId: HF.story.jobId,
    },
    {
      type: "ad_image" as const,
      placement: "FACEBOOK_RIGHT_COLUMN",
      format: "landscape_16_9",
      aspectRatio: "1.91:1",
      width: 1200,
      height: 628,
      validationStatus: "valid" as const,
      fileUrl: HF.landscape.url,
      jobId: HF.landscape.jobId,
    },
  ];

  for (const v of visualSet) {
    const safeZone =
      v.format === "story_9_16"
        ? { safeZoneTopPercent: 14, safeZoneBottomPercent: 35, safeZoneSidePercent: 6 }
        : {};
    const vc = await prisma.visualCreative.create({
      data: {
        businessProfileId: business.id,
        contentOrderId: order.id,
        type: v.type,
        placement: v.placement,
        prompt: `Anuncio ${v.aspectRatio} de Sanitaria Cat Litter 25L sobre fondo limpio, beneficio 'rinde el doble', precio $890, logo discreto, estética comercial.`,
        format: v.format,
        aspectRatio: v.aspectRatio,
        width: v.width,
        height: v.height,
        ...safeZone,
        isPlacementReady: true,
        status: "completed",
        validationStatus: v.validationStatus,
        validationNotes:
          v.validationStatus === "warning"
            ? ["El CTA podría quedar muy abajo: subir dentro de la zona segura."]
            : [],
        fileUrl: v.fileUrl,
        provider: "higgsfield",
        providerJobId: v.jobId,
        metadata: {
          angle: ANGLE_BY_RATIO[v.aspectRatio]?.k ?? null,
          angleLabel: ANGLE_BY_RATIO[v.aspectRatio]?.l ?? null,
        },
      },
    });
    await prisma.creativeVariant.create({
      data: {
        businessProfileId: business.id,
        contentOrderId: order.id,
        visualCreativeId: vc.id,
        placement: v.placement,
        format: v.format,
        aspectRatio: v.aspectRatio,
        width: v.width,
        height: v.height,
        fileUrl: vc.fileUrl,
        prompt: vc.prompt,
        safeZoneApplied: v.format === "story_9_16",
        validationStatus: v.validationStatus,
      },
    });
  }

  await prisma.visualGenerationJob.create({
    data: {
      businessProfileId: business.id,
      contentOrderId: order.id,
      provider: "higgsfield",
      status: "completed",
      input: { kind: "creative_variations", formats: ["4:5", "1:1", "9:16"] },
      output: { generated: 3, jobIds: [HF.feed.jobId, HF.square.jobId, HF.story.jobId] },
      startedAt: daysAgo(0),
      completedAt: daysAgo(0),
    },
  });

  await prisma.campaignDraft.create({
    data: {
      contentOrderId: order.id,
      objective: "Mensajes a WhatsApp",
      budget: 10,
      audience: "Dueños de gatos en Florida (+10km), 25-55 años",
      placements: ["INSTAGRAM_FEED", "FACEBOOK_FEED", "INSTAGRAM_STORIES", "INSTAGRAM_REELS"],
      adCopies: [
        "Sanitaria 25L que rinde el doble — $890 con envío gratis.",
        "Tu gato merece lo mejor 🐱 Pedila por WhatsApp.",
      ],
      creatives: { variants: ["4:5", "1:1", "9:16"] },
      recommendedPlacements: ["INSTAGRAM_FEED", "INSTAGRAM_STORIES", "INSTAGRAM_REELS"],
      placementValidation: { valid: 2, warning: 1, invalid: 0 },
      creativeSpecVersion: "2026-06",
      status: "draft",
    },
  });

  const token = generateToken();
  await prisma.deliveryLink.create({
    data: {
      contentOrderId: order.id,
      token,
      url: `${APP_URL}/delivery/${token}`,
      expiresAt: daysFromNow(30),
    },
  });

  await prisma.contentApproval.create({
    data: {
      contentOrderId: order.id,
      businessProfileId: business.id,
      status: "pending",
    },
  });

  await prisma.contentScore.create({
    data: {
      contentOpportunityId: null,
      salesPotential: "high",
      urgency: "high",
      confidence: 0.82,
      reason: "Responde la duda #1 (precio) y la objeción de costo. Alta intención detectada.",
      basedOnConversationsCount: 12,
      recommendedPublishDate: daysFromNow(1),
    },
  });

  console.log("🌱 Sembrando Daily Digest 'Ideas para mañana'…");
  const digest = await prisma.dailyDigest.create({
    data: {
      businessProfileId: business.id,
      date: daysAgo(0),
      totalConversations: 6,
      totalMessages: 14,
      topQuestions: ["Precio", "Envíos", "Formas de pago", "Stock", "Ubicación"],
      topObjections: ["Me parece caro", "Después veo"],
      topProductInterests: ["Sanitaria 25L", "Envíos"],
      contentIdeas: [
        "Carrusel: 5 dudas frecuentes antes de comprar",
        "Historia: Sí, hacemos envíos",
        "Reel: Lo que más nos preguntan antes de comprar",
      ],
      campaignIdeas: ["Anuncio: Consultá por WhatsApp y recibí asesoramiento rápido"],
      recommendedAction:
        "Mañana publicá una historia aclarando formas de pago y envíos.",
      status: "sent",
      sentAt: daysAgo(0),
    },
  });
  await prisma.dailyDigestItem.createMany({
    data: [
      {
        dailyDigestId: digest.id,
        type: "faq",
        title: "Precio (la duda #1)",
        description: "8 consultas por el precio hoy.",
        frequency: 8,
        priority: "high",
      },
      {
        dailyDigestId: digest.id,
        type: "content_idea",
        title: "Carrusel de dudas frecuentes",
        description: "Responder precio, envío y pago en un solo carrusel.",
        priority: "high",
      },
      {
        dailyDigestId: digest.id,
        type: "campaign_idea",
        title: "Anuncio a Mensajes",
        description: "Campaña a WhatsApp destacando envío gratis.",
        priority: "medium",
      },
      {
        dailyDigestId: digest.id,
        type: "recommendation",
        title: "Historia de pagos y envíos",
        description: "Aclarar formas de pago y envíos en una historia.",
        priority: "high",
      },
    ],
  });

  console.log("🌱 Sembrando oportunidades, respuestas y planes…");
  await prisma.opportunityAlert.createMany({
    data: [
      {
        businessProfileId: business.id,
        type: "faq",
        title: "Pico de consultas por precio",
        description: "El precio se preguntó 8 veces hoy. Aclararlo en contenido bajaría fricción.",
        source: "conversaciones",
        priority: "high",
        recommendedAction: "Crear carrusel de dudas frecuentes.",
        status: "new",
      },
      {
        businessProfileId: business.id,
        type: "urgency",
        title: "Intención de compra sin cerrar",
        description: "Valeria mostró intención de compra. Seguimiento recomendado.",
        source: "conversaciones",
        priority: "critical",
        recommendedAction: "Enviar respuesta sugerida de cierre.",
        status: "new",
      },
    ],
  });

  await prisma.suggestedReply.createMany({
    data: [
      {
        businessProfileId: business.id,
        triggerType: "price_objection",
        customerMessage: "Me parece caro",
        suggestedReply:
          "Te entiendo 🙂 La de 25L rinde el doble, así que te termina saliendo más barata por uso. ¿Te coordino una con envío gratis?",
        tone: "persuasive",
        status: "suggested",
      },
      {
        businessProfileId: business.id,
        triggerType: "purchase_intent",
        customerMessage: "Quiero comprar, ¿me lo mandás?",
        suggestedReply:
          "¡Genial! 🙌 Pasame tu dirección y zona y te confirmo el envío. ¿Pagás por transferencia o Mercado Pago?",
        tone: "friendly",
        status: "suggested",
      },
    ],
  });

  const calendar = await prisma.contentCalendar.create({
    data: {
      businessProfileId: business.id,
      startDate: daysFromNow(1),
      endDate: daysFromNow(7),
      objective: "Vender más y bajar dudas frecuentes",
      status: "draft",
    },
  });
  await prisma.contentCalendarItem.createMany({
    data: [
      {
        contentCalendarId: calendar.id,
        date: daysFromNow(1),
        contentType: "story",
        title: "Sí, hacemos envíos",
        angle: "Responder duda frecuente",
        suggestedCopy: "🚚 Hacemos envíos en Florida. Escribinos tu zona.",
        cta: "Consultá por WhatsApp",
        status: "pending",
      },
      {
        contentCalendarId: calendar.id,
        date: daysFromNow(2),
        contentType: "carousel",
        title: "5 dudas antes de comprar",
        angle: "Educativo",
        suggestedCopy: "Lo que más nos preguntan 👇",
        cta: "Pedí la tuya",
        status: "pending",
      },
      {
        contentCalendarId: calendar.id,
        date: daysFromNow(3),
        contentType: "reel",
        title: "Cuánto rinde la de 25L",
        angle: "Demostración / objeción de precio",
        suggestedCopy: "Mirá cuánto rinde 😮",
        cta: "Escribinos",
        status: "pending",
      },
    ],
  });

  await prisma.budgetPlan.create({
    data: {
      businessProfileId: business.id,
      monthlyBudget: 300,
      currency: "USD",
      objective: "Mensajes a WhatsApp",
      recommendedDistribution: {
        "Mensajes (prospección)": 0.6,
        "Remarketing": 0.25,
        "Alcance local": 0.15,
      },
      explanation:
        "60% a campañas de mensajes para generar conversaciones, 25% a remarketing de quienes interactuaron y 15% a alcance local en Florida.",
      status: "draft",
    },
  });

  await prisma.offerSuggestion.create({
    data: {
      businessProfileId: business.id,
      sourceInsightId: faqPrice.id,
      title: "Envío gratis por compras desde $890",
      description: "Aprovechar que muchos preguntan por envíos para sumar valor sin bajar precio.",
      offerType: "free_shipping",
      suggestedCopy: "🚚 Envío gratis en Florida llevando la sanitaria de 25L.",
      reason: "Responde la objeción de precio sin tocar el margen.",
      priority: "high",
      status: "pending",
    },
  });

  await prisma.weeklyReport.create({
    data: {
      businessProfileId: business.id,
      weekStartDate: daysAgo(7),
      weekEndDate: daysAgo(0),
      totalConversations: 32,
      totalMessages: 88,
      topQuestions: ["Precio", "Envíos", "Pagos"],
      topObjections: ["Caro", "Después veo"],
      topProductInterests: ["Sanitaria 25L"],
      topPurchaseSignals: ["Quiero comprar", "¿Me lo mandás?"],
      recommendedContentPlan: ["Carrusel de dudas", "Reel de rendimiento", "Historia de envíos"],
      recommendedCampaigns: ["Mensajes a WhatsApp con envío gratis"],
      summary:
        "Semana con fuerte interés en la sanitaria 25L. El precio domina las consultas; destacar 'rinde el doble' y envío gratis reduciría objeciones.",
      status: "generated",
    },
  });

  await prisma.voiceBrief.create({
    data: {
      businessProfileId: business.id,
      audioUrl: "https://example.com/audios/brief-demo.ogg",
      transcription:
        "Hola, quiero promocionar la sanitaria de 25 litros esta semana, tengo envío gratis en Florida, el presupuesto es como diez dólares por día.",
      extractedBrief: {
        producto: "Sanitaria 25L",
        oferta: "Envío gratis en Florida",
        presupuesto: "10 USD/día",
        objetivo: "Promoción semanal",
      },
      status: "processed",
    },
  });

  console.log("🌱 Sembrando estrategia de marketing…");
  await prisma.marketStrategy.create({
    data: {
      businessProfileId: business.id,
      dominantAwarenessLevel: "product",
      brandDna: {
        identidad: "Agro y Mascotas Centro",
        rubro: "Mascotas y agro",
        tono: "Cercano, simple y vendedor",
        estiloVisual: "Limpio, colores naturales, producto protagonista",
        colores: ["#166534", "#f59e0b"],
        propuestaValor: "Sanitaria que rinde el doble, con asesoramiento cercano y envío en Florida.",
        producto: "Sanitaria aglomerante Cat Litter 25L",
        precio: 890,
      },
      avatar: {
        publico: "Dueños de gatos, familias y personas con mascotas",
        zona: "Florida, Uruguay",
        deseosReiss: ["Familia", "Tranquilidad", "Aceptación", "Ahorro"],
        dolores: ["Me parece caro", "Después veo"],
        deseos: ["Sanitaria 25L", "Envíos"],
      },
      offer: {
        queOfrece: "Sanitaria aglomerante Cat Litter 25L a $890",
        diferenciales: ["Atención cercana y rápida", "Asesoramiento honesto", "Envío gratis por zona", "Combo sanitaria + alimento"],
        ofertaGancho: "Envío gratis en Florida",
      },
      competitors: [
        { nombre: "Competencia típica del rubro en Florida, Uruguay", angulo: "Producto + precio", oferta: "Descuentos puntuales", hooks: ["Precio bajo", "Promo del día"], nota: "Reemplazar con competidores reales (espionaje real se conecta luego)." },
        { nombre: "Tiendas grandes / cadenas", angulo: "Variedad y precio", oferta: "Catálogo amplio y envío", hooks: ["Todo en un lugar"], nota: "Tu ventaja: cercanía, asesoramiento y trato personal." },
      ],
      sevenSuitcases: {
        publico: "Dueños de gatos, familias y personas con mascotas",
        problema: 'Lo que frena: "Me parece caro"',
        solucion: "Sanitaria aglomerante Cat Litter 25L",
        diferenciales: ["Atención cercana y rápida", "Asesoramiento honesto", "Envío gratis por zona"],
        objeciones: [
          { objecion: "Me parece caro", respuesta: "La de 25L rinde el doble: te dura más y el costo por uso es menor." },
          { objecion: "Después veo", respuesta: "Hoy hay envío sin costo en Florida; cuando quieras te lo coordino." },
        ],
        testimonios: ["Pedir 2-3 testimonios reales de clientes (texto o captura de WhatsApp)."],
        garantia: "Garantía de satisfacción: si no te convence, lo cambiamos.",
      },
      awarenessMap: [
        { key: "unaware", label: "Inconsciente", angulo: "Educar sobre el contexto", copy: "¿Sabías esto sobre el cuidado de tu gato? Te lo contamos simple." },
        { key: "problem", label: "Consciente del problema", angulo: "Nombrar el dolor", copy: "¿Cansado de cambiar la sanitaria todo el tiempo? Hay una salida." },
        { key: "solution", label: "Consciente de la solución", angulo: "Mostrar que existe solución", copy: "Una sanitaria que rinde el doble. Mirá cómo." },
        { key: "product", label: "Consciente del producto", angulo: "Por qué nosotros", copy: "Cat Litter 25L a $890 — y por qué te conviene elegirnos." },
        { key: "most_aware", label: "El más consciente", angulo: "Oferta + urgencia + CTA", copy: "Envío gratis en Florida. Escribinos por WhatsApp y lo coordinamos hoy." },
      ],
      scriptGuide: [
        { nombre: "Problema → Solución", estructura: ["Hook con el problema", "Agitar el dolor", "Mostrar la sanitaria 25L como solución", "Prueba / demostración", "CTA a WhatsApp"] },
        { nombre: "UGC / Testimonio", estructura: ["Hook personal", "El antes", "El después", "Recomendación honesta", "CTA"] },
        { nombre: "Demostración", estructura: ["Hook de curiosidad", "Mostrar cuánto rinde", "Beneficio clave", "Oferta", "CTA"] },
      ],
      creativeMatrix: [
        { deseo: "Familia", nivel: "problem", formato: "reel", hook: '"Si te preocupa el bienestar de tu gato, mirá esto 👀"' },
        { deseo: "Familia", nivel: "product", formato: "imagen", hook: "Cat Litter 25L: pensada para tu familia y tu gato" },
        { deseo: "Tranquilidad", nivel: "solution", formato: "reel", hook: '"La forma simple de tener la casa sin olor (y que rinda)"' },
        { deseo: "Tranquilidad", nivel: "most_aware", formato: "imagen", hook: "Envío gratis en Florida — solo por esta semana" },
        { deseo: "Aceptación", nivel: "problem", formato: "imagen", hook: '"Lo que nadie te cuenta antes de comprar sanitaria"' },
        { deseo: "Ahorro", nivel: "solution", formato: "reel", hook: '"Rinde el doble: te explico por qué te ahorra plata"' },
        { deseo: "Ahorro", nivel: "most_aware", formato: "reel", hook: '"Última oportunidad: Cat Litter 25L a $890"' },
      ],
      budgetCalc: {
        ticketPromedio: 890,
        margenPorClientePct: 0.25,
        costoPorCompraObjetivo: 223,
        numeroMagicoDescripcion: "El número mágico es el costo por resultado: si pagás más que esto por compra, perdés rentabilidad.",
        roasObjetivo: 4,
        presupuestoMensual: 300,
        inversionDiariaSugerida: 10,
        semaforo: {
          verde: "Costo por compra ≤ 223: escalar",
          amarillo: "Costo por compra entre 223 y 290: optimizar",
          rojo: "Costo por compra > 290: pausar y revisar",
        },
        nota: "Moneda según el ticket cargado. Ajustá margen y ROAS objetivo a tu realidad.",
      },
      campaignStructure: [
        { etapa: "Presentación", objetivo: "Reconocimiento / Reproducciones de video", presupuestoPct: 0.15, publico: "Frío amplio del rubro en Florida", exclusiones: "Compradores", ubicaciones: "Feed, Reels, Stories" },
        { etapa: "Evaluación", objetivo: "Interacción / Tráfico / Mensajes", presupuestoPct: 0.25, publico: "Frío interesado + públicos similares (lookalike)", exclusiones: "Compradores", ubicaciones: "Feed, Reels" },
        { etapa: "Conversión", objetivo: "Ventas / Mensajes a WhatsApp", presupuestoPct: 0.45, publico: "Tibio: interactuaron, vieron video, visitaron", exclusiones: "Compradores últimos 30 días", ubicaciones: "Feed, Stories, Reels" },
        { etapa: "Ascensión", objetivo: "Recompra / Upsell", presupuestoPct: 0.15, publico: "Compradores", exclusiones: "—", ubicaciones: "Feed, Stories" },
      ],
      summary:
        'Estrategia para Agro y Mascotas Centro (Mascotas y agro). Nivel de consciencia dominante: Consciente del producto. Foco: responder "Me parece caro" y destacar que rinde el doble + envío gratis.',
      status: "generated",
    },
  });

  console.log("✅ Seed completo.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
