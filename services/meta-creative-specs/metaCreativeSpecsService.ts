import { prisma } from "@/lib/prisma";
import type { MetaPlacement, MetaCreativeFormat } from "@/lib/validators/enums";
import type { VariantSpec } from "@/services/visual/types";
import {
  DEFAULT_CREATIVE_SET,
  DEFAULT_META_CREATIVE_SPECS,
  getSafeZoneForPlacement,
  placementPromptGuidance,
  recommendedPlacementsForObjective,
  type MetaSafeZone,
} from "./metaCreativeSpecs";

/**
 * Acceso a las especificaciones creativas de Meta (leídas de la base) +
 * cálculo de las variantes que conviene generar por ubicación.
 */
export class MetaCreativeSpecsService {
  getAllActiveSpecs() {
    return prisma.metaCreativeSpec.findMany({
      where: { isActive: true },
      orderBy: { placement: "asc" },
    });
  }

  getSpecForPlacement(placement: MetaPlacement, format: MetaCreativeFormat = "IMAGE") {
    return prisma.metaCreativeSpec.findUnique({
      where: { placement_format: { placement, format } },
    });
  }

  getDefaultCreativeSet() {
    return DEFAULT_CREATIVE_SET;
  }

  getRecommendedPlacementsForObjective(objective: string | null | undefined): MetaPlacement[] {
    return recommendedPlacementsForObjective(objective);
  }

  getSafeZoneForPlacement(placement: MetaPlacement): MetaSafeZone | null {
    return getSafeZoneForPlacement(placement);
  }

  generatePlacementSpecificPrompt(basePrompt: string, placement: MetaPlacement): string {
    return `${basePrompt} ${placementPromptGuidance(placement)}`;
  }

  /**
   * Dado un set de ubicaciones, devuelve las variantes mínimas a generar
   * (4:5, 1:1, 9:16 según corresponda) para no depender de una sola imagen.
   */
  suggestCreativeVariants(placements: MetaPlacement[]): VariantSpec[] {
    const requested = new Set(placements);
    const variants: VariantSpec[] = [];
    for (const set of DEFAULT_CREATIVE_SET) {
      const matchPlacement =
        set.placements.find((p) => requested.has(p)) ?? set.placements[0];
      // Incluir la variante si alguna de sus ubicaciones fue pedida (o si no se pidió ninguna).
      if (placements.length === 0 || set.placements.some((p) => requested.has(p))) {
        variants.push({
          placement: matchPlacement,
          format:
            set.format === "VERTICAL_4_5"
              ? "vertical_4_5"
              : set.format === "STORY_9_16"
                ? "story_9_16"
                : set.format === "SQUARE_1_1"
                  ? "square_1_1"
                  : set.format === "LINK_1_91_1"
                    ? "landscape_16_9"
                    : "custom",
          aspectRatio: set.aspectRatio,
          width: set.width,
          height: set.height,
        });
      }
    }
    return variants;
  }

  /** Default set como VariantSpec[] (cuando no hay ubicaciones específicas). */
  defaultVariantSpecs(): VariantSpec[] {
    return this.suggestCreativeVariants([]);
  }

  /** Specs base por placement (data en memoria, sin DB). */
  staticSpecFor(placement: MetaPlacement) {
    return (
      DEFAULT_META_CREATIVE_SPECS.find((s) => s.placement === placement) ??
      DEFAULT_META_CREATIVE_SPECS[0]
    );
  }
}

export const metaCreativeSpecsService = new MetaCreativeSpecsService();
