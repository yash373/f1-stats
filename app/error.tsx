"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-zinc-500">
        {error.message || "Upstream data may be unavailable. Try again."}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white"
      >
        Try again
      </button>
    </div>
  );
}
