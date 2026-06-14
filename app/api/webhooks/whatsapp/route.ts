import { NextRequest, NextResponse } from "next/server";
import { handleTurn, newSession } from "@/services/whatsapp/conversationFlow";

/**
 * Webhook de WhatsApp (mock).
 *
 * GET  → verificación tipo Meta (hub.challenge).
 * POST → recibe un mensaje entrante, lo procesa con el flujo conversacional y
 *        devuelve las respuestas en JSON (simulado).
 *
 * Nota: en el MVP el webhook es stateless (no persiste el estado de la
 * conversación entre llamadas). Con la WhatsApp Cloud API real se guardará la
 * sesión por teléfono y se enviarán plantillas aprobadas fuera de la ventana 24h.
 */

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const challenge = params.get("hub.challenge");
  if (challenge) return new NextResponse(challenge);
  return NextResponse.json({ ok: true, service: "vendemas-whatsapp-webhook" });
}

interface InboundPayload {
  from?: string;
  phone?: string;
  text?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  let body: InboundPayload = {};
  try {
    body = (await req.json()) as InboundPayload;
  } catch {
    // payload vacío o inválido
  }

  const phone = body.from ?? body.phone ?? "+59899000000";
  const text = body.text ?? body.message ?? "";
  if (!text) {
    return NextResponse.json({ error: "Falta el texto del mensaje" }, { status: 400 });
  }

  const result = await handleTurn(newSession(phone), text);
  return NextResponse.json({
    phone,
    replies: result.replies.map((r) => r.text),
    deliveryUrl: result.replies.find((r) => r.deliveryUrl)?.deliveryUrl ?? null,
    sessionPhase: result.session.phase,
  });
}
