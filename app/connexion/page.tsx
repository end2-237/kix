import { AuthForm } from "@/components/mb/AuthForm";
import { AuthShell } from "@/components/mb/AuthShell";
import { DemoAccounts } from "@/components/mb/DemoAccounts";

export const metadata = { title: "Connexion" };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const { refus } = await searchParams;

  return (
    <AuthShell
      title="Content de te revoir."
      subtitle="Ton numéro et ton mot de passe : ton Pass, tes jetons et ton classement te suivent."
      footer={<DemoAccounts />}
    >
      <AuthForm mode="signin" refused={refus === "1"} />
    </AuthShell>
  );
}
