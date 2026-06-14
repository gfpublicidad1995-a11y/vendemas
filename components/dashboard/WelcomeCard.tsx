"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const KEY = "vm-welcome-dismissed";

/** Tarjeta de bienvenida/orientación en el panel. Se puede cerrar (recordado en el navegador). */
export function WelcomeCard() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) === "1") setDismissed(true);
  }, []);

  if (dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignorar
    }
    setDismissed(true);
  }

  return (
    <div className="vm-fade-up relative mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute right-3 top-3 rounded-lg p-1 text-stone-400 transition hover:bg-white/70 hover:text-stone-600"
      >
        <X className="h-4 w-4" />
      </button>
      <h2 className="text-lg font-semibold text-stone-900">👋 Bienvenido a VendeMás</h2>
      <p className="mt-1 max-w-2xl text-sm text-stone-600">
        Estás viendo el panel con un negocio de ejemplo (Agro y Mascotas Centro). Probá las
        funciones clave:
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/simulator"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          📲 Probar el simulador
        </Link>
        <Link
          href="/dashboard/strategy"
          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          🧠 Ver la estrategia
        </Link>
        <Link
          href="/dashboard/deliveries"
          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          📦 Ver entregas
        </Link>
      </div>
    </div>
  );
}
