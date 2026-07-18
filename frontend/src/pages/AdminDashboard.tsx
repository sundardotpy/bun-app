import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import EndpointEditor, { EndpointDraft } from "../components/EndpointEditor";
import {
  adminLogout,
  adminMe,
  ApiEndpoint,
  createEndpoint,
  deleteEndpoint,
  listEndpoints,
  updateEndpoint,
} from "../lib/api";

function pairsToRecord(pairs: [string, string][]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [k, v] of pairs) {
    if (k.trim()) record[k.trim()] = v;
  }
  return record;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const me = await adminMe();
      if (!me.authenticated) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setChecking(false);
      await refresh();
    })();
  }, []);

  async function refresh() {
    const res = await listEndpoints();
    if (res.success) {
      setEndpoints(res.endpoints);
      if (!selectedId && res.endpoints.length > 0) {
        setSelectedId(res.endpoints[0].id);
      }
    }
  }

  async function handleLogout() {
    await adminLogout();
    navigate("/", { replace: true });
  }

  async function handleSave(draft: EndpointDraft) {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: draft.name,
        method: draft.method,
        urlTemplate: draft.urlTemplate,
        queryParams: pairsToRecord(draft.queryParams),
        headers: pairsToRecord(draft.headers),
      };
      const res = creatingNew ? await createEndpoint({ id: draft.id, ...payload, updatedAt: "" }) : await updateEndpoint(draft.id, payload);
      if (!res.success) {
        setError(res.message || "Failed to save.");
        return;
      }
      setCreatingNew(false);
      setSelectedId(draft.id);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!confirm(`Delete endpoint "${selectedId}"?`)) return;
    const res = await deleteEndpoint(selectedId);
    if (res.success) {
      setSelectedId(null);
      await refresh();
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-cream">
        <Header showSettings={false} />
      </div>
    );
  }

  const selected = endpoints.find((e) => e.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-cream">
      <Header showSettings={false} />
      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="badge mb-2">Admin</span>
            <h1 className="text-3xl font-black tracking-tight">API collection</h1>
          </div>
          <button onClick={handleLogout} className="btn-ghost">
            Log out
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          <aside className="card flex flex-col gap-1 p-3">
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => {
                  setCreatingNew(false);
                  setError("");
                  setSelectedId(ep.id);
                }}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  ep.id === selectedId && !creatingNew ? "bg-ink text-cream" : "hover:bg-ink/5"
                }`}
              >
                {ep.name}
              </button>
            ))}
            <button
              onClick={() => {
                setCreatingNew(true);
                setError("");
                setSelectedId(null);
              }}
              className={`mt-1 rounded-lg border border-dashed border-ink/20 px-3 py-2 text-left text-sm font-semibold text-accent-dark ${
                creatingNew ? "bg-accent-light" : "hover:bg-ink/5"
              }`}
            >
              + Add endpoint
            </button>
          </aside>

          <div>
            {creatingNew ? (
              <EndpointEditor endpoint={null} isNew saving={saving} error={error} onSave={handleSave} />
            ) : selected ? (
              <EndpointEditor
                key={selected.id}
                endpoint={selected}
                isNew={false}
                saving={saving}
                error={error}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ) : (
              <p className="text-sm text-ink/50">Select an endpoint or add a new one.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
