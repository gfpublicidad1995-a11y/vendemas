import { prisma } from "@/lib/prisma";
import { asStringArray } from "@/lib/json";
import { industryPlaybookService } from "@/services/industry/industryPlaybookService";
import { conversationIntelligenceService } from "@/services/conversations/conversationIntelligenceService";

/**
 * MarketStrategyService — inteligencia de marketing nativa de VendeMás,
 * basada en las metodologías de Felipe Vergara:
 *  - ADN de marca + avatar (16 deseos de Reiss)
 *  - Las 7 maletas de cualquier compra (público, problema, solución,
 *    diferenciales, objeciones, testimonios, garantía)
 *  - 5 niveles de consciencia (Eugene Schwartz)
 *  - Diversificación creativa (deseo × nivel → hooks para reel e imagen)
 *  - Guía de guiones
 *  - Calculadora de presupuesto (número mágico = costo por resultado objetivo)
 *  - Estructura de campañas (Presentación, Evaluación, Conversión, Ascensión)
 *
 * Todo se genera con reglas + los datos del negocio (rubro, marca, conversaciones).
 */

// 16 deseos de Reiss
export const REISS_16 = [
  "Poder", "Curiosidad", "Independencia", "Estatus", "Contacto social",
  "Venganza", "Honor", "Idealismo", "Ejercicio físico", "Romance",
  "Familia", "Orden", "Comer", "Aceptación", "Tranquilidad", "Ahorro",
] as const;

// 5 niveles de consciencia
export const AWARENESS_LEVELS = [
  { key: "unaware", label: "Inconsciente", focus: "Ni sabe que tiene el problema." },
  { key: "problem", label: "Consciente del problema", focus: "Siente el dolor pero no conoce la solución." },
  { key: "solution", label: "Consciente de la solución", focus: "Sabe que hay soluciones, compara opciones." },
  { key: "product", label: "Consciente del producto", focus: "Conoce tu producto, evalúa si comprar." },
  { key: "most_aware", label: "El más consciente", focus: "Listo para comprar, solo necesita la oferta y el empujón." },
] as const;

const DESIRES_BY_CATEGORY: { match: string; desires: string[] }[] = [
  { match: "mascota", desires: ["Familia", "Tranquilidad", "Aceptación", "Ahorro"] },
  { match: "agro", desires: ["Orden", "Ahorro", "Tranquilidad", "Familia"] },
  { match: "ropa", desires: ["Estatus", "Aceptación", "Romance", "Orden"] },
  { match: "comida", desires: ["Comer", "Familia", "Contacto social", "Tranquilidad"] },
  { match: "belleza", desires: ["Estatus", "Aceptación", "Romance", "Tranquilidad"] },
  { match: "gimnasi", desires: ["Ejercicio físico", "Estatus", "Aceptación", "Poder"] },
  { match: "servicio", desires: ["Tranquilidad", "Orden", "Ahorro", "Poder"] },
  { match: "tienda", desires: ["Ahorro", "Curiosidad", "Estatus", "Aceptación"] },
];

function desiresForCategory(category: string): string[] {
  const c = category.toLowerCase();
  return (
    DESIRES_BY_CATEGORY.find((d) => c.includes(d.match))?.desires ?? [
      "Tranquilidad", "Aceptación", "Ahorro", "Familia",
    ]
  );
}

function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.replace(/\./g, "").match(/(\d{2,7})/);
  return m ? Number(m[1]) : null;
}

const j = (v: unknown) => JSON.parse(JSON.stringify(v));

