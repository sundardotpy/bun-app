export default function Toast({ message }: { message: string | null }) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center transition-all duration-300 ${
        message ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      {message && (
        <div className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream shadow-lg">{message}</div>
      )}
    </div>
  );
}
