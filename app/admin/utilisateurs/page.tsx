import Image from "next/image";
import { PageHead, Pill, Table, Td } from "@/components/admin/AdminUI";
import { setUserRole } from "@/lib/actions";
import { getAllUsers, getAllVenues } from "@/lib/queries";
import { group } from "@/lib/format";

export const metadata = { title: "Utilisateurs" };

const roles = [
  { value: "client", label: "Client" },
  { value: "manager", label: "Gérant" },
  { value: "admin", label: "Admin" },
];

export default async function AdminUsers() {
  const [users, venues] = await Promise.all([getAllUsers(), getAllVenues()]);

  return (
    <>
      <PageHead title="Utilisateurs" subtitle="Clients, gérants et administrateurs. Le rôle ouvre les accès." />

      <Table head={["Compte", "Téléphone", "Rôle", "Salle", "Points", "Changer le rôle"]}>
        {users.map((user) => (
          <tr key={user.id}>
            <Td>
              <span className="flex items-center gap-3">
                {user.avatar ? (
                  <Image src={user.avatar} alt={user.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold">
                    {user.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="font-semibold">{user.name}</span>
              </span>
            </Td>
            <Td className="text-muted">+237 {user.phone}</Td>
            <Td>
              <Pill tone={user.role === "admin" ? "jade" : user.role === "manager" ? "gold" : "neutral"}>
                {roles.find((r) => r.value === user.role)?.label ?? user.role}
              </Pill>
            </Td>
            <Td className="text-muted">{venues.find((v) => v.id === user.venueId)?.name ?? "—"}</Td>
            <Td>{user.role === "client" ? group(user.points) : "—"}</Td>
            <Td>
              <form action={setUserRole} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={user.id} />
                <select
                  name="role"
                  defaultValue={user.role}
                  className="h-9 rounded-none border border-line bg-surface px-2 text-[12px] text-ink"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value} className="bg-bg text-ink">
                      {role.label}
                    </option>
                  ))}
                </select>
                <select
                  name="venueId"
                  defaultValue={user.venueId ?? ""}
                  className="h-9 rounded-none border border-line bg-surface px-2 text-[12px] text-ink"
                >
                  <option value="" className="bg-bg text-ink">
                    Sans salle
                  </option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id} className="bg-bg text-ink">
                      {venue.name}
                    </option>
                  ))}
                </select>
                <button className="rounded-full bg-gold px-3 py-2 text-[11px] font-semibold text-gold-ink">OK</button>
              </form>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