export class MarketStrategyService {
  async generateStrategy(businessProfileId: string) {
    const business = await prisma.businessProfile.findUnique({
      where: { id: businessProfileId },
      include: { brandKit: true },
    });
    if (!business) throw new Error("Negocio no encontrado");

    const [summary, objections, angles, offers] = await Promise.all([
      conversationIntelligenceService.analyzeBusinessConversations(businessProfileId),
      prisma.objectionInsight.findMany({ where: { businessProfileId } }),
      industryPlaybookService.suggestContentAngles(business.category),
      // ofertas sugeridas del playbook
      industryPlaybookService
        .getPlaybookByIndustry(business.category)
        .then((p) => asStringArray(p?.suggestedOffers)),
    ]);

    const zona = business.city ? `${business.city}${business.country ? `, ${business.country}` : ""}` : "tu zona";
    const desires = desiresForCategory(business.category);
    const price = parsePrice(business.mainOffer);

    // --- ADN de marca ---
    const brandDna = {
      identidad: business.businessName,
      rubro: business.category,
      tono: business.toneOfVoice ?? business.brandKit?.toneOfVoice ?? "Cercano, simple y vendedor",
      estiloVisual: business.brandKit?.visualStyle ?? "Limpio y comercial",
      colores: [business.brandKit?.primaryColor, business.brandKit?.secondaryColor].filter(Boolean),
      propuestaValor: business.mainOffer
        ? `${business.businessName} resuelve la necesidad de ${business.targetAudience ?? "su público"} con ${business.mainOffer}.`
        : `${business.businessName} para ${business.targetAudience ?? "su público"}.`,
      producto: business.mainOffer,
      precio: price,
    };

    // --- Avatar (16 deseos de Reiss) ---
    const avatar = {
      publico: business.targetAudience ?? "Público objetivo del rubro",
      zona,
      deseosReiss: desires,
      dolores: objections.map((o) => o.objection),
      deseos: summary.topProductInterests.length ? summary.topProductInterests : angles.slice(0, 2),
    };

    // --- Oferta ---
    const offer = {
      queOfrece: business.mainOffer ?? "Producto/servicio principal",
      diferenciales: ["Atención cercana y rápida", "Asesoramiento honesto", ...offers].slice(0, 4),
      ofertaGancho: offers[0] ?? "Beneficio por tiempo limitado",
    };

    // --- Competidores (típicos del rubro en la zona) ---
    const competitors = [
      {
        nombre: `Competencia típica del rubro en ${zona}`,
        angulo: angles[0] ?? "Producto + precio",
        oferta: offers[0] ?? "Descuentos puntuales",
        hooks: ["Precio bajo", "Promo del día"],
        nota: "Reemplazar con competidores reales (la herramienta de espionaje real se conecta luego).",
      },
      {
        nombre: "Tiendas grandes / cadenas",
        angulo: "Variedad y precio",
        oferta: "Envío y catálogo amplio",
        hooks: ["Todo en un lugar", "Marcas conocidas"],
        nota: "Tu ventaja: cercanía, asesoramiento y trato personal.",
      },
    ];

    // --- 7 maletas de cualquier compra ---
    const sevenSuitcases = {
      publico: business.targetAudience ?? "Definir público concreto",
      problema: objections[0]?.objection
        ? `Lo que frena: "${objections[0].objection}"`
        : "El cliente no encuentra una opción confiable y cercana.",
      solucion: business.mainOffer ?? "Tu producto/servicio principal",
      diferenciales: offer.diferenciales,
      objeciones: objections.length
        ? objections.map((o) => ({ objecion: o.objection, respuesta: o.suggestedResponse }))
        : [{ objecion: "Me parece caro", respuesta: "Destacar valor y costo por uso; sumar un beneficio." }],
      testimonios: ["Pedir 2-3 testimonios reales de clientes (texto o captura de WhatsApp)."],
      garantia: "Ofrecer una garantía simple (satisfacción / cambio) para bajar el riesgo percibido.",
    };

    // --- Nivel de consciencia dominante ---
    let dominantAwarenessLevel = "problem";
    if (summary.purchaseIntentCount > 0) dominantAwarenessLevel = "most_aware";
    else if (summary.topObjections.length > 0) dominantAwarenessLevel = "product";
    else if (summary.topQuestions.length > 0) dominantAwarenessLevel = "solution";

    // --- Mapa de niveles de consciencia ---
    const oferta = business.mainOffer ?? "tu oferta";
    const awarenessMap = [
      { key: "unaware", label: "Inconsciente", angulo: "Educar sobre el contexto", copy: `¿Sabías esto sobre ${business.category.toLowerCase()}? Te lo contamos simple.` },
      { key: "problem", label: "Consciente del problema", angulo: "Nombrar el dolor", copy: `Si te pasa ${sevenSuitcases.problema.toLowerCase()}, no sos el único. Hay una salida.` },
      { key: "solution", label: "Consciente de la solución", angulo: "Mostrar que existe solución", copy: `Así se resuelve, sin complicarte. Mirá cómo.` },
      { key: "product", label: "Consciente del producto", angulo: "Por qué nosotros", copy: `${oferta} — y por qué te conviene elegirnos a nosotros.` },
      { key: "most_aware", label: "El más consciente", angulo: "Oferta + urgencia + CTA", copy: `${offer.ofertaGancho}. Escribinos por WhatsApp y lo coordinamos hoy.` },
    ];

    // --- Guía de guiones (reels) ---
    const scriptGuide = [
      { nombre: "Problema → Solución", estructura: ["Hook con el problema", "Agitar el dolor", `Mostrar ${oferta} como solución`, "Prueba / demostración", "CTA a WhatsApp"] },
      { nombre: "UGC / Testimonio", estructura: ["Hook personal", "El antes", "El después", "Recomendación honesta", "CTA"] },
      { nombre: "Demostración", estructura: ["Hook de curiosidad", "Mostrar el uso real", "Beneficio clave", "Oferta", "CTA"] },
    ];

    // --- Matriz de diversificación creativa (deseo × nivel → hook) ---
    const creativeMatrix = [
      { deseo: desires[0], nivel: "problem", formato: "reel", hook: `"Si te preocupa ${desires[0].toLowerCase()}, mirá esto 👀"` },
      { deseo: desires[0], nivel: "product", formato: "imagen", hook: `${oferta}: pensado para ${avatar.publico.toLowerCase()}` },
      { deseo: desires[1], nivel: "solution", formato: "reel", hook: `"La forma simple de resolverlo (y rinde)"` },
      { deseo: desires[1], nivel: "most_aware", formato: "imagen", hook: `${offer.ofertaGancho} — solo por esta semana` },
      { deseo: desires[2], nivel: "problem", formato: "imagen", hook: `"Lo que nadie te cuenta antes de comprar"` },
      { deseo: desires[2], nivel: "solution", formato: "reel", hook: `"3 razones para elegir bien"` },
      { deseo: desires[3] ?? desires[0], nivel: "most_aware", formato: "reel", hook: `"Última oportunidad: ${oferta}"` },
      { deseo: desires[3] ?? desires[1], nivel: "product", formato: "imagen", hook: `Comparalo: por qué conviene ${business.businessName}` },
    ];

    // --- Calculadora de presupuesto (número mágico) ---
    const ticket = price ?? 1000;
    const margenPct = 0.25; // % del ticket que se puede pagar por cliente
    const costoPorCompraObjetivo = Math.round(ticket * margenPct);
    const roasObjetivo = Math.round((1 / margenPct) * 10) / 10; // ~4x
    const monthlyBudget = business.monthlyAdBudget ?? 300;
    const inversionDiaria = Math.round((monthlyBudget / 30) * 100) / 100;
    const budgetCalc = {
      ticketPromedio: ticket,
      margenPorClientePct: margenPct,
      costoPorCompraObjetivo, // "número mágico" = costo por resultado objetivo
      numeroMagicoDescripcion:
        "El número mágico es el costo por resultado: si pagás más que esto por compra, perdés rentabilidad.",
      roasObjetivo,
      presupuestoMensual: monthlyBudget,
      inversionDiariaSugerida: inversionDiaria,
      semaforo: {
        verde: `Costo por compra ≤ ${costoPorCompraObjetivo}: escalar`,
        amarillo: `Costo por compra entre ${costoPorCompraObjetivo} y ${Math.round(costoPorCompraObjetivo * 1.3)}: optimizar`,
        rojo: `Costo por compra > ${Math.round(costoPorCompraObjetivo * 1.3)}: pausar y revisar`,
      },
      nota: "Moneda según el ticket cargado. Ajustá margen y ROAS objetivo a tu realidad.",
    };

    // --- Estructura de campañas (Presentación / Evaluación / Conversión / Ascensión) ---
    const campaignStructure = [
      { etapa: "Presentación", objetivo: "Reconocimiento / Reproducciones de video", presupuestoPct: 0.15, publico: `Frío amplio del rubro en ${zona}`, exclusiones: "Compradores", ubicaciones: "Feed, Reels, Stories" },
      { etapa: "Evaluación", objetivo: "Interacción / Tráfico / Mensajes", presupuestoPct: 0.25, publico: "Frío interesado + públicos similares (lookalike)", exclusiones: "Compradores", ubicaciones: "Feed, Reels" },
      { etapa: "Conversión", objetivo: "Ventas / Mensajes a WhatsApp", presupuestoPct: 0.45, publico: "Tibio: interactuaron, vieron video, visitaron", exclusiones: "Compradores últimos 30 días", ubicaciones: "Feed, Stories, Reels" },
      { etapa: "Ascensión", objetivo: "Recompra / Upsell", presupuestoPct: 0.15, publico: "Compradores", exclusiones: "—", ubicaciones: "Feed, Stories" },
    ];

    const summaryText = `Estrategia para ${business.businessName} (${business.category}). Nivel de consciencia dominante: ${
      AWARENESS_LEVELS.find((l) => l.key === dominantAwarenessLevel)?.label
    }. Foco: responder "${sevenSuitcases.problema}" y destacar ${offer.diferenciales[0].toLowerCase()}.`;

    return prisma.marketStrategy.upsert({
      where: { businessProfileId },
      update: {
        brandDna: j(brandDna),
        avatar: j(avatar),
        offer: j(offer),
        competitors: j(competitors),
        sevenSuitcases: j(sevenSuitcases),
        dominantAwarenessLevel,
        awarenessMap: j(awarenessMap),
        scriptGuide: j(scriptGuide),
        creativeMatrix: j(creativeMatrix),
        budgetCalc: j(budgetCalc),
        campaignStructure: j(campaignStructure),
        summary: summaryText,
        status: "generated",
      },
      create: {
        businessProfileId,
        brandDna: j(brandDna),
        avatar: j(avatar),
        offer: j(offer),
        competitors: j(competitors),
        sevenSuitcases: j(sevenSuitcases),
        dominantAwarenessLevel,
        awarenessMap: j(awarenessMap),
        scriptGuide: j(scriptGuide),
        creativeMatrix: j(creativeMatrix),
        budgetCalc: j(budgetCalc),
        campaignStructure: j(campaignStructure),
        summary: summaryText,
        status: "generated",
      },
    });
  }
}

export const marketStrategyService = new MarketStrategyService();
