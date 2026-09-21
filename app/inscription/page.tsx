import { AuthForm } from "@/components/mb/AuthForm";
import { AuthShell } from "@/components/mb/AuthShell";

export const metadata = { title: "Créer un compte" };

export default function InscriptionPage() {
  return (
    <AuthShell
      title="Ouvre ton Pass."
      subtitle="Trente secondes, un numéro Mobile Money, et la première partie se lance au QR."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
