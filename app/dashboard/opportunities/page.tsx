import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { alertTypeLabel, priorityLabel, toneForPriority, contentTypeLabel } from "@/lib/labels";
import { createContentFromAlert, generateOpportunities } from "@/app/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const [alerts, opportunities, firstBusiness] = await Promise.all([
    prisma.opportunityAlert.findMany({
      orderBy: { createdAt: "desc" },
      include: { businessProfile: { select: { businessName: true } } },
    }),
    prisma.contentOpportunity.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { businessProfile: { select: { businessName: true } } },
    }),
    prisma.businessProfile.findFirst({ select: { id: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Radar de oportunidades"
        description="Detectamos picos de consultas, objeciones repetidas e intención de compra para que actúes a tiempo."
      >
        {firstBusiness ? (
          <form action={generateOpportunities}>
            <input type="hidden" name="businessProfileId" value={firstBusiness.id} />
            <SubmitButton
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              pendingText="Detectando…"
            >
              🎯 Detectar oportunidades de hoy
            </SubmitButton>
          </form>
        ) : null}
      </PageHeader>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <EmptyState title="Sin oportunidades todavía" />
        ) : (
          alerts.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={toneForPriority(a.priority)}>{priorityLabel(a.priority)}</Badge>
                    <Badge>{alertTypeLabel(a.type)}</Badge>
                  </div>
                  <h3 className="mt-2 font-medium text-stone-800">{a.title}</h3>
                  <p className="text-sm text-stone-500">{a.description}</p>
                  {a.recommendedAction ? (
                    <p className="mt-2 text-sm text-emerald-700">→ {a.recommendedAction}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-stone-400">{a.businessProfile.businessName}</span>
              </div>
              {a.status !== "used" ? (
                <form action={createContentFromAlert} className="mt-3">
                  <input type="hidden" name="alertId" value={a.id} />
                  <SubmitButton
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    pendingText="Generando…"
                  >
                    Crear contenido para esta oportunidad
                  </SubmitButton>
                </form>
              ) : null}
            </Card>
          ))
        )}
      </div>

      {opportunities.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Oportunidades de contenido
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {opportunities.map((o) => (
              <Card key={o.id} className="p-4">
                <div className="flex items-center justify-between">
                  <Badge tone="blue">{contentTypeLabel(o.contentType)}</Badge>
                  <Badge tone={toneForPriority(o.priority)}>{priorityLabel(o.priority)}</Badge>
                </div>
                <h3 className="mt-2 font-medium text-stone-800">{o.title}</h3>
                <p className="text-sm text-stone-500">{o.angle}</p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
