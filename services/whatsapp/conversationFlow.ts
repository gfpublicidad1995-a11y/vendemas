import { prisma } from "@/lib/prisma";
import { quickCampaignService } from "@/services/content/quickCampaignService";
import { whatsappTemplates } from "@/services/whatsapp";

/**
 * WhatsAppConversationService (flujo del simulador).
 * Máquina de estados simple que cubre los caminos clave del MVP:
 * alta de negocio, Campaña Rápida y aprobación / cambios.
 */

export type SimPhase =
  | "start"
  | "collecting_business_name"
  | "collecting_category"
  | "collecting_city"
  | "collecting_offer"
  | "ready"
  | "qc_business"
  | "qc_category"
  | "qc_product"
  | "qc_offer"
  | "qc_budget"
  | "qc_generating"
  | "waiting_approval"
  | "collecting_changes";

export interface SimSession {
  phone: string;
  phase: SimPhase;
  userId?: string;
  businessProfileId?: string;
  businessName?: string;
  ownBusiness?: boolean;
  draft: Record<string, string>;
  lastOrderId?: string;
  lastDeliveryUrl?: string;
}

export interface BotReply {
  text: string;
  deliveryUrl?: string;
  orderId?: string;
}

export interface TurnResult {
  session: SimSession;
  replies: BotReply[];
}

const MENU =
  "¿Qué querés hacer?\n• Escribí algo como \"quiero vender más esta semana\" para una Campaña Rápida ⚡\n• O contame qué producto querés promocionar.";

export function newSession(phone: string): SimSession {
  return { phone, phase: "start", draft: {} };
}

async function record(session: SimSession, direction: "inbound" | "outbound", content: string) {
  await prisma.whatsAppMessage.create({
    data: {
      userId: session.userId,
      businessProfileId: session.businessProfileId,
      phone: session.phone,
      direction,
      messageType: "text",
      content,
    },
  });
}

