import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { generateCalendar, createContentFromCalendarItem } from "@/app/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const [calendars, firstBusiness] = await Promise.all([
    prisma.contentCalendar.findMany({
      orderBy: { startDate: "desc" },
      include: {
        businessProfile: { select: { businessName: true } },
        items: { orderBy: { date: "asc" } },
      },
    }),
    prisma.businessProfile.findFirst({ select: { id: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Calendario de contenido"
        description="Un plan semanal listo para aprobar y publicar, armado desde tus conversaciones."
      >
        {firstBusiness ? (
          <form action={generateCalendar}>
            <input type="hidden" name="businessProfileId" value={firstBusiness.id} />
            <SubmitButton
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              pendingText="Armando…"
            >
              🗓️ Generar calendario
            </SubmitButton>
          </form>
        ) : null}
      </PageHeader>
      {calendars.length === 0 ? (
        <EmptyState title="Sin calendarios todavía" />
      ) : (
        <div className="space-y-6">
          {calendars.map((cal) => (
            <Card key={cal.id} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-stone-800">{cal.objective ?? "Plan semanal"}</h2>
                  <p className="text-xs text-stone-400">
                    {cal.businessProfile.businessName} · {formatDate(cal.startDate)} → {formatDate(cal.endDate)}
                  </p>
                </div>
                <Badge tone="amber">{cal.status}</Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {cal.items.map((it) => (
                  <div key={it.id} className="rounded-xl border border-stone-100 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-400">{formatDate(it.date)}</span>
                      <Badge tone="blue">{it.contentType}</Badge>
                    </div>
                    <div className="mt-1 text-sm font-medium text-stone-800">{it.title}</div>
                    {it.suggestedCopy ? (
                      <p className="mt-1 text-xs text-stone-500">{it.suggestedCopy}</p>
                    ) : null}
                    {it.cta ? <p className="mt-1 text-xs text-emerald-700">{it.cta}</p> : null}
                    {it.status === "pending" ? (
                      <form action={createContentFromCalendarItem} className="mt-2">
                        <input type="hidden" name="calendarItemId" value={it.id} />
                        <SubmitButton
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                          pendingText="Generando…"
                        >
                          Crear esta pieza
                        </SubmitButton>
                      </form>
                    ) : (
                      <Badge tone="green" className="mt-2">{it.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
