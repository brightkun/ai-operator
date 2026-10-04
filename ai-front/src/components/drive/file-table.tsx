import { FileText, FileSpreadsheet, FileType, Star } from "lucide-react";
import type { DriveFile } from "@/lib/types";
import { cn } from "@/lib/utils";

const kindIcon: Record<DriveFile["kind"], { Icon: typeof FileText; className: string }> = {
  pdf: { Icon: FileType, className: "text-red-500" },
  doc: { Icon: FileText, className: "text-blue-500" },
  sheet: { Icon: FileSpreadsheet, className: "text-green-600" },
};

export function FileTable({ files }: { files: DriveFile[] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-ink-300 text-xs font-medium uppercase tracking-wide text-ink-500">
          <th className="px-6 py-2 font-medium">Name</th>
          <th className="px-6 py-2 font-medium">Owner</th>
          <th className="px-6 py-2 font-medium">Last modified</th>
          <th className="px-6 py-2 font-medium">File size</th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => {
          const { Icon, className } = kindIcon[file.kind];
          return (
            <tr key={file.id} className="cursor-pointer border-b border-ink-100 hover:bg-ink-100">
              <td className="px-6 py-3">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", className)} />
                  <span className="font-medium text-ink-900">{file.name}</span>
                  {file.starred && <Star className="h-3.5 w-3.5 fill-accent text-accent" />}
                </div>
              </td>
              <td className="px-6 py-3 text-ink-500">{file.owner}</td>
              <td className="px-6 py-3 text-ink-500">{file.modified}</td>
              <td className="px-6 py-3 text-ink-500">{file.size}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
