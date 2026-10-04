"use client";

import { FormEvent, useState } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled || value.trim().length === 0) return;
    onSend(value);
    setValue("");
  };

  return (
    <form
      className="flex items-center gap-2 rounded-full border border-ink-300 bg-white px-4 py-2 shadow-sm"
      onSubmit={submit}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Спросите о письмах, встречах или файлах..."
        maxLength={4000}
        className="flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-500 outline-none"
      />
      <button
        type="submit"
        aria-label="Отправить"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white disabled:bg-ink-100 disabled:text-ink-500"
        disabled={disabled || value.trim().length === 0}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </form>
  );
}
