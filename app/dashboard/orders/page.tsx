import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { orderTypeLabel, orderStatusLabel, toneForStatus } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.contentOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      businessProfile: { select: { businessName: true } },
      _count: { select: { contentPieces: true, visualCreatives: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Pedidos de contenido"
        description="Cada pedido genera piezas, anuncios o campañas listas para aprobar."
      >
        <ButtonLink href="/dashboard/orders/new">+ Nuevo pedido</ButtonLink>
      </PageHeader>

      {orders.length === 0 ? (
        <EmptyState title="Sin pedidos" description="Creá uno nuevo o generá una Campaña Rápida desde el simulador." />
      ) : (
        <Card className="divide-y divide-stone-100">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/dashboard/orders/${o.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-stone-50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-800">{orderTypeLabel(o.type)}</span>
                  {o.type === "quick_campaign" ? <Badge tone="emerald">⚡ Rápida</Badge> : null}
                </div>
                <div className="truncate text-xs text-stone-400">
                  {o.businessProfile.businessName} · {o.objective ?? "Sin objetivo"} · {formatDate(o.createdAt)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-stone-400">
                  {o._count.contentPieces} piezas · {o._count.visualCreatives} imágenes
                </span>
                <Badge tone={toneForStatus(o.status)}>{orderStatusLabel(o.status)}</Badge>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
