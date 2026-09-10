import { AppSidebar } from "@/components/kix/AppSidebar";
import { BottomNav } from "@/components/kix/BottomNav";
import { getBalance, getUnreadCount } from "@/lib/queries";
import { requireUser } from "@/lib/session";

/**
 * Coquille de l'app : colonne de téléphone avec barre d'onglets flottante en
 * mobile, navigation latérale et contenu large dès le format bureau.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [balance, unread] = await Promise.all([getBalance(user.id), getUnreadCount(user.id)]);

  return (
    <div className="relative flex min-h-dvh">
      <AppSidebar user={user} balance={balance} unread={unread} />

      <div className="relative mx-auto w-full max-w-[430px] overflow-x-hidden px-5 pt-4 pb-32 lg:mx-0 lg:max-w-none lg:overflow-visible lg:px-10 lg:pt-8 lg:pb-14">
        <div className="halo halo-green -top-35 -left-24 h-85 w-85 lg:hidden" />
        <div className="halo halo-violet top-75 -right-32 h-80 w-80 lg:hidden" />
        <div className="relative mx-auto flex flex-col gap-3.5 lg:max-w-320 lg:gap-6">{children}</div>
      </div>

      <BottomNav />
    </div>
  );
}
