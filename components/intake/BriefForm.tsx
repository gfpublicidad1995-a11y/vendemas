import { Card } from "@/components/ui";
import { createBusiness } from "@/app/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PhotoInput } from "@/components/intake/PhotoInput";

const inputClass =
  "mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400";

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

/**
 * Formulario de brief de marca. `source` define a dónde se vuelve tras crear:
 * "dashboard" → ficha del negocio; "public" → página de gracias para el cliente.
 */
export function BriefForm({
  source = "dashboard",
  submitLabel = "Crear negocio y armar la marca",
}: {
  source?: "dashboard" | "public";
  submitLabel?: string;
}) {
  return (
    <form action={createBusiness} className="space-y-6">
      <input type="hidden" name="source" value={source} />

      {/* Datos de la marca */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Datos de la marca
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del negocio *" full>
            <input name="businessName" required placeholder="Ej: Agro y Mascotas Centro" className={inputClass} />
          </Field>
          <Field label="Rubro / categoría">
            <input name="category" placeholder="Ej: Mascotas y agro" className={inputClass} />
          </Field>
          <Field label="Ciudad">
            <input name="city" placeholder="Ej: Florida" className={inputClass} />
          </Field>
          <Field label="Qué vendés / oferta principal" full>
            <input name="mainOffer" placeholder="Ej: Sanitaria para gatos 25L, $890 con envío" className={inputClass} />
          </Field>
          <Field label="¿A quién le vendés? (público)" full>
            <input name="targetAudience" placeholder="Ej: dueños de gatos y mascotas en Florida" className={inputClass} />
          </Field>
          <Field label="Contanos de tu marca" full>
            <textarea
              name="description"
              rows={3}
              placeholder="Historia, qué te diferencia, qué querés transmitir, productos estrella…"
              className={inputClass}
            />
          </Field>
          <Field label="Tono de voz">
            <input name="toneOfVoice" placeholder="Ej: cercano, simple y vendedor" className={inputClass} />
          </Field>
          <Field label="Presupuesto mensual de pauta (USD)">
            <input name="monthlyAdBudget" type="number" min="0" placeholder="300" className={inputClass} />
          </Field>
          <Field label="WhatsApp">
            <input name="whatsappNumber" placeholder="+598 9X XXX XXX" className={inputClass} />
          </Field>
          <Field label="Instagram">
            <input name="instagramHandle" placeholder="@tunegocio" className={inputClass} />
          </Field>
          <Field label="Color primario de marca">
            <input name="primaryColor" placeholder="#166534" className={inputClass} />
          </Field>
          <Field label="Color secundario de marca">
            <input name="secondaryColor" placeholder="#d9fdd3" className={inputClass} />
          </Field>
        </div>
      </Card>

      {/* Fotos */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Fotos (para el contenido y los anuncios)
        </h2>
        <p className="mb-4 mt-1 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-emerald-200">
          💡 Sacá las fotos con <b>buena luz</b> y <b>fondo blanco</b>. Así quedan más profesionales y
          las podemos usar en más formatos (recortar, poner en distintos fondos, etc.).
        </p>
        <div className="space-y-4">
          <PhotoInput name="productPhoto" label="📦 Foto del producto a promocionar (fondo blanco)" />
          <PhotoInput name="logo" label="🏷️ Logo del negocio" />
          <PhotoInput name="founderPhoto" label="🧑 Foto del dueño/a (fondo blanco)" />
        </div>
        <p className="mt-3 text-xs text-stone-400">
          Las fotos son opcionales para crear el negocio, pero las necesitamos para generar los
          visuales. Podés sumarlas después.
        </p>
      </Card>

      <SubmitButton
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        pendingText="Creando el negocio…"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
