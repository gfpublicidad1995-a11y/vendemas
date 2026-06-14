"use client";

import { useState } from "react";

/** Input de imagen con vista previa (miniatura) al elegir el archivo. */
export function PhotoInput({
  name,
  label,
  hint,
}: {
  name: string;
  label: string;
  hint?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs text-stone-400">{hint}</span> : null}
      <div className="mt-1.5 flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="vista previa"
            className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-stone-200"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xl text-stone-300 ring-1 ring-stone-200">
            📷
          </div>
        )}
        <input
          type="file"
          name={name}
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
          className="block w-full cursor-pointer text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emerald-700"
        />
      </div>
    </div>
  );
}
