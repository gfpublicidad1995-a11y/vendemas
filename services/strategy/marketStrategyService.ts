import { prisma } from "@/lib/prisma";
import { asStringArray } from "@/lib/json";
import { industryPlaybookService } from "@/services/industry/industryPlaybookService";
import { conversationIntelligenceService } from "@/services/conversations/conversationIntelligenceService";
import { aiService } from "@/services/ai";
import type { BusinessContext, StrategyBrainSignals } from "@/services/ai";

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
    const price = parsePrice(business.mainOffer);

    // --- Cerebro estratégico generado por IA (con fallback heurístico) ---
    const ctx: BusinessContext = {
      businessName: business.businessName,
      category: business.category,
      city: business.city,
      toneOfVoice: business.toneOfVoice ?? business.brandKit?.toneOfVoice ?? null,
      mainOffer: business.mainOffer,
      targetAudience: business.targetAudience,
      description: business.description,
    };
    const signals: StrategyBrainSignals = {
      zona,
      precio: price,
      objeciones: objections.map((o) => ({
        objecion: o.objection,
        respuesta: o.suggestedResponse ?? "Destacá el valor real y bajá el riesgo percibido.",
      })),
      topPreguntas: summary.topQuestions,
      topIntereses: summary.topProductInterests,
      ofertasSugeridas: offers,
      angulosContenido: angles,
      deseosSugeridos: desiresForCategory(business.category),
      reissOpciones: [...REISS_16],
      niveles: AWARENESS_LEVELS.map((l) => ({ key: l.key, label: l.label, focus: l.focus })),
    };
    const brain = await aiService.generateStrategyBrain(ctx, signals);

    // --- ADN de marca ---
    const brandDna = {
      identidad: business.businessName,
      rubro: business.category,
      tono: business.toneOfVoice ?? business.brandKit?.toneOfVoice ?? "Cercano, simple y vendedor",
      estiloVisual: business.brandKit?.visualStyle ?? "Limpio y comercial",
      colores: [business.brandKit?.primaryColor, business.brandKit?.secondaryColor].filter(Boolean),
      propuestaValor: brain.propuestaValor,
      producto: business.mainOffer,
      precio: price,
    };

    // --- Avatar (16 deseos de Reiss) ---
    const avatar = {
      publico: business.targetAudience ?? "Público objetivo del rubro",
      zona,
      perfil: brain.avatarPerfil,
      deseosReiss: brain.deseosReiss,
      dolores: brain.dolores,
      deseos: brain.deseos,
    };

    // --- Oferta ---
    const offer = {
      queOfrece: business.mainOffer ?? "Producto/servicio principal",
      diferenciales: brain.diferenciales,
      ofertaGancho: brain.ofertaGancho,
    };

    // --- Competidores (típicos del rubro; nota = cómo superarlos) ---
    const competitors = brain.competidores.map((c) => ({
      nombre: c.nombre,
      angulo: c.angulo,
      oferta: c.oferta,
      nota: c.comoSuperarlo,
    }));

    // --- 7 maletas de cualquier compra ---
    const sevenSuitcases = {
      publico: business.targetAudience ?? "Definir público concreto",
      problema: brain.problema,
      solucion: brain.solucion,
      diferenciales: brain.diferenciales,
      objeciones: brain.objeciones,
      testimonios: brain.testimonios,
      garantia: brain.garantia,
    };

    // --- Nivel de consciencia dominante (según señales de conversaciones) ---
    let dominantAwarenessLevel = "problem";
    if (summary.purchaseIntentCount > 0) dominantAwarenessLevel = "most_aware";
    else if (summary.topObjections.length > 0) dominantAwarenessLevel = "product";
    else if (summary.topQuestions.length > 0) dominantAwarenessLevel = "solution";

    // --- Mapa de niveles de consciencia (copys por nivel, generados por IA) ---
    const awarenessMap = AWARENESS_LEVELS.map((l) => {
      const c = brain.awarenessCopies.find((x) => x.key === l.key);
      return { key: l.key, label: l.label, angulo: c?.angulo ?? l.focus, copy: c?.copy ?? "" };
    });

    // --- Guía de guiones + matriz de diversificación creativa (IA) ---
    const scriptGuide = brain.scriptGuide;
    const creativeMatrix = brain.creativeHooks;

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
    }. Foco: responder "${sevenSuitcases.problema}" y destacar ${(offer.diferenciales[0] ?? "tu diferencial").toLowerCase()}.`;

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
