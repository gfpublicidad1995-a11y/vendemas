"use client";

import { useState } from "react";

/** Copia el link público de alta para enviárselo al cliente (p. ej. por WhatsApp). */
export function ShareIntakeButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/alta`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignorar
    }
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
    >
      {copied ? "¡Link copiado!" : "🔗 Link de alta para clientes"}
    </button>
  );
}
