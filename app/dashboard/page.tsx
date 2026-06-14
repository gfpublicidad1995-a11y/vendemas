import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  Card,
  PageHeader,
  SectionTitle,
  StatCard,
} from "@/components/ui";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import {
  orderTypeLabel,
  orderStatusLabel,
  insightTypeLabel,
  toneForStatus,
} from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const [
    businesses,
    pendingOrders,
    contentPieces,
    draftCampaigns,
    conversations,
    insights,
    digests,
    opportunities,
    quickCampaigns,
    visuals,
    validCreatives,
    warningCreatives,
    recentOrders,
    recentInsights,
    recentDigests,
    recentAlerts,
  ] = await Promise.all([
    prisma.businessProfile.count(),
    prisma.contentOrder.count({
      where: { status: { in: ["draft", "collecting_info", "ready_to_generate", "generating"] } },
    }),
    prisma.contentPiece.count(),
    prisma.campaignDraft.count({ where: { status: "draft" } }),
    prisma.conversationThread.count(),
    prisma.conversationInsight.count(),
    prisma.dailyDigest.count(),
    prisma.opportunityAlert.count(),
    prisma.contentOrder.count({ where: { type: "quick_campaign" } }),
    prisma.visualCreative.count(),
    prisma.creativeVariant.count({ where: { validationStatus: "valid" } }),
    prisma.creativeVariant.count({ where: { validationStatus: "warning" } }),
    prisma.contentOrder.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { businessProfile: { select: { businessName: true } } },
    }),
    prisma.conversationInsight.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.dailyDigest.findMany({
      take: 4,
      orderBy: { date: "desc" },
      include: { businessProfile: { select: { businessName: true } } },
    }),
    prisma.opportunityAlert.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <WelcomeCard />
      <PageHeader
        title="Panel de VendeMás"
        description="Vos atendé tu negocio. Acá vemos el contenido, los anuncios y las ideas para vender más."
      />

      <div className="vm-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Negocios" value={businesses} href="/dashboard/businesses" tone="emerald" />
        <StatCard label="Pedidos pendientes" value={pendingOrders} href="/dashboard/orders" tone="amber" />
        <StatCard label="Piezas generadas" value={contentPieces} href="/dashboard/content" tone="green" />
        <StatCard label="Campañas en borrador" value={draftCampaigns} href="/dashboard/campaigns" tone="amber" />
        <StatCard label="Conversaciones" value={conversations} href="/dashboard/conversations" tone="blue" />
        <StatCard label="Insights detectados" value={insights} href="/dashboard/insights" tone="purple" />
        <StatCard label="Reportes diarios" value={digests} href="/dashboard/digests" tone="green" />
        <StatCard label="Oportunidades" value={opportunities} href="/dashboard/opportunities" tone="amber" />
        <StatCard label="Campañas rápidas" value={quickCampaigns} href="/dashboard/orders" tone="emerald" />
        <StatCard label="Visuales generados" value={visuals} href="/dashboard/visuals" tone="green" />
        <StatCard label="Creativos validados" value={validCreatives} href="/dashboard/visuals" tone="green" />
        <StatCard label="Creativos con avisos" value={warningCreatives} href="/dashboard/visuals" tone="amber" />
      </div>

      <div className="vm-stagger mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle
            action={
              <Link href="/dashboard/orders" className="text-xs font-medium text-emerald-700 hover:underline">
                Ver todos
              </Link>
            }
          >
            Últimos pedidos
          </SectionTitle>
          <Card className="divide-y divide-stone-100">
            {recentOrders.length === 0 ? (
              <p className="p-4 text-sm text-stone-400">Todavía no hay pedidos.</p>
            ) : (
              recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/dashboard/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-stone-800">
                      {orderTypeLabel(o.type)}
                    </div>
                    <div className="truncate text-xs text-stone-400">
                      {o.businessProfile.businessName} · {formatDate(o.createdAt)}
                    </div>
                  </div>
                  <Badge tone={toneForStatus(o.status)}>{orderStatusLabel(o.status)}</Badge>
                </Link>
              ))
            )}
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              <Link href="/dashboard/insights" className="text-xs font-medium text-emerald-700 hover:underline">
                Ver todos
              </Link>
            }
          >
            Últimos insights
          </SectionTitle>
          <Card className="divide-y divide-stone-100">
            {recentInsights.length === 0 ? (
              <p className="p-4 text-sm text-stone-400">Sin insights todavía.</p>
            ) : (
              recentInsights.map((i) => (
                <Link
                  key={i.id}
                  href={`/dashboard/insights/${i.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-stone-800">{i.title}</div>
                    <div className="text-xs text-stone-400">{insightTypeLabel(i.type)} · {i.frequency}×</div>
                  </div>
                  <Badge tone="purple">{insightTypeLabel(i.type)}</Badge>
                </Link>
              ))
            )}
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              <Link href="/dashboard/digests" className="text-xs font-medium text-emerald-700 hover:underline">
                Ver todos
              </Link>
            }
          >
            Últimos reportes diarios
          </SectionTitle>
          <Card className="divide-y divide-stone-100">
            {recentDigests.length === 0 ? (
              <p className="p-4 text-sm text-stone-400">Sin reportes todavía.</p>
            ) : (
              recentDigests.map((d) => (
                <Link
                  key={d.id}
                  href={`/dashboard/digests/${d.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-stone-800">
                      Ideas para mañana · {formatDate(d.date)}
                    </div>
                    <div className="text-xs text-stone-400">
                      {d.businessProfile.businessName} · {d.totalConversations} charlas
                    </div>
                  </div>
                  <Badge tone={toneForStatus(d.status)}>{d.status}</Badge>
                </Link>
              ))
            )}
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              <Link href="/dashboard/opportunities" className="text-xs font-medium text-emerald-700 hover:underline">
                Ver todas
              </Link>
            }
          >
            Últimas oportunidades
          </SectionTitle>
          <Card className="divide-y divide-stone-100">
            {recentAlerts.length === 0 ? (
              <p className="p-4 text-sm text-stone-400">Sin oportunidades todavía.</p>
            ) : (
              recentAlerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-stone-800">{a.title}</div>
                    <div className="truncate text-xs text-stone-400">{a.description}</div>
                  </div>
                  <Badge tone={a.priority === "critical" ? "red" : "amber"}>{a.priority}</Badge>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
