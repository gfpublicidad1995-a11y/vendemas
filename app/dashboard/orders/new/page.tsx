import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { createOrder } from "@/app/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const dynamic = "force-dynamic";

const TYPES: { value: string; label: string }[] = [
  { value: "quick_campaign", label: "Campaña Rápida (todo el pack)" },
  { value: "ads_pack", label: "Pack de anuncios" },
  { value: "carousel", label: "Carrusel" },
  { value: "video_script", label: "Guion de video" },
  { value: "content_pack", label: "Pack de contenido" },
];

const inputClass =
  "mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400";

export default async function NewOrderPage() {
  const businesses = await prisma.businessProfile.findMany({
    select: { id: true, businessName: true },
    orderBy: { businessName: "asc" },
  });

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Nuevo pedido"
        description="Creá un pedido y generamos el contenido al toque (mockeado). Después lo ves en la entrega."
      />
      <Card className="p-6">
        <form action={createOrder} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Negocio</span>
            <select name="businessProfileId" required className={inputClass} defaultValue={businesses[0]?.id}>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.businessName}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Tipo</span>
            <select name="type" required className={inputClass} defaultValue="quick_campaign">
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Objetivo</span>
            <input name="objective" placeholder="Ej: vender más esta semana" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Producto / servicio</span>
            <input name="productOrService" placeholder="Ej: Sanitaria 25L" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Oferta</span>
            <input name="offer" placeholder="Ej: $890 con envío gratis" className={inputClass} />
          </label>
          <SubmitButton
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            pendingText="Generando contenido…"
          >
            Generar contenido
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
