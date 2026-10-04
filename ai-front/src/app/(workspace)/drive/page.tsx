import { Search, Upload, Plus } from "lucide-react";
import { driveFiles, driveFolders } from "@/lib/mock-data";
import { FolderCard } from "@/components/drive/folder-card";
import { FileTable } from "@/components/drive/file-table";
import { Button } from "@/components/ui/button";

export default function DrivePage() {
  return (
    <div>
      <div className="flex items-center gap-3 border-b border-ink-300 px-6 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-ink-300 px-3 py-2">
          <Search className="h-4 w-4 text-ink-500" />
          <input
            placeholder="Search in Drive..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
          />
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-ink-900">My Drive</h1>
          <Button variant="secondary" className="gap-2">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-500">Folders</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {driveFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>

        <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-500">Files</h2>
      </div>

      <FileTable files={driveFiles} />
    </div>
  );
}
