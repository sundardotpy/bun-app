import { downloadHref, reportFilename } from "@/lib/api";
import { HistoryEntry } from "@/lib/history";

const STATUS_LABEL: Record<HistoryEntry["status"], string> = {
  success: "Success",
  error: "Failed",
  account_deletion: "Needs check",
};

const STATUS_CLASS: Record<HistoryEntry["status"], string> = {
  success: "bg-accent-light text-accent-dark",
  error: "bg-red-100 text-red-700",
  account_deletion: "bg-amber-100 text-amber-800",
};

const REPORT_LABEL: Record<HistoryEntry["reportType"], string> = {
  master: "Master Report",
  taxation: "Taxation Report",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  entries: HistoryEntry[];
  onToast: (message: string) => void;
}

export default function HistoryList({ entries, onToast }: Props) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/50">Recent requests</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-ink/40">No requests yet in this browser.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div key={entry.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {REPORT_LABEL[entry.reportType]} · User {entry.userId}
                </p>
                <p className="text-xs text-ink/50">{formatTime(entry.timestamp)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASS[entry.status]}`}>
                  {STATUS_LABEL[entry.status]}
                </span>
                {entry.status === "success" && entry.downloadUrl && (
                  <a
                    href={downloadHref(
                      entry.downloadUrl,
                      entry.filename ?? reportFilename(entry.reportType, entry.userId)
                    )}
                    download={entry.filename ?? reportFilename(entry.reportType, entry.userId)}
                    onClick={() => onToast("Download started")}
                    className="text-xs font-semibold text-accent-dark hover:underline"
                  >
                    Re-download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
