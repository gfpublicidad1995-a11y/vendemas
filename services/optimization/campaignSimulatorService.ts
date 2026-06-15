/**
 * Simulador de resultados de Meta Ads (metodología de Felipe Vergara):
 * a partir de un presupuesto y métricas esperadas, proyecta impresiones,
 * clics, resultados, costo por resultado y ROAS en 3 escenarios
 * (conservador / moderado / optimista). Determinista, sin IA.
 *
 * Complementa la suite: la calculadora dice CUÁNTO invertir, este simulador
 * QUÉ esperar, y el diagnóstico 3 Q's QUÉ falló después.
 */

import type { Light, ResultType } from "./campaignDiagnosisService";

export type { ResultType };

export interface SimulatorInput {
  resultType: ResultType;
  currency?: string;
  budget: number; // presupuesto total del período
  cpm: number; // costo por mil impresiones esperado (en la moneda)
  ctr: number; // % esperado de clics sobre impresiones (ej. 1.2 = 1.2%)
  conversionRate: number; // % esperado de clic→resultado (ej. 8 = 8%)
  ticket?: number | null; // valor por compra (para ROAS), solo "compras"
  targetCostPerResult?: number | null; // objetivo / "número mágico"
}

export interface ScenarioResult {
  key: "conservador" | "moderado" | "optimista";
  name: string;
  impressions: number;
  clicks: number;
  results: number;
  costPerResult: number | null;
  revenue: number | null;
  roas: number | null;
  light: Light;
}

export interface SimulatorResult {
  ok: boolean;
  currency: string;
  resultType: ResultType;
  scenarios: ScenarioResult[];
  summary: string;
  note?: string;
}

// Multiplicadores por escenario (peor/igual/mejor que lo esperado).
const SCENARIOS: { key: ScenarioResult["key"]; name: string; ctr: number; conv: number; cpm: number }[] = [
  { key: "conservador", name: "Conservador", ctr: 0.7, conv: 0.7, cpm: 1.25 },
  { key: "moderado", name: "Moderado", ctr: 1, conv: 1, cpm: 1 },
  { key: "optimista", name: "Optimista", ctr: 1.3, conv: 1.3, cpm: 0.85 },
];

const round = (n: number) => Math.round(n);
const money = (v: number, cur: string) => `${cur} ${v.toLocaleString("es-UY", { maximumFractionDigits: 2 })}`;

export class CampaignSimulatorService {
  simulate(input: SimulatorInput): SimulatorResult {
    const cur = input.currency || "USD";
    const budget = Math.max(0, input.budget || 0);
    const cpm = Math.max(0.01, input.cpm || 0);
    const ctr = Math.max(0, input.ctr || 0) / 100;
    const conv = Math.max(0, input.conversionRate || 0) / 100;
    const ticket = input.ticket && input.ticket > 0 ? input.ticket : null;
    const target = input.targetCostPerResult && input.targetCostPerResult > 0 ? input.targetCostPerResult : null;

    const scenarios: ScenarioResult[] = SCENARIOS.map((s) => {
      const cpmS = cpm * s.cpm;
      const ctrS = ctr * s.ctr;
      const convS = conv * s.conv;
      const impressions = (budget / cpmS) * 1000;
      const clicks = impressions * ctrS;
      const results = clicks * convS;
      const costPerResult = results > 0 ? budget / results : null;
      const revenue = ticket != null ? results * ticket : null;
      const roas = revenue != null && budget > 0 ? revenue / budget : null;

      // Semáforo: contra el objetivo de costo si lo hay; si no, contra el ROAS (compras).
      let light: Light = "gray";
      if (target != null && costPerResult != null) {
        light = costPerResult <= target ? "green" : costPerResult <= target * 1.3 ? "amber" : "red";
      } else if (roas != null) {
        light = roas >= 3 ? "green" : roas >= 1 ? "amber" : "red";
      }

      return {
        key: s.key,
        name: s.name,
        impressions: round(impressions),
        clicks: round(clicks),
        results: round(results),
        costPerResult,
        revenue,
        roas,
        light,
      };
    });

    const cons = scenarios[0];
    const mod = scenarios[1];
    const opt = scenarios[2];
    const noun =
      input.resultType === "compras" ? "compras" : input.resultType === "leads" ? "leads" : "conversaciones";
    const summary =
      mod.results > 0
        ? `Con ${money(budget, cur)} podés esperar entre ${cons.results} y ${opt.results} ${noun} (estimado ${mod.results}), a ~${
            mod.costPerResult != null ? money(mod.costPerResult, cur) : "—"
          } cada una${mod.roas != null ? ` y un ROAS estimado de ${mod.roas.toFixed(2)}x` : ""}.`
        : "Con esos números no se proyectan resultados; revisá el presupuesto o las métricas esperadas.";

    const note =
      target != null
        ? `El semáforo compara el costo por resultado contra tu objetivo (${money(target, cur)}).`
        : input.resultType === "compras"
          ? "Cargá el ticket promedio para ver ingresos y ROAS, o un costo objetivo para el semáforo."
          : "Cargá un costo objetivo por resultado para activar el semáforo.";

    return { ok: true, currency: cur, resultType: input.resultType, scenarios, summary, note };
  }
}

export const campaignSimulatorService = new CampaignSimulatorService();
