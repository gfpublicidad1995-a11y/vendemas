import { PageHeader } from "@/components/ui";
import { BriefForm } from "@/components/intake/BriefForm";

export const dynamic = "force-dynamic";

export default function NewBusinessPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Nuevo negocio — Brief de marca"
        description="Con estos datos armamos el ADN de marca, la estrategia y todo el contenido. Cuanto más completo, mejores los resultados."
      />
      <BriefForm source="dashboard" />
    </div>
  );
}
