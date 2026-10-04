"use client";

import { useDeferredValue, useState } from "react";
import { Search } from "lucide-react";
import { FileTable } from "@/components/drive/file-table";
import { FolderCard } from "@/components/drive/folder-card";
import { GoogleGate } from "@/components/integrations/google-gate";
import { useDriveFiles } from "@/hooks/data/useData";

export default function DrivePage() {
  return (
    <GoogleGate resource="drive">
      <DriveContent />
    </GoogleGate>
  );
}

function DriveContent() {
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.trim());
  const drive = useDriveFiles(search);

  const folders = drive.data?.filter((file) => file.isFolder) ?? [];
  const files = drive.data?.filter((file) => !file.isFolder) ?? [];

  return (
    <div>
      <div className="border-b border-ink-300 px-6 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-ink-300 px-3 py-2">
          <Search className="h-4 w-4 text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по Drive..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
          />
        </div>
      </div>

      <div className="px-6 py-4">
        <h1 className="text-lg font-semibold text-ink-900">Мой диск</h1>
        <p className="text-sm text-ink-500">Недавно изменённые файлы</p>

        {drive.isLoading && <p className="mt-4 text-sm text-ink-500">Загрузка...</p>}
        {drive.isError && (
          <p className="mt-4 text-sm text-red-600">Не удалось загрузить файлы.</p>
        )}
        {drive.data && drive.data.length === 0 && (
          <p className="mt-4 text-sm text-ink-500">
            {search ? "Ничего не найдено." : "Файлов пока нет. Нажмите «Синхронизировать»."}
          </p>
        )}

        {folders.length > 0 && (
          <>
            <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-500">Папки</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {folders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} />
              ))}
            </div>
          </>
        )}

        {files.length > 0 && (
          <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-500">Файлы</h2>
        )}
      </div>

      {files.length > 0 && <FileTable files={files} />}
    </div>
  );
}
