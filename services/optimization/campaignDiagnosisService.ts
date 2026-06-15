/**
 * Diagnóstico de campañas de Meta Ads con la metodología de las "3 Q's" de
 * Felipe Vergara + semáforo de benchmarks (🟢/🟡/🔴). Reconstruido nativo
 * (no llama al MCP de FV). Determinista: no usa IA, así que funciona siempre.
 *
 * Las 3 preguntas recorren el embudo de arriba hacia abajo y el primer
 * "rojo" es el cuello de botella:
 *   Q1 ¿Le llega a la gente indicada?  → entrega / público   (frecuencia)
 *   Q2 ¿El anuncio engancha?           → creativo            (CTR)
 *   Q3 ¿El destino convierte?          → destino / oferta    (tasa de conversión, costo por resultado, ROAS)
 *
 * Las métricas-ratio (CTR, frecuencia, conversión, ROAS) son independientes de
 * la moneda; el costo por resultado se compara contra el objetivo que cargue el
 * usuario (su "número mágico"), así sirve en cualquier moneda.
 */

export type ResultType = "conversaciones" | "leads" | "compras";
export type Light = "green" | "amber" | "red" | "gray";

export interface CampaignMetricsInput {
  resultType: ResultType;
  currency?: string;
  spend: number;
  impressions: number;
  reach?: number | null;
  linkClicks: number;
  results: number;
  revenue?: number | null;
  targetCostPerResult?: number | null;
}

export interface MetricReading {
  key: string;
  label: string;
  display: string;
  light: Light;
  benchmark: string;
}

export type Bottleneck = "entrega" | "creativo" | "destino" | "ninguno";

export interface QReading {
  q: 1 | 2 | 3;
  question: string;
  area: string;
  summary: string;
  light: Light;
  isBottleneck: boolean;
}

