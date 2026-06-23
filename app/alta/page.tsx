import { BriefForm } from "@/components/intake/BriefForm";
import { BrandMark } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AltaPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Encabezado de marca */}
        <div className="mb-6 flex items-center gap-2.5">
          <BrandMark />
          <span className="font-brand text-lg font-bold text-stone-900">VendeMás</span>
        </div>

        <h1 className="font-brand text-3xl font-bold leading-tight text-stone-900">
          Contanos de tu negocio 👋
        </h1>
        <p className="mt-2 max-w-xl text-sm text-stone-600">
          Completá este formulario para que armemos tu marca, tu estrategia y todo el contenido.
          Te toma 5 minutos. Mientras más completo, mejores los resultados.
        </p>

        <div className="mt-8">
          <BriefForm source="public" submitLabel="Enviar mi brief" />
        </div>

        <p className="mt-8 text-center text-xs text-stone-400">
          Tus datos quedan privados y se usan solo para crear tu contenido · VendeMás
        </p>
      </div>
    </div>
  );
}
