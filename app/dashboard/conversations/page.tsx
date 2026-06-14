import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const threads = await prisma.conversationThread.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: {
      businessProfile: { select: { businessName: true } },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Conversaciones"
        description="Analizamos las charlas comerciales para detectar dudas, objeciones y oportunidades. Los teléfonos de tus clientes quedan protegidos."
      />
      {threads.length === 0 ? (
        <EmptyState title="Sin conversaciones todavía" />
      ) : (
        <Card className="divide-y divide-stone-100">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/conversations/${t.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-stone-50"
            >
              <div className="min-w-0">
                <div className="font-medium text-stone-800">{t.customerName ?? "Cliente"}</div>
                <div className="truncate text-xs text-stone-400">
                  {t.businessProfile.businessName} · {t._count.messages} mensajes · {formatDateTime(t.lastMessageAt)}
                </div>
              </div>
              <Badge tone={t.status === "open" ? "green" : "gray"}>{t.status}</Badge>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
