"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignorar
        }
      }}
      className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
    >
      {copied ? "¡Copiado!" : label}
    </button>
  );
}

/** Copia varios textos juntos de una. Útil para llevarse todo el contenido de un toque. */
export function CopyAllButton({ texts, label = "Copiar todo" }: { texts: string[]; label?: string }) {
  const [copied, setCopied] = useState(false);
  const joined = texts.filter((t) => t && t.trim()).join("\n\n");
  if (!joined) return null;
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(joined);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignorar
        }
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
    >
      {copied ? "¡Copiado!" : `📋 ${label}`}
    </button>
  );
}
