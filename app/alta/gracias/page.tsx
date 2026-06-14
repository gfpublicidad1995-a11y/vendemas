import Link from "next/link";

export default function GraciasPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✅
        </div>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">¡Gracias! Recibimos tu brief 🙌</h1>
        <p className="mt-3 text-sm text-stone-600">
          Ya tenemos lo necesario para empezar a armar tu marca y tu contenido. Te vamos a escribir
          por WhatsApp con las primeras piezas para que las apruebes.
        </p>
        <p className="mt-6 text-xs text-stone-400">VendeMás · Tu agencia dentro de WhatsApp</p>
        <Link
          href="/alta"
          className="mt-6 inline-block rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
        >
          Cargar otro negocio
        </Link>
      </div>
    </div>
  );
}
