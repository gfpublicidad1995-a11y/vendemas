import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { priorityLabel, toneForPriority } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { asStringArray } from "@/lib/json";
import { formatDigestForWhatsApp } from "@/services/digests/formatDigest";
import { CreateContentFromDigestItemButton } from "@/components/dashboard/ActionButtons";

export const dynamic = "force-dynamic";

export default async function DigestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const digest = await prisma.dailyDigest.findUnique({
    where: { id },
    include: {
      businessProfile: { select: { businessName: true } },
      items: { orderBy: { priority: "desc" } },
    },
  });
  if (!digest) notFound();

  const waMessage = formatDigestForWhatsApp(digest);

  const list = (title: string, items: string[], emoji: string) =>
    items.length > 0 ? (
      <div>
        <p className="mb-1 text-xs font-medium text-stone-400">{emoji} {title}</p>
        <ul className="space-y-1">
          {items.map((q, i) => (
            <li key={i} className="rounded-lg bg-stone-50 px-3 py-1.5 text-sm text-stone-700">{q}</li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div>
      <PageHeader
        title={`Ideas para mañana · ${formatDate(digest.date)}`}
        description={`${digest.businessProfile.businessName} · ${digest.totalConversations} conversaciones, ${digest.totalMessages} mensajes`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <SectionTitle>Lo que pasó hoy</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {list("Más preguntado", asStringArray(digest.topQuestions), "❓")}
              {list("Objeciones", asStringArray(digest.topObjections), "🤔")}
              {list("Interés en productos", asStringArray(digest.topProductInterests), "🛒")}
              {list("Ideas de contenido", asStringArray(digest.contentIdeas), "💡")}
            </div>
            {digest.recommendedAction ? (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
                🔥 {digest.recommendedAction}
              </div>
            ) : null}
          </Card>

          <Card className="p-5">
            <SectionTitle>Acciones sugeridas</SectionTitle>
            <div className="space-y-2">
              {digest.items.map((it) => (
                <div key={it.id} className="rounded-xl border border-stone-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-stone-800">{it.title}</div>
                      <div className="text-xs text-stone-500">{it.description}</div>
                    </div>
                    <Badge tone={toneForPriority(it.priority)}>{priorityLabel(it.priority)}</Badge>
                  </div>
                  {it.type === "content_idea" || it.type === "campaign_idea" ? (
                    <div className="mt-2">
                      <CreateContentFromDigestItemButton itemId={it.id} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle>Mensaje de WhatsApp</SectionTitle>
          <Card className="bg-[#e7ffdb] p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-800">
              {waMessage}
            </pre>
          </Card>
          <p className="mt-2 text-xs text-stone-400">
            Así le llega el resumen al emprendedor. Puede responder 1-4 para crear las piezas.
          </p>
        </div>
      </div>
    </div>
  );
}
