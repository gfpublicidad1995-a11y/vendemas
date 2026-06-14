import { BriefForm } from "@/components/intake/BriefForm";

export const dynamic = "force-dynamic";

export default function AltaPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Encabezado de marca */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
            V
          </div>
          <span className="text-lg font-semibold text-stone-900">VendeMás</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
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
