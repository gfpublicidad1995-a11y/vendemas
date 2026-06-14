"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { contentGenerationService } from "@/services/content/contentGenerationService";
import { dailyDigestService } from "@/services/digests/dailyDigestService";
import { opportunityRadarService } from "@/services/opportunities/opportunityRadarService";
import { suggestedReplyService } from "@/services/replies/suggestedReplyService";
import { contentCalendarService } from "@/services/calendar/contentCalendarService";
import { weeklyReportService } from "@/services/reports/weeklyReportService";
import { budgetPlannerService } from "@/services/budget/budgetPlannerService";
import { offerSuggestionService } from "@/services/offers/offerSuggestionService";
import { voiceBriefService } from "@/services/voice/voiceBriefService";
import { revisionService } from "@/services/revisions/revisionService";
import { marketStrategyService } from "@/services/strategy/marketStrategyService";
import { handleTurn, type SimSession } from "@/services/whatsapp/conversationFlow";
import { storageService } from "@/services/storage";

// --- Simulador ---------------------------------------------------------------
export async function simulateTurn(session: SimSession, text: string) {
  return handleTurn(session, text);
}

// --- Contenido / pedidos -----------------------------------------------------
export async function createContentFromInsight(formData: FormData) {
  const insightId = String(formData.get("insightId"));
  const insight = await prisma.conversationInsight.findUnique({ where: { id: insightId } });
  if (!insight) throw new Error("Insight no encontrado");
  const order = await prisma.contentOrder.create({
    data: {
      businessProfileId: insight.businessProfileId,
      sourceInsightId: insight.id,
      type: "insight_based_content_pack",
      status: "ready_to_generate",
      objective: `Contenido basado en: ${insight.title}`,
      notes: insight.description,
    },
  });
  await contentGenerationService.generateForOrder(order.id);
  await prisma.conversationInsight.update({ where: { id: insightId }, data: { status: "used" } });
  revalidatePath("/dashboard/orders");
  redirect(`/dashboard/orders/${order.id}`);
}

export async function createContentFromDigestItem(formData: FormData) {
  const digestItemId = String(formData.get("digestItemId"));
  const result = await dailyDigestService.createContentOrderFromDigestItem(digestItemId);
  revalidatePath("/dashboard/orders");
  redirect(`/dashboard/orders/${result.orderId}`);
}

export async function createOrder(formData: FormData) {
  const businessProfileId = String(formData.get("businessProfileId"));
  const type = String(formData.get("type"));
  const objective = String(formData.get("objective") ?? "");
  const offer = String(formData.get("offer") ?? "");
  const productOrService = String(formData.get("productOrService") ?? "");
  const order = await prisma.contentOrder.create({
    data: {
      businessProfileId,
      type,
      status: "ready_to_generate",
      objective: objective || null,
      offer: offer || null,
      productOrService: productOrService || null,
    },
  });
  await contentGenerationService.generateForOrder(order.id);
  revalidatePath("/dashboard/orders");
  redirect(`/dashboard/orders/${order.id}`);
}

// --- Aprobación / cambios ----------------------------------------------------
export async function approveOrder(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  await prisma.contentApproval.updateMany({
    where: { contentOrderId: orderId, status: { in: ["pending", "changes_requested"] } },
    data: { status: "approved", approvedAt: new Date() },
  });
  revalidatePath(`/dashboard/orders/${orderId}`);
}

export async function requestChanges(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  const instruction = String(formData.get("instruction") ?? "").trim();
  if (!instruction) return;
  const order = await prisma.contentOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Pedido no encontrado");
  const ownerId = (await firstOwnerId(order.businessProfileId)) ?? "";
  const revision = await revisionService.createRevisionRequest(
    orderId,
    instruction,
    order.businessProfileId,
    ownerId
  );
  // Aplicamos el cambio: reescribe los copies según la instrucción.
  await revisionService.applyRevision(revision.id);
  revalidatePath(`/dashboard/orders/${orderId}`);
}

// --- Generadores por negocio -------------------------------------------------
export async function generateOpportunities(formData: FormData) {
  const businessProfileId = String(formData.get("businessProfileId"));
  await opportunityRadarService.detectDailyOpportunities(businessProfileId);
  revalidatePath("/dashboard/opportunities");
}

export async function createContentFromAlert(formData: FormData) {
  const alertId = String(formData.get("alertId"));
  const result = await opportunityRadarService.createContentOrderFromAlert(alertId);
  redirect(`/dashboard/orders/${result.orderId}`);
}

export async function generateSuggestedReplies(formData: FormData) {
  const businessProfileId = String(formData.get("businessProfileId"));
  await suggestedReplyService.generateRepliesForBusiness(businessProfileId);
  revalidatePath("/dashboard/conversations");
}

export async function markReplyUsed(formData: FormData) {
  await suggestedReplyService.markReplyAsUsed(String(formData.get("replyId")));
  revalidatePath("/dashboard/conversations");
}

export async function markReplyDismissed(formData: FormData) {
  await suggestedReplyService.markReplyAsDismissed(String(formData.get("replyId")));
  revalidatePath("/dashboard/conversations");
}

export async function generateCalendar(formData: FormData) {
  const businessProfileId = String(formData.get("businessProfileId"));
  await contentCalendarService.generateWeeklyCalendar(businessProfileId);
  revalidatePath("/dashboard/calendar");
  redirect("/dashboard/calendar");
}

