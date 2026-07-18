import { useState } from "react";
import { generateReport, ReportType } from "../lib/api";
import { addHistoryEntry, HistoryEntry } from "../lib/history";

interface Props {
  onResult: (entry: HistoryEntry) => void;
  onToast: (message: string) => void;
}

type Loading = ReportType | null;

export default function ReportForm({ onResult, onToast }: Props) {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState<Loading>(null);

  async function handleDownload(reportType: ReportType) {
    const trimmed = userId.trim();
    if (!trimmed) return;
    setLoading(reportType);
    onToast("Fetching report…");
    try {
      const res = await generateReport(reportType, trimmed);
      const entry = addHistoryEntry({
        reportType,
        userId: trimmed,
        status: res.success ? "success" : res.accountDeletionSuspected ? "account_deletion" : "error",
        message: res.message,
        downloadUrl: res.downloadUrl,
      });
      onResult(entry[0]);
      if (res.success && res.downloadUrl) {
        onToast("Download started");
        window.location.href = res.downloadUrl;
      } else {
        onToast(res.message);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <label htmlFor="userId" className="mb-2 block text-sm font-semibold text-ink/70">
        User ID
      </label>
      <input
        id="userId"
        type="text"
        inputMode="numeric"
        placeholder="e.g. 941458"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="mb-6 w-full rounded-full border border-ink/15 bg-white px-5 py-3 text-base outline-none focus:border-ink/40"
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!userId.trim() || loading !== null}
          onClick={() => handleDownload("master")}
          className="btn-primary flex-1"
        >
          {loading === "master" ? "Generating…" : "Download Master Report"}
        </button>
        <button
          type="button"
          disabled={!userId.trim() || loading !== null}
          onClick={() => handleDownload("taxation")}
          className="btn-primary flex-1"
        >
          {loading === "taxation" ? "Generating…" : "Download Taxation Report"}
        </button>
      </div>
    </div>
  );
}
