// Contrato del servicio de IA de contenido.
// El mock devuelve respuestas realistas; el proveedor real (Anthropic) se
// enchufa después implementando esta misma interface.

export interface BusinessContext {
  businessName: string;
  category: string;
  city?: string | null;
  toneOfVoice?: string | null;
  mainOffer?: string | null;
  targetAudience?: string | null;
  description?: string | null;
  preferredWords?: string[];
  forbiddenWords?: string[];
}

export interface ContentBrief {
  productOrService?: string | null;
  offer?: string | null;
  objective?: string | null;
  notes?: string | null;
  validUntil?: string | null;
  budget?: string | null;
}

export interface AdsPackResult {
  primaryTexts: string[];
  headlines: string[];
  descriptions: string[];
  imageIdeas: string[];
  campaignStructure: string;
  audienceRecommendation: string;
  budgetRecommendation: string;
  cta: string;
}

export type AdAngle = "directa" | "emocional" | "urgencia" | "prueba_social";

export interface AngledAd {
  angle: AdAngle;
  angleLabel: string;
  primaryText: string;
  headline: string;
  visualAngle: string;
}

export interface CarouselResult {
  title: string;
  slides: string[];
  caption: string;
  cta: string;
}

export interface VideoScriptResult {
  hook: string;
  body: string;
  close: string;
  cta: string;
  visualNotes: string;
  estimatedDuration: string;
}

export interface QuickCampaignResult {
  stories: string[];
  carousel: CarouselResult;
  ads: { primaryText: string; headline: string }[];
  copies: string[];
  headlines: string[];
  reelScript: VideoScriptResult;
  campaignStructure: string;
  audienceRecommendation: string;
  budgetRecommendation: string;
}

export interface DigestIdeas {
  contentIdeas: string[];
  campaignIdeas: string[];
  recommendedAction: string;
}

export interface ChatTurn {
  from: "user" | "bot";
  text: string;
}

export interface ChatExtracted {
  businessName?: string;
  category?: string;
  product?: string;
  offer?: string;
  budget?: string;
}

export interface ChatReplyResult {
  reply: string;
  extracted: ChatExtracted;
  readyToGenerate: boolean;
}

export interface AIContentService {
  generateAdCopies(ctx: BusinessContext, brief: ContentBrief): Promise<AdsPackResult>;
  generateAngledAds(ctx: BusinessContext, brief: ContentBrief, hooks?: string[]): Promise<AngledAd[]>;
  generateCarousel(ctx: BusinessContext, brief: ContentBrief): Promise<CarouselResult>;
  generateVideoScript(ctx: BusinessContext, brief: ContentBrief): Promise<VideoScriptResult>;
  generateCampaignStrategy(ctx: BusinessContext, brief: ContentBrief): Promise<string>;
  generateBrandTone(ctx: BusinessContext): Promise<string>;
  analyzeBusinessProfile(ctx: BusinessContext): Promise<string>;
  generateDailyDigestIdeas(
    ctx: BusinessContext,
    topQuestions: string[],
    topObjections: string[]
  ): Promise<DigestIdeas>;
  generateWhatsAppReplies(ctx: BusinessContext, customerMessage: string): Promise<string[]>;
  generateQuickCampaign(ctx: BusinessContext, brief: ContentBrief): Promise<QuickCampaignResult>;
  generateRevision(original: string, instruction: string): Promise<string>;
  generateVisualPromptBase(ctx: BusinessContext, subject: string): Promise<string>;
  /** Conversación de WhatsApp manejada por IA: entiende, responde y extrae datos. */
  chatReply(
    ctx: BusinessContext | null,
    history: ChatTurn[],
    draft: Record<string, string>
  ): Promise<ChatReplyResult>;
}
