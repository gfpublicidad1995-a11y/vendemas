"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f5] px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-xl">
        ⚠️
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-stone-900">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-sm text-stone-500">
        Tuvimos un problema procesando esto. Probá de nuevo; si sigue, contanos.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
        >
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
