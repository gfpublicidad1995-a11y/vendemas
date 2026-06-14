import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { toneForStatus } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DigestsPage() {
  const digests = await prisma.dailyDigest.findMany({
    orderBy: { date: "desc" },
    include: { businessProfile: { select: { businessName: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Ideas para mañana"
        description="Cada día analizamos las consultas y te preparamos ideas de contenido y anuncios para el día siguiente."
      />
      {digests.length === 0 ? (
        <EmptyState title="Sin reportes todavía" />
      ) : (
        <Card className="divide-y divide-stone-100">
          {digests.map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/digests/${d.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-stone-50"
            >
              <div>
                <div className="font-medium text-stone-800">Ideas para mañana · {formatDate(d.date)}</div>
                <div className="text-xs text-stone-400">
                  {d.businessProfile.businessName} · {d.totalConversations} charlas · {d.totalMessages} mensajes
                </div>
              </div>
              <Badge tone={toneForStatus(d.status)}>{d.status}</Badge>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
