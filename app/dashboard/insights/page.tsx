import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { insightTypeLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const insights = await prisma.conversationInsight.findMany({
    orderBy: [{ frequency: "desc" }, { createdAt: "desc" }],
    include: { businessProfile: { select: { businessName: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Aprendizajes de tus clientes"
        description="Lo que detectamos en las charlas: dudas, objeciones, intereses y oportunidades para vender mejor."
      />
      {insights.length === 0 ? (
        <EmptyState
          title="Sin aprendizajes todavía"
          description="Aparecen solos a medida que hay charlas con clientes."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((i) => (
            <Link key={i.id} href={`/dashboard/insights/${i.id}`}>
              <Card className="h-full p-4 transition hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="purple">{insightTypeLabel(i.type)}</Badge>
                  <span className="text-xs text-stone-400">{i.frequency}× · {Math.round(i.confidence * 100)}%</span>
                </div>
                <h3 className="mt-2 font-medium text-stone-800">{i.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-stone-500">{i.description}</p>
                <p className="mt-2 text-xs text-stone-400">{i.businessProfile.businessName}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
