import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { humanPlacement, ASPECT_RATIO_LABEL } from "@/services/meta-creative-specs/metaCreativeSpecs";
import { asStringArray } from "@/lib/json";
import type { MetaPlacement, MetaAspectRatio } from "@/lib/validators/enums";

export const dynamic = "force-dynamic";

export default async function CreativeSpecsPage() {
  const specs = await prisma.metaCreativeSpec.findMany({
    where: { isActive: true },
    orderBy: { placement: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Especificaciones de Meta Ads"
        description="Medidas, ratios y zonas seguras por ubicación. Se guardan en la base para actualizarlas fácil cuando Meta cambie sus recomendaciones."
      />
      {specs.length === 0 ? (
        <EmptyState title="Sin especificaciones cargadas" description="Corré el seed para cargarlas." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {specs.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-stone-800">{humanPlacement(s.placement as MetaPlacement)}</h3>
                <Badge tone="emerald">{ASPECT_RATIO_LABEL[s.recommendedAspectRatio as MetaAspectRatio] ?? s.recommendedAspectRatio}</Badge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-stone-400">Recomendado</dt>
                <dd className="text-right text-stone-700">{s.recommendedWidth}×{s.recommendedHeight}</dd>
                {s.premiumWidth ? (
                  <>
                    <dt className="text-stone-400">Premium</dt>
                    <dd className="text-right text-stone-700">{s.premiumWidth}×{s.premiumHeight}</dd>
                  </>
                ) : null}
                <dt className="text-stone-400">Peso máx.</dt>
                <dd className="text-right text-stone-700">{s.maxFileSizeMb ?? "—"} MB</dd>
                <dt className="text-stone-400">Archivos</dt>
                <dd className="text-right text-stone-700">{asStringArray(s.supportedFileTypes).join(", ")}</dd>
              </dl>
              {s.safeZoneTopPercent != null ? (
                <p className="mt-3 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                  Zona segura: {s.safeZoneTopPercent}% arriba · {s.safeZoneBottomPercent}% abajo · {s.safeZoneSidePercent}% lados
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
