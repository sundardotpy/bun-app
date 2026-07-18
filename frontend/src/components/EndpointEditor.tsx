import { useEffect, useState } from "react";
import KeyValueEditor from "./KeyValueEditor";
import { ApiEndpoint } from "../lib/api";

export interface EndpointDraft {
  id: string;
  name: string;
  method: string;
  urlTemplate: string;
  queryParams: [string, string][];
  headers: [string, string][];
}

function toDraft(endpoint: ApiEndpoint | null): EndpointDraft {
  if (!endpoint) {
    return { id: "", name: "", method: "GET", urlTemplate: "", queryParams: [], headers: [] };
  }
  return {
    id: endpoint.id,
    name: endpoint.name,
    method: endpoint.method,
    urlTemplate: endpoint.urlTemplate,
    queryParams: Object.entries(endpoint.queryParams),
    headers: Object.entries(endpoint.headers),
  };
}

interface Props {
  endpoint: ApiEndpoint | null;
  isNew: boolean;
  saving: boolean;
  error: string;
  onSave: (draft: EndpointDraft) => void;
  onDelete?: () => void;
}

export default function EndpointEditor({ endpoint, isNew, saving, error, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<EndpointDraft>(() => toDraft(endpoint));

  useEffect(() => {
    setDraft(toDraft(endpoint));
  }, [endpoint?.id, isNew]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      className="card flex flex-col gap-5 p-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink/70">Endpoint ID</label>
          <input
            value={draft.id}
            disabled={!isNew}
            onChange={(e) => setDraft({ ...draft, id: e.target.value })}
            placeholder="e.g. master-report"
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ink/40 disabled:bg-ink/5"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink/70">Name</label>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ink/40"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink/70">Method</label>
        <select
          value={draft.method}
          onChange={(e) => setDraft({ ...draft, method: e.target.value })}
          className="w-32 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ink/40"
        >
          {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink/70">URL template</label>
        <input
          value={draft.urlTemplate}
          onChange={(e) => setDraft({ ...draft, urlTemplate: e.target.value })}
          placeholder="https://api.example.com/users/{{userId}}/report"
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-ink/40"
        />
        <p className="mt-1 text-xs text-ink/40">Use {"{{userId}}"} where the dynamic user ID should be inserted.</p>
      </div>

      <KeyValueEditor
        label="Query params"
        pairs={draft.queryParams}
        onChange={(pairs) => setDraft({ ...draft, queryParams: pairs })}
      />
      <KeyValueEditor label="Headers" pairs={draft.headers} onChange={(pairs) => setDraft({ ...draft, headers: pairs })} />

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button type="submit" disabled={saving || !draft.id || !draft.name || !draft.urlTemplate} className="btn-primary">
          {saving ? "Saving…" : isNew ? "Create endpoint" : "Save changes"}
        </button>
        {!isNew && onDelete && (
          <button type="button" onClick={onDelete} className="btn-ghost text-red-600">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
