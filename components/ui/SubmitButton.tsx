"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

/**
 * Botón de submit con estado de carga automático (useFormStatus).
 * Se usa dentro de cualquier <form action={serverAction}> para dar feedback
 * mientras el server action corre (la generación tarda ~1-2s).
 */
export function SubmitButton({
  children,
  className,
  pendingText = "…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(className, pending && "cursor-wait opacity-70")}
    >
      {pending ? pendingText : children}
    </button>
  );
}
