import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { asRecord } from "@/lib/json";
import { generateBudgetPlan } from "@/app/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

export default async function BudgetPlannerPage() {
  const [plans, firstBusiness] = await Promise.all([
    prisma.budgetPlan.findMany({
      orderBy: { createdAt: "desc" },
      include: { businessProfile: { select: { businessName: true } } },
    }),
    prisma.businessProfile.findFirst({ select: { id: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Planificador de pauta"
        description="Te recomendamos cómo repartir tu presupuesto. Nunca activamos campañas ni gastamos sin tu aprobación."
      >
        {firstBusiness ? (
          <form action={generateBudgetPlan} className="flex items-center gap-2">
            <input type="hidden" name="businessProfileId" value={firstBusiness.id} />
            <input
              name="monthlyBudget"
              type="number"
              defaultValue={300}
              min={0}
              className="w-24 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <SubmitButton
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              pendingText="Calculando…"
            >
              💰 Generar plan
            </SubmitButton>
          </form>
        ) : null}
      </PageHeader>

      <div className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
        🔒 Esto es solo una recomendación. No se gasta nada hasta que apruebes.
      </div>

      {plans.length === 0 ? (
        <EmptyState title="Sin planes de pauta todavía" />
      ) : (
        <div className="space-y-6">
          {plans.map((p) => {
            const dist = asRecord(p.recommendedDistribution);
            const entries = Object.entries(dist) as [string, number][];
            return (
              <Card key={p.id} className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-stone-800">
                      {formatCurrency(p.monthlyBudget, p.currency)} / mes
                    </h2>
                    <p className="text-xs text-stone-400">
                      {p.businessProfile.businessName} · {p.objective}
                    </p>
                  </div>
                  <Badge tone="amber">{p.status}</Badge>
                </div>
                <div className="space-y-2">
                  {entries.map(([label, ratio]) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-600">{label}</span>
                        <span className="text-stone-400">
                          {Math.round(Number(ratio) * 100)}% · {formatCurrency(p.monthlyBudget * Number(ratio), p.currency)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.round(Number(ratio) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {p.explanation ? <p className="mt-4 text-sm text-stone-600">{p.explanation}</p> : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
