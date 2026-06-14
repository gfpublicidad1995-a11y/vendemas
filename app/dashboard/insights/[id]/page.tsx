import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { insightTypeLabel, priorityLabel, toneForPriority } from "@/lib/labels";
import { asStringArray } from "@/lib/json";
import { CreateContentFromInsightButton } from "@/components/dashboard/ActionButtons";

export const dynamic = "force-dynamic";

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const insight = await prisma.conversationInsight.findUnique({
    where: { id },
    include: {
      businessProfile: { select: { businessName: true } },
      contentOpportunities: true,
      offerSuggestions: true,
    },
  });
  if (!insight) notFound();

  return (
    <div>
      <PageHeader title={insight.title} description={insight.businessProfile.businessName}>
        <CreateContentFromInsightButton insightId={insight.id} />
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone="purple">{insightTypeLabel(insight.type)}</Badge>
        <span className="text-sm text-stone-500">Frecuencia: {insight.frequency}×</span>
        <span className="text-sm text-stone-500">Confianza: {Math.round(insight.confidence * 100)}%</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>Qué detectamos</SectionTitle>
          <p className="text-sm text-stone-700">{insight.description}</p>
          {asStringArray(insight.examples).length > 0 ? (
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-stone-400">Ejemplos reales</p>
              <ul className="space-y-1">
                {asStringArray(insight.examples).map((ex, idx) => (
                  <li key={idx} className="rounded-lg bg-stone-50 px-3 py-1.5 text-sm text-stone-600">
                    “{ex}”
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle>Oportunidades de contenido</SectionTitle>
            {insight.contentOpportunities.length === 0 ? (
              <p className="text-sm text-stone-400">Sin oportunidades vinculadas.</p>
            ) : (
              <div className="space-y-2">
                {insight.contentOpportunities.map((o) => (
                  <div key={o.id} className="rounded-xl border border-stone-100 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-800">{o.title}</span>
                      <Badge tone={toneForPriority(o.priority)}>{priorityLabel(o.priority)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{o.angle}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {insight.offerSuggestions.length > 0 ? (
            <Card className="p-5">
              <SectionTitle>Ofertas sugeridas</SectionTitle>
              <div className="space-y-2">
                {insight.offerSuggestions.map((o) => (
                  <div key={o.id} className="rounded-xl border border-stone-100 p-3">
                    <span className="text-sm font-medium text-stone-800">{o.title}</span>
                    <p className="mt-1 text-xs text-stone-500">{o.suggestedCopy}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
