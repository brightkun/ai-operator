"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";

export function ChatInput() {
  const [value, setValue] = useState("");

  return (
    <form
      className="flex items-center gap-2 rounded-full border border-ink-300 bg-white px-4 py-2 shadow-sm"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Message AI Operator..."
        className="flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-500 outline-none"
      />
      <button
        type="submit"
        aria-label="Send message"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500 disabled:opacity-50"
        disabled={value.trim().length === 0}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </form>
  );
}
