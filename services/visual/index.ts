import { features } from "@/lib/config/env";
import { MockVisualGenerationService } from "./mock";
import { HiggsfieldVisualGenerationService } from "./higgsfield";
import type { VisualGenerationService } from "./types";

export * from "./types";

/**
 * Selector del motor visual.
 * - HIGGSFIELD_MCP_ENABLED=false (default): MockVisualGenerationService.
 * - HIGGSFIELD_MCP_ENABLED=true: HiggsfieldVisualGenerationService.
 */
function createVisualService(): VisualGenerationService {
  return features.useHiggsfield
    ? new HiggsfieldVisualGenerationService()
    : new MockVisualGenerationService();
}

export const visualService: VisualGenerationService = createVisualService();
