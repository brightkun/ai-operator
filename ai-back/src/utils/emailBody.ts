// Достаём читаемый текст из письма Gmail (MIME-структура) и отрезаем цитируемую переписку.
// Чистые функции: проверяются без сети.

import { gmail_v1 } from "googleapis";

type Part = gmail_v1.Schema$MessagePart;

const decodeBase64Url = (data: string) =>
  Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");

// Письма бывают не только в UTF-8 (windows-1251, koi8-r, iso-8859-1): без учёта кодировки кириллица превращается в «РїСЂРёРІРµС‚»
const decodePart = (part: Part) => {
  const bytes = decodeBase64Url(part.body?.data ?? "");
  const contentType = part.headers?.find((h) => h.name?.toLowerCase() === "content-type")?.value ?? "";
  const charset = /charset="?([\w-]+)"?/i.exec(contentType)?.[1] ?? "utf-8";

  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes);
  } catch {
    return bytes.toString("utf8"); // неизвестная кодировка
  }
};

const ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  laquo: "«",
  raquo: "»",
  mdash: "—",
  ndash: "–",
  hellip: "…",
};

export const htmlToText = (html: string) =>
  html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|table|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Предпочитаем text/plain; если его нет — берём HTML и чистим от тегов. Вложения (нет body.data) пропускаем.
export const extractEmailText = (payload: Part | undefined | null) => {
  const plains: string[] = [];
  const htmls: string[] = [];

  const walk = (part: Part | undefined | null) => {
    if (!part) return;

    if (part.parts?.length) {
      part.parts.forEach(walk);
      return;
    }

    if (!part.body?.data || part.filename) return;

    if (part.mimeType === "text/plain") plains.push(decodePart(part));
    else if (part.mimeType === "text/html") htmls.push(decodePart(part));
  };

  walk(payload);

  const text = plains.length ? plains.join("\n\n") : htmls.map(htmlToText).join("\n\n");
  return text.replace(/\r\n/g, "\n").trim();
};

// Начало цитируемого блока: «On … wrote:», «… написал(а):», пересылка, заголовок Outlook
const QUOTE_START = [
  /^On\s.{5,200}\swrote:\s*$/i,
  /^Am\s.{5,200}\sschrieb\s.*:\s*$/i,
  // \b в JS не понимает кириллицу, поэтому граница слова — пробел или запятая
  /^.{0,200}[\s,](написал|написала|пишет)(\(а\))?:\s*$/i,
  /^-{2,}\s*(Original Message|Forwarded message|Исходное сообщение|Пересылаемое сообщение)/i,
  /^_{8,}\s*$/,
];

const OUTLOOK_HEADER = /^(From|От):\s.+/i;
const OUTLOOK_FOLLOW = /^(Sent|Date|Отправлено|Дата):\s.+/i;

// Убираем историю переписки: ответу нужен только новый текст, а лишний хвост — это расход квоты модели и лишние данные
export const stripQuotedReply = (text: string) => {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  const cutAt = lines.findIndex((line, i) => {
    const trimmed = line.trim();
    if (QUOTE_START.some((re) => re.test(trimmed))) return true;
    if (OUTLOOK_HEADER.test(trimmed)) {
      return lines.slice(i + 1, i + 5).some((next) => OUTLOOK_FOLLOW.test(next.trim()));
    }
    return false;
  });

  const kept = (cutAt >= 0 ? lines.slice(0, cutAt) : lines)
    .filter((line) => !line.trimStart().startsWith(">"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // если после обрезки почти ничего не осталось (письмо целиком — пересылка), лучше оставить как было
  return kept.length >= 20 ? kept : text.trim();
};

export const MAX_BODY_CHARS = 6000;

export const prepareEmailBody = (payload: Part | undefined | null) => {
  const body = stripQuotedReply(extractEmailText(payload));
  return body.length > MAX_BODY_CHARS ? `${body.slice(0, MAX_BODY_CHARS)}\n[...текст обрезан]` : body;
};