export interface CampaignDiagnosis {
  ok: boolean;
  metrics: MetricReading[];
  questions: QReading[];
  bottleneck: Bottleneck;
  verdict: string;
  verdictTone: Light;
  diagnosis: string;
  actions: string[];
  dataWarning?: string;
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const money = (v: number, cur = "USD") => `${cur} ${v.toLocaleString("es-UY", { maximumFractionDigits: 2 })}`;

// Umbrales de tasa de conversión clic→resultado según el tipo de resultado.
const CONV_BENCH: Record<ResultType, { green: number; amber: number; label: string }> = {
  conversaciones: { green: 0.1, amber: 0.04, label: "clic→conversación" },
  leads: { green: 0.08, amber: 0.03, label: "clic→lead" },
  compras: { green: 0.03, amber: 0.01, label: "clic→compra" },
};

function lightForConv(rate: number, t: ResultType): Light {
  const b = CONV_BENCH[t];
  if (rate >= b.green) return "green";
  if (rate >= b.amber) return "amber";
  return "red";
}

export class CampaignDiagnosisService {
  diagnose(input: CampaignMetricsInput): CampaignDiagnosis {
    const cur = input.currency || "USD";
    const spend = Math.max(0, input.spend || 0);
    const impressions = Math.max(0, input.impressions || 0);
    const reach = input.reach && input.reach > 0 ? input.reach : null;
    const clicks = Math.max(0, input.linkClicks || 0);
    const results = Math.max(0, input.results || 0);
    const revenue = input.revenue && input.revenue > 0 ? input.revenue : null;
    const target = input.targetCostPerResult && input.targetCostPerResult > 0 ? input.targetCostPerResult : null;

    // --- Métricas derivadas ---
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const frequency = reach ? impressions / reach : null;
    const convRate = clicks > 0 ? results / clicks : 0;
    const costPerResult = results > 0 ? spend / results : null;
    const roas = revenue && spend > 0 ? revenue / spend : null;

    // --- Semáforo por métrica ---
    const ctrLight: Light = ctr >= 0.015 ? "green" : ctr >= 0.008 ? "amber" : "red";
    const freqLight: Light = frequency == null ? "gray" : frequency <= 2 ? "green" : frequency <= 3.5 ? "amber" : "red";
    const convLight: Light = clicks > 0 ? lightForConv(convRate, input.resultType) : "gray";
    const costLight: Light =
      costPerResult == null ? "red" : target == null ? "gray" : costPerResult <= target ? "green" : costPerResult <= target * 1.3 ? "amber" : "red";
    const roasLight: Light = roas == null ? "gray" : roas >= 3 ? "green" : roas >= 1 ? "amber" : "red";

    const metrics: MetricReading[] = [
      { key: "ctr", label: "CTR (clics / impresiones)", display: pct(ctr), light: ctrLight, benchmark: "🟢 ≥1.5% · 🟡 0.8–1.5% · 🔴 <0.8%" },
      { key: "cpm", label: "CPM (costo x 1.000 impr.)", display: money(cpm, cur), light: "gray", benchmark: "Referencial (depende de país y público)" },
      { key: "cpc", label: "CPC (costo por clic)", display: money(cpc, cur), light: "gray", benchmark: "Referencial" },
      ...(frequency != null
        ? [{ key: "freq", label: "Frecuencia", display: frequency.toFixed(2), light: freqLight, benchmark: "🟢 ≤2 · 🟡 2–3.5 · 🔴 >3.5 (fatiga)" } as MetricReading]
        : []),
      { key: "conv", label: `Tasa de conversión (${CONV_BENCH[input.resultType].label})`, display: clicks > 0 ? pct(convRate) : "—", light: convLight, benchmark: `🟢 ≥${pct(CONV_BENCH[input.resultType].green)} · 🔴 <${pct(CONV_BENCH[input.resultType].amber)}` },
      {
        key: "cpr",
        label: "Costo por resultado",
        display: costPerResult == null ? "sin resultados" : money(costPerResult, cur),
        light: costLight,
        benchmark: target ? `Objetivo: ${money(target, cur)} · 🟡 hasta ${money(target * 1.3, cur)}` : "Cargá tu objetivo para el semáforo",
      },
      ...(roas != null
        ? [{ key: "roas", label: "ROAS (retorno de la inversión)", display: `${roas.toFixed(2)}x`, light: roasLight, benchmark: "🟢 ≥3x · 🟡 1–3x · 🔴 <1x" } as MetricReading]
        : []),
    ];

    // --- Las 3 preguntas (semáforo por etapa del embudo) ---
    // Q2: si casi nadie hace clic, el creativo no engancha.
    const q2Light: Light = ctrLight;
    // Q1: entrega/público — frecuencia (si hay dato).
    const q1Light: Light = freqLight;
    // Q3: destino/oferta — conversión + costo vs objetivo + ROAS.
    const q3Light: Light = worst([
      convLight,
      costLight === "gray" ? "green" : costLight,
      roasLight === "gray" ? "green" : roasLight,
    ]);

    const questions: QReading[] = [
      {
        q: 1,
        question: "¿Le está llegando a la gente indicada?",
        area: "Entrega / público",
        summary: frequency != null ? `Frecuencia ${frequency.toFixed(2)}` : "Sin dato de alcance para medir frecuencia",
        light: q1Light,
        isBottleneck: false,
      },
      {
        q: 2,
        question: "¿El anuncio engancha?",
        area: "Creativo",
        summary: `CTR ${pct(ctr)}`,
        light: q2Light,
        isBottleneck: false,
      },
      {
        q: 3,
        question: "¿El destino convierte?",
        area: "Destino / oferta",
        summary: clicks > 0 ? `Conversión ${pct(convRate)}${costPerResult != null ? ` · ${money(costPerResult, cur)}/resultado` : ""}` : "Todavía sin clics para medir",
        light: q3Light,
        isBottleneck: false,
      },
    ];

    // --- Cuello de botella: primer "rojo" del embudo; si no, el peor "amarillo" ---
    const order: { area: Bottleneck; light: Light }[] = [
      { area: "entrega", light: q1Light },
      { area: "creativo", light: q2Light },
      { area: "destino", light: q3Light },
    ];
    let bottleneck: Bottleneck =
      order.find((o) => o.light === "red")?.area ?? order.find((o) => o.light === "amber")?.area ?? "ninguno";

    // Sin clics: el problema arranca en el creativo (nadie engancha) salvo que la entrega ya sea el rojo.
    if (clicks === 0 && impressions > 0 && bottleneck !== "entrega") bottleneck = "creativo";

    if (bottleneck !== "ninguno") {
      const area = bottleneck === "entrega" ? "entrega" : bottleneck === "creativo" ? "creativo" : "destino";
      const qb = questions.find((q) => q.area.toLowerCase().startsWith(area));
      if (qb) qb.isBottleneck = true;
    }

    const { verdict, verdictTone, diagnosis, actions } = this.plan(bottleneck, {
      ctr,
      frequency,
      convRate,
      costPerResult,
      target,
      roas,
      resultType: input.resultType,
      cur,
    });

    // --- Aviso de datos insuficientes ---
    let dataWarning: string | undefined;
    if (impressions < 1000 || clicks < 20) {
      dataWarning =
        "Hay pocos datos todavía (poca impresión/clics). Tomá el diagnóstico como preliminar: dejá correr la campaña hasta tener volumen para decidir con confianza.";
    }

    return {
      ok: true,
      metrics,
      questions,
      bottleneck,
      verdict,
      verdictTone,
      diagnosis,
      actions,
      dataWarning,
    };
  }

