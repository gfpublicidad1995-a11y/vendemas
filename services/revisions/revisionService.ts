import { prisma } from "@/lib/prisma";
import { aiService } from "@/services/ai";
import { visualService } from "@/services/visual";

const REVISION_PATTERNS = [
  /m[aá]s corto/i,
  /m[aá]s largo/i,
  /m[aá]s emocional/i,
  /m[aá]s vendedor/i,
  /m[aá]s directo/i,
  /m[aá]s premium/i,
  /m[aá]s limpio/i,
  /m[aá]s moderno/i,
  /m[aá]s profesional/i,
  /m[aá]s uruguayo/i,
  /sac[aá] /i,
  /otra versi[oó]n/i,
  /cambi[aá] (la )?imagen/i,
];

/**
 * Flujo de cambios. Detecta pedidos de revisión y los aplica sobre las piezas.
 */
export class RevisionService {
  detectRevisionIntent(message: string): boolean {
    return REVISION_PATTERNS.some((re) => re.test(message));
  }

  async createRevisionRequest(
    contentOrderId: string,
    instruction: string,
    businessProfileId: string,
    requestedByUserId: string,
    contentPieceId?: string
  ) {
    return prisma.revisionRequest.create({
      data: { contentOrderId, contentPieceId, businessProfileId, requestedByUserId, instruction, status: "pending" },
    });
  }

  /** Aplica la revisión re-escribiendo los copies del pedido. */
  async applyRevision(revisionRequestId: string) {
    const revision = await prisma.revisionRequest.findUnique({ where: { id: revisionRequestId } });
    if (!revision) throw new Error("Revisión no encontrada");

    await prisma.revisionRequest.update({ where: { id: revisionRequestId }, data: { status: "processing" } });

    const pieces = await prisma.contentPiece.findMany({
      where: { contentOrderId: revision.contentOrderId, type: { in: ["ad_copy", "story", "content_idea"] } },
    });
    for (const p of pieces) {
      if (!p.body) continue;
      const revised = await aiService.generateRevision(p.body, revision.instruction);
      await prisma.contentPiece.update({ where: { id: p.id }, data: { body: revised } });
    }

    await prisma.revisionRequest.update({ where: { id: revisionRequestId }, data: { status: "completed" } });
    await prisma.contentApproval.updateMany({
      where: { contentOrderId: revision.contentOrderId },
      data: { status: "pending", feedback: null },
    });
    return { revisedPieces: pieces.length };
  }

  /** Genera una variación nueva de una pieza (sin pisar la original). */
  async generateVariation(contentPieceId: string, instruction: string) {
    const piece = await prisma.contentPiece.findUnique({ where: { id: contentPieceId } });
    if (!piece || !piece.body) throw new Error("Pieza no encontrada");
    const revised = await aiService.generateRevision(piece.body, instruction);
    return prisma.contentPiece.create({
      data: {
        contentOrderId: piece.contentOrderId,
        type: piece.type,
        title: `${piece.title ?? "Pieza"} (variación)`,
        body: revised,
        format: piece.format,
      },
    });
  }

  /** Regenera un visual con feedback (nueva variante). */
  async regenerateVisualVariation(visualCreativeId: string, instruction: string) {
    const v = await prisma.visualCreative.findUnique({ where: { id: visualCreativeId } });
    if (!v) throw new Error("Visual no encontrado");
    const result = await visualService.regenerateVisualWithFeedback(
      {
        prompt: v.prompt,
        type: v.type as never,
        format: v.format as never,
        aspectRatio: v.aspectRatio,
        width: v.width ?? 1080,
        height: v.height ?? 1080,
        placement: (v.placement as never) ?? undefined,
      },
      instruction
    );
    return prisma.visualCreative.create({
      data: {
        businessProfileId: v.businessProfileId,
        contentOrderId: v.contentOrderId,
        type: v.type,
        placement: v.placement,
        prompt: result.prompt,
        format: v.format,
        aspectRatio: v.aspectRatio,
        width: v.width,
        height: v.height,
        isPlacementReady: true,
        status: "completed",
        validationStatus: v.validationStatus,
        fileUrl: result.fileUrl,
        provider: result.provider,
      },
    });
  }
}

export const revisionService = new RevisionService();
