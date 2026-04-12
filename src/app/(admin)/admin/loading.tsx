export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-border rounded-lg" />
        <div className="h-4 w-72 bg-border rounded-lg mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5 h-28" />
        ))}
      </div>
      <div className="bg-card rounded-2xl border border-border p-6 h-64" />
    </div>
  );
}
