import { Folder } from "lucide-react";
import type { DriveFile } from "@/lib/types";

// Папки открываются в самом Google Drive
export function FolderCard({ folder }: { folder: DriveFile }) {
  return (
    <a
      href={folder.webViewLink ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-card border border-ink-300 px-4 py-3 text-left hover:bg-ink-100"
    >
      <Folder className="h-5 w-5 shrink-0 fill-accent/20 text-accent" />
      <span className="truncate text-sm font-medium text-ink-900">{folder.name}</span>
    </a>
  );
}
