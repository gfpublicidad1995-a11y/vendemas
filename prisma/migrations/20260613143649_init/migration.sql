-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT,
    "country" TEXT,
    "targetAudience" TEXT,
    "toneOfVoice" TEXT,
    "mainOffer" TEXT,
    "instagramHandle" TEXT,
    "facebookPage" TEXT,
    "whatsappNumber" TEXT,
    "monthlyAdBudget" REAL,
    "dailyDigestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigestTime" TEXT NOT NULL DEFAULT '20:30',
    "timezone" TEXT NOT NULL DEFAULT 'America/Montevideo',
    "digestWhatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "consentToAnalyzeConversations" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrandKit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "fontStyle" TEXT,
    "toneOfVoice" TEXT,
    "forbiddenWords" JSONB,
    "preferredWords" JSONB,
    "visualStyle" TEXT,
    "exampleCaptions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BrandKit_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "mimeType" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asset_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "sourceInsightId" TEXT,
    "sourceDigestItemId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "objective" TEXT,
    "offer" TEXT,
    "productOrService" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentOrder_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentOrder_sourceInsightId_fkey" FOREIGN KEY ("sourceInsightId") REFERENCES "ConversationInsight" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentOrder_sourceDigestItemId_fkey" FOREIGN KEY ("sourceDigestItemId") REFERENCES "DailyDigestItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentPiece" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentOrderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "format" TEXT,
    "fileUrl" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentPiece_contentOrderId_fkey" FOREIGN KEY ("contentOrderId") REFERENCES "ContentOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentOrderId" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feedback" TEXT,
    "requestedAction" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentApproval_contentOrderId_fkey" FOREIGN KEY ("contentOrderId") REFERENCES "ContentOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentApproval_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RevisionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentOrderId" TEXT NOT NULL,
    "contentPieceId" TEXT,
    "businessProfileId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RevisionRequest_contentOrderId_fkey" FOREIGN KEY ("contentOrderId") REFERENCES "ContentOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RevisionRequest_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "ContentPiece" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RevisionRequest_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RevisionRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentOrderId" TEXT NOT NULL,
    "objective" TEXT,
    "budget" REAL,
    "audience" TEXT,
    "placements" JSONB,
    "adCopies" JSONB NOT NULL,
    "creatives" JSONB NOT NULL,
    "recommendedPlacements" JSONB,
    "creativeVariants" JSONB,
    "placementValidation" JSONB,
    "creativeSpecVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CampaignDraft_contentOrderId_fkey" FOREIGN KEY ("contentOrderId") REFERENCES "ContentOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentOrderId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryLink_contentOrderId_fkey" FOREIGN KEY ("contentOrderId") REFERENCES "ContentOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "businessProfileId" TEXT,
    "phone" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT,
    "mediaUrl" TEXT,
    "rawPayload" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsAppMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WhatsAppMessage_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "customerPhoneHash" TEXT NOT NULL,
    "customerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConversationThread_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationThreadId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT,
    "normalizedContent" TEXT,
    "detectedIntent" TEXT,
    "sentiment" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationMessage_conversationThreadId_fkey" FOREIGN KEY ("conversationThreadId") REFERENCES "ConversationThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "examples" JSONB,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConversationInsight_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FaqInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "suggestedAnswer" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "sourceExamples" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FaqInsight_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ObjectionInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "objection" TEXT NOT NULL,
    "suggestedResponse" TEXT NOT NULL,
    "recommendedContentIdea" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ObjectionInsight_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentOpportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "sourceInsightId" TEXT,
    "title" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "angle" TEXT,
    "suggestedCopy" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentOpportunity_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentOpportunity_sourceInsightId_fkey" FOREIGN KEY ("sourceInsightId") REFERENCES "ConversationInsight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyDigest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "topQuestions" JSONB,
    "topObjections" JSONB,
    "topProductInterests" JSONB,
    "contentIdeas" JSONB,
    "campaignIdeas" JSONB,
    "recommendedAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyDigest_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyDigestItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyDigestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyDigestItem_dailyDigestId_fkey" FOREIGN KEY ("dailyDigestId") REFERENCES "DailyDigest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduledJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledFor" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduledJob_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpportunityAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "recommendedAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OpportunityAlert_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SuggestedReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "conversationMessageId" TEXT,
    "insightId" TEXT,
    "triggerType" TEXT NOT NULL,
    "customerMessage" TEXT,
    "suggestedReply" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'friendly',
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SuggestedReply_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SuggestedReply_conversationMessageId_fkey" FOREIGN KEY ("conversationMessageId") REFERENCES "ConversationMessage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SuggestedReply_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "ConversationInsight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentCalendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "objective" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentCalendar_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentCalendarItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentCalendarId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "contentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "angle" TEXT,
    "suggestedCopy" TEXT,
    "suggestedVisual" TEXT,
    "cta" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentCalendarItem_contentCalendarId_fkey" FOREIGN KEY ("contentCalendarId") REFERENCES "ContentCalendar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IndustryTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "industry" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "angle" TEXT,
    "structure" JSONB,
    "exampleCopy" TEXT,
    "suggestedCTA" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IndustryPlaybook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "industry" TEXT NOT NULL,
    "commonQuestions" JSONB,
    "commonObjections" JSONB,
    "bestContentAngles" JSONB,
    "bestCampaignObjectives" JSONB,
    "suggestedAudiences" JSONB,
    "suggestedOffers" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentOpportunityId" TEXT,
    "contentPieceId" TEXT,
    "dailyDigestItemId" TEXT,
    "salesPotential" TEXT NOT NULL DEFAULT 'medium',
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "reason" TEXT,
    "basedOnConversationsCount" INTEGER NOT NULL DEFAULT 0,
    "recommendedPublishDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentScore_contentOpportunityId_fkey" FOREIGN KEY ("contentOpportunityId") REFERENCES "ContentOpportunity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentScore_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "ContentPiece" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentScore_dailyDigestItemId_fkey" FOREIGN KEY ("dailyDigestItemId") REFERENCES "DailyDigestItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "weekStartDate" DATETIME NOT NULL,
    "weekEndDate" DATETIME NOT NULL,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "topQuestions" JSONB,
    "topObjections" JSONB,
    "topProductInterests" JSONB,
    "topPurchaseSignals" JSONB,
    "recommendedContentPlan" JSONB,
    "recommendedCampaigns" JSONB,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WeeklyReport_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoiceBrief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "whatsappMessageId" TEXT,
    "audioUrl" TEXT NOT NULL,
    "transcription" TEXT,
    "extractedBrief" JSONB,
    "status" TEXT NOT NULL DEFAULT 'received',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoiceBrief_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VoiceBrief_whatsappMessageId_fkey" FOREIGN KEY ("whatsappMessageId") REFERENCES "WhatsAppMessage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "monthlyBudget" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "objective" TEXT,
    "recommendedDistribution" JSONB,
    "explanation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetPlan_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "sourceInsightId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "offerType" TEXT NOT NULL,
    "suggestedCopy" TEXT,
    "reason" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfferSuggestion_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferSuggestion_sourceInsightId_fkey" FOREIGN KEY ("sourceInsightId") REFERENCES "ConversationInsight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisualCreative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "contentOrderId" TEXT,
    "contentPieceId" TEXT,
    "assetId" TEXT,
    "type" TEXT NOT NULL,
    "placement" TEXT,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "format" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "safeZoneTopPercent" REAL,
    "safeZoneBottomPercent" REAL,
    "safeZoneSidePercent" REAL,
    "isPlacementReady" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "validationStatus" TEXT NOT NULL DEFAULT 'pending',
    "validationNotes" JSONB,
    "fileUrl" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "providerJobId" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisualCreative_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VisualCreative_contentOrderId_fkey" FOREIGN KEY ("contentOrderId") REFERENCES "ContentOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VisualCreative_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "ContentPiece" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VisualCreative_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisualPromptTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "industry" TEXT,
    "contentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "promptStructure" TEXT NOT NULL,
    "recommendedFormat" TEXT,
    "styleTags" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VisualGenerationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "contentOrderId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisualGenerationJob_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VisualGenerationJob_contentOrderId_fkey" FOREIGN KEY ("contentOrderId") REFERENCES "ContentOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetaCreativeSpec" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placement" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "recommendedAspectRatio" TEXT NOT NULL,
    "recommendedWidth" INTEGER NOT NULL,
    "recommendedHeight" INTEGER NOT NULL,
    "premiumWidth" INTEGER,
    "premiumHeight" INTEGER,
    "minWidth" INTEGER,
    "minHeight" INTEGER,
    "maxFileSizeMb" INTEGER,
    "supportedFileTypes" JSONB NOT NULL,
    "safeZoneTopPercent" REAL,
    "safeZoneBottomPercent" REAL,
    "safeZoneSidePercent" REAL,
    "primaryTextRecommendation" TEXT,
    "headlineRecommendation" TEXT,
    "descriptionRecommendation" TEXT,
    "notes" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CreativeVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "contentOrderId" TEXT,
    "visualCreativeId" TEXT,
    "placement" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "fileUrl" TEXT,
    "prompt" TEXT NOT NULL,
    "safeZoneApplied" BOOLEAN NOT NULL DEFAULT false,
    "validationStatus" TEXT NOT NULL DEFAULT 'pending',
    "validationNotes" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreativeVariant_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreativeVariant_contentOrderId_fkey" FOREIGN KEY ("contentOrderId") REFERENCES "ContentOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CreativeVariant_visualCreativeId_fkey" FOREIGN KEY ("visualCreativeId") REFERENCES "VisualCreative" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "BusinessProfile_userId_idx" ON "BusinessProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandKit_businessProfileId_key" ON "BrandKit"("businessProfileId");

