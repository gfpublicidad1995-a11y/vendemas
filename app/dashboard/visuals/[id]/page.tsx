import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { validationStatusLabel, toneForStatus } from "@/lib/labels";
import { creativeValidationService } from "@/services/meta-creative-specs/creativeValidationService";
import { asStringArray, asRecord } from "@/lib/json";
import { CreativeImageUploader } from "@/components/visuals/CreativeImageUploader";
import { importCreativeImageFromUrl } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function VisualDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const visual = await prisma.visualCreative.findUnique({
    where: { id },
    include: {
      businessProfile: { select: { businessName: true } },
      contentOrder: { select: { id: true } },
    },
  });
  if (!visual) notFound();

  const report = await creativeValidationService.generateValidationReport(id);
  const meta = asRecord(visual.metadata);
  const isFinal = !!meta.finalImage;

  const fact = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between border-b border-stone-100 py-2 text-sm">
      <dt className="text-stone-400">{label}</dt>
      <dd className="text-stone-700">{value}</dd>
    </div>
  );

  return (
    <div>
      <PageHeader title="Pieza visual" description={visual.businessProfile.businessName} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Card className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={visual.fileUrl ?? ""} alt={visual.aspectRatio} className="w-full" />
          </Card>
          <p className="mt-2 text-center text-xs text-stone-400">
            {isFinal
              ? `Imagen final cargada ✅ · ${visual.provider}`
              : `Vista previa (placeholder mock). Proveedor: ${visual.provider}.`}
          </p>

          <Card className="mt-3 p-4">
            <SectionTitle>Imagen final del anuncio</SectionTitle>
            <p className="mb-3 mt-1 text-xs text-stone-500">
              Subí el anuncio profesional (o importá el render). Reemplaza la vista previa y es lo que ve el cliente en
              la entrega. Se guarda de forma permanente (no caduca).
            </p>
            <CreativeImageUploader visualCreativeId={visual.id} />

            <div className="mt-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                o importar desde una URL
              </p>
              <form action={importCreativeImageFromUrl} className="flex gap-2">
                <input type="hidden" name="visualCreativeId" value={visual.id} />
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="https://… (render de la imagen)"
                  className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                />
                <SubmitButton
                  className="shrink-0 rounded-xl bg-stone-800 px-3 py-2 text-sm font-medium text-white hover:bg-stone-900"
                  pendingText="Importando…"
                >
                  Importar
                </SubmitButton>
              </form>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Badge tone={toneForStatus(visual.validationStatus)}>
                {validationStatusLabel(visual.validationStatus)}
              </Badge>
              <Badge>{visual.type}</Badge>
              {visual.contentOrder ? (
                <Link
                  href={`/dashboard/orders/${visual.contentOrder.id}`}
                  className="ml-auto text-xs font-medium text-emerald-700 hover:underline"
                >
                  Ver pedido
                </Link>
              ) : null}
            </div>
            <dl>
              {fact("Ubicación", visual.placement ?? "—")}
              {fact("Ratio", visual.aspectRatio)}
              {fact("Medidas", `${visual.width ?? "?"} × ${visual.height ?? "?"} px`)}
              {fact("Formato", visual.format)}
              {visual.safeZoneTopPercent != null
                ? fact(
                    "Zona segura",
                    `${visual.safeZoneTopPercent}% / ${visual.safeZoneBottomPercent}% / ${visual.safeZoneSidePercent}%`
                  )
                : null}
            </dl>
          </Card>

          {report ? (
            <Card className="p-5">
              <SectionTitle>Validación para {report.placement}</SectionTitle>
              <Badge tone={toneForStatus(report.status)}>{validationStatusLabel(report.status)}</Badge>
              {report.problems.length > 0 ? (
                <ul className="mt-3 space-y-1">
                  {report.problems.map((p, i) => (
                    <li key={i} className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-700">
                      {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-emerald-700">Sin observaciones. Listo para usar ✅</p>
              )}
              {report.recommendations.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-stone-500">
                  {report.recommendations.map((r, i) => (
                    <li key={i}>→ {r}</li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ) : null}

          <Card className="p-5">
            <SectionTitle>Prompt</SectionTitle>
            <p className="whitespace-pre-wrap text-sm text-stone-600">{visual.prompt}</p>
            {asStringArray(visual.validationNotes).length > 0 ? (
              <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
                {asStringArray(visual.validationNotes).join(" · ")}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
