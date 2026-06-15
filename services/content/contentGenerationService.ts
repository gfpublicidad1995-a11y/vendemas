import { prisma } from "@/lib/prisma";
import { env } from "@/lib/config/env";
import { generateToken } from "@/lib/ids";
import { asArray, asStringArray } from "@/lib/json";
import { aiService, type AngledAd, type BusinessContext, type ContentBrief } from "@/services/ai";
import { visualService } from "@/services/visual";
import { visualPromptService, type BrandStyle } from "@/services/visual/visualPromptService";
import { metaCreativeSpecsService } from "@/services/meta-creative-specs/metaCreativeSpecsService";
import { creativeValidationService } from "@/services/meta-creative-specs/creativeValidationService";
import { getSafeZoneForPlacement, STORY_SAFE_ZONE } from "@/services/meta-creative-specs/metaCreativeSpecs";
import type { MetaPlacement, VisualCreativeType } from "@/lib/validators/enums";
import type { VariantSpec } from "@/services/visual/types";

export interface GenerationResult {
  orderId: string;
  token: string;
  deliveryUrl: string;
}

type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

function loadOrder(orderId: string) {
  return prisma.contentOrder.findUnique({
    where: { id: orderId },
    include: { businessProfile: { include: { brandKit: true, marketStrategy: true } } },
  });
}

function toContext(business: LoadedOrder["businessProfile"]): BusinessContext {
  return {
    businessName: business.businessName,
    category: business.category,
    city: business.city,
    toneOfVoice: business.toneOfVoice ?? business.brandKit?.toneOfVoice,
    mainOffer: business.mainOffer,
    targetAudience: business.targetAudience,
    description: business.description,
    preferredWords: asStringArray(business.brandKit?.preferredWords),
    forbiddenWords: asStringArray(business.brandKit?.forbiddenWords),
  };
}

function toBrand(business: LoadedOrder["businessProfile"]): BrandStyle | undefined {
  if (!business.brandKit) return undefined;
  return {
    primaryColor: business.brandKit.primaryColor,
    secondaryColor: business.brandKit.secondaryColor,
    visualStyle: business.brandKit.visualStyle,
    forbiddenWords: asStringArray(business.brandKit.forbiddenWords),
  };
}

function toBrief(order: LoadedOrder): ContentBrief {
  return {
    productOrService: order.productOrService,
    offer: order.offer,
    objective: order.objective,
    notes: order.notes,
  };
}

/** Hooks de la estrategia (matriz de diversificación) para alimentar los anuncios. */
function strategyHooks(order: LoadedOrder): string[] {
  const strat = order.businessProfile.marketStrategy;
  if (!strat) return [];
  return asArray<{ hook?: string }>(strat.creativeMatrix)
    .map((m) => m?.hook)
    .filter((x): x is string => typeof x === "string");
}

class ContentGenerationService {
  /** Punto de entrada: genera todo según el tipo de pedido y deja el link de entrega. */
  async generateForOrder(orderId: string): Promise<GenerationResult> {
    const order = await loadOrder(orderId);
    if (!order) throw new Error(`ContentOrder ${orderId} no existe`);

    await prisma.contentOrder.update({ where: { id: orderId }, data: { status: "generating" } });

    const ctx = toContext(order.businessProfile);
    const brand = toBrand(order.businessProfile);
    const brief = toBrief(order);

    try {
      switch (order.type) {
        case "quick_campaign":
          await this.buildQuickCampaign(order, ctx, brand, brief);
          break;
        case "ads_pack":
          await this.buildAdsPack(order, ctx, brand, brief);
          break;
        case "carousel":
          await this.buildCarousel(order, ctx, brand, brief);
          break;
        case "video_script":
          await this.buildVideoScript(order, ctx, brief);
          break;
        default:
          await this.buildContentPack(order, ctx, brief);
      }

      const delivery = await this.generateDeliveryLink(orderId);
      await prisma.contentOrder.update({ where: { id: orderId }, data: { status: "delivered" } });
      await prisma.contentApproval.create({
        data: { contentOrderId: orderId, businessProfileId: order.businessProfileId, status: "pending" },
      });
      return delivery;
    } catch (e) {
      await prisma.contentOrder.update({ where: { id: orderId }, data: { status: "failed" } });
      throw e;
    }
  }

