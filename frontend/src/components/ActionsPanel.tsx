import { useEffect, useState } from "react";
import { ActionDescriptor, listActions } from "../lib/api";
import ActionCard from "./ActionCard";

export default function ActionsPanel({ onToast }: { onToast: (message: string) => void }) {
  const [actions, setActions] = useState<ActionDescriptor[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    listActions()
      .then((res) => setActions(res.actions))
      .catch(() => setError(true));
  }, []);

  if (error || actions.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-1 text-2xl font-black tracking-tight">Account actions</h2>
      <p className="mb-5 text-sm text-ink/60">Run a modification or reset. Destructive actions ask for confirmation.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} onToast={onToast} />
        ))}
      </div>
    </section>
  );
}
