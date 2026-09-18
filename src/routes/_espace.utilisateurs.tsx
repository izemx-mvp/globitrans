import { createFileRoute } from "@tanstack/react-router";
import { Avatar, Chip, Mono, PageHeader, TableWrap, Td, Th, Tr } from "@/components/app/bits";
import { useDB } from "@/services/db";
import { ROLE_LABELS, formatDateTime } from "@/services/business";

export const Route = createFileRoute("/_espace/utilisateurs")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — GLOBITRANS" },
      {
        name: "description",
        content: "Comptes utilisateurs du bureau d'ordre digital : rôles, permissions et dernière connexion.",
      },
      { property: "og:title", content: "Utilisateurs — GLOBITRANS" },
      { property: "og:description", content: "Comptes, rôles et permissions du bureau d'ordre digital." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const db = useDB();

  return (
    <>
      <PageHeader title="Utilisateurs" subtitle="Comptes, rôles et permissions de la plateforme." />

      <div className="card-surface overflow-hidden">
        <TableWrap>
          <thead>
            <tr>
              <Th>Utilisateur</Th>
              <Th>Email</Th>
              <Th>Rôle</Th>
              <Th>Déclarant lié</Th>
              <Th>Dernière connexion</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {db.users.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={u.avatar} />
                    <span className="text-[13px] font-medium">
                      {u.firstName} {u.lastName}
                    </span>
                  </div>
                </Td>
                <Td>
                  <Mono className="text-[12.5px]">{u.email}</Mono>
                </Td>
                <Td>
                  <Chip tone={u.role === "ADMIN" ? "blue" : u.role === "FINANCE" ? "success" : "neutral"}>
                    {ROLE_LABELS[u.role]}
                  </Chip>
                </Td>
                <Td className="text-[13px]">
                  {db.declarants.find((d) => d.id === u.declarantId)
                    ? `${db.declarants.find((d) => d.id === u.declarantId)!.firstName} ${db.declarants.find((d) => d.id === u.declarantId)!.lastName}`
                    : "—"}
                </Td>
                <Td className="mono text-[12px] text-muted-foreground">{formatDateTime(u.lastLogin)}</Td>
                <Td>{u.active ? <Chip tone="success">Actif</Chip> : <Chip tone="neutral">Inactif</Chip>}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </>
  );
}
