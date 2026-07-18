import { HistoryEntry } from "../lib/history";

interface Props {
  entry: HistoryEntry | null;
  onToast: (message: string) => void;
}

export default function ResultPanel({ entry, onToast }: Props) {
  if (!entry) return null;

  if (entry.status === "success") {
    return (
      <div className="card mt-4 flex flex-col items-start gap-3 border-accent-light bg-accent-light/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="badge mb-1">Ready</span>
          <p className="text-sm font-medium text-ink">{entry.message}</p>
        </div>
        {entry.downloadUrl && (
          <a href={entry.downloadUrl} onClick={() => onToast("Download started")} className="btn-accent">
            Download Excel
          </a>
        )}
      </div>
    );
  }

  if (entry.status === "account_deletion") {
    return (
      <div className="card mt-4 border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-800">Heads up</p>
        <p className="text-sm text-amber-900">{entry.message}</p>
      </div>
    );
  }

  return (
    <div className="card mt-4 border-red-200 bg-red-50 p-5">
      <p className="text-sm font-semibold text-red-800">Request failed</p>
      <p className="text-sm text-red-900">{entry.message}</p>
    </div>
  );
}
