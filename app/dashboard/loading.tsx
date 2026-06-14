export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-64 rounded-lg bg-stone-200" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-stone-200 bg-white" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl border border-stone-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
