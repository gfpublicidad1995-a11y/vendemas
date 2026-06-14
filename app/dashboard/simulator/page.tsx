import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { Simulator } from "@/components/simulator/Simulator";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  // Teléfono del dueño de ejemplo (Agro y Mascotas Centro) para demo rápida.
  const owner = await prisma.user.findFirst({ where: { role: "owner" }, select: { phone: true } });

  return (
    <div>
      <PageHeader
        title="Simulador de WhatsApp"
        description="Probá la experiencia completa: alta de negocio, Campaña Rápida, entrega y aprobación — todo por chat."
      />
      <Simulator defaultPhone={owner?.phone ?? "+59899123456"} />
    </div>
  );
}