  // --- piezas de texto -----------------------------------------------------

  private async buildContentPack(order: LoadedOrder, ctx: BusinessContext, brief: ContentBrief) {
    const ads = await aiService.generateAdCopies(ctx, brief);
    await prisma.contentPiece.createMany({
      data: [
        ...ads.primaryTexts.map((body, i) => ({
          contentOrderId: order.id,
          type: "ad_copy",
          title: `Copy ${i + 1}`,
          body,
          format: "feed",
        })),
        {
          contentOrderId: order.id,
          type: "content_idea",
          title: "Titulares",
          body: ads.headlines.map((h, i) => `${i + 1}. ${h}`).join("\n"),
          format: "headlines",
        },
      ],
    });
  }

  private async buildAdsPack(order: LoadedOrder, ctx: BusinessContext, brand: BrandStyle | undefined, brief: ContentBrief) {
    const hooks = strategyHooks(order);
    const [ads, angled] = await Promise.all([
      aiService.generateAdCopies(ctx, brief),
      aiService.generateAngledAds(ctx, brief, hooks),
    ]);
    await prisma.contentPiece.createMany({
      data: [
        ...angled.map((a) => ({
          contentOrderId: order.id,
          type: "ad_copy",
          title: `Anuncio — ${a.angleLabel}`,
          body: `${a.primaryText}\n\nTitular: ${a.headline}`,
          format: "meta_ads",
        })),
        {
          contentOrderId: order.id,
          type: "content_idea",
          title: "Titulares (5)",
          body: ads.headlines.map((h, i) => `${i + 1}. ${h}`).join("\n"),
          format: "headlines",
        },
        {
          contentOrderId: order.id,
          type: "content_idea",
          title: "Descripciones (3)",
          body: ads.descriptions.join("\n"),
          format: "descriptions",
        },
        {
          contentOrderId: order.id,
          type: "campaign_structure",
          title: "Estructura de campaña",
          body: `${ads.campaignStructure}\n\nPúblico: ${ads.audienceRecommendation}\nPresupuesto: ${ads.budgetRecommendation}\nCTA: ${ads.cta}`,
          format: "meta_ads",
        },
      ],
    });
    await this.buildCampaignDraft(order, ads.audienceRecommendation, angled.map((a) => a.primaryText));
    await this.buildVisualVariants(order, ctx, brand, "ad_image", undefined, angled);
  }

  private async buildCarousel(order: LoadedOrder, ctx: BusinessContext, brand: BrandStyle | undefined, brief: ContentBrief) {
    const c = await aiService.generateCarousel(ctx, brief);
    await prisma.contentPiece.create({
      data: {
        contentOrderId: order.id,
        type: "carousel_pack",
        title: c.title,
        body: `${c.slides.join("\n")}\n\nCaption: ${c.caption}\nCTA: ${c.cta}`,
        format: "carousel",
      },
    });
    await this.buildVisualVariants(order, ctx, brand, "carousel_slide", ["INSTAGRAM_FEED"]);
  }

  private async buildVideoScript(order: LoadedOrder, ctx: BusinessContext, brief: ContentBrief) {
    const v = await aiService.generateVideoScript(ctx, brief);
    await prisma.contentPiece.create({
      data: {
        contentOrderId: order.id,
        type: "video_script",
        title: "Guion de reel",
        body: `Hook: ${v.hook}\nDesarrollo: ${v.body}\nCierre: ${v.close}\nCTA: ${v.cta}\nVisual: ${v.visualNotes}\nDuración: ${v.estimatedDuration}`,
        format: "reel_9_16",
      },
    });
  }

