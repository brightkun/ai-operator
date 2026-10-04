"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Mail,
  Calendar,
  HardDrive,
  FileText,
  LogOut,
  Plug,
  BarChart3,
  CalendarCheck,
  ListChecks,
  Sunrise,
} from "lucide-react";
import { LiaJira } from "react-icons/lia";
import { useLogout } from "@/hooks/auth/useLogout";
import { navItems } from "@/lib/nav-items";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const icons = {
  gmail: Mail,
  calendar: Calendar,
  drive: HardDrive,
  notes: FileText,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const isOperatorActive = pathname === "/";

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-ink-300 bg-white">
      {/* App identity */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 text-xs font-semibold text-white">
          AI
        </div>
        <span className="text-sm font-semibold text-ink-900">
          AI Operator 2.0
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {/* Primary entry point gets its own emphasized row, like the mock */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isOperatorActive
              ? "bg-ink-900 text-white"
              : "text-ink-700 hover:bg-ink-100",
          )}
        >
          <Sparkles
            className={cn(
              "h-4 w-4",
              isOperatorActive ? "text-accent" : "text-ink-500",
            )}
          />
          AI Operator
        </Link>

        {/* Что делает AI с вашими данными: сводка дня и задачи из писем */}
        {[
          { href: "/brief", label: "Сводка дня", Icon: Sunrise },
          { href: "/tasks", label: "Задачи", Icon: ListChecks },
          { href: "/review", label: "Недельный обзор", Icon: CalendarCheck },
          { href: "/stats", label: "Эффективность", Icon: BarChart3 },
        ].map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-ink-100 text-ink-900"
                : "text-ink-500 hover:bg-ink-100 hover:text-ink-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <div className="my-2 border-t border-ink-300" />

        {navItems
          .filter((item) => item.key !== "jira")
          .map((item) => {
            const Icon = icons[item.key as keyof typeof icons];
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-ink-100 text-ink-900"
                    : "text-ink-500 hover:bg-ink-100 hover:text-ink-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

        {/* Third-party integrations get their brand mark instead of a lucide icon */}
        <Link
          href="/jira"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/jira")
              ? "bg-ink-100 text-ink-900"
              : "text-ink-500 hover:bg-ink-100 hover:text-ink-900",
          )}
        >
          <LiaJira className="h-4 w-4" />
          Jira
        </Link>

        <div className="my-2 border-t border-ink-300" />

        <Link
          href="/integrations"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/integrations")
              ? "bg-ink-100 text-ink-900"
              : "text-ink-500 hover:bg-ink-100 hover:text-ink-900",
          )}
        >
          <Plug className="h-4 w-4" />
          Интеграции
        </Link>
      </nav>

      <UserFooter />
    </aside>
  );
}

function UserFooter() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  return (
    <div className="flex items-center gap-2 border-t border-ink-300 px-4 py-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-rose-200 to-emerald-200" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900">
          {user?.name}
        </p>
        <p className="truncate text-xs text-ink-500">{user?.email}</p>
      </div>
      <button
        type="button"
        aria-label="Выйти"
        title="Выйти"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="shrink-0 rounded p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
