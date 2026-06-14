"use client";

import { useState } from "react";

const WA = "https://wa.me/?text=";

/** Botón chico para reenviar un texto por WhatsApp (abre WhatsApp con el texto listo). */
export function WhatsAppCopyButton({ text }: { text: string }) {
  const href = WA + encodeURIComponent(text);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
    >
      <span aria-hidden>📲</span> WhatsApp
    </a>
  );
}

/** Barra para compartir el link de la entrega. Usa la URL real que está viendo el usuario. */
export function ShareDeliveryBar({ businessName }: { businessName: string }) {
  const [copied, setCopied] = useState(false);

  const currentUrl = () => (typeof window === "undefined" ? "" : window.location.href);

  function shareWhatsApp() {
    const msg = `Mirá el contenido que preparó VendeMás para ${businessName} 👇\n${currentUrl()}`;
    window.open(WA + encodeURIComponent(msg), "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignorar
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        onClick={shareWhatsApp}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <span aria-hidden>📲</span> Compartir por WhatsApp
      </button>
      <button
        onClick={copyLink}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
      >
        {copied ? "¡Link copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
