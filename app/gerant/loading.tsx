export default function GerantLoading() {
  return (
    <div className="flex min-h-dvh flex-col gap-5 p-5 lg:p-7">
      <div className="skeleton h-12 w-64 rounded-none" />
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-none" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-96 rounded-panel" />
        <div className="skeleton h-96 rounded-panel" />
      </div>
    </div>
  );
}