-- CreateIndex
CREATE INDEX "Asset_businessProfileId_idx" ON "Asset"("businessProfileId");

-- CreateIndex
CREATE INDEX "ContentOrder_businessProfileId_idx" ON "ContentOrder"("businessProfileId");

-- CreateIndex
CREATE INDEX "ContentOrder_status_idx" ON "ContentOrder"("status");

-- CreateIndex
CREATE INDEX "ContentPiece_contentOrderId_idx" ON "ContentPiece"("contentOrderId");

-- CreateIndex
CREATE INDEX "ContentApproval_contentOrderId_idx" ON "ContentApproval"("contentOrderId");

-- CreateIndex
CREATE INDEX "ContentApproval_businessProfileId_idx" ON "ContentApproval"("businessProfileId");

-- CreateIndex
CREATE INDEX "RevisionRequest_contentOrderId_idx" ON "RevisionRequest"("contentOrderId");

-- CreateIndex
CREATE INDEX "RevisionRequest_businessProfileId_idx" ON "RevisionRequest"("businessProfileId");

-- CreateIndex
CREATE INDEX "CampaignDraft_contentOrderId_idx" ON "CampaignDraft"("contentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryLink_token_key" ON "DeliveryLink"("token");

-- CreateIndex
CREATE INDEX "DeliveryLink_contentOrderId_idx" ON "DeliveryLink"("contentOrderId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_phone_idx" ON "WhatsAppMessage"("phone");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_businessProfileId_idx" ON "WhatsAppMessage"("businessProfileId");

-- CreateIndex
CREATE INDEX "ConversationThread_businessProfileId_idx" ON "ConversationThread"("businessProfileId");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationThreadId_idx" ON "ConversationMessage"("conversationThreadId");

-- CreateIndex
CREATE INDEX "ConversationInsight_businessProfileId_idx" ON "ConversationInsight"("businessProfileId");

-- CreateIndex
CREATE INDEX "ConversationInsight_type_idx" ON "ConversationInsight"("type");

-- CreateIndex
CREATE INDEX "FaqInsight_businessProfileId_idx" ON "FaqInsight"("businessProfileId");

-- CreateIndex
CREATE INDEX "ObjectionInsight_businessProfileId_idx" ON "ObjectionInsight"("businessProfileId");

-- CreateIndex
CREATE INDEX "ContentOpportunity_businessProfileId_idx" ON "ContentOpportunity"("businessProfileId");

-- CreateIndex
CREATE INDEX "DailyDigest_businessProfileId_idx" ON "DailyDigest"("businessProfileId");

-- CreateIndex
CREATE INDEX "DailyDigest_date_idx" ON "DailyDigest"("date");

-- CreateIndex
CREATE INDEX "DailyDigestItem_dailyDigestId_idx" ON "DailyDigestItem"("dailyDigestId");

-- CreateIndex
CREATE INDEX "ScheduledJob_businessProfileId_idx" ON "ScheduledJob"("businessProfileId");

-- CreateIndex
CREATE INDEX "ScheduledJob_status_idx" ON "ScheduledJob"("status");

-- CreateIndex
CREATE INDEX "OpportunityAlert_businessProfileId_idx" ON "OpportunityAlert"("businessProfileId");

-- CreateIndex
CREATE INDEX "SuggestedReply_businessProfileId_idx" ON "SuggestedReply"("businessProfileId");

-- CreateIndex
CREATE INDEX "ContentCalendar_businessProfileId_idx" ON "ContentCalendar"("businessProfileId");

-- CreateIndex
CREATE INDEX "ContentCalendarItem_contentCalendarId_idx" ON "ContentCalendarItem"("contentCalendarId");

-- CreateIndex
CREATE INDEX "IndustryTemplate_industry_idx" ON "IndustryTemplate"("industry");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryPlaybook_industry_key" ON "IndustryPlaybook"("industry");

-- CreateIndex
CREATE INDEX "WeeklyReport_businessProfileId_idx" ON "WeeklyReport"("businessProfileId");

-- CreateIndex
CREATE INDEX "VoiceBrief_businessProfileId_idx" ON "VoiceBrief"("businessProfileId");

-- CreateIndex
CREATE INDEX "BudgetPlan_businessProfileId_idx" ON "BudgetPlan"("businessProfileId");

-- CreateIndex
CREATE INDEX "OfferSuggestion_businessProfileId_idx" ON "OfferSuggestion"("businessProfileId");

-- CreateIndex
CREATE INDEX "VisualCreative_businessProfileId_idx" ON "VisualCreative"("businessProfileId");

-- CreateIndex
CREATE INDEX "VisualCreative_contentOrderId_idx" ON "VisualCreative"("contentOrderId");

-- CreateIndex
CREATE INDEX "VisualPromptTemplate_industry_idx" ON "VisualPromptTemplate"("industry");

-- CreateIndex
CREATE INDEX "VisualGenerationJob_businessProfileId_idx" ON "VisualGenerationJob"("businessProfileId");

-- CreateIndex
CREATE INDEX "MetaCreativeSpec_placement_idx" ON "MetaCreativeSpec"("placement");

-- CreateIndex
CREATE UNIQUE INDEX "MetaCreativeSpec_placement_format_key" ON "MetaCreativeSpec"("placement", "format");

-- CreateIndex
CREATE INDEX "CreativeVariant_businessProfileId_idx" ON "CreativeVariant"("businessProfileId");

-- CreateIndex
CREATE INDEX "CreativeVariant_contentOrderId_idx" ON "CreativeVariant"("contentOrderId");
