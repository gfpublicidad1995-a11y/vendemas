import type {
  MetaPlacement,
  MetaCreativeFormat,
  MetaAspectRatio,
} from "@/lib/validators/enums";

/**
 * Módulo MetaCreativeSpecs (data pura).
 *
 * Meta cambia sus recomendaciones seguido, por eso estas specs se guardan en
 * la base (modelo MetaCreativeSpec) y se leen desde ahí. Este archivo es la
 * fuente para el seed inicial + helpers de cálculo (ratios, zonas seguras,
 * prompts por ubicación). Actualizar acá y volver a sembrar para refrescar.
 */

export interface MetaSafeZone {
  topPercent: number;
  bottomPercent: number;
  sidePercent: number;
}

export interface MetaCreativeSpecData {
  placement: MetaPlacement;
  format: MetaCreativeFormat;
  recommendedAspectRatio: MetaAspectRatio;
  recommendedWidth: number;
  recommendedHeight: number;
  premiumWidth?: number;
  premiumHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxFileSizeMb?: number;
  supportedFileTypes: string[];
  safeZoneTopPercent?: number;
  safeZoneBottomPercent?: number;
  safeZoneSidePercent?: number;
  primaryTextRecommendation?: string;
  headlineRecommendation?: string;
  descriptionRecommendation?: string;
  notes?: string[];
}

/** Zona segura estándar para formatos verticales full-screen (Stories/Reels). */
export const STORY_SAFE_ZONE: MetaSafeZone = {
  topPercent: 14,
  bottomPercent: 35,
  sidePercent: 6,
};

/** Etiqueta legible por ratio. */
export const ASPECT_RATIO_LABEL: Record<MetaAspectRatio, string> = {
  SQUARE_1_1: "1:1",
  VERTICAL_4_5: "4:5",
  STORY_9_16: "9:16",
  LANDSCAPE_16_9: "16:9",
  LINK_1_91_1: "1.91:1",
  CUSTOM: "custom",
};

/** Dimensiones recomendadas por ratio (px). */
export const ASPECT_RATIO_DIMENSIONS: Record<
  MetaAspectRatio,
  { width: number; height: number }
> = {
  SQUARE_1_1: { width: 1080, height: 1080 },
  VERTICAL_4_5: { width: 1080, height: 1350 },
  STORY_9_16: { width: 1080, height: 1920 },
  LANDSCAPE_16_9: { width: 1920, height: 1080 },
  LINK_1_91_1: { width: 1200, height: 628 },
  CUSTOM: { width: 1080, height: 1080 },
};

const JPG_PNG = ["JPG", "PNG"];

