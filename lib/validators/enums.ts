import { z } from "zod";

/**
 * Fuente de verdad de todos los "enums" del dominio.
 * En la base se guardan como String (portabilidad SQLite↔PostgreSQL); acá
 * Zod define y valida los valores permitidos. Usar SIEMPRE estos enums.
 */

export const UserRole = z.enum(["owner", "admin", "client"]);

export const AssetType = z.enum([
  "logo",
  "product_photo",
  "founder_photo",
  "avatar_video",
  "reference_image",
  "other",
]);

export const ContentOrderType = z.enum([
  "content_pack",
  "ads_pack",
  "carousel",
  "video_script",
  "full_campaign",
  "insight_based_content_pack",
  "daily_digest_content_pack",
  "quick_campaign",
]);

export const ContentOrderStatus = z.enum([
  "draft",
  "collecting_info",
  "ready_to_generate",
  "generating",
  "completed",
  "delivered",
  "failed",
]);

export const ContentPieceType = z.enum([
  "feed_image",
  "story",
  "carousel_slide",
  "carousel_pack",
  "ad_copy",
  "video_script",
  "campaign_structure",
  "whatsapp_reply",
  "content_idea",
]);

export const ApprovalStatus = z.enum([
  "pending",
  "approved",
  "changes_requested",
  "rejected",
]);

export const RevisionStatus = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const CampaignStatus = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "published",
  "paused",
]);

export const WhatsAppDirection = z.enum(["inbound", "outbound"]);

export const WhatsAppMessageType = z.enum([
  "text",
  "image",
  "video",
  "audio",
  "document",
]);

export const ThreadStatus = z.enum(["open", "closed", "archived"]);

export const InsightType = z.enum([
  "faq",
  "objection",
  "pain_point",
  "purchase_intent",
  "content_opportunity",
  "campaign_opportunity",
  "product_interest",
]);

export const InsightStatus = z.enum(["new", "reviewed", "used", "dismissed"]);

export const ContentOpportunityType = z.enum([
  "reel",
  "carousel",
  "story",
  "feed_post",
  "ad",
  "whatsapp_faq",
]);

export const Priority = z.enum(["low", "medium", "high"]);
export const AlertPriority = z.enum(["low", "medium", "high", "critical"]);

export const OpportunityStatus = z.enum(["pending", "generated", "dismissed"]);

export const DigestStatus = z.enum(["pending", "generated", "sent", "failed"]);

export const DigestItemType = z.enum([
  "faq",
  "objection",
  "product_interest",
  "content_idea",
  "campaign_idea",
  "recommendation",
]);

export const ScheduledJobType = z.enum([
  "daily_digest",
  "weekly_report",
  "campaign_check",
  "content_reminder",
]);

export const JobStatus = z.enum([
  "scheduled",
  "running",
  "completed",
  "failed",
]);

export const OpportunityAlertType = z.enum([
  "content",
  "campaign",
  "sales",
  "objection",
  "faq",
  "product_interest",
  "urgency",
]);

export const AlertStatus = z.enum(["new", "reviewed", "used", "dismissed"]);

export const ReplyTriggerType = z.enum([
  "price_objection",
  "delivery_question",
  "payment_question",
  "stock_question",
  "purchase_intent",
  "general_question",
]);

export const ReplyTone = z.enum([
  "friendly",
  "professional",
  "direct",
  "persuasive",
]);

export const ReplyStatus = z.enum(["suggested", "used", "dismissed"]);

export const CalendarStatus = z.enum([
  "draft",
  "active",
  "completed",
  "archived",
]);

export const CalendarItemContentType = z.enum([
  "story",
  "reel",
  "carousel",
  "feed_post",
  "ad",
  "whatsapp_status",
]);

export const CalendarItemStatus = z.enum([
  "pending",
  "generated",
  "approved",
  "published",
  "skipped",
]);

export const Level = z.enum(["low", "medium", "high"]);

export const ReportStatus = z.enum(["pending", "generated", "sent", "failed"]);

export const VoiceBriefStatus = z.enum([
  "received",
  "transcribed",
  "processed",
  "failed",
]);

export const BudgetPlanStatus = z.enum([
  "draft",
  "approved",
  "active",
  "archived",
]);

export const OfferType = z.enum([
  "discount",
  "bundle",
  "free_shipping",
  "limited_time",
  "payment_plan",
  "bonus",
  "seasonal",
]);

export const OfferStatus = z.enum(["pending", "used", "dismissed"]);

export const AwarenessLevel = z.enum([
  "unaware",
  "problem",
  "solution",
  "product",
  "most_aware",
]);
export type AwarenessLevel = z.infer<typeof AwarenessLevel>;

export const VisualCreativeType = z.enum([
  "feed_image",
  "story_image",
  "ad_image",
  "carousel_slide",
  "video",
  "ugc_video",
  "avatar_video",
  "thumbnail",
]);

