"use client";

import { useMetrics } from "@/hooks/metrics/useMetrics";
import { plural } from "@/lib/tasks";
import type { Metrics } from "@/lib/types";

const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });
const keyToDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

const percent = (value: number | null) => (value === null ? "—" : `${value}%`);

const compare = (current: number, previous: number) => {
  const diff = current - previous;
  if (diff === 0) return `столько же, сколько неделей раньше (${previous})`;
  const word = plural(Math.abs(diff), ["действие", "действия", "действий"]);
  return diff > 0
    ? `на ${diff} ${word} больше, чем неделей раньше (${previous})`
    : `на ${-diff} ${word} меньше, чем неделей раньше (${previous})`;
};

export function StatsContent() {
  const metricsQuery = useMetrics();
  const metrics = metricsQuery.data;

  if (metricsQuery.isLoading) {
    return <p className="px-6 py-8 text-sm text-ink-500">Загрузка...</p>;
  }

  if (metricsQuery.isError || !metrics) {
    return (
      <div className="px-6 py-8 text-sm">
        <p className="text-red-600">Не удалось загрузить метрики.</p>
        <button type="button" onClick={() => metricsQuery.refetch()} className="mt-1 underline">
          Повторить
        </button>
      </div>
    );
  }

  const { current: c, previous: p } = metrics;
  const hasAnything =
    c.aiActions + c.draftsGenerated + c.emailSummaries + c.meetingPreps + c.assistantAnswers + c.tasksSuggested > 0;

  const cards: { label: string; value: string; hint: string }[] = [
    {
      label: "Сэкономлено времени",
      value: `≈ ${c.hoursSaved} ч`,
      hint: "оценка, не измерение — допущения ниже",
    },
    {
      label: "Принято черновиков",
      value: percent(c.draftAcceptanceRate),
      hint: c.draftsGenerated ? `${c.draftsAccepted} из ${c.draftsGenerated} составленных` : "черновики пока не составлялись",
    },
    {
      label: "Принято подсказок AI",
      value: percent(c.suggestionAcceptanceRate),
      hint: c.tasksSuggested ? `${c.tasksKept} из ${c.tasksSuggested} задач из писем оставлены (не отклонены)` : "AI пока не находил задач в письмах",
    },
    {
      label: "Обязательства",
      value: `${c.commitmentsCompleted} / ${c.commitmentsDetected}`,
      hint: "выполнено / найдено за неделю",
    },
    {
      label: "Сводка дня",
      value: `${c.briefOpenDays} из 7`,
      hint: `дней с открытой сводкой (${c.briefOpenRate}%)`,
    },
    {
      label: "Ответы ассистента",
      value: String(c.assistantAnswers),
      hint: c.assistantAnswers ? `из них с источниками: ${c.assistantAnswersWithSources}` : "вопросов в чате не было",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 pb-12 pt-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Эффективность</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-900">
          {dayMonth.format(keyToDate(c.from))} — {dayMonth.format(keyToDate(c.to))}
        </h1>
        <p className="mt-1 text-sm text-ink-500">Сколько работы за неделю сделано вместе с AI. Считается по вашим действиям в приложении.</p>
      </header>

      <section className="rounded-card bg-ink-900 p-6 text-white">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-300">Главная метрика</p>
        <p className="mt-2 text-5xl font-semibold">{c.aiActions}</p>
        <p className="mt-1 text-sm">
          {plural(c.aiActions, ["действие", "действия", "действий"])} выполнено с помощью AI
        </p>
        <p className="mt-3 text-xs text-ink-300">
          {compare(c.aiActions, p.aiActions)}. Это задачи, которые AI нашёл в письмах и вы закрыли ({c.aiTasksDone}), плюс принятые черновики
          ответов ({c.draftsAccepted}).
        </p>
      </section>

      {!hasAnything && (
        <p className="rounded-lg border border-dashed border-ink-300 px-4 py-3 text-sm text-ink-500">
          Пока цифр нет: они появятся, когда вы начнёте пользоваться помощью AI — пересказами писем, черновиками, подготовкой к встречам.
        </p>
      )}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-ink-300 px-4 py-3">
            <p className="text-2xl font-semibold text-ink-900">{card.value}</p>
            <p className="text-xs font-medium text-ink-700">{card.label}</p>
            <p className="mt-0.5 text-[11px] text-ink-500">{card.hint}</p>
          </div>
        ))}
      </section>

      <Assumptions metrics={metrics} />
    </div>
  );
}

function Assumptions({ metrics }: { metrics: Metrics }) {
  const { minutesSaved: m, current: c } = metrics;

  return (
    <section className="rounded-lg bg-ink-50 px-4 py-3 text-xs text-ink-500">
      <p className="font-medium text-ink-700">Как оценивается сэкономленное время</p>
      <p className="mt-1">
        {m.emailSummary} мин — пересказ письма ({c.emailSummaries}), {m.draftAccepted} мин — принятый черновик ({c.draftsAccepted}),{" "}
        {m.meetingPrep} мин — подготовка к встрече ({c.meetingPreps}), {m.assistantAnswer} мин — ответ ассистента ({c.assistantAnswers}),{" "}
        {m.taskFound} мин — задача, найденная в письме ({c.tasksKept}). Это грубая прикидка, а не замер.
      </p>
      <p className="mt-2">
        Метрики по всей команде (активные пользователи за неделю, точность источников) появятся вместе с рабочими пространствами.
      </p>
    </section>
  );
}
