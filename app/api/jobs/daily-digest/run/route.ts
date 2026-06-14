import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dailyDigestService } from "@/services/digests/dailyDigestService";

/**
 * Corre el Daily Digest "Ideas para mañana".
 * Body opcional: { businessProfileId?: string, date?: string }.
 * Si no se pasa businessProfileId, corre para todos los negocios habilitados.
 *
 * Respeta los consentimientos del negocio (no analiza ni envía sin permiso).
 */
export async function POST(req: NextRequest) {
  let body: { businessProfileId?: string; date?: string } = {};
  try {
    body = await req.json();
  } catch {
    // sin body
  }

  const date = body.date ? new Date(body.date) : undefined;

  const businessIds = body.businessProfileId
    ? [body.businessProfileId]
    : (
        await prisma.businessProfile.findMany({
          where: { dailyDigestEnabled: true },
          select: { id: true },
        })
      ).map((b) => b.id);

  const results: Record<string, unknown>[] = [];
  for (const id of businessIds) {
    try {
      const run = await dailyDigestService.generateDailyDigest(id, date);
      if (run.status === "generated" && run.digestId) {
        const sent = await dailyDigestService.sendDigestToBusinessOwner(run.digestId);
        results.push({ businessProfileId: id, ...run, sent });
      } else {
        results.push({ businessProfileId: id, ...run });
      }
    } catch (e) {
      results.push({ businessProfileId: id, status: "error", error: String(e) });
    }
  }

  return NextResponse.json({ ran: results.length, results });
}
