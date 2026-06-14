import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import {
  orderTypeLabel,
  orderStatusLabel,
  insightTypeLabel,
  toneForStatus,
} from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import { asStringArray } from "@/lib/json";
import { BusinessActions } from "@/components/dashboard/BusinessActions";
import { createCampaignFromOffer } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await prisma.businessProfile.findUnique({
    where: { id },
    include: {
      brandKit: true,
      assets: true,
      contentOrders: { orderBy: { createdAt: "desc" }, take: 6 },
      conversationInsights: { orderBy: { frequency: "desc" }, take: 6 },
      dailyDigests: { orderBy: { date: "desc" }, take: 3 },
      visualCreatives: { orderBy: { createdAt: "desc" }, take: 6 },
      offerSuggestions: { where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!business) notFound();

  const fact = (label: string, value: React.ReactNode) => (
    <div>
      <dt className="text-xs font-medium text-stone-400">{label}</dt>
      <dd className="text-sm text-stone-800">{value ?? "—"}</dd>
    </div>
  );

  return (
    <div>
      <PageHeader title={business.businessName} description={business.description ?? undefined} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <SectionTitle>Datos del negocio</SectionTitle>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {fact("Rubro", business.category)}
              {fact("Ciudad", `${business.city ?? "—"}, ${business.country ?? ""}`)}
              {fact("Tono de voz", business.toneOfVoice)}
              {fact("Público", business.targetAudience)}
              {fact("Oferta principal", business.mainOffer)}
              {fact("WhatsApp", business.whatsappNumber)}
              {fact("Instagram", business.instagramHandle)}
              {fact("Presupuesto mensual", formatCurrency(business.monthlyAdBudget, "USD"))}
              {fact("Zona horaria", business.timezone)}
            </dl>
          </Card>

          <Card className="p-5">
            <SectionTitle
              action={
                <Link href="/dashboard/orders" className="text-xs font-medium text-emerald-700 hover:underline">
                  Ver pedidos
                </Link>
              }
            >
              Pedidos recientes
            </SectionTitle>
            <div className="divide-y divide-stone-100">
              {business.contentOrders.length === 0 ? (
                <p className="py-3 text-sm text-stone-400">Sin pedidos.</p>
              ) : (
                business.contentOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/dashboard/orders/${o.id}`}
                    className="flex items-center justify-between py-3 hover:opacity-80"
                  >
                    <span className="text-sm text-stone-700">{orderTypeLabel(o.type)}</span>
                    <Badge tone={toneForStatus(o.status)}>{orderStatusLabel(o.status)}</Badge>
                  </Link>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Insights detectados</SectionTitle>
            <div className="divide-y divide-stone-100">
              {business.conversationInsights.length === 0 ? (
                <p className="py-3 text-sm text-stone-400">Sin insights.</p>
              ) : (
                business.conversationInsights.map((i) => (
                  <Link
                    key={i.id}
                    href={`/dashboard/insights/${i.id}`}
                    className="flex items-center justify-between py-3 hover:opacity-80"
                  >
                    <span className="text-sm text-stone-700">{i.title}</span>
                    <Badge tone="purple">{insightTypeLabel(i.type)} · {i.frequency}×</Badge>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <BusinessActions businessProfileId={business.id} />

          {business.offerSuggestions.length > 0 ? (
            <Card className="p-5">
              <SectionTitle>Ofertas sugeridas</SectionTitle>
              <div className="space-y-2">
                {business.offerSuggestions.map((o) => (
                  <div key={o.id} className="rounded-xl border border-stone-100 p-3">
                    <div className="text-sm font-medium text-stone-800">{o.title}</div>
                    <p className="mt-1 text-xs text-stone-500">{o.suggestedCopy}</p>
                    <form action={createCampaignFromOffer} className="mt-2">
                      <input type="hidden" name="offerId" value={o.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Crear campaña con esta oferta
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {business.brandKit ? (
            <Card className="p-5">
              <SectionTitle>Brand Kit</SectionTitle>
              <div className="flex items-center gap-3">
                <span
                  className="h-8 w-8 rounded-lg ring-1 ring-stone-200"
                  style={{ background: business.brandKit.primaryColor ?? "#ccc" }}
                />
                <span
                  className="h-8 w-8 rounded-lg ring-1 ring-stone-200"
                  style={{ background: business.brandKit.secondaryColor ?? "#ccc" }}
                />
                <span className="text-xs text-stone-500">{business.brandKit.visualStyle}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {asStringArray(business.brandKit.preferredWords).map((w) => (
                  <Badge key={w} tone="green">{w}</Badge>
                ))}
                {asStringArray(business.brandKit.forbiddenWords).map((w) => (
                  <Badge key={w} tone="red">⛔ {w}</Badge>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="p-5">
            <SectionTitle>Assets ({business.assets.length})</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {business.assets.map((a) => (
                <div key={a.id} className="overflow-hidden rounded-lg ring-1 ring-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.type} className="aspect-square w-full object-cover" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Consentimientos</SectionTitle>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-stone-600">Analizar conversaciones</span>
                <Badge tone={business.consentToAnalyzeConversations ? "green" : "red"}>
                  {business.consentToAnalyzeConversations ? "Sí" : "No"}
                </Badge>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-stone-600">Reporte diario por WhatsApp</span>
                <Badge tone={business.digestWhatsappOptIn ? "green" : "red"}>
                  {business.digestWhatsappOptIn ? "Sí" : "No"}
                </Badge>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-stone-600">Ideas para mañana</span>
                <Badge tone={business.dailyDigestEnabled ? "green" : "red"}>
                  {business.dailyDigestEnabled ? `${business.dailyDigestTime}` : "Off"}
                </Badge>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <SectionTitle>Reportes diarios</SectionTitle>
            <div className="divide-y divide-stone-100">
              {business.dailyDigests.length === 0 ? (
                <p className="py-2 text-sm text-stone-400">Sin reportes.</p>
              ) : (
                business.dailyDigests.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dashboard/digests/${d.id}`}
                    className="flex items-center justify-between py-2 text-sm hover:opacity-80"
                  >
                    <span className="text-stone-700">{formatDate(d.date)}</span>
                    <span className="text-stone-400">{d.totalConversations} charlas</span>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
