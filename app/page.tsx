"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import ReportForm from "@/components/ReportForm";
import ResultPanel from "@/components/ResultPanel";
import HistoryList from "@/components/HistoryList";
import Toast from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import { getHistory, HistoryEntry } from "@/lib/history";

export default function Home() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastResult, setLastResult] = useState<HistoryEntry | null>(null);
  const { toastMessage, showToast } = useToast();

  // Read on mount rather than during render: localStorage does not exist while
  // the page is being server-rendered.
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function handleResult(entry: HistoryEntry) {
    setLastResult(entry);
    setHistory(getHistory());
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-12 sm:px-10">
        <span className="badge mb-4">Report Library</span>
        <h1 className="mb-2 text-4xl font-black tracking-tight">Download reports</h1>
        <p className="mb-8 text-sm text-ink/60">
          Enter a user ID and pull their Master or Taxation report as an Excel file.
        </p>
        <ReportForm onResult={handleResult} onToast={showToast} />
        <ResultPanel entry={lastResult} onToast={showToast} />
        <HistoryList entries={history} onToast={showToast} />
      </main>
      <Toast message={toastMessage} />
    </div>
  );
}
