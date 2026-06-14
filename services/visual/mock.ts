import type {
  VisualGenerationService,
  VisualPromptOnly,
  VisualRequest,
  VisualResult,
} from "./types";

/**
 * Proveedor visual mockeado. Devuelve prompts, URLs placeholder y metadata de
 * formato. Misma forma de respuesta que tendrá Higgsfield, así que conectar el
 * real es cambiar el selector, no el resto del código.
 */
export class MockVisualGenerationService implements VisualGenerationService {
  readonly provider = "mock" as const;

  private placeholder(req: { width: number; height: number; aspectRatio: string }) {
    return `https://placehold.co/${req.width}x${req.height}/166534/FFFFFF?text=${encodeURIComponent(
      req.aspectRatio
    )}`;
  }

  private toResult(req: VisualRequest): VisualResult {
    return {
      prompt: req.prompt,
      negativePrompt: req.negativePrompt,
      type: req.type,
      format: req.format,
      aspectRatio: req.aspectRatio,
      width: req.width,
      height: req.height,
      placement: req.placement,
      fileUrl: this.placeholder(req),
      provider: "mock",
      status: "completed",
      providerJobId: `mock_${Math.abs(hash(req.prompt + req.aspectRatio))}`,
      metadata: { mock: true },
    };
  }

  async generateFeedImage(req: VisualRequest) {
    return this.toResult(req);
  }
  async generateStoryImage(req: VisualRequest) {
    return this.toResult(req);
  }
  async generateAdImage(req: VisualRequest) {
    return this.toResult(req);
  }
  async generateCarouselSlides(req: VisualRequest, slideCount: number) {
    return Array.from({ length: slideCount }, (_, i) =>
      this.toResult({ ...req, prompt: `${req.prompt} — slide ${i + 1}/${slideCount}` })
    );
  }
  async generateVideoCreative(req: VisualRequest) {
    return { ...this.toResult(req), metadata: { mock: true, kind: "video" } };
  }
  async generateUGCStyleVideo(req: VisualRequest) {
    return { ...this.toResult(req), metadata: { mock: true, kind: "ugc_video" } };
  }
  async generateAvatarVideo(req: VisualRequest) {
    return { ...this.toResult(req), metadata: { mock: true, kind: "avatar_video" } };
  }
  async generateProductScene(req: VisualRequest) {
    return { ...this.toResult(req), metadata: { mock: true, kind: "product_scene" } };
  }
  async generateCreativeVariations(input: {
    prompt: string;
    type: VisualRequest["type"];
    variants: { placement: VisualRequest["placement"]; format: VisualRequest["format"]; aspectRatio: string; width: number; height: number }[];
  }) {
    return input.variants.map((v) =>
      this.toResult({
        prompt: input.prompt,
        type: input.type,
        format: v.format,
        aspectRatio: v.aspectRatio,
        width: v.width,
        height: v.height,
        placement: v.placement,
      })
    );
  }
  async generateVisualPromptsOnly(reqs: VisualPromptOnly[]) {
    return reqs;
  }
  async regenerateVisualWithFeedback(req: VisualRequest, instruction: string) {
    return this.toResult({ ...req, prompt: `${req.prompt} [ajuste: ${instruction}]` });
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