/** Specs base por ubicación (formato imagen). Fuente del seed inicial. */
export const DEFAULT_META_CREATIVE_SPECS: MetaCreativeSpecData[] = [
  {
    placement: "FACEBOOK_FEED",
    format: "IMAGE",
    recommendedAspectRatio: "VERTICAL_4_5",
    recommendedWidth: 1080,
    recommendedHeight: 1350,
    premiumWidth: 1440,
    premiumHeight: 1800,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    primaryTextRecommendation: "Texto principal corto, beneficio en la 1ª línea (máx ~125 caracteres).",
    headlineRecommendation: "Titular de 5-7 palabras con el gancho.",
    notes: [
      "Priorizar 4:5 para performance en mobile.",
      "Producto o beneficio visible en el primer vistazo.",
      "Logo presente pero no protagonista.",
    ],
  },
  {
    placement: "INSTAGRAM_FEED",
    format: "IMAGE",
    recommendedAspectRatio: "VERTICAL_4_5",
    recommendedWidth: 1080,
    recommendedHeight: 1350,
    premiumWidth: 1440,
    premiumHeight: 1800,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    primaryTextRecommendation: "Caption con gancho en la 1ª línea; el resto se corta con '...'.",
    headlineRecommendation: "Titular breve y directo.",
    notes: ["Estética cuidada, mobile-first.", "Evitar saturar de texto."],
  },
  {
    placement: "INSTAGRAM_PROFILE_FEED",
    format: "IMAGE",
    recommendedAspectRatio: "VERTICAL_4_5",
    recommendedWidth: 1080,
    recommendedHeight: 1350,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    notes: ["Mismo criterio que Feed."],
  },
  {
    placement: "FACEBOOK_STORIES",
    format: "IMAGE",
    recommendedAspectRatio: "STORY_9_16",
    recommendedWidth: 1080,
    recommendedHeight: 1920,
    premiumWidth: 1440,
    premiumHeight: 2560,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    safeZoneTopPercent: STORY_SAFE_ZONE.topPercent,
    safeZoneBottomPercent: STORY_SAFE_ZONE.bottomPercent,
    safeZoneSidePercent: STORY_SAFE_ZONE.sidePercent,
    notes: [
      "No poner texto, logo, precio ni CTA en el 14% superior, 35% inferior ni 6% lateral.",
      "Composición full-screen.",
    ],
  },
  {
    placement: "INSTAGRAM_STORIES",
    format: "IMAGE",
    recommendedAspectRatio: "STORY_9_16",
    recommendedWidth: 1080,
    recommendedHeight: 1920,
    premiumWidth: 1440,
    premiumHeight: 2560,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    safeZoneTopPercent: STORY_SAFE_ZONE.topPercent,
    safeZoneBottomPercent: STORY_SAFE_ZONE.bottomPercent,
    safeZoneSidePercent: STORY_SAFE_ZONE.sidePercent,
    notes: ["Ideal para urgencia, prueba social o consulta por WhatsApp."],
  },
  {
    placement: "MESSENGER_STORIES",
    format: "IMAGE",
    recommendedAspectRatio: "STORY_9_16",
    recommendedWidth: 1080,
    recommendedHeight: 1920,
    premiumWidth: 1440,
    premiumHeight: 2560,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    safeZoneTopPercent: STORY_SAFE_ZONE.topPercent,
    safeZoneBottomPercent: STORY_SAFE_ZONE.bottomPercent,
    safeZoneSidePercent: STORY_SAFE_ZONE.sidePercent,
  },
  {
    placement: "FACEBOOK_REELS",
    format: "IMAGE",
    recommendedAspectRatio: "STORY_9_16",
    recommendedWidth: 1080,
    recommendedHeight: 1920,
    premiumWidth: 1440,
    premiumHeight: 2560,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    safeZoneTopPercent: STORY_SAFE_ZONE.topPercent,
    safeZoneBottomPercent: STORY_SAFE_ZONE.bottomPercent,
    safeZoneSidePercent: STORY_SAFE_ZONE.sidePercent,
    notes: ["El gancho debe entenderse en 1 segundo.", "Evitar texto importante abajo."],
  },
  {
    placement: "INSTAGRAM_REELS",
    format: "IMAGE",
    recommendedAspectRatio: "STORY_9_16",
    recommendedWidth: 1080,
    recommendedHeight: 1920,
    premiumWidth: 1440,
    premiumHeight: 2560,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    safeZoneTopPercent: STORY_SAFE_ZONE.topPercent,
    safeZoneBottomPercent: STORY_SAFE_ZONE.bottomPercent,
    safeZoneSidePercent: STORY_SAFE_ZONE.sidePercent,
    notes: ["Ideal para UGC, testimonio, demostración y problema-solución."],
  },
  {
    placement: "FACEBOOK_MARKETPLACE",
    format: "IMAGE",
    recommendedAspectRatio: "SQUARE_1_1",
    recommendedWidth: 1080,
    recommendedHeight: 1080,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    notes: [
      "Producto protagonista, fondo limpio.",
      "Debe entenderse qué se vende sin depender del texto.",
    ],
  },
  {
    placement: "FACEBOOK_SEARCH_RESULTS",
    format: "IMAGE",
    recommendedAspectRatio: "SQUARE_1_1",
    recommendedWidth: 1080,
    recommendedHeight: 1080,
    minWidth: 1080,
    minHeight: 1080,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    notes: ["Variante 4:5 (1080x1350) también válida.", "Mensaje claro, producto reconocible."],
  },
  {
    placement: "INSTAGRAM_EXPLORE",
    format: "IMAGE",
    recommendedAspectRatio: "SQUARE_1_1",
    recommendedWidth: 1080,
    recommendedHeight: 1080,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    notes: ["Variante 4:5 (1080x1350) también válida.", "Diseño limpio."],
  },
  {
    placement: "FACEBOOK_RIGHT_COLUMN",
    format: "IMAGE",
    recommendedAspectRatio: "LINK_1_91_1",
    recommendedWidth: 1200,
    recommendedHeight: 628,
    minWidth: 600,
    minHeight: 314,
    maxFileSizeMb: 30,
    supportedFileTypes: JPG_PNG,
    notes: [
      "Anuncio tipo enlace landscape (1.91:1). 1:1 (1080x1080) también válido.",
      "Muy poco texto, marca legible, CTA simple.",
    ],
  },
];

export interface DefaultCreativeVariant {
  label: string;
  format: MetaAspectRatio;
  aspectRatio: string;
  width: number;
  height: number;
  placements: MetaPlacement[];
  premium?: { width: number; height: number };
}

/**
 * "Default Creative Set": el set mínimo de piezas que toda campaña rápida
 * genera para no depender de una sola imagen.
 */
