import { Folder } from "lucide-react";
import type { DriveFolder } from "@/lib/types";

export function FolderCard({ folder }: { folder: DriveFolder }) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-card border border-ink-300 px-4 py-3 text-left hover:bg-ink-100"
    >
      <Folder className="h-5 w-5 fill-accent/20 text-accent" />
      <span className="text-sm font-medium text-ink-900">{folder.name}</span>
    </button>
  );
}
