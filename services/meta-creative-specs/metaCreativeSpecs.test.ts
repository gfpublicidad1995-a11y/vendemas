import { describe, it, expect } from "vitest";
import {
  getSafeZoneForPlacement,
  placementPromptGuidance,
  ASPECT_RATIO_DIMENSIONS,
  DEFAULT_CREATIVE_SET,
  STORY_SAFE_ZONE,
} from "@/services/meta-creative-specs/metaCreativeSpecs";

describe("metaCreativeSpecs", () => {
  it("Stories y Reels tienen zona segura; Feed no", () => {
    expect(getSafeZoneForPlacement("INSTAGRAM_STORIES")).toEqual(STORY_SAFE_ZONE);
    expect(getSafeZoneForPlacement("INSTAGRAM_REELS")).not.toBeNull();
    expect(getSafeZoneForPlacement("INSTAGRAM_FEED")).toBeNull();
  });

  it("dimensiones recomendadas por ratio", () => {
    expect(ASPECT_RATIO_DIMENSIONS.VERTICAL_4_5).toEqual({ width: 1080, height: 1350 });
    expect(ASPECT_RATIO_DIMENSIONS.STORY_9_16.height).toBe(1920);
  });

  it("el prompt de Stories incluye instrucciones de zona segura", () => {
    const p = placementPromptGuidance("INSTAGRAM_STORIES");
    expect(p).toMatch(/zona segura/i);
    expect(p).toContain("35%");
  });

  it("el default creative set cubre 4:5, 1:1 y 9:16", () => {
    const ratios = DEFAULT_CREATIVE_SET.map((v) => v.aspectRatio);
    expect(ratios).toEqual(expect.arrayContaining(["4:5", "1:1", "9:16"]));
  });
});
