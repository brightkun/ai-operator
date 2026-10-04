import { useMutation } from "@tanstack/react-query";
import { api } from "../api/api";

export interface EmailAssistResult {
  text: string;
  cached: boolean;
}

// Краткое содержание или черновик ответа для одного письма. Полный текст письма уходит в AI
// только в этот момент — по нажатию человека; автоматически письма в AI не отправляются.
export const useEmailAssist = () =>
  useMutation({
    mutationKey: ["email-assist"],
    mutationFn: async (input: {
      emailId: number;
      action: "summary" | "reply";
      instruction?: string;
      refresh?: boolean;
    }) => {
      const { emailId, ...body } = input;
      const response = await api.post<EmailAssistResult>(`/emails/${emailId}/assist`, {
        ...body,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      return response.data;
    },
  });

// Метрика «принятие черновика» (ТЗ): человек скопировал ответ или открыл его в Gmail. Сбой метрики не показываем.
export const reportDraftAccepted = (emailId: number, how: "copy" | "gmail") => {
  api.post("/events", { type: "draft_accepted", meta: { emailId, how } }).catch(() => {});
};
