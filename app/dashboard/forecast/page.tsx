"use client";

import { useState } from "react";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import {
  campaignSimulatorService,
  type SimulatorResult,
  type ResultType,
} from "@/services/optimization/campaignSimulatorService";
import type { Light } from "@/services/optimization/campaignDiagnosisService";

const DOT: Record<Light, string> = { green: "🟢", amber: "🟡", red: "🔴", gray: "⚪" };
const TEXT: Record<Light, string> = {
  green: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-red-700",
  gray: "text-stone-500",
};

const RESULT_LABEL: Record<ResultType, string> = {
  conversaciones: "Conversaciones (WhatsApp)",
  leads: "Leads / formularios",
  compras: "Compras (tienda)",
};

const inputCls =
  "mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-stone-600">{label}</span>
      {children}
      {hint ? <span className="mt-0.5 block text-[11px] text-stone-400">{hint}</span> : null}
    </label>
  );
}

function money(v: number | null, cur: string) {
  if (v == null) return "—";
  return `${cur} ${v.toLocaleString("es-UY", { maximumFractionDigits: 2 })}`;
}

export default function ForecastPage() {
  const [resultType, setResultType] = useState<ResultType>("conversaciones");
  const [currency, setCurrency] = useState("USD");
  const [f, setF] = useState({
    budget: "300",
    cpm: "6",
    ctr: "1.2",
    conversionRate: "8",
    ticket: "",
    targetCostPerResult: "",
  });
  const [result, setResult] = useState<SimulatorResult | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));
  const num = (s: string) => {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  function run(e: React.FormEvent) {
    e.preventDefault();
    setResult(
      campaignSimulatorService.simulate({
        resultType,
        currency,
        budget: num(f.budget),
        cpm: num(f.cpm),
        ctr: num(f.ctr),
        conversionRate: num(f.conversionRate),
        ticket: f.ticket ? num(f.ticket) : null,
        targetCostPerResult: f.targetCostPerResult ? num(f.targetCostPerResult) : null,
      })
    );
  }

  return (
    <div>
      <PageHeader
        title="Simulador de resultados"
        description="Antes de gastar: estimá cuántos resultados y a qué costo, en 3 escenarios. Es una proyección con tus números esperados, no una promesa."
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit p-5">
          <SectionTitle>Tu campaña</SectionTitle>
          <form onSubmit={run} className="mt-2 space-y-3">
            <Field label="Objetivo / tipo de resultado">
              <select value={resultType} onChange={(e) => setResultType(e.target.value as ResultType)} className={inputCls}>
                {(Object.keys(RESULT_LABEL) as ResultType[]).map((k) => (
                  <option key={k} value={k}>
                    {RESULT_LABEL[k]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Moneda">
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Presupuesto" hint="total del período">
                <input type="number" inputMode="decimal" min={0} value={f.budget} onChange={set("budget")} className={inputCls} />
              </Field>
              <Field label="CPM esperado" hint="costo x 1.000 impr.">
                <input type="number" inputMode="decimal" min={0} value={f.cpm} onChange={set("cpm")} className={inputCls} />
              </Field>
              <Field label="CTR esperado (%)" hint="clics / impresiones">
                <input type="number" inputMode="decimal" min={0} value={f.ctr} onChange={set("ctr")} className={inputCls} />
              </Field>
              <Field label="Conversión (%)" hint="clic → resultado">
                <input type="number" inputMode="decimal" min={0} value={f.conversionRate} onChange={set("conversionRate")} className={inputCls} />
              </Field>
              {resultType === "compras" ? (
                <Field label="Ticket promedio" hint="para ingresos / ROAS">
                  <input type="number" inputMode="decimal" min={0} value={f.ticket} onChange={set("ticket")} className={inputCls} placeholder="opcional" />
                </Field>
              ) : null}
              <Field label="Costo objetivo" hint="tu 'número mágico'">
                <input type="number" inputMode="decimal" min={0} value={f.targetCostPerResult} onChange={set("targetCostPerResult")} className={inputCls} placeholder="opcional" />
              </Field>
            </div>
            <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
              🔮 Simular
            </button>
            <p className="text-[11px] text-stone-400">Es una estimación. Los resultados reales dependen del mercado y los creativos.</p>
          </form>
        </Card>

        <div>
          {!result ? (
            <Card className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <div className="text-4xl">🔮</div>
              <p className="mt-2 max-w-sm text-sm text-stone-500">
                Cargá tu presupuesto y las métricas que esperás (dejamos valores típicos cargados) y te proyecto los
                resultados en 3 escenarios.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              <Card className="p-5 ring-1 ring-emerald-200 bg-emerald-50/40">
                <p className="text-sm text-stone-700">{result.summary}</p>
              </Card>

              <Card className="p-5">
                <SectionTitle>3 escenarios</SectionTitle>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-stone-400">
                        <th className="py-1 pr-3">Escenario</th>
                        <th className="py-1 pr-3 text-right">Impresiones</th>
                        <th className="py-1 pr-3 text-right">Clics</th>
                        <th className="py-1 pr-3 text-right">Resultados</th>
                        <th className="py-1 pr-3 text-right">Costo/result.</th>
                        {result.resultType === "compras" ? <th className="py-1 text-right">ROAS</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {result.scenarios.map((s) => (
                        <tr key={s.key} className="border-t border-stone-100">
                          <td className="py-2 pr-3 font-medium text-stone-700">
                            {DOT[s.light]} {s.name}
                          </td>
                          <td className="py-2 pr-3 text-right text-stone-600">{s.impressions.toLocaleString("es-UY")}</td>
                          <td className="py-2 pr-3 text-right text-stone-600">{s.clicks.toLocaleString("es-UY")}</td>
                          <td className="py-2 pr-3 text-right font-semibold text-stone-800">{s.results.toLocaleString("es-UY")}</td>
                          <td className={`py-2 pr-3 text-right font-medium ${TEXT[s.light]}`}>{money(s.costPerResult, result.currency)}</td>
                          {result.resultType === "compras" ? (
                            <td className={`py-2 text-right font-medium ${TEXT[s.light]}`}>{s.roas != null ? `${s.roas.toFixed(2)}x` : "—"}</td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.note ? <p className="mt-3 text-xs text-stone-400">{result.note}</p> : null}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