  private plan(
    bottleneck: Bottleneck,
    m: {
      ctr: number;
      frequency: number | null;
      convRate: number;
      costPerResult: number | null;
      target: number | null;
      roas: number | null;
      resultType: ResultType;
      cur: string;
    }
  ): { verdict: string; verdictTone: Light; diagnosis: string; actions: string[] } {
    const wayOver = m.target != null && m.costPerResult != null && m.costPerResult > m.target * 2;
    const losingMoney = m.roas != null && m.roas < 1;

    if (bottleneck === "ninguno") {
      return {
        verdict: "Escalar 🟢",
        verdictTone: "green",
        diagnosis: "La campaña está rindiendo: llega bien, el creativo engancha y el destino convierte. Es momento de meterle más nafta sin romper lo que funciona.",
        actions: [
          "Subí el presupuesto ~20% cada 3-4 días (de a poco, para no resetear el aprendizaje).",
          "Duplicá el anuncio ganador en públicos nuevos (similares / lookalike) para escalar horizontal.",
          "Sumá 1-2 creativos nuevos para que la frecuencia no se dispare al subir el gasto.",
        ],
      };
    }

    if (bottleneck === "entrega") {
      return {
        verdict: "Optimizar: público / entrega",
        verdictTone: "amber",
        diagnosis:
          m.frequency != null && m.frequency > 3.5
            ? `La frecuencia está alta (${m.frequency.toFixed(2)}): la misma gente ya vio el anuncio demasiadas veces y empieza a cansarse.`
            : "El anuncio no le está llegando de forma eficiente al público indicado.",
        actions: [
          "Ampliá el público (más intereses, mayor radio) o probá un público similar (lookalike) para refrescar a quién le llega.",
          "Sumá creativos nuevos: con más variedad, la frecuencia baja y el costo mejora.",
          "Si el público es muy chico, agrandalo o subí un poco el presupuesto para que el sistema tenga margen.",
        ],
      };
    }

    if (bottleneck === "creativo") {
      return {
        verdict: "Optimizar: creativo",
        verdictTone: "amber",
        diagnosis: `Pocos hacen clic (CTR ${pct(m.ctr)}): el anuncio llega pero no engancha. El problema está en el creativo o el gancho.`,
        actions: [
          "Probá nuevos hooks y ángulos: usá la matriz de Diversificación creativa de tu Estrategia (deseo × nivel de consciencia).",
          "Cambiá los primeros 3 segundos del video o la primera imagen, y reescribí el titular para que frene el scroll.",
          "Testeá 3-4 creativos distintos a la vez y dejá correr solo el que mejor CTR tenga.",
        ],
      };
    }

    // destino
    return {
      verdict: wayOver || losingMoney ? "Pausar y revisar el destino" : "Optimizar: destino / oferta",
      verdictTone: wayOver || losingMoney ? "red" : "amber",
      diagnosis: `La gente hace clic pero no convierte (conversión ${pct(m.convRate)}${
        m.costPerResult != null ? `, costo por resultado ${money(m.costPerResult, m.cur)}` : ""
      }). El cuello está en el destino o la oferta.`,
      actions: [
        m.resultType === "conversaciones"
          ? "En WhatsApp: respondé en los primeros minutos, con un mensaje claro y una oferta concreta. La demora mata la venta."
          : "Revisá el destino (landing / formulario): que cargue rápido, se entienda en 5 segundos y tenga un solo paso claro.",
        "Reforzá la oferta: hacela irresistible (gancho, beneficio claro, urgencia real) y sumá prueba social y garantía.",
        "Asegurate de que el anuncio y el destino prometan lo mismo: si el anuncio dice una cosa y el destino otra, la gente se va.",
      ],
    };
  }
}

function worst(lights: Light[]): Light {
  if (lights.includes("red")) return "red";
  if (lights.includes("amber")) return "amber";
  if (lights.includes("green")) return "green";
  return "gray";
}

export const campaignDiagnosisService = new CampaignDiagnosisService();
