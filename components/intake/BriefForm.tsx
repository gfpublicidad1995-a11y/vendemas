import { Card } from "@/components/ui";
import { createBusiness } from "@/app/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PhotoInput } from "@/components/intake/PhotoInput";

const inputClass =
  "mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400";

function Field({
  label,
  hint,
  children,
  full,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint ? <span className="mt-0.5 block text-xs text-stone-400">{hint}</span> : null}
    </label>
  );
}

function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
          {step}
        </span>
        <div>
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

/**
 * Formulario de brief de marca, en pasos simples para un usuario no técnico.
 * `source` define a dónde se vuelve tras crear: "dashboard" → ficha del negocio;
 * "public" → página de gracias para el cliente. Los `name` se mantienen iguales.
 */
export function BriefForm({
  source = "dashboard",
  submitLabel = "Crear negocio y armar la marca",
}: {
  source?: "dashboard" | "public";
  submitLabel?: string;
}) {
  return (
    <form action={createBusiness} className="space-y-5">
      <input type="hidden" name="source" value={source} />

      <Section step={1} title="Lo esencial" subtitle="Con esto ya podemos arrancar.">
        <Field label="¿Cómo se llama tu negocio? *" full>
          <input name="businessName" required placeholder="Ej: Agro y Mascotas Centro" className={inputClass} />
        </Field>
        <Field label="¿Qué vendés?" full hint="Tu producto o servicio principal, con el precio si querés.">
          <input name="mainOffer" placeholder="Ej: Sanitaria para gatos 25L, $890 con envío" className={inputClass} />
        </Field>
        <Field label="¿A quién le vendés?" full hint="Tus clientes ideales.">
          <input name="targetAudience" placeholder="Ej: dueños de gatos y mascotas en Florida" className={inputClass} />
        </Field>
        <Field label="¿Qué tipo de negocio es?">
          <input name="category" placeholder="Ej: Mascotas y agro" className={inputClass} />
        </Field>
        <Field label="¿En qué ciudad estás?">
          <input name="city" placeholder="Ej: Florida" className={inputClass} />
        </Field>
      </Section>

      <Section
        step={2}
        title="Para venderte mejor"
        subtitle="Nos ayuda a escribir lo que de verdad convence. Si algo no sabés, dejalo en blanco."
      >
        <Field label="Contanos de tu negocio" full>
          <textarea
            name="description"
            rows={3}
            placeholder="Tu historia, qué te enorgullece, tus productos estrella…"
            className={inputClass}
          />
        </Field>
        <Field label="¿Qué problema le resolvés a tu cliente?" full>
          <input name="problem" placeholder="Ej: no consiguen X cerca, pierden tiempo, no saben cuál elegir…" className={inputClass} />
        </Field>
        <Field label="¿Por qué te eligen a vos?" full hint="Lo que te hace distinto.">
          <input name="differentiators" placeholder="Ej: atención rápida, envío en el día, asesoramiento, mejor precio" className={inputClass} />
        </Field>
        <Field label="¿Qué los hace dudar antes de comprar?" full hint="Las típicas excusas.">
          <input name="objections" placeholder="Ej: «es caro», «no sé si me sirve», «desconfío del envío»" className={inputClass} />
        </Field>
        <Field label="¿Ofrecés alguna garantía o promesa?" full>
          <input name="guarantee" placeholder="Ej: satisfacción garantizada, cambios sin costo, devolución" className={inputClass} />
        </Field>
      </Section>

      <Section step={3} title="Tu marca y contacto" subtitle="Opcional, para darle tu identidad. Si no sabés, lo vemos juntos después.">
        <Field label="Color principal de tu marca" hint="Tocá para elegirlo.">
          <input name="primaryColor" type="color" defaultValue="#166534" className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-stone-200 bg-white p-1" />
        </Field>
        <Field label="Color secundario" hint="Tocá para elegirlo.">
          <input name="secondaryColor" type="color" defaultValue="#d9fdd3" className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-stone-200 bg-white p-1" />
        </Field>
        <Field label="¿Cómo te gusta hablarle a tus clientes?" full hint="El tono de tus mensajes.">
          <input name="toneOfVoice" placeholder="Ej: cercano, simple y vendedor" className={inputClass} />
        </Field>
        <Field label="Tu WhatsApp">
          <input name="whatsappNumber" placeholder="+598 9X XXX XXX" className={inputClass} />
        </Field>
        <Field label="Tu Instagram">
          <input name="instagramHandle" placeholder="@tunegocio" className={inputClass} />
        </Field>
        <Field label="¿Cuánto pensás invertir por mes?" full hint="En publicidad, aprox. y en dólares. Opcional.">
          <input name="monthlyAdBudget" type="number" min="0" placeholder="300" className={inputClass} />
        </Field>
      </Section>

      <Section step={4} title="Fotos" subtitle="Para que el contenido salga con tu producto y tu cara, no genérico.">
        <div className="sm:col-span-2">
          <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-emerald-200">
            💡 Sacalas con <b>buena luz</b> y <b>fondo blanco</b>. Así quedan más profesionales y las podemos usar en
            más formatos.
          </p>
          <div className="space-y-4">
            <PhotoInput name="productPhoto" label="📦 Foto del producto (fondo blanco)" />
            <PhotoInput name="logo" label="🏷️ Logo del negocio" />
            <PhotoInput name="founderPhoto" label="🧑 Tu foto (fondo blanco)" />
          </div>
          <p className="mt-3 text-xs text-stone-400">
            Las fotos son opcionales para arrancar, pero las necesitamos para los anuncios. Podés sumarlas después.
          </p>
        </div>
      </Section>

      <SubmitButton
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99]"
        pendingText="Creando tu negocio…"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