export async function handleTurn(input: SimSession, text: string): Promise<TurnResult> {
  const session: SimSession = { ...input, draft: { ...input.draft } };
  const replies: BotReply[] = [];
  const say = (text: string, extra?: Partial<BotReply>) => replies.push({ text, ...extra });
  const t = text.trim();

  await record(session, "inbound", t);

  // Resolver negocio existente por teléfono al inicio.
  if (!session.businessProfileId && (session.phase === "start" || session.phase === "ready")) {
    const user = await prisma.user.findUnique({
      where: { phone: session.phone },
      include: { businessProfiles: { take: 1 } },
    });
    if (user?.businessProfiles[0]) {
      session.userId = user.id;
      session.businessProfileId = user.businessProfiles[0].id;
      session.businessName = user.businessProfiles[0].businessName;
      if (session.phase === "start") session.phase = "ready";
    }
  }

  switch (session.phase) {
    case "start": {
      session.phase = "collecting_business_name";
      say("¡Hola! 👋 Soy VendeMás, tu agencia de contenido y anuncios por WhatsApp.");
      say("Para arrancar, ¿cómo se llama tu negocio?");
      break;
    }
    case "collecting_business_name": {
      session.draft.businessName = t;
      session.phase = "collecting_category";
      say(`¡Buenísimo, ${t}! ¿De qué rubro es? (ej: mascotas, ropa, comida…)`);
      break;
    }
    case "collecting_category": {
      session.draft.category = t;
      session.phase = "collecting_city";
      say("¿En qué ciudad estás?");
      break;
    }
    case "collecting_city": {
      session.draft.city = t;
      session.phase = "collecting_offer";
      say("Última: ¿cuál es tu oferta o producto principal?");
      break;
    }
    case "collecting_offer": {
      session.draft.offer = t;
      const user = await prisma.user.upsert({
        where: { phone: session.phone },
        update: {},
        create: { name: session.draft.businessName ?? "Emprendedor/a", phone: session.phone, role: "owner" },
      });
      const business = await prisma.businessProfile.create({
        data: {
          userId: user.id,
          businessName: session.draft.businessName ?? "Mi negocio",
          category: session.draft.category ?? "General",
          city: session.draft.city,
          country: "Uruguay",
          mainOffer: session.draft.offer,
          toneOfVoice: "Cercano, simple y vendedor",
          consentToAnalyzeConversations: true,
          digestWhatsappOptIn: true,
          brandKit: {
            create: { toneOfVoice: "Cercano, simple y vendedor", visualStyle: "Limpio y comercial" },
          },
        },
      });
      session.userId = user.id;
      session.businessProfileId = business.id;
      session.businessName = business.businessName;
      session.ownBusiness = true;
      session.phase = "ready";
      say(`¡Listo! Tu negocio "${business.businessName}" ya está cargado en VendeMás 🎉`);
      say(MENU);
      break;
    }
    case "ready": {
      if (quickCampaignService.detectQuickCampaignIntent(t)) {
        if (session.ownBusiness && session.businessProfileId) {
          session.phase = "qc_product";
          say(`¡Vamos con una Campaña Rápida para ${session.businessName}! ⚡ ¿Qué producto o servicio querés vender?`);
        } else {
          session.phase = "qc_business";
          say("¡Vamos con una Campaña Rápida! ⚡ Primero, ¿cómo se llama tu negocio?");
        }
      } else {
        say("Te leo 🙂");
        say(MENU);
      }
      break;
    }
    case "qc_business": {
      session.draft.businessName = t;
      session.phase = "qc_category";
      say(`¡Buenísimo, ${t}! ¿De qué rubro es? (ej: ropa, comida, mascotas…)`);
      break;
    }
    case "qc_category": {
      session.draft.category = t;
      session.phase = "qc_product";
      say("¿Qué producto o servicio querés promocionar?");
      break;
    }
    case "qc_product": {
      session.draft.product = t;
      session.phase = "qc_offer";
      say("Perfecto. ¿Cuál es el precio o la promo? (ej: $890 con envío gratis)");
      break;
    }
    case "qc_offer": {
      session.draft.qcOffer = t;
      session.phase = "qc_budget";
      say("¿Cuánto pensás invertir por día? (ej: USD 10/día)");
      break;
    }
    case "qc_budget": {
      session.draft.budget = t;

      // Resolver el negocio: si la persona ya tiene el suyo registrado, usarlo;
      // si no, crear/usar uno con el nombre y rubro que escribió. Así el contenido
      // y la respuesta se adaptan a SU negocio (no al de ejemplo).
      let businessProfileId =
        session.ownBusiness && session.businessProfileId ? session.businessProfileId : undefined;
      if (!businessProfileId) {
        const name = session.draft.businessName?.trim() || "Mi negocio";
        const user = await prisma.user.upsert({
          where: { phone: session.phone },
          update: {},
          create: { name, phone: session.phone, role: "owner" },
        });
        const existing = await prisma.businessProfile.findFirst({
          where: { userId: user.id, businessName: name },
        });
        const business =
          existing ??
          (await prisma.businessProfile.create({
            data: {
              userId: user.id,
              businessName: name,
              category: session.draft.category?.trim() || "General",
              country: "Uruguay",
              mainOffer: session.draft.qcOffer || session.draft.product || null,
              toneOfVoice: "Cercano, simple y vendedor",
              consentToAnalyzeConversations: true,
              digestWhatsappOptIn: true,
              brandKit: {
                create: { toneOfVoice: "Cercano, simple y vendedor", visualStyle: "Limpio y comercial" },
              },
            },
          }));
        session.userId = user.id;
        session.businessProfileId = business.id;
        session.businessName = business.businessName;
        session.ownBusiness = true;
        businessProfileId = business.id;
      }

      const order = await quickCampaignService.generateQuickCampaignOrder(businessProfileId, {
        productOrService: session.draft.product,
        offer: session.draft.qcOffer,
        budget: session.draft.budget,
        objective: "Vender más esta semana",
      });
      const result = await quickCampaignService.generateQuickCampaignContent(order.id);
      session.lastOrderId = order.id;
      session.lastDeliveryUrl = result.deliveryUrl;
      session.phase = "waiting_approval";
      say("¡Listo! Te armé historias, carrusel, anuncios, copies, guion de reel y los visuales en 4:5, 1:1 y 9:16 ✨");
      say(
        whatsappTemplates.deliveryLink(session.businessName ?? "tu negocio", result.deliveryUrl),
        { deliveryUrl: result.deliveryUrl, orderId: order.id }
      );
      break;
    }
    case "waiting_approval": {
      const choice = t.toLowerCase();
      if (choice === "1" || choice.includes("aprob")) {
        if (session.lastOrderId) {
          await prisma.contentApproval.updateMany({
            where: { contentOrderId: session.lastOrderId, status: "pending" },
            data: { status: "approved", approvedAt: new Date() },
          });
        }
        session.phase = "ready";
        say("¡Aprobado! 🙌 Dejamos todo listo. Cuando quieras, pedimos otra campaña.");
      } else if (choice === "2" || choice.includes("cambio")) {
        session.phase = "collecting_changes";
        say("Decime qué querés cambiar (ej: \"hacelo más corto\" o \"más vendedor\").");
      } else if (choice === "3" || choice.includes("vendedor")) {
        await createRevision(session, "Hacerlo más vendedor");
        say("Lo hago más vendedor y te aviso 🔥");
        session.phase = "waiting_approval";
      } else if (choice === "4" || choice === "5" || choice.includes("versi")) {
        await createRevision(session, "Crear más versiones");
        say("Te genero más versiones 👍");
      } else {
        say("Respondé: 1 Aprobar · 2 Pedir cambios · 3 Más vendedor · 4 Más versiones");
      }
      break;
    }
    case "collecting_changes": {
      await createRevision(session, t);
      session.phase = "waiting_approval";
      say(`¡Anotado! Ajustamos: "${t}" y te reenvío la versión nueva.`);
      if (session.lastDeliveryUrl) say(`Mirala acá: ${session.lastDeliveryUrl}`, { deliveryUrl: session.lastDeliveryUrl });
      break;
    }
    default:
      say(MENU);
  }

  for (const r of replies) await record(session, "outbound", r.text);
  return { session, replies };
}

async function createRevision(session: SimSession, instruction: string) {
  if (!session.lastOrderId || !session.businessProfileId || !session.userId) return;
  await prisma.revisionRequest.create({
    data: {
      contentOrderId: session.lastOrderId,
      businessProfileId: session.businessProfileId,
      requestedByUserId: session.userId,
      instruction,
      status: "pending",
    },
  });
  await prisma.contentApproval.updateMany({
    where: { contentOrderId: session.lastOrderId, status: "pending" },
    data: { status: "changes_requested", feedback: instruction },
  });
}
