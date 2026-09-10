export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-12 w-72 rounded-none" />
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-none" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-none" />
    </div>
  );
}
