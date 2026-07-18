interface Props {
  label: string;
  pairs: [string, string][];
  onChange: (pairs: [string, string][]) => void;
  valueType?: "text" | "password";
}

export default function KeyValueEditor({ label, pairs, onChange, valueType = "text" }: Props) {
  function updatePair(index: number, key: string, value: string) {
    const next = [...pairs];
    next[index] = [key, value];
    onChange(next);
  }

  function removePair(index: number) {
    onChange(pairs.filter((_, i) => i !== index));
  }

  function addPair() {
    onChange([...pairs, ["", ""]]);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink/70">{label}</span>
        <button type="button" onClick={addPair} className="text-xs font-bold text-accent-dark hover:underline">
          + Add
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {pairs.length === 0 && <p className="text-xs text-ink/40">None configured.</p>}
        {pairs.map(([key, value], i) => (
          <div key={i} className="flex gap-2">
            <input
              placeholder="Key"
              value={key}
              onChange={(e) => updatePair(i, e.target.value, value)}
              className="w-1/3 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ink/40"
            />
            <input
              placeholder="Value"
              type={valueType}
              value={value}
              onChange={(e) => updatePair(i, key, e.target.value)}
              className="flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-ink/40"
            />
            <button
              type="button"
              onClick={() => removePair(i)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink/15 text-ink/50 hover:bg-ink/5"
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
