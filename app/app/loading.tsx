/** Squelette affiché pendant que la page se prépare côté serveur. */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-3.5 lg:gap-6">
      <div className="skeleton h-11 w-48 rounded-full" />
      <div className="skeleton h-12 rounded-full lg:max-w-xl" />
      <div className="grid gap-3.5 lg:grid-cols-3 lg:gap-6">
        <div className="skeleton h-44 rounded-panel lg:col-span-2 lg:h-105" />
        <div className="skeleton h-24 rounded-card lg:h-105 lg:rounded-panel" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
        <div className="skeleton h-40 rounded-card lg:h-64" />
        <div className="skeleton h-40 rounded-card lg:h-64" />
        <div className="skeleton hidden h-64 rounded-card lg:block" />
      </div>
    </div>
  );
}
