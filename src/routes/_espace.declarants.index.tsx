import { createFileRoute, Link } from "@tanstack/react-router";
import { Avatar, Chip, PageHeader, TableWrap, Td, Th, Tr } from "@/components/app/bits";
import { Btn } from "@/components/app/dialogs";
import { TODAY, useDB } from "@/services/db";
import { downloadCSV } from "@/services/business";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_espace/declarants/")({
  head: () => ({
    meta: [
      { title: "Déclarants — GLOBITRANS" },
      {
        name: "description",
        content: "Gestion des déclarants GLOBITRANS, de leurs portefeuilles clients et de leurs dépôts quotidiens.",
      },
      { property: "og:title", content: "Déclarants — GLOBITRANS" },
      { property: "og:description", content: "Gestion des déclarants et de leurs portefeuilles clients." },
    ],
  }),
  component: DeclarantsPage,
});

function DeclarantsPage() {
  const db = useDB();

  const rows = db.declarants.map((d) => {
    const today = db.mainLevees.filter((m) => m.declarantId === d.id && m.releaseDate === TODAY);
    return {
      declarant: d,
      clients: db.clients.filter((c) => c.declarantId === d.id).length,
      today: today.length,
      toDeposit: today.filter((m) => !m.deposited).length,
      deposited: today.filter((m) => m.deposited).length,
      received: today.filter((m) => m.receivedByFinance).length,
    };
  });

  return (
    <>
      <PageHeader
        title="Déclarants"
        subtitle="Gestion des déclarants et de leurs portefeuilles clients."
        actions={
          <Btn
            variant="outline"
            onClick={() =>
              downloadCSV("globitrans-declarants.csv", [
                ["Déclarant", "Clients", "Dossiers du jour", "À déposer", "Déposés", "Reçus Finance"],
                ...rows.map((r) => [
                  `${r.declarant.firstName} ${r.declarant.lastName}`,
                  r.clients,
                  r.today,
                  r.toDeposit,
                  r.deposited,
                  r.received,
                ]),
              ])
            }
          >
            <Download className="size-4" /> Exporter
          </Btn>
        }
      />

      <div className="card-surface overflow-hidden">
        <TableWrap>
          <thead>
            <tr>
              <Th>Déclarant</Th>
              <Th>Clients attribués</Th>
              <Th>Dossiers aujourd'hui</Th>
              <Th>À déposer</Th>
              <Th>Déposés</Th>
              <Th>Reçus Finance</Th>
              <Th>Statut</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.declarant.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={r.declarant.avatar} />
                    <div>
                      <Link
                        to="/declarants/$declarantId"
                        params={{ declarantId: r.declarant.id }}
                        className="text-[13px] font-medium text-primary hover:underline"
                      >
                        {r.declarant.firstName} {r.declarant.lastName}
                      </Link>
                      <p className="text-[11.5px] text-muted-foreground">{r.declarant.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="mono">{r.clients}</Td>
                <Td className="mono">{r.today}</Td>
                <Td className="mono text-warning">{r.toDeposit}</Td>
                <Td className="mono">{r.deposited}</Td>
                <Td className="mono text-success">{r.received}</Td>
                <Td>{r.declarant.active ? <Chip tone="success">Actif</Chip> : <Chip tone="neutral">Inactif</Chip>}</Td>
                <Td className="text-right">
                  <Link to="/declarants/$declarantId" params={{ declarantId: r.declarant.id }}>
                    <Btn variant="outline" size="sm">
                      Consulter
                    </Btn>
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </>
  );
}
