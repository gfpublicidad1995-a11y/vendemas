"use client";

import { useRef } from "react";
import {
  approveOrder,
  createContentFromDigestItem,
  createContentFromInsight,
  requestChanges,
  runDailyDigest,
} from "@/app/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50";

export function CreateContentFromInsightButton({ insightId }: { insightId: string }) {
  return (
    <form action={createContentFromInsight}>
      <input type="hidden" name="insightId" value={insightId} />
      <SubmitButton className={primaryBtn} pendingText="Generando…">
        ✨ Crear contenido desde este insight
      </SubmitButton>
    </form>
  );
}

export function CreateContentFromDigestItemButton({ itemId }: { itemId: string }) {
  return (
    <form action={createContentFromDigestItem}>
      <input type="hidden" name="digestItemId" value={itemId} />
      <SubmitButton className={secondaryBtn} pendingText="Generando…">
        Crear esta pieza
      </SubmitButton>
    </form>
  );
}

export function ApproveOrderButton({ orderId }: { orderId: string }) {
  return (
    <form action={approveOrder}>
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton className={primaryBtn} pendingText="Aprobando…">
        ✅ Aprobar
      </SubmitButton>
    </form>
  );
}

const CHANGE_CHIPS = [
  "Hacelo más corto",
  "Más vendedor",
  "Cambiá la imagen",
  "Dame otra opción",
];

export function RequestChangesForm({ orderId }: { orderId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(text: string) {
    if (inputRef.current) inputRef.current.value = text;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={requestChanges} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex flex-wrap gap-1.5">
        {CHANGE_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => pick(c)}
            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          name="instruction"
          placeholder="O escribí con tus palabras qué querés cambiar…"
          className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
        />
        <SubmitButton className={secondaryBtn} pendingText="Aplicando…">
          Pedir cambios
        </SubmitButton>
      </div>
    </form>
  );
}

export function RunDigestButton({ businessProfileId }: { businessProfileId: string }) {
  return (
    <form action={runDailyDigest}>
      <input type="hidden" name="businessProfileId" value={businessProfileId} />
      <SubmitButton className={secondaryBtn} pendingText="Generando…">
        🌅 Generar “Ideas para mañana”
      </SubmitButton>
    </form>
  );
}
