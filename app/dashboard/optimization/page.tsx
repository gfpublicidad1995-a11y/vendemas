"use client";

import { useState } from "react";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import {
  campaignDiagnosisService,
  type CampaignDiagnosis,
  type Light,
  type ResultType,
} from "@/services/optimization/campaignDiagnosisService";

const DOT: Record<Light, string> = { green: "🟢", amber: "🟡", red: "🔴", gray: "⚪" };
const RING: Record<Light, string> = {
  green: "ring-emerald-200 bg-emerald-50/50",
  amber: "ring-amber-200 bg-amber-50/50",
  red: "ring-red-200 bg-red-50/50",
  gray: "ring-stone-200 bg-stone-50/50",
};
const TEXT: Record<Light, string> = {
  green: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-red-700",
  gray: "text-stone-500",
};

const RESULT_LABEL: Record<ResultType, string> = {
  conversaciones: "Mensajes por WhatsApp",
  leads: "Consultas / contactos",
  compras: "Ventas",
};

const RESULT_COUNT_LABEL: Record<ResultType, string> = {
  conversaciones: "¿Cuántos te escribieron?",
  leads: "¿Cuántas consultas llegaron?",
  compras: "¿Cuántas ventas hubo?",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-stone-600">{label}</span>
      {children}
      {hint ? <span className="mt-0.5 block text-[11px] text-stone-400">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400";

export default function OptimizationPage() {
  const [resultType, setResultType] = useState<ResultType>("conversaciones");
  const [currency, setCurrency] = useState("USD");
  const [f, setF] = useState({
    spend: "",
    impressions: "",
    reach: "",
    linkClicks: "",
    results: "",
    revenue: "",
    targetCostPerResult: "",
  });
  const [result, setResult] = useState<CampaignDiagnosis | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));
  const num = (s: string) => {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  function diagnose(e: React.FormEvent) {
    e.preventDefault();
    setResult(
      campaignDiagnosisService.diagnose({
        resultType,
        currency,
        spend: num(f.spend),
        impressions: num(f.impressions),
        reach: f.reach ? num(f.reach) : null,
        linkClicks: num(f.linkClicks),
        results: num(f.results),
        revenue: f.revenue ? num(f.revenue) : null,
        targetCostPerResult: f.targetCostPerResult ? num(f.targetCostPerResult) : null,
      })
    );
  }

  return (
    <div>
      <PageHeader
        title="Resultados y optimización"
        description="Cargá los números de tu campaña y te decimos qué está fallando y qué hacer. Usamos las 3 preguntas (entrega · creativo · destino) con semáforo 🟢🟡🔴."
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Formulario */}
        <Card className="h-fit p-5">
          <SectionTitle>Datos de la campaña</SectionTitle>
          <form onSubmit={diagnose} className="mt-2 space-y-3">
            <Field label="¿Qué buscabas con la campaña?">
              <select
                value={resultType}
                onChange={(e) => setResultType(e.target.value as ResultType)}
                className={inputCls}
              >
                {(Object.keys(RESULT_LABEL) as ResultType[]).map((k) => (
                  <option key={k} value={k}>
                    {RESULT_LABEL[k]}
                  </option>
                ))}
              </select>
            </Field>

            <p className="rounded-lg bg-stone-50 px-3 py-2 text-[11px] text-stone-500 ring-1 ring-stone-100">
              💡 Estos números los copiás del Administrador de Anuncios de Meta (Ads Manager).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="¿Cuánto gastaste?">
                <input type="number" inputMode="decimal" min={0} value={f.spend} onChange={set("spend")} className={inputCls} placeholder="0" />
              </Field>
              <Field label="Moneda">
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Veces que se mostró" hint="impresiones">
                <input type="number" min={0} value={f.impressions} onChange={set("impressions")} className={inputCls} placeholder="0" />
              </Field>
              <Field label="Gente distinta que llegó" hint="alcance · opcional">
                <input type="number" min={0} value={f.reach} onChange={set("reach")} className={inputCls} placeholder="opcional" />
              </Field>
              <Field label="¿Cuántos hicieron clic?">
                <input type="number" min={0} value={f.linkClicks} onChange={set("linkClicks")} className={inputCls} placeholder="0" />
              </Field>
              <Field label={RESULT_COUNT_LABEL[resultType]}>
                <input type="number" min={0} value={f.results} onChange={set("results")} className={inputCls} placeholder="0" />
              </Field>
              {resultType === "compras" ? (
                <Field label="¿Cuánto vendiste en total?" hint="para el retorno (ROAS)">
                  <input type="number" min={0} value={f.revenue} onChange={set("revenue")} className={inputCls} placeholder="opcional" />
                </Field>
              ) : null}
              <Field label="¿Cuánto querés pagar por cada uno?" hint="opcional">
                <input type="number" min={0} value={f.targetCostPerResult} onChange={set("targetCostPerResult")} className={inputCls} placeholder="opcional" />
              </Field>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              🩺 Diagnosticar
            </button>
            <p className="text-[11px] text-stone-400">
              Solo analizamos números que cargás vos. No tocamos campañas ni gastamos nada.
            </p>
          </form>
        </Card>

        {/* Resultado */}
        <div>
          {!result ? (
            <Card className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <div className="text-4xl">🩺</div>
              <p className="mt-2 max-w-sm text-sm text-stone-500">
                Cargá los datos de tu campaña (los sacás de Ads Manager) y te diagnostico el cuello de botella y el plan
                para mejorar.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              {/* Veredicto */}
              <Card className={`p-5 ring-1 ${RING[result.verdictTone]}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{DOT[result.verdictTone]}</span>
                  <h2 className={`text-lg font-bold ${TEXT[result.verdictTone]}`}>{result.verdict}</h2>
                </div>
                <p className="mt-1 text-sm text-stone-700">{result.diagnosis}</p>
                {result.dataWarning ? (
                  <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 ring-1 ring-amber-200">
                    ⚠️ {result.dataWarning}
                  </p>
                ) : null}
              </Card>

              {/* Las 3 preguntas */}
              <Card className="p-5">
                <SectionTitle>Las 3 preguntas</SectionTitle>
                <div className="mt-2 space-y-2">
                  {result.questions.map((q) => (
                    <div
                      key={q.q}
                      className={`flex items-center gap-3 rounded-xl p-3 ring-1 ${RING[q.light]} ${
                        q.isBottleneck ? "ring-2" : ""
                      }`}
                    >
                      <span className="text-xl">{DOT[q.light]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-800">
                          {q.q}. {q.question}
                          {q.isBottleneck ? (
                            <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                              CUELLO DE BOTELLA
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-stone-500">
                          {q.area} · {q.summary}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Plan de acción */}
              <Card className="p-5">
                <SectionTitle>Qué hacer ahora</SectionTitle>
                <ul className="mt-2 space-y-2">
                  {result.actions.map((a, i) => (
                    <li key={i} className="flex gap-2 text-sm text-stone-700">
                      <span className="font-bold text-emerald-600">{i + 1}.</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Métricas con semáforo */}
              <Card className="p-5">
                <SectionTitle>Métricas (semáforo)</SectionTitle>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {result.metrics.map((m) => (
                        <tr key={m.key} className="border-t border-stone-100 first:border-0">
                          <td className="py-2 pr-3">
                            <span className="mr-2">{DOT[m.light]}</span>
                            <span className="text-stone-600">{m.label}</span>
                          </td>
                          <td className={`py-2 pr-3 text-right font-semibold ${TEXT[m.light]}`}>{m.display}</td>
                          <td className="hidden py-2 text-right text-[11px] text-stone-400 sm:table-cell">
                            {m.benchmark}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
