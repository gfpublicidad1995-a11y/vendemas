"use client";

import { useState, useRef, useEffect } from "react";
import { simulateTurn } from "@/app/actions";
import type { SimSession } from "@/services/whatsapp/conversationFlow";

interface ChatMessage {
  from: "user" | "bot";
  text: string;
  deliveryUrl?: string;
}

function makeSession(phone: string): SimSession {
  return { phone, phase: "chatting", draft: {} };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Baja la resolución de la imagen y la pasa a data URL liviano (para no mandar MB).
function downscale(file: File, maxDim = 1024): Promise<string> {
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

function PhotoRow({
  label,
  value,
  onPick,
}: {
  label: string;
  value?: string;
  onPick: (file: File) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-9 w-9 shrink-0 rounded object-cover ring-1 ring-stone-200" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-stone-100 text-stone-300 ring-1 ring-stone-200">
          📷
        </span>
      )}
      <span className="flex-1 text-xs text-stone-600">{label}</span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <span className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">
        {value ? "Cambiar" : "Subir"}
      </span>
    </label>
  );
}

// Chips rápidos según el momento de la charla, para guiar al usuario.
const CHIPS_BY_PHASE: Record<string, { label: string; value: string }[]> = {
  chatting: [
    { label: "Hola 👋", value: "Hola" },
    { label: "Quiero vender más esta semana", value: "Quiero vender más esta semana" },
    { label: "¿Qué podés hacer?", value: "¿Qué podés hacer por mi negocio?" },
  ],
  waiting_approval: [
    { label: "✅ Aprobar", value: "1" },
    { label: "✏️ Pedir cambios", value: "2" },
    { label: "🔥 Más vendedor", value: "3" },
    { label: "🔁 Más versiones", value: "4" },
  ],
  collecting_changes: [
    { label: "Hacelo más corto", value: "Hacelo más corto" },
    { label: "Más vendedor", value: "Hacelo más vendedor" },
  ],
};

export function Simulator({ defaultPhone }: { defaultPhone: string }) {
  const [phone, setPhone] = useState(defaultPhone);
  const [session, setSession] = useState<SimSession>(() => makeSession(defaultPhone));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<{ product?: string; logo?: string; founder?: string }>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  async function onPick(type: "product" | "logo" | "founder", file: File) {
    try {
      const url = await downscale(file);
      setPhotos((p) => ({ ...p, [type]: url }));
    } catch {
      // ignorar
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text: trimmed }]);
    setLoading(true);
    try {
      const res = await simulateTurn(
        session,
        trimmed,
        Object.keys(photos).length ? photos : undefined,
      );
      setSession(res.session);
      // Revelamos las respuestas de a una, con una pausa de "escribiendo…" entre
      // cada una, para que se sienta como una charla real de WhatsApp.
      for (let i = 0; i < res.replies.length; i++) {
        const r = res.replies[i];
        await sleep(i === 0 ? 650 : 550 + Math.min(r.text.length * 6, 900));
        setMessages((m) => [
          ...m,
          { from: "bot" as const, text: r.text, deliveryUrl: r.deliveryUrl },
        ]);
      }
    } catch (e) {
      await sleep(500);
      setMessages((m) => [
        ...m,
        { from: "bot", text: "⚠️ Ups, algo falló generando el contenido. Probá de nuevo." },
      ]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function resetWith(newPhone: string) {
    setPhone(newPhone);
    setSession(makeSession(newPhone));
    setMessages([]);
    setPhotos({});
  }

  function newNumber() {
    const rnd = String(Math.floor(Math.random() * 9000000) + 1000000);
    resetWith(`+59899${rnd.slice(0, 6)}`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 bg-emerald-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-bold">V</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">VendeMás</div>
              <div className="text-[11px] text-emerald-100">simulando · {phone}</div>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-[#efeae2] px-4 py-4">
          {messages.length === 0 ? (
            <p className="mt-10 text-center text-sm text-stone-500">
              Escribí “Hola” para empezar, o “Quiero vender más esta semana” para una Campaña Rápida ⚡
            </p>
          ) : null}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`vm-bubble-in max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  m.from === "user" ? "bg-[#d9fdd3] text-stone-800" : "bg-white text-stone-800"
                }`}
              >
                {m.text}
                {m.deliveryUrl ? (
                  <a
                    href={m.deliveryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block rounded-lg bg-emerald-600 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    📦 Abrir entrega
                  </a>
                ) : null}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex justify-start">
              <div className="vm-bubble-in flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-3 shadow-sm">
                <span className="vm-typing-dot" />
                <span className="vm-typing-dot" />
                <span className="vm-typing-dot" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-stone-100 p-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {(CHIPS_BY_PHASE[session.phase] ?? CHIPS_BY_PHASE.chatting).map((c) => (
              <button
                key={c.value}
                onClick={() => send(c.value)}
                disabled={loading}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600 hover:bg-stone-200 disabled:opacity-50"
              >
                {c.label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí un mensaje…"
              className="flex-1 rounded-full border border-stone-200 px-4 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 text-sm shadow-sm">
          <p className="font-medium text-stone-800">📸 Fotos para tus anuncios</p>
          <p className="mt-1 text-xs text-stone-500">
            Subí estas 3 y los anuncios salen con tu producto, tu logo y tu foto (no genéricos).
          </p>
          <div className="mt-3 space-y-2">
            <PhotoRow label="Producto (fondo blanco)" value={photos.product} onPick={(f) => onPick("product", f)} />
            <PhotoRow label="Logo" value={photos.logo} onPick={(f) => onPick("logo", f)} />
            <PhotoRow label="Tu foto" value={photos.founder} onPick={(f) => onPick("founder", f)} />
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
          <p className="font-medium text-stone-800">Probá los flujos</p>
          <ul className="mt-2 space-y-1 text-stone-500">
            <li>• Negocio existente: ya está cargado, escribí “quiero vender más”.</li>
            <li>• Campaña Rápida: te pide producto, precio y presupuesto.</li>
            <li>• Aprobación: tocá un botón (Aprobar, Pedir cambios…) o respondé 1 a 4.</li>
          </ul>
          <button
            onClick={newNumber}
            className="mt-3 w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            🔄 Nuevo número (probar alta de negocio)
          </button>
          <button
            onClick={() => resetWith(defaultPhone)}
            className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            Volver al negocio de ejemplo
          </button>
        </div>
      </div>
    </div>
  );
}
