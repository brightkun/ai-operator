// Метрики из ТЗ для одного пользователя: North Star («действия, выполненные с помощью AI, за неделю»),
// принятие черновиков и подсказок, обязательства, открытия сводки, запросы с ответом, сэкономленное время.
// Всё считается из наших таблиц (tasks, usage_events) без модели; сравнение с предыдущими 7 днями.

import { pool } from "../plugins/pg";
import { addDaysToKey, localDateKey, safeTimeZone } from "../utils/time";
import { localDaysRange } from "./data.service";

const PERIOD_DAYS = 7;

// Оценка сэкономленного времени: минут на одно действие. Это допущение, а не измерение, и в интерфейсе так и подписано
export const MINUTES_SAVED = {
  emailSummary: 2, // не читать длинное письмо целиком
  draftAccepted: 5, // не писать ответ с нуля
  meetingPrep: 10, // не собирать контекст встречи по почте и файлам
  assistantAnswer: 3, // ответ на вопрос по почте, календарю или задачам
  taskFound: 1, // задача, которую AI нашёл в письме и человек не отклонил
} as const;

const ratio = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);

interface IPeriod {
  from: string;
  to: string;
  aiActions: number;
  aiTasksDone: number;
  draftsAccepted: number;
  draftsGenerated: number;
  draftAcceptanceRate: number | null;
  tasksSuggested: number;
  tasksKept: number;
  suggestionAcceptanceRate: number | null;
  commitmentsDetected: number;
  commitmentsCompleted: number;
  briefOpenDays: number;
  briefOpenRate: number;
  assistantAnswers: number;
  assistantAnswersWithSources: number;
  emailSummaries: number;
  meetingPreps: number;
  hoursSaved: number;
}

const computePeriod = async (userId: number, startKey: string, tz: string): Promise<IPeriod> => {
  const range = localDaysRange(startKey, PERIOD_DAYS, tz);

  const [tasks, events, briefDays] = await Promise.all([
    pool.query<{
      suggested: number;
      kept: number;
      ai_done: number;
      commitments_detected: number;
      commitments_completed: number;
    }>(
      `SELECT
         (count(*) FILTER (WHERE source = 'email' AND created_at >= $2 AND created_at < $3))::int AS suggested,
         (count(*) FILTER (WHERE source = 'email' AND status <> 'dismissed' AND created_at >= $2 AND created_at < $3))::int AS kept,
         (count(*) FILTER (WHERE source = 'email' AND status = 'done' AND updated_at >= $2 AND updated_at < $3))::int AS ai_done,
         (count(*) FILTER (WHERE kind = 'commitment' AND status <> 'dismissed' AND created_at >= $2 AND created_at < $3))::int AS commitments_detected,
         (count(*) FILTER (WHERE kind = 'commitment' AND status = 'done' AND updated_at >= $2 AND updated_at < $3))::int AS commitments_completed
       FROM tasks WHERE user_id = $1`,
      [userId, range.from, range.to],
    ),
    pool.query<{ type: string; n: number; with_sources: number }>(
      `SELECT type, count(*)::int AS n,
              (count(*) FILTER (WHERE coalesce((meta->>'sources')::int, 0) > 0))::int AS with_sources
       FROM usage_events
       WHERE user_id = $1 AND created_at >= $2 AND created_at < $3 GROUP BY type`,
      [userId, range.from, range.to],
    ),
    // «открыл сводку» считаем по дням: десять открытий за день — это один день
    pool.query<{ days: number }>(
      `SELECT count(DISTINCT to_char(created_at AT TIME ZONE $4::text, 'YYYY-MM-DD'))::int AS days
       FROM usage_events
       WHERE user_id = $1 AND type = 'brief_opened' AND created_at >= $2 AND created_at < $3`,
      [userId, range.from, range.to, tz],
    ),
  ]);

  const t = tasks.rows[0]!;
  const usage = new Map(events.rows.map((r) => [r.type, r]));
  const count = (type: string) => usage.get(type)?.n ?? 0;

  const draftsAccepted = count("draft_accepted");
  const draftsGenerated = count("email_draft");
  const emailSummaries = count("email_summary");
  const meetingPreps = count("meeting_prep");
  const assistantAnswers = count("assistant_query");
  const briefOpenDays = briefDays.rows[0]!.days;

  const minutes =
    emailSummaries * MINUTES_SAVED.emailSummary +
    draftsAccepted * MINUTES_SAVED.draftAccepted +
    meetingPreps * MINUTES_SAVED.meetingPrep +
    assistantAnswers * MINUTES_SAVED.assistantAnswer +
    t.kept * MINUTES_SAVED.taskFound;

  return {
    from: startKey,
    to: addDaysToKey(startKey, PERIOD_DAYS - 1),
    // North Star: задачи, найденные AI и закрытые человеком, + принятые черновики (так же считает недельный обзор)
    aiActions: t.ai_done + draftsAccepted,
    aiTasksDone: t.ai_done,
    draftsAccepted,
    draftsGenerated,
    draftAcceptanceRate: ratio(draftsAccepted, draftsGenerated),
    tasksSuggested: t.suggested,
    tasksKept: t.kept,
    suggestionAcceptanceRate: ratio(t.kept, t.suggested),
    commitmentsDetected: t.commitments_detected,
    commitmentsCompleted: t.commitments_completed,
    briefOpenDays,
    briefOpenRate: Math.round((briefOpenDays / PERIOD_DAYS) * 100),
    assistantAnswers,
    assistantAnswersWithSources: usage.get("assistant_query")?.with_sources ?? 0,
    emailSummaries,
    meetingPreps,
    hoursSaved: Math.round((minutes / 60) * 10) / 10,
  };
};

export const getMetricsService = async (userId: number, timeZone: string | undefined) => {
  const tz = safeTimeZone(timeZone);
  const today = localDateKey(new Date(), tz);
  const currentStart = addDaysToKey(today, -(PERIOD_DAYS - 1));
  const previousStart = addDaysToKey(currentStart, -PERIOD_DAYS);

  const [current, previous] = await Promise.all([
    computePeriod(userId, currentStart, tz),
    computePeriod(userId, previousStart, tz),
  ]);

  return { timeZone: tz, current, previous, minutesSaved: MINUTES_SAVED };
};
