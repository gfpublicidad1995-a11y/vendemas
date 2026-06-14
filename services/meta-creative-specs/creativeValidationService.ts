import { prisma } from "@/lib/prisma";
import type { MetaPlacement, ValidationStatus } from "@/lib/validators/enums";
import {
  ASPECT_RATIO_LABEL,
  DEFAULT_META_CREATIVE_SPECS,
  getSafeZoneForPlacement,
  humanPlacement,
  type MetaCreativeSpecData,
} from "./metaCreativeSpecs";

export interface CreativeLike {
  width?: number | null;
  height?: number | null;
  aspectRatio: string;
  format?: string | null;
  placement?: string | null;
  fileUrl?: string | null;
  safeZoneApplied?: boolean;
}

export interface ValidationReport {
  status: ValidationStatus;
  problems: string[];
  recommendations: string[];
  placement?: string;
  suggestedAction?: string;
}

/**
 * Valida un creativo contra la spec de su ubicación. En el MVP se basa en
 * metadata (medidas, ratio, zona segura), no en analizar el pixel.
 */
export class CreativeValidationService {
  validateDimensions(creative: CreativeLike, spec: MetaCreativeSpecData): string[] {
    const problems: string[] = [];
    const w = creative.width ?? 0;
    const h = creative.height ?? 0;
    const minW = spec.minWidth ?? Math.min(spec.recommendedWidth, 1080);
    const minH = spec.minHeight ?? Math.min(spec.recommendedHeight, 1080);
    if (w < minW || h < minH) {
      problems.push(`Medidas ${w}x${h} por debajo del mínimo recomendado (${minW}x${minH}).`);
    }
    return problems;
  }

  validateAspectRatio(creative: CreativeLike, spec: MetaCreativeSpecData): string[] {
    const expected = ASPECT_RATIO_LABEL[spec.recommendedAspectRatio];
    if (creative.aspectRatio !== expected) {
      return [`Ratio ${creative.aspectRatio} distinto al recomendado para ${humanPlacement(spec.placement)} (${expected}).`];
    }
    return [];
  }

  validateSafeZone(creative: CreativeLike, placement: MetaPlacement): string[] {
    const zone = getSafeZoneForPlacement(placement);
    if (zone && !creative.safeZoneApplied) {
      return [
        `Esta ubicación (${humanPlacement(placement)}) tiene zonas seguras. Si el texto/CTA quedan en el ${zone.bottomPercent}% inferior, la interfaz puede taparlos.`,
      ];
    }
    return [];
  }

  validateFileType(creative: CreativeLike, spec: MetaCreativeSpecData): string[] {
    if (!creative.fileUrl) return [];
    const ext = creative.fileUrl.split(".").pop()?.toUpperCase() ?? "";
    if (ext && spec.supportedFileTypes.length && !spec.supportedFileTypes.includes(ext) && !creative.fileUrl.includes("placehold")) {
      return [`Tipo de archivo .${ext} no recomendado (${spec.supportedFileTypes.join("/")}).`];
    }
    return [];
  }

  /** Heurísticas mock para densidad de texto / marca / CTA. */
  validateTextDensity(): string[] {
    return [];
  }

  /** Corre todas las validaciones contra un creativo + su spec. */
  validate(creative: CreativeLike, spec: MetaCreativeSpecData): ValidationReport {
    const placement = (creative.placement as MetaPlacement) ?? spec.placement;
    const problems = [
      ...this.validateDimensions(creative, spec),
      ...this.validateFileType(creative, spec),
    ];
    const warnings = [
      ...this.validateAspectRatio(creative, spec),
      ...this.validateSafeZone(creative, placement),
    ];

    let status: ValidationStatus = "valid";
    if (problems.length) status = "invalid";
    else if (warnings.length) status = "warning";

    const allProblems = [...problems, ...warnings];
    const recommendations: string[] = [];
    if (warnings.length)
      recommendations.push("Generá una variante específica para esta ubicación en lugar de reutilizar la misma imagen.");
    if (problems.length)
      recommendations.push(`Regenerá en ${spec.recommendedWidth}x${spec.recommendedHeight}px.`);

    return {
      status,
      problems: allProblems,
      recommendations,
      placement: humanPlacement(placement),
      suggestedAction: status === "valid" ? undefined : "Pedí otra versión visual para esta ubicación.",
    };
  }

  /** Genera el reporte para un VisualCreative ya guardado. */
  async generateValidationReport(creativeId: string): Promise<ValidationReport | null> {
    const creative = await prisma.visualCreative.findUnique({ where: { id: creativeId } });
    if (!creative) return null;
    const placement = (creative.placement as MetaPlacement | null) ?? undefined;
    const spec =
      DEFAULT_META_CREATIVE_SPECS.find((s) => s.placement === placement) ??
      DEFAULT_META_CREATIVE_SPECS[0];
    return this.validate(
      {
        width: creative.width,
        height: creative.height,
        aspectRatio: creative.aspectRatio,
        format: creative.format,
        placement: creative.placement,
        fileUrl: creative.fileUrl,
        safeZoneApplied: creative.safeZoneTopPercent != null,
      },
      spec
    );
  }
}

export const creativeValidationService = new CreativeValidationService();