export const DEFAULT_CREATIVE_SET: DefaultCreativeVariant[] = [
  {
    label: "Feed vertical 4:5",
    format: "VERTICAL_4_5",
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
    placements: ["FACEBOOK_FEED", "INSTAGRAM_FEED", "INSTAGRAM_PROFILE_FEED"],
    premium: { width: 1440, height: 1800 },
  },
  {
    label: "Cuadrado 1:1",
    format: "SQUARE_1_1",
    aspectRatio: "1:1",
    width: 1080,
    height: 1080,
    placements: [
      "FACEBOOK_MARKETPLACE",
      "FACEBOOK_SEARCH_RESULTS",
      "INSTAGRAM_EXPLORE",
      "FACEBOOK_RIGHT_COLUMN",
    ],
  },
  {
    label: "Story / Reel 9:16",
    format: "STORY_9_16",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    placements: [
      "INSTAGRAM_STORIES",
      "FACEBOOK_STORIES",
      "INSTAGRAM_REELS",
      "FACEBOOK_REELS",
      "MESSENGER_STORIES",
    ],
    premium: { width: 1440, height: 2560 },
  },
  {
    label: "Landscape 1.91:1",
    format: "LINK_1_91_1",
    aspectRatio: "1.91:1",
    width: 1200,
    height: 628,
    placements: ["FACEBOOK_RIGHT_COLUMN", "FACEBOOK_SEARCH_RESULTS"],
  },
];

/** Zona segura para una ubicación (null si no aplica). */
export function getSafeZoneForPlacement(
  placement: MetaPlacement
): MetaSafeZone | null {
  const verticalFullScreen: MetaPlacement[] = [
    "FACEBOOK_STORIES",
    "INSTAGRAM_STORIES",
    "MESSENGER_STORIES",
    "FACEBOOK_REELS",
    "INSTAGRAM_REELS",
  ];
  return verticalFullScreen.includes(placement) ? STORY_SAFE_ZONE : null;
}

/** Formatos/ubicaciones recomendadas según objetivo de campaña. */
export function recommendedPlacementsForObjective(
  objective: string | null | undefined
): MetaPlacement[] {
  const base: MetaPlacement[] = [
    "INSTAGRAM_FEED",
    "FACEBOOK_FEED",
    "INSTAGRAM_STORIES",
    "INSTAGRAM_REELS",
  ];
  const obj = (objective ?? "").toLowerCase();
  if (obj.includes("marketplace") || obj.includes("venta local")) {
    return ["FACEBOOK_MARKETPLACE", "FACEBOOK_FEED", "INSTAGRAM_FEED"];
  }
  if (obj.includes("alcance") || obj.includes("reconocimiento")) {
    return [...base, "INSTAGRAM_EXPLORE", "FACEBOOK_SEARCH_RESULTS"];
  }
  return base;
}

/** Sufijo de prompt con las reglas de la ubicación (zona segura, formato). */
export function placementPromptGuidance(placement: MetaPlacement): string {
  const dims =
    DEFAULT_META_CREATIVE_SPECS.find((s) => s.placement === placement) ??
    DEFAULT_META_CREATIVE_SPECS[0];
  const ratio = ASPECT_RATIO_LABEL[dims.recommendedAspectRatio];
  const zone = getSafeZoneForPlacement(placement);
  const parts: string[] = [
    `Formato ${ratio} (${dims.recommendedWidth}x${dims.recommendedHeight}px) para ${humanPlacement(placement)}.`,
  ];
  if (zone) {
    parts.push(
      `Mantener texto, logo, precio y CTA dentro de zona segura: evitar el ${zone.topPercent}% superior, ${zone.bottomPercent}% inferior y ${zone.sidePercent}% de cada lateral. Composición full-screen.`
    );
  } else {
    parts.push(
      "Producto/beneficio protagonista en el primer vistazo, texto corto y legible, logo discreto, CTA claro, márgenes seguros."
    );
  }
  return parts.join(" ");
}

/** Nombre legible de una ubicación. */
export function humanPlacement(placement: MetaPlacement): string {
  const map: Record<MetaPlacement, string> = {
    FACEBOOK_FEED: "Facebook Feed",
    INSTAGRAM_FEED: "Instagram Feed",
    FACEBOOK_STORIES: "Facebook Stories",
    INSTAGRAM_STORIES: "Instagram Stories",
    FACEBOOK_REELS: "Facebook Reels",
    INSTAGRAM_REELS: "Instagram Reels",
    FACEBOOK_MARKETPLACE: "Facebook Marketplace",
    FACEBOOK_SEARCH_RESULTS: "Facebook Search",
    INSTAGRAM_EXPLORE: "Instagram Explore",
    INSTAGRAM_PROFILE_FEED: "Instagram Profile Feed",
    MESSENGER_STORIES: "Messenger Stories",
    FACEBOOK_RIGHT_COLUMN: "Facebook Right Column",
  };
  return map[placement];
}
