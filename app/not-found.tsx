import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f5] px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-bold text-white">
        V
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-stone-900">No encontramos esta página</h1>
      <p className="mt-2 max-w-md text-sm text-stone-500">
        El link puede haber cambiado o la entrega ya no está disponible.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        Ir al panel
      </Link>
    </div>
  );
}
