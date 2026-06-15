import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card, SectionTitle } from "@/components/ui";
import {
  orderTypeLabel,
  contentPieceTypeLabel,
  toneForStatus,
  awarenessLevelLabel,
} from "@/lib/labels";
import { asRecord } from "@/lib/json";

const s = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));
const NIVEL: Record<string, string> = { high: "alto", medium: "medio", low: "bajo" };
import { CopyButton } from "@/components/delivery/CopyButton";
import { ShareDeliveryBar, WhatsAppCopyButton } from "@/components/delivery/ShareButtons";
import { AdCreativePreview } from "@/components/delivery/AdCreativePreview";
import {
  ApproveOrderButton,
  RequestChangesForm,
} from "@/components/dashboard/ActionButtons";

export const dynamic = "force-dynamic";

const BUCKETS: { ratios: string[]; title: string; note?: string }[] = [
  { ratios: ["4:5"], title: "Vertical — para el feed de Facebook e Instagram" },
  { ratios: ["9:16"], title: "Para Historias y Reels" },
  { ratios: ["1:1"], title: "Cuadrado — para publicaciones y carrusel" },
  { ratios: ["1.91:1"], title: "Ancho — para algunos anuncios" },
];

const VIDEO_TYPES = ["video", "ugc_video", "avatar_video"];

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await prisma.deliveryLink.findUnique({
    where: { token },
    include: {
      contentOrder: {
        include: {
          businessProfile: { include: { brandKit: true, assets: true, marketStrategy: true } },
          contentPieces: { orderBy: { createdAt: "asc" } },
          campaignDrafts: true,
          visualCreatives: true,
          contentApprovals: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!link) notFound();

  const order = link.contentOrder;
  const business = order.businessProfile;
  const approval = order.contentApprovals[0];
  const assetUrl = (t: string) => business.assets.find((a) => a.type === t)?.url ?? null;
  const productPhotoUrl = assetUrl("product_photo");
  const logoUrl = assetUrl("logo") ?? business.brandKit?.logoUrl ?? null;
  const founderPhotoUrl = assetUrl("founder_photo");
  const strat = business.marketStrategy;
  const stratBrand = asRecord(strat?.brandDna);
  const stratAvatar = asRecord(strat?.avatar);
  const stratMaletas = asRecord(strat?.sevenSuitcases);
  const pieceIds = order.contentPieces.map((p) => p.id);
  const score = pieceIds.length
    ? await prisma.contentScore.findFirst({ where: { contentPieceId: { in: pieceIds } } })
    : null;

  const copies = order.contentPieces.filter((p) =>
    ["ad_copy", "content_idea", "story"].includes(p.type)
  );
  // En la entrega al cliente no mostramos la "estructura de campaña" (es jerga de
  // operador: públicos, presupuesto, ubicaciones de Meta). Queda en el dashboard.
  const others = order.contentPieces.filter(
    (p) => !["ad_copy", "content_idea", "story", "campaign_structure"].includes(p.type)
  );

  // Resumen en lenguaje de persona de lo que incluye la entrega.
  const imgCount = order.visualCreatives.filter((v) => !VIDEO_TYPES.includes(v.type)).length;
  const videoCount = order.visualCreatives.filter((v) => VIDEO_TYPES.includes(v.type)).length;
  const countType = (t: string) => order.contentPieces.filter((p) => p.type === t).length;
  const resumen = [
    countType("story") ? { icon: "📱", label: `${countType("story")} historias para Instagram y Facebook` } : null,
    countType("ad_copy") ? { icon: "🖼️", label: `${countType("ad_copy")} anuncios listos para publicar` } : null,
    countType("carousel_pack") ? { icon: "🎠", label: `Un carrusel para tus redes` } : null,
    countType("content_idea") ? { icon: "✍️", label: `Textos listos para copiar y pegar` } : null,
    countType("video_script") ? { icon: "🎬", label: `Un guion para grabar un video o reel` } : null,
    imgCount ? { icon: "🎨", label: `${imgCount} imágenes en los tamaños que usan las redes` } : null,
    videoCount ? { icon: "🎥", label: `${videoCount} ${videoCount === 1 ? "video" : "videos"}` } : null,
  ].filter((x): x is { icon: string; label: string } => x !== null);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Encabezado */}
        <div className="mb-6 flex items-center gap-3">
          {business.brandKit?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.brandKit.logoUrl} alt={business.businessName} className="h-12 w-12 rounded-xl" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
              {business.businessName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-stone-900">{business.businessName}</h1>
            <p className="text-sm text-stone-500">{orderTypeLabel(order.type)} — preparado por VendeMás</p>
          </div>
          {approval ? (
            <Badge tone={toneForStatus(approval.status)} className="ml-auto">
              {approval.status === "approved" ? "Aprobado ✅" : approval.status === "changes_requested" ? "Cambios pedidos" : "Pendiente de aprobación"}
            </Badge>
          ) : null}
        </div>

        {/* Resumen: qué incluye la entrega (en lenguaje de persona) */}
        {resumen.length ? (
          <Card className="mb-6 p-5">
            <p className="text-sm font-semibold text-stone-800">📦 Esto es lo que te preparamos</p>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {resumen.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-stone-700">
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone-500">
              Mirá todo acá abajo. Si te gusta, tocá <span className="font-medium text-emerald-700">Aprobar</span>; si
              querés cambiar algo, escribinos y lo ajustamos.
            </p>
          </Card>
        ) : null}

        {/* Compartir entrega */}
        <Card className="mb-6 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
            Compartí esta entrega
          </p>
          <ShareDeliveryBar businessName={business.businessName} />
        </Card>

        {score ? (
          <Card className="mb-6 flex items-center gap-4 p-4">
            <div className="text-3xl">🎯</div>
            <div>
              <div className="flex items-center gap-2">
                <Badge tone={score.salesPotential === "high" ? "green" : "amber"}>
                  Potencial de venta: {NIVEL[score.salesPotential] ?? score.salesPotential}
                </Badge>
                <Badge tone={score.urgency === "high" ? "red" : "amber"}>
                  Urgencia: {NIVEL[score.urgency] ?? score.urgency}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-stone-500">{score.reason}</p>
            </div>
          </Card>
        ) : null}

        {/* La estrategia detrás del contenido */}
        {strat ? (
          <Card className="mb-6 p-5">
            <SectionTitle>🧭 La estrategia detrás</SectionTitle>
            <p className="mt-1 text-sm text-stone-700">{s(stratBrand.propuestaValor)}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">A quién le hablamos</p>
                <p className="mt-0.5 text-sm text-stone-700">{s(stratAvatar.publico)}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Qué problema resolvemos</p>
                <p className="mt-0.5 text-sm text-stone-700">{s(stratMaletas.problema)}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Momento del cliente</p>
                <p className="mt-0.5 text-sm text-stone-700">{awarenessLevelLabel(strat.dominantAwarenessLevel)}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-stone-400">Cada pieza de abajo está pensada con esta estrategia.</p>
          </Card>
        ) : null}

        {/* Copies */}
        <SectionTitle>Textos listos para copiar</SectionTitle>
        <div className="mb-6 space-y-2">
          {copies.map((p) => (
            <Card key={p.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <Badge tone="blue">{contentPieceTypeLabel(p.type)}</Badge>
                {p.title ? <span className="ml-2 text-sm font-medium text-stone-700">{p.title}</span> : null}
                <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">{p.body}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <CopyButton text={p.body ?? ""} />
                <WhatsAppCopyButton text={p.body ?? ""} />
              </div>
            </Card>
          ))}
        </div>

        {/* Guiones / estructura */}
        {others.length > 0 ? (
          <>
            <SectionTitle>Guion del reel y carrusel</SectionTitle>
            <div className="mb-6 space-y-2">
              {others.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">{p.title}</span>
                    <Badge tone="purple">{contentPieceTypeLabel(p.type)}</Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">{p.body}</p>
                </Card>
              ))}
            </div>
          </>
        ) : null}

        {/* Videos */}
        {order.visualCreatives.some((v) => VIDEO_TYPES.includes(v.type)) ? (
          <>
            <SectionTitle>Videos</SectionTitle>
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {order.visualCreatives
                .filter((v) => VIDEO_TYPES.includes(v.type))
                .map((v) => (
                  <Card key={v.id} className="overflow-hidden">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video src={v.fileUrl ?? ""} controls playsInline className="w-full bg-black" />
                    <div className="p-2 text-xs text-stone-400">{v.placement ?? v.aspectRatio}</div>
                  </Card>
                ))}
            </div>
          </>
        ) : null}

        {/* Visuales por ubicación */}
        {order.visualCreatives.some((v) => !VIDEO_TYPES.includes(v.type)) ? (
          <>
            <SectionTitle>Tus imágenes para los anuncios</SectionTitle>
            <div className="mb-3 rounded-xl bg-stone-50 p-3 text-sm text-stone-600 ring-1 ring-stone-100">
              Te dejamos cada imagen en los tamaños que usan Facebook e Instagram. Usá la que corresponde según dónde la
              publiques (feed, historias, etc.).
            </div>
            <div className="mb-6 space-y-5">
              {BUCKETS.map((bucket) => {
                const items = order.visualCreatives.filter(
                  (v) => bucket.ratios.includes(v.aspectRatio) && !VIDEO_TYPES.includes(v.type),
                );
                if (items.length === 0) return null;
                return (
                  <div key={bucket.title}>
                    <h3 className="mb-2 text-sm font-medium text-stone-700">{bucket.title}</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {items.map((v) => {
                        const meta = asRecord(v.metadata);
                        return (
                          <Card key={v.id} className="overflow-hidden">
                            {meta.composed ? (
                              <AdCreativePreview
                                aspectRatio={v.aspectRatio}
                                angle={meta.angle ? String(meta.angle) : null}
                                headline={String(meta.headline ?? "")}
                                offer={meta.offer ? String(meta.offer) : null}
                                cta={meta.cta ? String(meta.cta) : null}
                                brandName={String(meta.brandName ?? business.businessName)}
                                primaryColor={
                                  meta.primaryColor
                                    ? String(meta.primaryColor)
                                    : business.brandKit?.primaryColor ?? null
                                }
                                productPhotoUrl={productPhotoUrl}
                                logoUrl={logoUrl}
                                founderPhotoUrl={founderPhotoUrl}
                              />
                            ) : (
                              <div className="aspect-square bg-stone-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={v.fileUrl ?? ""} alt={v.aspectRatio} className="h-full w-full object-cover" />
                              </div>
                            )}
                            <div className="p-2 text-xs">
                              {meta.angleLabel ? (
                                <div className="font-medium text-purple-600">{String(meta.angleLabel)}</div>
                              ) : null}
                              {meta.composed ? null : (
                                <a
                                  href={v.fileUrl ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="mt-1 block rounded-md bg-stone-100 py-1 text-center text-stone-600 hover:bg-stone-200"
                                >
                                  Descargar
                                </a>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}

        {/* Acciones */}
        <Card className="p-5">
          <SectionTitle>¿Qué hacemos con esto?</SectionTitle>
          {approval?.status === "approved" ? (
            <p className="text-sm text-emerald-700">¡Ya lo aprobaste! 🙌 Quedamos a la orden para la próxima.</p>
          ) : (
            <div className="space-y-3">
              <ApproveOrderButton orderId={order.id} />
              <RequestChangesForm orderId={order.id} />
              <p className="text-xs text-stone-400">
                Vos aprobás antes de publicar. No gastamos plata en pauta sin tu permiso.
              </p>
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-stone-400">
          Entrega privada de VendeMás · {business.businessName}
        </p>
      </div>
    </div>
  );
}
