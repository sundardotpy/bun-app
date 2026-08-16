import { useState } from "react";
import { ActionDescriptor, ActionResult, executeAction } from "../lib/api";

interface Props {
  action: ActionDescriptor;
  onToast: (message: string) => void;
}

function initialValues(action: ActionDescriptor): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of action.fields) values[field.name] = field.default ?? "";
  return values;
}

export default function ActionCard({ action, onToast }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(action));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const allFilled = action.fields.every((f) => values[f.name]?.trim());

  async function handleRun() {
    if (!allFilled || loading) return;
    if (action.danger && !window.confirm(`Run "${action.name}"? This cannot be undone.`)) return;

    setLoading(true);
    setResult(null);
    onToast(`Running ${action.name}…`);
    try {
      const res = await executeAction(action.id, values);
      setResult(res);
      onToast(res.success ? `${action.name}: ${res.message}` : res.message);
    } catch {
      const res = { success: false, message: "Request failed. Please try again." };
      setResult(res);
      onToast(res.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{action.name}</h3>
        {action.danger && (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
            Destructive
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {action.fields.map((field) => (
          <div key={field.name}>
            <label className="mb-1 block text-xs font-semibold text-ink/60">{field.label}</label>
            <input
              type={field.type === "number" ? "number" : "text"}
              inputMode={field.type === "number" ? "numeric" : "text"}
              placeholder={field.placeholder}
              value={values[field.name]}
              onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ink/40"
            />
          </div>
        ))}
      </div>

      {result && (
        <p className={`text-xs font-medium ${result.success ? "text-accent-dark" : "text-red-600"}`}>
          {result.success ? "✓ " : "✕ "}
          {result.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleRun}
        disabled={!allFilled || loading}
        className={`btn-pill ${action.danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-ink text-cream hover:bg-black"}`}
      >
        {loading ? "Working…" : action.name}
      </button>
    </div>
  );
}