export async function createContentFromCalendarItem(formData: FormData) {
  const calendarItemId = String(formData.get("calendarItemId"));
  const result = await contentCalendarService.createContentOrderFromCalendarItem(calendarItemId);
  redirect(`/dashboard/orders/${result.orderId}`);
}

export async function generateWeeklyReport(formData: FormData) {
  const businessProfileId = String(formData.get("businessProfileId"));
  await weeklyReportService.generateWeeklyReport(businessProfileId);
  revalidatePath("/dashboard/reports/weekly");
  redirect("/dashboard/reports/weekly");
}

export async function generateBudgetPlan(formData: FormData) {
  const businessProfileId = String(formData.get("businessProfileId"));
  const monthlyBudget = Number(formData.get("monthlyBudget") ?? 300) || 300;
  await budgetPlannerService.generateBudgetPlan(businessProfileId, monthlyBudget);
  revalidatePath("/dashboard/budget-planner");
  redirect("/dashboard/budget-planner");
}

export async function generateOffers(formData: FormData) {
  const businessProfileId = String(formData.get("businessProfileId"));
  await offerSuggestionService.generateOffersFromInsights(businessProfileId);
  revalidatePath(`/dashboard/businesses/${businessProfileId}`);
}

export async function generateMarketStrategy(formData: FormData) {
  const businessProfileId = String(formData.get("businessProfileId"));
  await marketStrategyService.generateStrategy(businessProfileId);
  revalidatePath("/dashboard/strategy");
  redirect("/dashboard/strategy");
}

export async function createCampaignFromOffer(formData: FormData) {
  const offerId = String(formData.get("offerId"));
  const result = await offerSuggestionService.createCampaignFromOffer(offerId);
  redirect(`/dashboard/orders/${result.orderId}`);
}

export async function runDailyDigest(formData: FormData) {
  const businessProfileId = String(formData.get("businessProfileId"));
  const result = await dailyDigestService.generateDailyDigest(businessProfileId);
  if (result.status === "generated" && result.digestId) {
    await dailyDigestService.sendDigestToBusinessOwner(result.digestId);
    redirect(`/dashboard/digests/${result.digestId}`);
  }
  revalidatePath("/dashboard/digests");
}

export async function createContentFromVoice(formData: FormData) {
  const businessProfileId = String(formData.get("businessProfileId"));
  const vb = await voiceBriefService.receiveVoiceMessage(
    businessProfileId,
    "https://example.com/audios/brief-demo.ogg"
  );
  const result = await voiceBriefService.createContentOrderFromVoiceBrief(vb.id);
  redirect(`/dashboard/orders/${result.orderId}`);
}

// --- Alta de negocio / brief de marca ---------------------------------------
export async function createBusiness(formData: FormData) {
  const str = (k: string) => {
    const v = formData.get(k);
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s;
  };

  const businessName = str("businessName");
  if (!businessName) throw new Error("Falta el nombre del negocio.");

  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No hay usuario en la base. Corré `npm run seed`.");

  const budgetRaw = str("monthlyAdBudget");
  const tone = str("toneOfVoice") ?? "Cercano, simple y vendedor";

  const business = await prisma.businessProfile.create({
    data: {
      userId: user.id,
      businessName,
      category: str("category") ?? "General",
      description: str("description"),
      city: str("city"),
      country: str("country") ?? "Uruguay",
      targetAudience: str("targetAudience"),
      toneOfVoice: tone,
      mainOffer: str("mainOffer"),
      whatsappNumber: str("whatsappNumber"),
      instagramHandle: str("instagramHandle"),
      monthlyAdBudget: budgetRaw ? Number(budgetRaw) || null : null,
    },
  });

  const logoUrl = await saveAsset(formData.get("logo"), business.id, "logo");
  await saveAsset(formData.get("productPhoto"), business.id, "product_photo");
  await saveAsset(formData.get("founderPhoto"), business.id, "founder_photo");

  await prisma.brandKit.create({
    data: {
      businessProfileId: business.id,
      logoUrl,
      toneOfVoice: tone,
      visualStyle: str("visualStyle") ?? "Limpio y comercial",
      primaryColor: str("primaryColor"),
      secondaryColor: str("secondaryColor"),
    },
  });

  revalidatePath("/dashboard/businesses");
  redirect(`/dashboard/businesses/${business.id}`);
}

/** Sube un archivo del brief y crea su Asset. Devuelve la URL (o null si no hay archivo). */
async function saveAsset(
  entry: FormDataEntryValue | null,
  businessProfileId: string,
  type: string
): Promise<string | null> {
  if (!entry || typeof entry === "string" || entry.size === 0) return null;
  const bytes = new Uint8Array(await entry.arrayBuffer());
  const { url } = await storageService.uploadFile({
    key: `${businessProfileId}/${type}-${entry.name}`,
    contentType: entry.type,
    data: bytes,
  });
  await prisma.asset.create({
    data: { businessProfileId, type, url, filename: entry.name, mimeType: entry.type },
  });
  return url;
}

async function firstOwnerId(businessProfileId: string): Promise<string | null> {
  const b = await prisma.businessProfile.findUnique({
    where: { id: businessProfileId },
    select: { userId: true },
  });
  return b?.userId ?? null;
}
