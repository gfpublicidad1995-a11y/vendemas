import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { campaignStatusLabel, toneForStatus } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaignDraft.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contentOrder: {
        select: {
          id: true,
          businessProfile: { select: { businessName: true } },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Campañas"
        description="Todas las campañas nacen en borrador. Nunca publicamos ni gastamos sin aprobación explícita."
      />

      <div className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
        🔒 VendeMás no activa campañas reales ni gasta presupuesto sin tu OK.
      </div>

      {campaigns.length === 0 ? (
        <EmptyState title="Sin campañas todavía" />
      ) : (
        <Card className="divide-y divide-stone-100">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/orders/${c.contentOrder.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-stone-50"
            >
              <div className="min-w-0">
                <div className="font-medium text-stone-800">{c.objective ?? "Campaña"}</div>
                <div className="truncate text-xs text-stone-400">
                  {c.contentOrder.businessProfile.businessName} · {c.audience ?? ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm text-stone-500">{formatCurrency(c.budget, "USD")}/día</span>
                <Badge tone={toneForStatus(c.status)}>{campaignStatusLabel(c.status)}</Badge>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
