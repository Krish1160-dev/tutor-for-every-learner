export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

export function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
      <span>⚠️ {message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="self-start rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function LoadingCard({ label }: { label: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <Spinner className="h-7 w-7 text-brand-600" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="text-xs text-slate-400">This usually takes a few seconds.</p>
    </div>
  );
}
