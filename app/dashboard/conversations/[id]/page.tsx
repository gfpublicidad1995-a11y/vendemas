import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { toneForStatus } from "@/lib/labels";
import {
  generateSuggestedReplies,
  markReplyDismissed,
  markReplyUsed,
} from "@/app/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await prisma.conversationThread.findUnique({
    where: { id },
    include: {
      businessProfile: { select: { id: true, businessName: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) notFound();

  const replies = await prisma.suggestedReply.findMany({
    where: { businessProfileId: thread.businessProfileId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div>
      <PageHeader
        title={thread.customerName ?? "Cliente"}
        description={`${thread.businessProfile.businessName} · teléfono protegido (hash ${thread.customerPhoneHash.slice(0, 8)}…)`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle>Conversación</SectionTitle>
          <div className="space-y-3">
            {thread.messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.direction === "inbound" ? "justify-start" : "justify-end")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    m.direction === "inbound"
                      ? "bg-stone-100 text-stone-800"
                      : "bg-emerald-600 text-white"
                  )}
                >
                  <p>{m.content}</p>
                  {m.detectedIntent ? (
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px]",
                        m.direction === "inbound" ? "bg-white text-stone-500" : "bg-emerald-700 text-emerald-50"
                      )}
                    >
                      {m.detectedIntent}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle
              action={
                <form action={generateSuggestedReplies}>
                  <input type="hidden" name="businessProfileId" value={thread.businessProfileId} />
                  <SubmitButton
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    pendingText="…"
                  >
                    Generar
                  </SubmitButton>
                </form>
              }
            >
              Respuestas sugeridas
            </SectionTitle>
            {replies.length === 0 ? (
              <p className="text-sm text-stone-400">Sin respuestas sugeridas. Tocá “Generar”.</p>
            ) : (
              <div className="space-y-3">
                {replies.map((r) => (
                  <div key={r.id} className="rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                    <div className="flex items-center justify-between">
                      <Badge tone="blue">{r.triggerType}</Badge>
                      <Badge tone={toneForStatus(r.status)}>{r.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-stone-700">{r.suggestedReply}</p>
                    {r.status === "suggested" ? (
                      <div className="mt-2 flex gap-2">
                        <form action={markReplyUsed}>
                          <input type="hidden" name="replyId" value={r.id} />
                          <SubmitButton className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100">
                            Usar
                          </SubmitButton>
                        </form>
                        <form action={markReplyDismissed}>
                          <input type="hidden" name="replyId" value={r.id} />
                          <SubmitButton className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-500 hover:bg-stone-200">
                            Descartar
                          </SubmitButton>
                        </form>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-stone-400">
              Las respuestas se sugieren para que las apruebes. No se envían solas.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
