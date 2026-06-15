import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { ShareIntakeButton } from "@/components/intake/ShareIntakeButton";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const businesses = await prisma.businessProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          contentOrders: true,
          conversationThreads: true,
          conversationInsights: true,
          visualCreatives: true,
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Negocios"
        description="Cada negocio tiene su marca, sus conversaciones y su contenido. No mezclamos datos entre negocios."
      >
        <ShareIntakeButton />
        <ButtonLink href="/dashboard/businesses/new">+ Nuevo negocio</ButtonLink>
      </PageHeader>
      {businesses.length === 0 ? (
        <EmptyState
          title="Todavía no hay negocios"
          description="Tocá “+ Nuevo negocio” para cargar el brief de marca (datos + fotos), o creá uno desde el simulador de WhatsApp."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {businesses.map((b) => (
            <Link key={b.id} href={`/dashboard/businesses/${b.id}`}>
              <Card className="h-full p-5 transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">{b.businessName}</h2>
                    <p className="text-sm text-stone-500">
                      {b.category} · {b.city ?? "—"}, {b.country ?? ""}
                    </p>
                  </div>
                  <Badge tone="emerald">{b.category}</Badge>
                </div>
                {b.mainOffer ? (
                  <p className="mt-3 line-clamp-2 text-sm text-stone-600">🎯 {b.mainOffer}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-500">
                  <span>{b._count.contentOrders} pedidos</span>
                  <span>{b._count.conversationThreads} charlas</span>
                  <span>{b._count.conversationInsights} aprendizajes</span>
                  <span>{b._count.visualCreatives} imágenes</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
