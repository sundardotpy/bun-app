export interface HistoryEntry {
  id: string;
  reportType: "master" | "taxation";
  userId: string;
  status: "success" | "error" | "account_deletion";
  message: string;
  downloadUrl?: string;
  timestamp: string;
}

const STORAGE_KEY = "report-downloader:history";
const MAX_ENTRIES = 5;

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry[] {
  const next: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [next, ...getHistory()].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
