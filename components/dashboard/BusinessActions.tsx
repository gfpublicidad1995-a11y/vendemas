import {
  generateOpportunities,
  generateSuggestedReplies,
  generateCalendar,
  generateWeeklyReport,
  generateOffers,
  createContentFromVoice,
  generateBudgetPlan,
  generateMarketStrategy,
  runDailyDigest,
} from "@/app/actions";
import { Card, SectionTitle } from "@/components/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";

const btn =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:bg-emerald-50";

function ActionForm({
  action,
  businessProfileId,
  pendingText,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  businessProfileId: string;
  pendingText?: string;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="businessProfileId" value={businessProfileId} />
      <SubmitButton className={btn} pendingText={pendingText ?? "Generando…"}>
        {children}
      </SubmitButton>
    </form>
  );
}

export function BusinessActions({ businessProfileId }: { businessProfileId: string }) {
  return (
    <Card className="p-5">
      <SectionTitle>Acciones de VendeMás</SectionTitle>
      <p className="mb-3 text-xs text-stone-400">
        Generá contenido e inteligencia para este negocio (todo mockeado, sin gastar pauta).
      </p>
      <div className="space-y-2">
        <ActionForm action={generateMarketStrategy} businessProfileId={businessProfileId} pendingText="Generando estrategia…">
          🧠 Generar estrategia de marketing
        </ActionForm>
        <ActionForm action={runDailyDigest} businessProfileId={businessProfileId}>
          🌅 Generar “Ideas para mañana”
        </ActionForm>
        <ActionForm action={generateOpportunities} businessProfileId={businessProfileId}>
          🎯 Detectar oportunidades
        </ActionForm>
        <ActionForm action={generateSuggestedReplies} businessProfileId={businessProfileId}>
          💬 Generar respuestas sugeridas
        </ActionForm>
        <ActionForm action={generateCalendar} businessProfileId={businessProfileId}>
          🗓️ Generar calendario semanal
        </ActionForm>
        <ActionForm action={generateWeeklyReport} businessProfileId={businessProfileId}>
          📈 Generar reporte semanal
        </ActionForm>
        <ActionForm action={generateOffers} businessProfileId={businessProfileId}>
          🏷️ Sugerir ofertas
        </ActionForm>
        <ActionForm
          action={createContentFromVoice}
          businessProfileId={businessProfileId}
          pendingText="Transcribiendo…"
        >
          🎤 Probar modo voz (audio → campaña)
        </ActionForm>
        <form action={generateBudgetPlan} className="flex gap-2 pt-1">
          <input type="hidden" name="businessProfileId" value={businessProfileId} />
          <input
            name="monthlyBudget"
            type="number"
            defaultValue={300}
            min={0}
            className="w-24 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
          <SubmitButton className={btn} pendingText="Generando…">
            💰 Plan de pauta (USD/mes)
          </SubmitButton>
        </form>
      </div>
    </Card>
  );
}
