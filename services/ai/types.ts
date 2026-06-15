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

/** Señales del negocio (rubro, conversaciones, playbook) que alimentan la estrategia. */
export interface StrategyBrainSignals {
  zona: string;
  precio: number | null;
  /** Objeciones reales detectadas (con su respuesta sugerida si existe). */
  objeciones: StrategyObjection[];
  topPreguntas: string[];
  topIntereses: string[];
  ofertasSugeridas: string[];
  angulosContenido: string[];
  /** Deseos de Reiss sugeridos por rubro (pista de arranque). */
  deseosSugeridos: string[];
  /** Los 16 deseos de Reiss, para que la IA elija los más afines. */
  reissOpciones: string[];
  /** Los 5 niveles de consciencia (key, label, foco). */
  niveles: { key: string; label: string; focus: string }[];
}

export interface StrategyObjection {
  objecion: string;
  respuesta: string;
}
export interface StrategyCompetitor {
  nombre: string;
  angulo: string;
  oferta: string;
  comoSuperarlo: string;
}
export interface StrategyAwarenessCopy {
  /** key del nivel de consciencia: unaware | problem | solution | product | most_aware */
  key: string;
  angulo: string;
  copy: string;
}
export interface StrategyCreativeHook {
  deseo: string;
  /** key del nivel de consciencia */
  nivel: string;
  /** "reel" | "imagen" */
  formato: string;
  hook: string;
}
export interface StrategyScript {
  nombre: string;
  estructura: string[];
}

/** Contenido estratégico específico del negocio (lo que deja de ser "verde"). */
export interface StrategyBrain {
  propuestaValor: string;
  avatarPerfil: string;
  deseosReiss: string[];
  dolores: string[];
  deseos: string[];
  problema: string;
  solucion: string;
  diferenciales: string[];
  ofertaGancho: string;
  objeciones: StrategyObjection[];
  testimonios: string[];
  garantia: string;
  competidores: StrategyCompetitor[];
  awarenessCopies: StrategyAwarenessCopy[];
  creativeHooks: StrategyCreativeHook[];
  scriptGuide: StrategyScript[];
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
  /** Cerebro estratégico: genera el contenido específico del negocio (ADN, avatar, 7 maletas, hooks, guiones, competidores). */
  generateStrategyBrain(ctx: BusinessContext, signals: StrategyBrainSignals): Promise<StrategyBrain>;
}
