import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { generateMarketStrategy } from "@/app/actions";
import { awarenessLevelLabel } from "@/lib/labels";
import { asArray, asRecord, asStringArray } from "@/lib/json";

export const dynamic = "force-dynamic";

type Rec = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));

function GenerateButton({ businessProfileId, label }: { businessProfileId: string; label: string }) {
  return (
    <form action={generateMarketStrategy}>
      <input type="hidden" name="businessProfileId" value={businessProfileId} />
      <SubmitButton
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        pendingText="Generando estrategia…"
      >
        {label}
      </SubmitButton>
    </form>
  );
}

function Maleta({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">{n}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</span>
      </div>
      <div className="mt-1 text-sm text-stone-700">{children}</div>
    </div>
  );
}

function Highlight({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Card className="h-full p-4">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium leading-snug text-stone-800">{value}</div>
    </Card>
  );
}

function StrategyView({ strategy }: { strategy: NonNullable<Awaited<ReturnType<typeof getBusinesses>>[number]["marketStrategy"]> }) {
  const brand = asRecord(strategy.brandDna);
  const avatar = asRecord(strategy.avatar);
  const offer = asRecord(strategy.offer);
  const maletas = asRecord(strategy.sevenSuitcases);
  const awareness = asArray<Rec>(strategy.awarenessMap);
  const scripts = asArray<Rec>(strategy.scriptGuide);
  const matrix = asArray<Rec>(strategy.creativeMatrix);
  const budget = asRecord(strategy.budgetCalc);
  const campaign = asArray<Rec>(strategy.campaignStructure);
  const competitors = asArray<Rec>(strategy.competitors);
  const objeciones = asArray<Rec>(maletas.objeciones);
  const semaforo = asRecord(budget.semaforo);

  return (
    <div className="space-y-6">
      {/* Resumen visual de un vistazo */}
      <div className="vm-stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Highlight icon="💎" label="Posicionamiento" value={s(brand.propuestaValor)} />
        <Highlight icon="🎯" label="Público objetivo" value={`${s(avatar.publico)} · ${s(avatar.zona)}`} />
        <Highlight icon="🧠" label="Nivel de consciencia" value={awarenessLevelLabel(strategy.dominantAwarenessLevel)} />
        <Highlight
          icon="💰"
          label="Presupuesto sugerido"
          value={`${s(budget.presupuestoMensual)}/mes · ${s(budget.inversionDiariaSugerida)}/día`}
        />
      </div>

      {/* Resumen */}
      <Card className="p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="emerald">Nivel dominante: {awarenessLevelLabel(strategy.dominantAwarenessLevel)}</Badge>
        </div>
        <p className="text-sm text-stone-700">{s(strategy.summary)}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ADN de marca */}
        <Card className="p-5">
          <SectionTitle>ADN de marca</SectionTitle>
          <dl className="space-y-1.5 text-sm">
            <Row k="Propuesta de valor" v={s(brand.propuestaValor)} />
            <Row k="Tono" v={s(brand.tono)} />
            <Row k="Estilo visual" v={s(brand.estiloVisual)} />
            <Row k="Producto" v={s(brand.producto)} />
            <Row k="Precio" v={s(brand.precio)} />
          </dl>
        </Card>

        {/* Avatar */}
        <Card className="p-5">
          <SectionTitle>Avatar (16 deseos de Reiss)</SectionTitle>
          <p className="text-sm text-stone-700">{s(avatar.publico)} · {s(avatar.zona)}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {asStringArray(avatar.deseosReiss).map((d) => (
              <Badge key={d} tone="purple">{d}</Badge>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-medium text-stone-400">Dolores</p>
              <ul className="list-inside list-disc text-stone-700">
                {asStringArray(avatar.dolores).map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400">Deseos</p>
              <ul className="list-inside list-disc text-stone-700">
                {asStringArray(avatar.deseos).map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* 7 maletas */}
      <Card className="p-5">
        <SectionTitle>Las 7 maletas de cualquier compra</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Maleta n={1} title="Público">{s(maletas.publico)}</Maleta>
          <Maleta n={2} title="Problema">{s(maletas.problema)}</Maleta>
          <Maleta n={3} title="Solución">{s(maletas.solucion)}</Maleta>
          <Maleta n={4} title="Diferenciales">
            <ul className="list-inside list-disc">{asStringArray(maletas.diferenciales).map((d, i) => <li key={i}>{d}</li>)}</ul>
          </Maleta>
          <Maleta n={5} title="Objeciones">
            <ul className="space-y-1">
              {objeciones.map((o, i) => <li key={i}>“{s(o.objecion)}” → {s(o.respuesta)}</li>)}
            </ul>
          </Maleta>
          <Maleta n={6} title="Testimonios">
            <ul className="list-inside list-disc">{asStringArray(maletas.testimonios).map((t, i) => <li key={i}>{t}</li>)}</ul>
          </Maleta>
          <Maleta n={7} title="Garantía">{s(maletas.garantia)}</Maleta>
        </div>
      </Card>

      {/* Niveles de consciencia */}
      <Card className="p-5">
        <SectionTitle>Mapa de niveles de consciencia</SectionTitle>
        <div className="space-y-2">
          {awareness.map((lvl, i) => (
            <div key={i} className="rounded-xl border border-stone-100 p-3">
              <div className="flex items-center gap-2">
                <Badge tone={String(lvl.key) === strategy.dominantAwarenessLevel ? "emerald" : "gray"}>{s(lvl.label)}</Badge>
                <span className="text-xs text-stone-400">{s(lvl.angulo)}</span>
              </div>
              <p className="mt-1 text-sm text-stone-700">“{s(lvl.copy)}”</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Guía de guiones */}
        <Card className="p-5">
          <SectionTitle>Guía de guiones (reels)</SectionTitle>
          <div className="space-y-3">
            {scripts.map((sc, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-stone-800">{s(sc.nombre)}</p>
                <ol className="list-inside list-decimal text-sm text-stone-600">
                  {asStringArray(sc.estructura).map((step, j) => <li key={j}>{step}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </Card>

        {/* Oferta */}
        <Card className="p-5">
          <SectionTitle>Oferta</SectionTitle>
          <p className="text-sm text-stone-700">{s(offer.queOfrece)}</p>
          <p className="mt-1 text-sm text-emerald-700">🎁 {s(offer.ofertaGancho)}</p>
          <p className="mt-3 text-xs font-medium text-stone-400">Diferenciales</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {asStringArray(offer.diferenciales).map((d) => <Badge key={d} tone="green">{d}</Badge>)}
          </div>
        </Card>
      </div>

      {/* Matriz de diversificación creativa */}
      <Card className="p-5">
        <SectionTitle>Diversificación creativa (deseo × nivel → hook)</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-400">
                <th className="py-1 pr-3">Deseo</th>
                <th className="py-1 pr-3">Nivel</th>
                <th className="py-1 pr-3">Formato</th>
                <th className="py-1">Hook</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((m, i) => (
                <tr key={i} className="border-t border-stone-100">
                  <td className="py-1.5 pr-3 text-stone-600">{s(m.deseo)}</td>
                  <td className="py-1.5 pr-3">{awarenessLevelLabel(String(m.nivel))}</td>
                  <td className="py-1.5 pr-3"><Badge tone={String(m.formato) === "reel" ? "blue" : "amber"}>{s(m.formato)}</Badge></td>
                  <td className="py-1.5 text-stone-700">{s(m.hook)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calculadora de presupuesto */}
        <Card className="p-5">
          <SectionTitle>Calculadora de presupuesto</SectionTitle>
          <dl className="space-y-1.5 text-sm">
            <Row k="Ticket promedio" v={s(budget.ticketPromedio)} />
            <Row k="Número mágico (costo por compra obj.)" v={s(budget.costoPorCompraObjetivo)} />
            <Row k="ROAS objetivo" v={`${s(budget.roasObjetivo)}x`} />
            <Row k="Presupuesto mensual" v={s(budget.presupuestoMensual)} />
            <Row k="Inversión diaria sugerida" v={s(budget.inversionDiariaSugerida)} />
          </dl>
          <div className="mt-3 space-y-1 text-xs">
            <p className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">🟢 {s(semaforo.verde)}</p>
            <p className="rounded bg-amber-50 px-2 py-1 text-amber-700">🟡 {s(semaforo.amarillo)}</p>
            <p className="rounded bg-red-50 px-2 py-1 text-red-700">🔴 {s(semaforo.rojo)}</p>
          </div>
          <p className="mt-2 text-xs text-stone-400">{s(budget.numeroMagicoDescripcion)}</p>
        </Card>

        {/* Competidores */}
        <Card className="p-5">
          <SectionTitle>Competidores</SectionTitle>
          <div className="space-y-2">
            {competitors.map((c, i) => (
              <div key={i} className="rounded-xl border border-stone-100 p-3 text-sm">
                <p className="font-medium text-stone-800">{s(c.nombre)}</p>
                <p className="text-stone-600">Ángulo: {s(c.angulo)} · Oferta: {s(c.oferta)}</p>
                {c.nota ? <p className="mt-1 text-xs text-stone-400">{s(c.nota)}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Estructura de campañas */}
      <Card className="p-5">
        <SectionTitle>Estructura de campañas recomendada</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {campaign.map((c, i) => (
            <div key={i} className="rounded-xl border border-stone-100 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-800">{s(c.etapa)}</span>
                <Badge tone="emerald">{Math.round(Number(c.presupuestoPct) * 100)}%</Badge>
              </div>
              <p className="mt-1 text-xs text-stone-500">{s(c.objetivo)}</p>
              <p className="mt-2 text-xs text-stone-600">👥 {s(c.publico)}</p>
              <p className="text-xs text-stone-400">Excluir: {s(c.exclusiones)}</p>
              <p className="text-xs text-stone-400">{s(c.ubicaciones)}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 ring-1 ring-amber-200">
          🔒 Es una recomendación. No activamos campañas ni gastamos sin tu aprobación.
        </p>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-stone-400">{k}</dt>
      <dd className="text-right text-stone-700">{v}</dd>
    </div>
  );
}

function getBusinesses() {
  return prisma.businessProfile.findMany({
    orderBy: { createdAt: "asc" },
    include: { marketStrategy: true },
  });
}

export default async function StrategyPage() {
  const businesses = await getBusinesses();

  return (
    <div>
      <PageHeader
        title="Estrategia"
        description="Inteligencia de marketing: ADN de marca, 7 maletas, niveles de consciencia, diversificación creativa, presupuesto y estructura de campañas."
      />
      {businesses.length === 0 ? (
        <EmptyState title="No hay negocios" description="Creá un negocio para generar su estrategia." />
      ) : (
        <div className="space-y-10">
          {businesses.map((b) => (
            <section key={b.id}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-900">{b.businessName}</h2>
                <GenerateButton
                  businessProfileId={b.id}
                  label={b.marketStrategy ? "Regenerar estrategia" : "Generar estrategia"}
                />
              </div>
              {b.marketStrategy ? (
                <StrategyView strategy={b.marketStrategy} />
              ) : (
                <EmptyState
                  title="Sin estrategia todavía"
                  description="Tocá “Generar estrategia” para crear el ADN de marca, las 7 maletas, los niveles de consciencia y la estructura de campañas."
                />
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
