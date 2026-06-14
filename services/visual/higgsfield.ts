import { env } from "@/lib/config/env";
import type {
  VisualGenerationService,
  VisualPromptOnly,
  VisualRequest,
  VisualResult,
} from "./types";

/**
 * Proveedor visual basado en Higgsfield MCP.
 *
 * Preparado para conectarse cuando HIGGSFIELD_MCP_ENABLED=true. La generación
 * real de imágenes/videos se implementa más adelante invocando el MCP de
 * Higgsfield con las credenciales del entorno (sin hardcodear nada).
 *
 * Mientras no esté implementado, los prompts SÍ se devuelven (no requieren el
 * MCP), y las generaciones de imagen/video lanzan un error descriptivo. Como el
 * selector usa el mock por defecto, esto no bloquea el MVP.
 */
export class HiggsfieldVisualGenerationService implements VisualGenerationService {
  readonly provider = "higgsfield" as const;

  constructor() {
    if (!env.HIGGSFIELD_MCP_SERVER_URL) {
      console.warn(
        "[VendeMás] Higgsfield habilitado pero falta HIGGSFIELD_MCP_SERVER_URL."
      );
    }
  }

  private notImplemented(): never {
    throw new Error(
      "Generación visual con Higgsfield MCP todavía no implementada. " +
        "Configurá HIGGSFIELD_MCP_SERVER_URL / HIGGSFIELD_WORKSPACE_ID e implementá la invocación del MCP."
    );
  }

  async generateFeedImage(_req: VisualRequest): Promise<VisualResult> {
    return this.notImplemented();
  }
  async generateStoryImage(_req: VisualRequest): Promise<VisualResult> {
    return this.notImplemented();
  }
  async generateAdImage(_req: VisualRequest): Promise<VisualResult> {
    return this.notImplemented();
  }
  async generateCarouselSlides(): Promise<VisualResult[]> {
    return this.notImplemented();
  }
  async generateVideoCreative(): Promise<VisualResult> {
    return this.notImplemented();
  }
  async generateUGCStyleVideo(): Promise<VisualResult> {
    return this.notImplemented();
  }
  async generateAvatarVideo(): Promise<VisualResult> {
    return this.notImplemented();
  }
  async generateProductScene(): Promise<VisualResult> {
    return this.notImplemented();
  }
  async generateCreativeVariations(): Promise<VisualResult[]> {
    return this.notImplemented();
  }
  async generateVisualPromptsOnly(reqs: VisualPromptOnly[]): Promise<VisualPromptOnly[]> {
    // Los prompts no requieren el MCP.
    return reqs;
  }
  async regenerateVisualWithFeedback(): Promise<VisualResult> {
    return this.notImplemented();
  }
}
