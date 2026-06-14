import type {
  VisualFormat,
  VisualCreativeType,
  MetaPlacement,
} from "@/lib/validators/enums";

export interface VisualRequest {
  prompt: string;
  negativePrompt?: string;
  type: VisualCreativeType;
  format: VisualFormat;
  aspectRatio: string;
  width: number;
  height: number;
  placement?: MetaPlacement;
}

export interface VariantSpec {
  placement: MetaPlacement;
  format: VisualFormat;
  aspectRatio: string;
  width: number;
  height: number;
}

export interface VisualResult {
  prompt: string;
  negativePrompt?: string;
  type: VisualCreativeType;
  format: VisualFormat;
  aspectRatio: string;
  width: number;
  height: number;
  placement?: MetaPlacement;
  fileUrl: string | null;
  provider: "mock" | "higgsfield";
  status: "completed" | "failed" | "pending";
  providerJobId?: string;
  metadata?: Record<string, unknown>;
}

export interface VisualPromptOnly {
  prompt: string;
  format: VisualFormat;
  aspectRatio: string;
  placement?: MetaPlacement;
}

export interface VisualGenerationService {
  readonly provider: "mock" | "higgsfield";
  generateFeedImage(req: VisualRequest): Promise<VisualResult>;
  generateStoryImage(req: VisualRequest): Promise<VisualResult>;
  generateAdImage(req: VisualRequest): Promise<VisualResult>;
  generateCarouselSlides(req: VisualRequest, slideCount: number): Promise<VisualResult[]>;
  generateVideoCreative(req: VisualRequest): Promise<VisualResult>;
  generateUGCStyleVideo(req: VisualRequest): Promise<VisualResult>;
  generateAvatarVideo(req: VisualRequest): Promise<VisualResult>;
  generateProductScene(req: VisualRequest): Promise<VisualResult>;
  generateCreativeVariations(input: {
    prompt: string;
    type: VisualCreativeType;
    variants: VariantSpec[];
  }): Promise<VisualResult[]>;
  generateVisualPromptsOnly(reqs: VisualPromptOnly[]): Promise<VisualPromptOnly[]>;
  regenerateVisualWithFeedback(req: VisualRequest, instruction: string): Promise<VisualResult>;
}
