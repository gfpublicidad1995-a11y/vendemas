import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, SectionTitle, StatCard, ActionCard } from "@/components/ui";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { orderTypeLabel, orderStatusLabel, toneForStatus } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTIONS = [
  { href: "/dashboard/simulator", icon: "📲", title: "Atender por WhatsApp", desc: "Charlá como un cliente y mirá cómo arma el contenido." },
  { href: "/dashboard/businesses", icon: "🏪", title: "Mis negocios", desc: "Los datos y la marca de cada cliente." },
  { href: "/dashboard/strategy", icon: "🧠", title: "Estrategia", desc: "El plan para vender de cada negocio." },
  { href: "/dashboard/deliveries", icon: "📦", title: "Entregas", desc: "Lo que le mandás al cliente para aprobar." },
  { href: "/dashboard/forecast", icon: "🔮", title: "Simular resultados", desc: "Qué esperar antes de gastar en anuncios." },
  { href: "/dashboard/optimization", icon: "🩺", title: "Revisar resultados", desc: "Qué está fallando y cómo mejorarlo." },
];

export default async function DashboardHome() {
  const [businesses, contentPieces, conversations, deliveries, recentOrders, recentDigests] =
    await Promise.all([
      prisma.businessProfile.count(),
      prisma.contentPiece.count(),
      prisma.conversationThread.count(),
      prisma.deliveryLink.count(),
      prisma.contentOrder.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { businessProfile: { select: { businessName: true } } },
      }),
      prisma.dailyDigest.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { businessProfile: { select: { businessName: true } } },
      }),
    ]);

  return (
    <div>
      <WelcomeCard />
      <PageHeader
        title="Inicio"
        description="Vos atendé tu negocio; nosotros armamos el contenido, los anuncios y las ideas para vender más. Elegí qué hacer 👇"
      />

      {/* Acciones principales — qué se puede hacer, en lenguaje simple */}
      <div className="vm-stagger grid grid-cols-2 gap-3 lg:grid-cols-3">
        {ACTIONS.map((a) => (
          <ActionCard key={a.href} {...a} />
        ))}
      </div>

      {/* Un vistazo — pocos números, claros */}
      <SectionTitle>Un vistazo</SectionTitle>
      <div className="vm-stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Negocios" value={businesses} href="/dashboard/businesses" tone="emerald" />
        <StatCard label="Contenido creado" value={contentPieces} href="/dashboard/content" tone="green" />
        <StatCard label="Charlas con clientes" value={conversations} href="/dashboard/conversations" tone="blue" />
        <StatCard label="Entregas" value={deliveries} href="/dashboard/deliveries" tone="green" />
      </div>

      {/* Actividad reciente */}
      <div className="vm-stagger mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle
            action={
              <Link href="/dashboard/orders" className="text-xs font-medium text-emerald-700 hover:underline">
                Ver todo
              </Link>
            }
          >
            Últimos pedidos
          </SectionTitle>
          <Card className="divide-y divide-stone-100">
            {recentOrders.length === 0 ? (
              <p className="p-4 text-sm text-stone-400">Todavía no hay pedidos. Probá el simulador para crear el primero.</p>
            ) : (
              recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/dashboard/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-stone-800">{orderTypeLabel(o.type)}</div>
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
              <Link href="/dashboard/digests" className="text-xs font-medium text-emerald-700 hover:underline">
                Ver todo
              </Link>
            }
          >
            Ideas para mañana
          </SectionTitle>
          <Card className="divide-y divide-stone-100">
            {recentDigests.length === 0 ? (
              <p className="p-4 text-sm text-stone-400">Sin ideas todavía. Aparecen cuando hay charlas con clientes.</p>
            ) : (
              recentDigests.map((d) => (
                <Link
                  key={d.id}
                  href={`/dashboard/digests/${d.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-stone-800">
                      Ideas del {formatDate(d.date)}
                    </div>
                    <div className="truncate text-xs text-stone-400">
                      {d.businessProfile.businessName} · {d.totalConversations} charlas
                    </div>
                  </div>
                  <span className="shrink-0 text-stone-300">→</span>
                </Link>
              ))
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