export const VisualFormat = z.enum([
  "square_1_1",
  "vertical_4_5",
  "story_9_16",
  "landscape_16_9",
  "custom",
]);

export const VisualStatus = z.enum([
  "pending",
  "generating",
  "completed",
  "failed",
]);

export const ValidationStatus = z.enum([
  "pending",
  "valid",
  "warning",
  "invalid",
]);

export const VisualProvider = z.enum(["mock", "higgsfield"]);

export const VisualGenerationJobStatus = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
]);

export const MetaPlacement = z.enum([
  "FACEBOOK_FEED",
  "INSTAGRAM_FEED",
  "FACEBOOK_STORIES",
  "INSTAGRAM_STORIES",
  "FACEBOOK_REELS",
  "INSTAGRAM_REELS",
  "FACEBOOK_MARKETPLACE",
  "FACEBOOK_SEARCH_RESULTS",
  "INSTAGRAM_EXPLORE",
  "INSTAGRAM_PROFILE_FEED",
  "MESSENGER_STORIES",
  "FACEBOOK_RIGHT_COLUMN",
]);

export const MetaCreativeFormat = z.enum([
  "IMAGE",
  "VIDEO",
  "CAROUSEL",
  "STORY",
  "REEL",
  "UGC_VIDEO",
  "THUMBNAIL",
]);

export const MetaAspectRatio = z.enum([
  "SQUARE_1_1",
  "VERTICAL_4_5",
  "STORY_9_16",
  "LANDSCAPE_16_9",
  "LINK_1_91_1",
  "CUSTOM",
]);

// Tipos TS derivados (usar en servicios y componentes).
export type UserRole = z.infer<typeof UserRole>;
export type AssetType = z.infer<typeof AssetType>;
export type ContentOrderType = z.infer<typeof ContentOrderType>;
export type ContentOrderStatus = z.infer<typeof ContentOrderStatus>;
export type ContentPieceType = z.infer<typeof ContentPieceType>;
export type ApprovalStatus = z.infer<typeof ApprovalStatus>;
export type RevisionStatus = z.infer<typeof RevisionStatus>;
export type CampaignStatus = z.infer<typeof CampaignStatus>;
export type WhatsAppDirection = z.infer<typeof WhatsAppDirection>;
export type WhatsAppMessageType = z.infer<typeof WhatsAppMessageType>;
export type ThreadStatus = z.infer<typeof ThreadStatus>;
export type InsightType = z.infer<typeof InsightType>;
export type InsightStatus = z.infer<typeof InsightStatus>;
export type ContentOpportunityType = z.infer<typeof ContentOpportunityType>;
export type Priority = z.infer<typeof Priority>;
export type AlertPriority = z.infer<typeof AlertPriority>;
export type OpportunityStatus = z.infer<typeof OpportunityStatus>;
export type DigestStatus = z.infer<typeof DigestStatus>;
export type DigestItemType = z.infer<typeof DigestItemType>;
export type ScheduledJobType = z.infer<typeof ScheduledJobType>;
export type JobStatus = z.infer<typeof JobStatus>;
export type OpportunityAlertType = z.infer<typeof OpportunityAlertType>;
export type AlertStatus = z.infer<typeof AlertStatus>;
export type ReplyTriggerType = z.infer<typeof ReplyTriggerType>;
export type ReplyTone = z.infer<typeof ReplyTone>;
export type ReplyStatus = z.infer<typeof ReplyStatus>;
export type CalendarStatus = z.infer<typeof CalendarStatus>;
export type CalendarItemContentType = z.infer<typeof CalendarItemContentType>;
export type CalendarItemStatus = z.infer<typeof CalendarItemStatus>;
export type Level = z.infer<typeof Level>;
export type ReportStatus = z.infer<typeof ReportStatus>;
export type VoiceBriefStatus = z.infer<typeof VoiceBriefStatus>;
export type BudgetPlanStatus = z.infer<typeof BudgetPlanStatus>;
export type OfferType = z.infer<typeof OfferType>;
export type OfferStatus = z.infer<typeof OfferStatus>;
export type VisualCreativeType = z.infer<typeof VisualCreativeType>;
export type VisualFormat = z.infer<typeof VisualFormat>;
export type VisualStatus = z.infer<typeof VisualStatus>;
export type ValidationStatus = z.infer<typeof ValidationStatus>;
export type VisualProvider = z.infer<typeof VisualProvider>;
export type VisualGenerationJobStatus = z.infer<
  typeof VisualGenerationJobStatus
>;
export type MetaPlacement = z.infer<typeof MetaPlacement>;
export type MetaCreativeFormat = z.infer<typeof MetaCreativeFormat>;
export type MetaAspectRatio = z.infer<typeof MetaAspectRatio>;
