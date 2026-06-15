"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { attachCreativeImage } from "@/app/actions";

// Baja la resolución a un JPEG liviano (para que entre como data URL persistente).
function downscale(file: File, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no ctx"));
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function CreativeImageUploader({ visualCreativeId }: { visualCreativeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File) {
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await downscale(file);
      const fd = new FormData();
      fd.set("visualCreativeId", visualCreativeId);
      fd.set("dataUrl", dataUrl);
      await attachCreativeImage(fd);
      router.refresh();
    } catch (e) {
      console.error(e);
      setError("No se pudo subir la imagen. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
        {busy ? "Subiendo…" : "📤 Subir imagen final del anuncio"}
      </label>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
