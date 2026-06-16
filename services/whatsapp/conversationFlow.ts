import { prisma } from "@/lib/prisma";
import { quickCampaignService } from "@/services/content/quickCampaignService";
import { marketStrategyService } from "@/services/strategy/marketStrategyService";
import { whatsappTemplates } from "@/services/whatsapp";
import { aiService } from "@/services/ai";
import type { BusinessContext, ChatTurn } from "@/services/ai";

/**
 * WhatsAppConversationService (flujo del simulador / webhook).
 * La conversación de "gathering" la maneja la IA: entiende lo que escribe el
 * cliente, responde natural y extrae los datos (producto, oferta, presupuesto).
 * Cuando tiene lo necesario, genera la Campaña Rápida. La aprobación queda
 * estructurada (1 aprobar · 2 cambios · 3 más vendedor · 4 más versiones).
 */

export type SimPhase = "chatting" | "waiting_approval" | "collecting_changes";

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

export function newSession(phone: string): SimSession {
  return { phone, phase: "chatting", draft: {} };
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

async function loadHistory(phone: string): Promise<ChatTurn[]> {
  const msgs = await prisma.whatsAppMessage.findMany({
    where: { phone },
    orderBy: { createdAt: "desc" },
    take: 16,
  });
  return msgs
    .reverse()
    .map((m) => ({
      from: m.direction === "inbound" ? ("user" as const) : ("bot" as const),
      text: m.content ?? "",
    }));
}

export async function handleTurn(
  input: SimSession,
  text: string,
  photos?: { product?: string; logo?: string; founder?: string },
): Promise<TurnResult> {
  const session: SimSession = { ...input, draft: { ...input.draft } };
  const replies: BotReply[] = [];
  const say = (text: string, extra?: Partial<BotReply>) => replies.push({ text, ...extra });
  const t = text.trim();

  await record(session, "inbound", t);

  if (session.phase === "waiting_approval") {
    const choice = t.toLowerCase();
    if (choice === "1" || choice.includes("aprob")) {
      if (session.lastOrderId) {
        await prisma.contentApproval.updateMany({
          where: { contentOrderId: session.lastOrderId, status: "pending" },
          data: { status: "approved", approvedAt: new Date() },
        });
      }
      session.phase = "chatting";
      say("¡Aprobado! 🙌 Quedó todo listo. Cuando quieras armamos otra campaña.");
    } else if (choice === "2" || choice.includes("cambio")) {
      session.phase = "collecting_changes";
      say("Decime qué querés cambiar (ej: «hacelo más corto» o «más vendedor»).");
    } else if (choice === "3" || choice.includes("vendedor")) {
      await createRevision(session, "Hacerlo más vendedor");
      say("Lo hago más vendedor y te aviso 🔥");
    } else if (choice === "4" || choice === "5" || choice.includes("versi")) {
      await createRevision(session, "Crear más versiones");
      say("Te genero más versiones 👍");
    } else {
      say("Respondé: 1 Aprobar · 2 Pedir cambios · 3 Más vendedor · 4 Más versiones");
    }
  } else if (session.phase === "collecting_changes") {
    await createRevision(session, t);
    session.phase = "waiting_approval";
    say(`¡Anotado! Ajustamos: "${t}" y te reenvío la versión nueva.`);
    if (session.lastDeliveryUrl)
      say(`Mirala acá: ${session.lastDeliveryUrl}`, { deliveryUrl: session.lastDeliveryUrl });
  } else {
    // Conversación manejada por IA: entiende lo que escribe, responde y junta datos.
    const history = await loadHistory(session.phone);
    let ctx: BusinessContext | null = null;
    if (session.businessProfileId) {
      const b = await prisma.businessProfile.findUnique({ where: { id: session.businessProfileId } });
      if (b)
        ctx = {
          businessName: b.businessName,
          category: b.category,
          city: b.city,
          toneOfVoice: b.toneOfVoice,
          mainOffer: b.mainOffer,
          targetAudience: b.targetAudience,
          description: b.description,
        };
    }

    const ai = await aiService.chatReply(ctx, history, session.draft);
    for (const [k, v] of Object.entries(ai.extracted)) {
      if (v && String(v).trim()) session.draft[k] = String(v).trim();
    }

    if (ai.readyToGenerate && session.draft.product) {
      const businessProfileId = await resolveBusiness(session);

      // Guardar las fotos que mandó la persona como assets del negocio.
      if (photos) {
        const toSave = [
          photos.product ? { type: "product_photo", url: photos.product } : null,
          photos.logo ? { type: "logo", url: photos.logo } : null,
          photos.founder ? { type: "founder_photo", url: photos.founder } : null,
        ].filter((x): x is { type: string; url: string } => x !== null);
        for (const a of toSave) {
          await prisma.asset.create({ data: { businessProfileId, type: a.type, url: a.url } });
        }
      }

      // ADN/estrategia: si el negocio aún no tiene, la generamos para que el
      // contenido salga "estrategia-grade" (sus hooks alimentan los anuncios).
      // Nunca bloquea la campaña: si falla, seguimos igual.
      try {
        const hasStrategy = await prisma.marketStrategy.findUnique({ where: { businessProfileId } });
        if (!hasStrategy) await marketStrategyService.generateStrategy(businessProfileId);
      } catch (e) {
        console.error("[whatsapp] generateStrategy →", e);
      }

      const order = await quickCampaignService.generateQuickCampaignOrder(businessProfileId, {
        productOrService: session.draft.product,
        offer: session.draft.offer,
        budget: session.draft.budget,
        objective: "Vender más esta semana",
      });
      const result = await quickCampaignService.generateQuickCampaignContent(order.id);
      session.lastOrderId = order.id;
      session.lastDeliveryUrl = result.deliveryUrl;
      session.phase = "waiting_approval";
      say(
        "¡Listo! 🎉 Te preparé todo para esta semana: historias, un carrusel, anuncios, textos para copiar, un guion para un reel y las imágenes en los tamaños que usan Facebook e Instagram. Te dejo todo acá 👇",
      );
      say(
        whatsappTemplates.deliveryLink(session.businessName ?? "tu negocio", result.deliveryUrl),
        { deliveryUrl: result.deliveryUrl, orderId: order.id },
      );
    } else {
      say(ai.reply);
    }
  }

  for (const r of replies) await record(session, "outbound", r.text);
  return { session, replies };
}

async function resolveBusiness(session: SimSession): Promise<string> {
  if (session.ownBusiness && session.businessProfileId) return session.businessProfileId;
  const name = session.draft.businessName?.trim() || session.businessName || "Mi negocio";
  const user = await prisma.user.upsert({
    where: { phone: session.phone },
    update: {},
    create: { name, phone: session.phone, role: "owner" },
  });
  // Descripción rica: junta lo que contó el cliente (problema, diferenciales,
  // objeciones) para que la estrategia y el contenido salgan a su medida.
  const d = session.draft;
  const richDescription =
    [
      d.description?.trim() || null,
      d.problem?.trim() ? `Problema que resuelve: ${d.problem.trim()}` : null,
      d.differentiators?.trim() ? `Por qué lo eligen: ${d.differentiators.trim()}` : null,
      d.objections?.trim() ? `Objeciones comunes: ${d.objections.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n") || null;
  const targetAudience = d.targetAudience?.trim() || null;
  const existing = await prisma.businessProfile.findFirst({
    where: { userId: user.id, businessName: name },
  });
  // Si ya existe, completamos lo que falte con lo que juntó el chat.
  if (existing) {
    const patch: { description?: string; targetAudience?: string } = {};
    if (!existing.description && richDescription) patch.description = richDescription;
    if (!existing.targetAudience && targetAudience) patch.targetAudience = targetAudience;
    if (Object.keys(patch).length) await prisma.businessProfile.update({ where: { id: existing.id }, data: patch });
  }
  const business =
    existing ??
    (await prisma.businessProfile.create({
      data: {
        userId: user.id,
        businessName: name,
        category: session.draft.category?.trim() || "General",
        country: "Uruguay",
        mainOffer: session.draft.offer || session.draft.product || null,
        description: richDescription,
        targetAudience,
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
  return business.id;
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
