import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { asStringArray } from "@/lib/json";
import { statusLabel } from "@/lib/labels";
import { generateWeeklyReport } from "@/app/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

export default async function WeeklyReportsPage() {
  const [reports, firstBusiness] = await Promise.all([
    prisma.weeklyReport.findMany({
      orderBy: { weekStartDate: "desc" },
      include: { businessProfile: { select: { businessName: true } } },
    }),
    prisma.businessProfile.findFirst({ select: { id: true } }),
  ]);

  const chips = (title: string, items: string[]) =>
    items.length ? (
      <div>
        <p className="mb-1 text-xs font-medium text-stone-400">{title}</p>
        <div className="flex flex-wrap gap-1">
          {items.map((x, i) => (
            <Badge key={i}>{x}</Badge>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div>
      <PageHeader
        title="Reportes semanales"
        description="El resumen de la semana: qué preguntaron, qué frenó las ventas y qué publicar."
      >
        {firstBusiness ? (
          <form action={generateWeeklyReport}>
            <input type="hidden" name="businessProfileId" value={firstBusiness.id} />
            <SubmitButton
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              pendingText="Generando…"
            >
              📈 Generar reporte
            </SubmitButton>
          </form>
        ) : null}
      </PageHeader>
      {reports.length === 0 ? (
        <EmptyState title="Sin reportes semanales todavía" />
      ) : (
        <div className="space-y-6">
          {reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-stone-800">
                  {r.businessProfile.businessName} · {formatDate(r.weekStartDate)} → {formatDate(r.weekEndDate)}
                </h2>
                <Badge tone="green">{statusLabel(r.status)}</Badge>
              </div>
              {r.summary ? <p className="mb-4 text-sm text-stone-600">{r.summary}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  {chips("Más preguntado", asStringArray(r.topQuestions))}
                  {chips("Objeciones", asStringArray(r.topObjections))}
                  {chips("Señales de compra", asStringArray(r.topPurchaseSignals))}
                </div>
                <div className="space-y-3">
                  {chips("Plan de contenido", asStringArray(r.recommendedContentPlan))}
                  {chips("Campañas sugeridas", asStringArray(r.recommendedCampaigns))}
                </div>
              </div>
              <div className="mt-4 flex gap-6 text-sm text-stone-500">
                <span>{r.totalConversations} charlas</span>
                <span>{r.totalMessages} mensajes</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
