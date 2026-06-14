import { features } from "@/lib/config/env";

/**
 * Servicio de Meta Ads. SIEMPRE crea borradores/pausados.
 * Regla de oro: nunca publicar ni gastar sin aprobación explícita del usuario.
 */

export interface CampaignDraftInput {
  objective: string;
  budget: number;
  audience: string;
  placements: string[];
}

export interface MetaCampaignRef {
  id: string;
  status: "draft" | "paused" | "published";
}

export interface MetaAdsService {
  createCampaignDraft(input: CampaignDraftInput): Promise<MetaCampaignRef>;
  createAdSetDraft(campaignId: string, input: Partial<CampaignDraftInput>): Promise<MetaCampaignRef>;
  createAdCreativeDraft(campaignId: string, creative: Record<string, unknown>): Promise<{ id: string }>;
  /** Requiere prueba de aprobación explícita; si no, lanza error. */
  publishCampaign(campaignId: string, approval: { approved: boolean; approvedByUserId: string }): Promise<MetaCampaignRef>;
  pauseCampaign(campaignId: string): Promise<MetaCampaignRef>;
  getCampaignMetrics(campaignId: string): Promise<Record<string, number>>;
}

class MockMetaAdsService implements MetaAdsService {
  async createCampaignDraft(_input: CampaignDraftInput): Promise<MetaCampaignRef> {
    return { id: `mock_campaign_${Math.abs(hash(JSON.stringify(_input)))}`, status: "paused" };
  }
  async createAdSetDraft(campaignId: string): Promise<MetaCampaignRef> {
    return { id: `${campaignId}_adset`, status: "paused" };
  }
  async createAdCreativeDraft(campaignId: string): Promise<{ id: string }> {
    return { id: `${campaignId}_creative` };
  }
  async publishCampaign(
    campaignId: string,
    approval: { approved: boolean; approvedByUserId: string }
  ): Promise<MetaCampaignRef> {
    if (!approval?.approved || !approval.approvedByUserId) {
      throw new Error(
        "No se puede publicar sin aprobación explícita del usuario (regla de seguridad de gasto)."
      );
    }
    return { id: campaignId, status: "published" };
  }
  async pauseCampaign(campaignId: string): Promise<MetaCampaignRef> {
    return { id: campaignId, status: "paused" };
  }
  async getCampaignMetrics(): Promise<Record<string, number>> {
    return { impressions: 0, reach: 0, messages: 0, spend: 0 };
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

function createMetaAdsService(): MetaAdsService {
  if (features.useRealMeta) {
    console.warn("[VendeMás] META_PROVIDER=real aún no implementado. Usando mock.");
  }
  return new MockMetaAdsService();
}

export const metaAdsService: MetaAdsService = createMetaAdsService();
