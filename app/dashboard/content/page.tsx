import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { contentPieceTypeLabel, orderTypeLabel } from "@/lib/labels";
import { truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const pieces = await prisma.contentPiece.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      contentOrder: {
        select: {
          id: true,
          type: true,
          businessProfile: { select: { businessName: true } },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Piezas generadas"
        description="Copies, carruseles, guiones y estructuras de campaña listos para usar."
      />
      {pieces.length === 0 ? (
        <EmptyState title="Sin piezas todavía" />
      ) : (
        <div className="space-y-3">
          {pieces.map((p) => (
            <Link key={p.id} href={`/dashboard/orders/${p.contentOrder.id}`}>
              <Card className="p-4 transition hover:shadow-md">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{contentPieceTypeLabel(p.type)}</Badge>
                  {p.title ? <span className="text-sm font-medium text-stone-800">{p.title}</span> : null}
                  <span className="ml-auto text-xs text-stone-400">
                    {p.contentOrder.businessProfile.businessName} · {orderTypeLabel(p.contentOrder.type)}
                  </span>
                </div>
                <p className="text-sm text-stone-600">{truncate(p.body ?? "", 180)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