  private async buildQuickCampaign(order: LoadedOrder, ctx: BusinessContext, brand: BrandStyle | undefined, brief: ContentBrief) {
    const qc = await aiService.generateQuickCampaign(ctx, brief);
    const angled = await aiService.generateAngledAds(ctx, brief, strategyHooks(order));

    const pieces = [
      ...qc.stories.map((body, i) => ({
        contentOrderId: order.id,
        type: "story",
        title: `Historia ${i + 1}`,
        body,
        format: "story_9_16",
      })),
      {
        contentOrderId: order.id,
        type: "carousel_pack",
        title: qc.carousel.title,
        body: `${qc.carousel.slides.join("\n")}\n\nCaption: ${qc.carousel.caption}\nCTA: ${qc.carousel.cta}`,
        format: "carousel",
      },
      ...angled.map((a) => ({
        contentOrderId: order.id,
        type: "ad_copy",
        title: `Anuncio — ${a.angleLabel}`,
        body: `${a.primaryText}\n\nTitular: ${a.headline}`,
        format: "meta_ads",
      })),
      {
        contentOrderId: order.id,
        type: "content_idea",
        title: "Copies (5)",
        body: qc.copies.map((c, i) => `${i + 1}. ${c}`).join("\n"),
        format: "copies",
      },
      {
        contentOrderId: order.id,
        type: "content_idea",
        title: "Titulares (5)",
        body: qc.headlines.map((h, i) => `${i + 1}. ${h}`).join("\n"),
        format: "headlines",
      },
      {
        contentOrderId: order.id,
        type: "video_script",
        title: "Guion de reel",
        body: `Hook: ${qc.reelScript.hook}\nDesarrollo: ${qc.reelScript.body}\nCierre: ${qc.reelScript.close}\nCTA: ${qc.reelScript.cta}`,
        format: "reel_9_16",
      },
      {
        contentOrderId: order.id,
        type: "campaign_structure",
        title: "Estructura de campaña",
        body: `${qc.campaignStructure}\n\nPúblico: ${qc.audienceRecommendation}\nPresupuesto: ${qc.budgetRecommendation}`,
        format: "meta_ads",
      },
    ];
    await prisma.contentPiece.createMany({ data: pieces });

    await this.buildCampaignDraft(order, qc.audienceRecommendation, qc.copies);
    await this.buildVisualVariants(order, ctx, brand, "ad_image", undefined, angled);
  }

  // --- visuales por ubicación + validación --------------------------------

