import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Presentation,
  Star,
} from "lucide-react";
import { formatBytes, formatFullDate } from "@/lib/format";
import type { DriveFile } from "@/lib/types";
import { cn } from "@/lib/utils";

type IconInfo = { Icon: typeof File; className: string };

const iconFor = (mimeType: string): IconInfo => {
  if (mimeType === "application/pdf") return { Icon: FileType, className: "text-red-500" };
  if (mimeType.startsWith("image/")) return { Icon: FileImage, className: "text-purple-500" };
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return { Icon: FileSpreadsheet, className: "text-green-600" };
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return { Icon: Presentation, className: "text-orange-500" };
  if (mimeType.includes("document") || mimeType.includes("word") || mimeType.startsWith("text/"))
    return { Icon: FileText, className: "text-blue-500" };
  return { Icon: File, className: "text-ink-500" };
};

export function FileTable({ files }: { files: DriveFile[] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-ink-300 text-xs font-medium uppercase tracking-wide text-ink-500">
          <th className="px-6 py-2 font-medium">Название</th>
          <th className="px-6 py-2 font-medium">Владелец</th>
          <th className="px-6 py-2 font-medium">Изменён</th>
          <th className="px-6 py-2 font-medium">Размер</th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => {
          const { Icon, className } = iconFor(file.mimeType);
          const name = (
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4 shrink-0", className)} />
              <span className="font-medium text-ink-900">{file.name}</span>
              {file.isStarred && <Star className="h-3.5 w-3.5 fill-accent text-accent" />}
            </div>
          );

          return (
            <tr key={file.id} className="border-b border-ink-100 hover:bg-ink-100">
              <td className="px-6 py-3">
                {file.webViewLink ? (
                  <a href={file.webViewLink} target="_blank" rel="noreferrer" className="block">
                    {name}
                  </a>
                ) : (
                  name
                )}
              </td>
              <td className="px-6 py-3 text-ink-500">{file.ownerName}</td>
              <td className="px-6 py-3 text-ink-500">{formatFullDate(file.modifiedAt)}</td>
              <td className="px-6 py-3 text-ink-500">{formatBytes(file.sizeBytes)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
