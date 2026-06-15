import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { validationStatusLabel, toneForStatus } from "@/lib/labels";
import { asRecord } from "@/lib/json";

export const dynamic = "force-dynamic";

export default async function VisualsPage() {
  const visuals = await prisma.visualCreative.findMany({
    orderBy: { createdAt: "desc" },
    include: { businessProfile: { select: { businessName: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Imágenes"
        description="Las imágenes de tus anuncios en los distintos tamaños de las redes. Tocá una para ver el detalle o subir la versión final."
      />
      {visuals.length === 0 ? (
        <EmptyState title="Sin visuales todavía" description="Generá una Campaña Rápida desde el simulador." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visuals.map((v) => (
            <Link key={v.id} href={`/dashboard/visuals/${v.id}`} className="group">
              <Card className="overflow-hidden transition hover:shadow-md">
                <div className="aspect-square overflow-hidden bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.fileUrl ?? ""} alt={v.aspectRatio} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">{v.aspectRatio}</span>
                    <Badge tone={toneForStatus(v.validationStatus)}>
                      {validationStatusLabel(v.validationStatus)}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-stone-400">
                    {v.placement ?? v.type} · {v.businessProfile.businessName}
                  </p>
                  {asRecord(v.metadata).angleLabel ? (
                    <Badge tone="purple" className="mt-1">
                      {String(asRecord(v.metadata).angleLabel)}
                    </Badge>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
