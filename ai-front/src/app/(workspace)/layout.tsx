import { PanelLeft } from "lucide-react";
import { AuthGate } from "@/components/auth/auth-gate";
import { Sidebar } from "@/components/layout/sidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Thin top rail present on every screen, holds the sidebar-collapse toggle */}
        <div className="flex h-11 shrink-0 items-center border-b border-ink-300 px-4">
          <button
            type="button"
            aria-label="Toggle sidebar"
            className="rounded p-1 text-ink-500 hover:bg-ink-100"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
    </AuthGate>
  );
}