  private async buildVisualVariants(
    order: LoadedOrder,
    ctx: BusinessContext,
    brand: BrandStyle | undefined,
    type: VisualCreativeType,
    placements?: MetaPlacement[],
    angles?: AngledAd[]
  ) {
    const subject = ctx.mainOffer || ctx.businessName;
    const basePrompt = await aiService.generateVisualPromptBase(ctx, subject);
    const variants: VariantSpec[] = metaCreativeSpecsService.suggestCreativeVariants(placements ?? []);

    // Assets del brief: si hay foto de producto, los anuncios se componen con
    // ella + logo + foto del cliente + colores + copy (se arman en la entrega).
    const productAsset = await prisma.asset.findFirst({
      where: { businessProfileId: order.businessProfileId, type: "product_photo" },
    });
    const composed = !!productAsset;

    const jobInput = { kind: "creative_variations", count: variants.length };
    const job = await prisma.visualGenerationJob.create({
      data: {
        businessProfileId: order.businessProfileId,
        contentOrderId: order.id,
        provider: visualService.provider,
        status: "running",
        input: jobInput,
        startedAt: new Date(),
      },
    });

    let generated = 0;
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const placement = variant.placement;
      const angle = angles && angles.length ? angles[i % angles.length] : undefined;
      const enriched = angle
        ? `${basePrompt} Enfoque ${angle.angleLabel}: ${angle.visualAngle}`
        : basePrompt;
      const prompt = visualPromptService.buildPlacementAwarePrompt(enriched, placement, brand);
      const result = await visualService.generateAdImage({
        prompt,
        type,
        format: variant.format,
        aspectRatio: variant.aspectRatio,
        width: variant.width,
        height: variant.height,
        placement,
      });

      const zone = getSafeZoneForPlacement(placement);
      const report = creativeValidationService.validate(
        {
          width: variant.width,
          height: variant.height,
          aspectRatio: variant.aspectRatio,
          format: variant.format,
          placement,
          fileUrl: result.fileUrl,
          safeZoneApplied: !!zone, // aplicamos las instrucciones de zona segura en el prompt
        },
        metaCreativeSpecsService.staticSpecFor(placement)
      );

      const creative = await prisma.visualCreative.create({
        data: {
          businessProfileId: order.businessProfileId,
          contentOrderId: order.id,
          type,
          placement,
          prompt,
          format: variant.format,
          aspectRatio: variant.aspectRatio,
          width: variant.width,
          height: variant.height,
          safeZoneTopPercent: zone ? STORY_SAFE_ZONE.topPercent : null,
          safeZoneBottomPercent: zone ? STORY_SAFE_ZONE.bottomPercent : null,
          safeZoneSidePercent: zone ? STORY_SAFE_ZONE.sidePercent : null,
          isPlacementReady: report.status !== "invalid",
          status: result.status,
          validationStatus: report.status,
          validationNotes: report.problems,
          fileUrl: result.fileUrl,
          provider: result.provider,
          providerJobId: result.providerJobId,
          assetId: productAsset?.id ?? null,
          metadata: {
            ...(angle ? { angle: angle.angle, angleLabel: angle.angleLabel } : {}),
            composed,
            headline: angle?.headline ?? ctx.mainOffer ?? ctx.businessName,
            offer: order.offer ?? ctx.mainOffer ?? null,
            cta: "Escribinos por WhatsApp",
            brandName: ctx.businessName,
            primaryColor: brand?.primaryColor ?? null,
            secondaryColor: brand?.secondaryColor ?? null,
          },
        },
      });

      await prisma.creativeVariant.create({
        data: {
          businessProfileId: order.businessProfileId,
          contentOrderId: order.id,
          visualCreativeId: creative.id,
          placement,
          format: variant.format,
          aspectRatio: variant.aspectRatio,
          width: variant.width,
          height: variant.height,
          fileUrl: result.fileUrl,
          prompt,
          safeZoneApplied: !!zone,
          validationStatus: report.status,
          validationNotes: report.problems,
        },
      });
      generated++;
    }

    await prisma.visualGenerationJob.update({
      where: { id: job.id },
      data: { status: "completed", output: { generated }, completedAt: new Date() },
    });
  }

  private async buildCampaignDraft(order: LoadedOrder, audience: string, copies: string[]) {
    const placements: MetaPlacement[] = metaCreativeSpecsService.getRecommendedPlacementsForObjective(
      order.objective
    );
    await prisma.campaignDraft.create({
      data: {
        contentOrderId: order.id,
        objective: "Mensajes a WhatsApp",
        budget: 10,
        audience,
        placements,
        adCopies: copies,
        creatives: { variants: ["4:5", "1:1", "9:16"] },
        recommendedPlacements: placements,
        placementValidation: { note: "Validar cada variante por ubicación antes de publicar." },
        creativeSpecVersion: "2026-06",
        status: "draft", // nunca se publica sin aprobación
      },
    });
  }

  // --- entrega -------------------------------------------------------------

  async generateDeliveryLink(orderId: string): Promise<GenerationResult> {
    const existing = await prisma.deliveryLink.findFirst({ where: { contentOrderId: orderId } });
    if (existing) {
      return { orderId, token: existing.token, deliveryUrl: existing.url };
    }
    const token = generateToken();
    const url = `${env.APP_URL}/delivery/${token}`;
    await prisma.deliveryLink.create({
      data: { contentOrderId: orderId, token, url },
    });
    return { orderId, token, deliveryUrl: url };
  }
}

export const contentGenerationService = new ContentGenerationService();
