// Права, которые мы просим у пользователя при подключении Google.
// Все только на чтение. Если добавляете новый scope — существующим пользователям
// придётся переподключить Google (статус интеграции покажет, каких прав не хватает).

export const SCOPE_GMAIL = "https://www.googleapis.com/auth/gmail.readonly";
export const SCOPE_CALENDAR = "https://www.googleapis.com/auth/calendar.readonly";
export const SCOPE_DRIVE = "https://www.googleapis.com/auth/drive.readonly";
export const SCOPE_EMAIL = "https://www.googleapis.com/auth/userinfo.email";

export const GOOGLE_SCOPES = [
  SCOPE_GMAIL,
  SCOPE_CALENDAR,
  SCOPE_DRIVE,
  SCOPE_EMAIL,
];

export type GoogleResource = "gmail" | "calendar" | "drive";

const RESOURCE_SCOPE: Record<GoogleResource, string> = {
  gmail: SCOPE_GMAIL,
  calendar: SCOPE_CALENDAR,
  drive: SCOPE_DRIVE,
};

// scope в БД хранится строкой через пробел, как её отдаёт Google
export const hasScope = (granted: string | null, resource: GoogleResource) =>
  (granted ?? "").split(" ").includes(RESOURCE_SCOPE[resource]);
