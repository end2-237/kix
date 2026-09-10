import { BottomNav } from "@/components/kix/BottomNav";

// Coquille de l'app : colonne mobile centrée, barre d'onglets flottante.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-x-hidden px-5 pt-4 pb-32">
      <div className="halo halo-green -top-35 -left-24 h-85 w-85" />
      <div className="halo halo-violet top-75 -right-32 h-80 w-80" />
      <div className="relative flex flex-col gap-3.5">{children}</div>
      <BottomNav />
    </div>
  );
}
