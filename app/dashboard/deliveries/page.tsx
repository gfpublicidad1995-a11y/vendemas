import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { orderTypeLabel } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const links = await prisma.deliveryLink.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contentOrder: {
        select: { id: true, type: true, businessProfile: { select: { businessName: true } } },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Entregas"
        description="Páginas privadas con token donde el emprendedor ve y aprueba su contenido."
      />
      {links.length === 0 ? (
        <EmptyState title="Sin entregas todavía" />
      ) : (
        <Card className="divide-y divide-stone-100">
          {links.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="font-medium text-stone-800">
                  {orderTypeLabel(l.contentOrder.type)} · {l.contentOrder.businessProfile.businessName}
                </div>
                <div className="truncate text-xs text-stone-400">{l.url}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-stone-400">{formatDate(l.createdAt)}</span>
                <Link
                  href={`/delivery/${l.token}`}
                  target="_blank"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Abrir
                </Link>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
