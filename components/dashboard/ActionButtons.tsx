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

export function RequestChangesForm({ orderId }: { orderId: string }) {
  return (
    <form action={requestChanges} className="flex gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <input
        name="instruction"
        placeholder="Ej: hacelo más corto / más vendedor…"
        className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
      />
      <SubmitButton className={secondaryBtn} pendingText="Aplicando…">
        Pedir cambios
      </SubmitButton>
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
