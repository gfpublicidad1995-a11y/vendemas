import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, PageHeader, SectionTitle } from "@/components/ui";
import {
  orderTypeLabel,
  orderStatusLabel,
  campaignStatusLabel,
  contentPieceTypeLabel,
  validationStatusLabel,
  statusLabel,
  toneForStatus,
} from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import { asStringArray } from "@/lib/json";
import { humanPlacement } from "@/services/meta-creative-specs/metaCreativeSpecs";
import type { MetaPlacement } from "@/lib/validators/enums";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.contentOrder.findUnique({
    where: { id },
    include: {
      businessProfile: { select: { id: true, businessName: true } },
      contentPieces: { orderBy: { createdAt: "asc" } },
      campaignDrafts: true,
      deliveryLinks: { orderBy: { createdAt: "desc" } },
      contentApprovals: { orderBy: { createdAt: "desc" } },
      visualCreatives: true,
      creativeVariants: true,
    },
  });
  if (!order) notFound();

  const campaign = order.campaignDrafts[0];
  const delivery = order.deliveryLinks[0];
  const approval = order.contentApprovals[0];

  return (
    <div>
      <PageHeader
        title={orderTypeLabel(order.type)}
        description={`${order.businessProfile.businessName} · ${order.objective ?? ""}`}
      >
        {delivery ? (
          <ButtonLink href={`/delivery/${delivery.token}`}>Ver entrega</ButtonLink>
        ) : null}
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone={toneForStatus(order.status)}>{orderStatusLabel(order.status)}</Badge>
        {approval ? (
          <Badge tone={toneForStatus(approval.status)}>Aprobación: {statusLabel(approval.status)}</Badge>
        ) : null}
        <span className="text-xs text-stone-400">Creado {formatDate(order.createdAt)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <SectionTitle>Piezas generadas ({order.contentPieces.length})</SectionTitle>
            <div className="space-y-3">
              {order.contentPieces.length === 0 ? (
                <p className="text-sm text-stone-400">Todavía no se generaron piezas.</p>
              ) : (
                order.contentPieces.map((p) => (
                  <div key={p.id} className="rounded-xl border border-stone-100 bg-stone-50/60 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone="blue">{contentPieceTypeLabel(p.type)}</Badge>
                      {p.title ? <span className="text-sm font-medium text-stone-800">{p.title}</span> : null}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-stone-600">{p.body}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {order.visualCreatives.length > 0 ? (
            <Card className="p-5">
              <SectionTitle>
                <Link href="/dashboard/visuals" className="hover:underline">
                  Imágenes
                </Link>
              </SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {order.visualCreatives.map((v) => (
                  <Link key={v.id} href={`/dashboard/visuals/${v.id}`} className="group">
                    <div className="overflow-hidden rounded-lg ring-1 ring-stone-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.fileUrl ?? ""} alt={v.aspectRatio} className="aspect-square w-full object-cover" />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-stone-500">{v.aspectRatio}</span>
                      <Badge tone={toneForStatus(v.validationStatus)}>
                        {validationStatusLabel(v.validationStatus)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {campaign ? (
            <Card className="p-5">
              <SectionTitle>
                <Link href="/dashboard/campaigns" className="hover:underline">
                  Campaña (borrador)
                </Link>
              </SectionTitle>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-stone-400">Objetivo</dt>
                  <dd className="text-stone-800">{campaign.objective}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400">Presupuesto</dt>
                  <dd className="text-stone-800">{formatCurrency(campaign.budget, "USD")}/día</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400">Público</dt>
                  <dd className="text-stone-800">{campaign.audience}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400">Ubicaciones</dt>
                  <dd className="flex flex-wrap gap-1">
                    {asStringArray(campaign.placements).map((p) => (
                      <Badge key={p}>{humanPlacement(p as MetaPlacement)}</Badge>
                    ))}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 ring-1 ring-amber-200">
                ⚠️ Nunca publicamos ni gastamos sin tu aprobación. Estado: {campaignStatusLabel(campaign.status)}.
              </div>
            </Card>
          ) : null}

          {delivery ? (
            <Card className="p-5">
              <SectionTitle>Entrega</SectionTitle>
              <p className="break-all text-xs text-stone-500">{delivery.url}</p>
              <ButtonLink href={`/delivery/${delivery.token}`} variant="secondary" className="mt-3 w-full">
                Abrir página de entrega
              </ButtonLink>
            </Card>
          ) : null}

          <Card className="p-5">
            <SectionTitle>Detalle</SectionTitle>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-stone-400">Oferta</dt>
                <dd className="text-stone-800">{order.offer ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Producto / servicio</dt>
                <dd className="text-stone-800">{order.productOrService ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Notas</dt>
                <dd className="text-stone-800">{order.notes ?? "—"}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
