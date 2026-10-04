import { Fragment, ReactNode } from "react";
import type { ChatSource } from "@/store/chat-store";

// Минимальная разметка ответа ассистента: абзацы, списки «- »/«1. », **жирный** и сноски [E12].
// Без dangerouslySetInnerHTML: весь текст выводится как текст, React его экранирует.

const INLINE = /(\*\*[^*\n]+\*\*|\[[ECF]\d+\])/g;
const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

function Inline({ text, sources }: { text: string; sources: ChatSource[] }) {
  const parts = text.split(INLINE);

  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }

        const ref = part.match(/^\[([ECF]\d+)\]$/)?.[1];
        if (ref) {
          const index = sources.findIndex((s) => s.ref === ref);
          if (index === -1) return null;
          const source = sources[index]!;
          return (
            <a
              key={i}
              href={source.url ?? undefined}
              target="_blank"
              rel="noreferrer"
              title={source.title}
              className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-ink-100 px-1 align-[0.15em] text-[10px] font-semibold text-ink-700 hover:bg-ink-300"
            >
              {index + 1}
            </a>
          );
        }

        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul" | "ol"; items: string[] };

const toBlocks = (content: string): Block[] => {
  const blocks: Block[] = [];

  for (const rawLine of content.split("\n")) {
    // заголовки модель всё равно иногда ставит — показываем их обычным жирным абзацем
    const line = rawLine.replace(/^\s*#{1,6}\s+(.*)$/, "**$1**");
    const last = blocks[blocks.length - 1];
    const bullet = line.match(BULLET);
    const numbered = line.match(NUMBERED);

    if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      const item = (bullet ?? numbered)![1] ?? "";
      if (last && last.kind === kind) last.items.push(item);
      else blocks.push({ kind, items: [item] });
    } else if (line.trim() === "") {
      blocks.push({ kind: "p", lines: [] }); // разрыв абзаца
    } else if (last && last.kind === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "p", lines: [line] });
    }
  }

  return blocks.filter((b) => (b.kind === "p" ? b.lines.length > 0 : b.items.length > 0));
};

export function MessageText({ content, sources = [] }: { content: string; sources?: ChatSource[] }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-ink-900">
      {toBlocks(content).map((block, i) => {
        if (block.kind === "p") {
          return (
            <p key={i}>
              {block.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  <Inline text={line} sources={sources} />
                </Fragment>
              ))}
            </p>
          );
        }

        const List = block.kind === "ul" ? "ul" : "ol";
        return (
          <List key={i} className={block.kind === "ul" ? "list-disc space-y-1 pl-5" : "list-decimal space-y-1 pl-5"}>
            {block.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} sources={sources} />
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

export function renderPlain(content: string): ReactNode {
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>;
}
