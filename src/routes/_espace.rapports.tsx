import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Kpi, Mono, PageHeader, Surface, TableWrap, Td, Th, Tr } from "@/components/app/bits";
import { Btn, inputClass } from "@/components/app/dialogs";
import { TODAY, useDB } from "@/services/db";
import { useSession } from "@/services/auth";
import { downloadCSV, exportMainLevees, formatDate } from "@/services/business";

export const Route = createFileRoute("/_espace/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports & Exports — GLOBITRANS" },
      {
        name: "description",
        content: "Statistiques d'activité des mains levées, répartition par client, déclarant et régime, et exports CSV.",
      },
      { property: "og:title", content: "Rapports & Exports — GLOBITRANS" },
      { property: "og:description", content: "Statistiques d'activité et exports du registre des mains levées." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const db = useDB();
  const session = useSession();
  const [from, setFrom] = useState(TODAY.slice(0, 8) + "01");
  const [to, setTo] = useState(TODAY);

  const list = useMemo(
    () =>
      db.mainLevees.filter((m) => {
        if (m.releaseDate < from || m.releaseDate > to) return false;
        if (session?.role === "DECLARANT" && m.declarantId !== session.declarantId) return false;
        return true;
      }),
    [db.mainLevees, from, to, session],
  );

  const byDeclarant = db.declarants.map((d) => ({
    label: `${d.firstName} ${d.lastName}`,
    total: list.filter((m) => m.declarantId === d.id).length,
    deposited: list.filter((m) => m.declarantId === d.id && m.deposited).length,
    received: list.filter((m) => m.declarantId === d.id && m.receivedByFinance).length,
  }));

  const byClient = db.clients
    .map((c) => ({ label: c.companyName, total: list.filter((m) => m.clientId === c.id).length }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const byRegime = Object.entries(
    list.reduce<Record<string, number>>((acc, m) => {
      acc[m.regimeCode] = (acc[m.regimeCode] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <>
      <PageHeader
        title="Rapports & Exports"
        subtitle="Analyse de l'activité du bureau d'ordre et extraction des registres."
        actions={
          <>
            <Btn variant="outline" onClick={() => window.print()}>
              Imprimer
            </Btn>
            <Btn onClick={() => exportMainLevees(db, list, `globitrans-registre-${from}_${to}.csv`)}>
              <Download className="size-4" /> Exporter le registre
            </Btn>
          </>
        }
      />

      <div className="card-surface mb-4 flex flex-wrap items-end gap-3 px-4 py-3">
        <label className="text-[12px] text-muted-foreground">
          Du
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputClass} mt-1 block`} />
        </label>
        <label className="text-[12px] text-muted-foreground">
          Au
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${inputClass} mt-1 block`} />
        </label>
        <span className="ml-auto text-[12.5px] text-muted-foreground">
          {list.length} dossiers sur la période — du {formatDate(from)} au {formatDate(to)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Mains levées reçues" value={list.length} hint="Période sélectionnée" tone="primary" />
        <Kpi label="Déposées" value={list.filter((m) => m.deposited).length} hint="Transmises à la Finance" />
        <Kpi label="Reçues Finance" value={list.filter((m) => m.receivedByFinance).length} hint="Accusé de réception" tone="success" />
        <Kpi label="Anomalies" value={list.filter((m) => m.anomaly).length} hint="À traiter" tone="warning" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Surface title="Volume par déclarant" bodyClassName="p-0">
          <TableWrap>
            <thead>
              <tr>
                <Th>Déclarant</Th>
                <Th>Total</Th>
                <Th>Déposés</Th>
                <Th>Reçus</Th>
              </tr>
            </thead>
            <tbody>
              {byDeclarant.map((r) => (
                <Tr key={r.label}>
                  <Td className="text-[13px]">{r.label}</Td>
                  <Td className="mono">{r.total}</Td>
                  <Td className="mono">{r.deposited}</Td>
                  <Td className="mono text-success">{r.received}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Surface>

        <Surface title="Top 10 clients" bodyClassName="p-0">
          <TableWrap>
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Dossiers</Th>
              </tr>
            </thead>
            <tbody>
              {byClient.map((r) => (
                <Tr key={r.label}>
                  <Td className="text-[13px]">{r.label}</Td>
                  <Td className="mono">{r.total}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Surface>

        <Surface title="Répartition par code régime" bodyClassName="p-0">
          <TableWrap>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Dossiers</Th>
                <Th>Part</Th>
              </tr>
            </thead>
            <tbody>
              {byRegime.map(([code, count]) => (
                <Tr key={code}>
                  <Td>
                    <Mono>{code}</Mono>
                  </Td>
                  <Td className="mono">{count}</Td>
                  <Td className="mono text-[12.5px]">{Math.round((count / Math.max(list.length, 1)) * 100)} %</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Surface>

        <Surface title="Exports disponibles" description="Formats CSV compatibles Excel.">
          <div className="space-y-2">
            <Btn variant="outline" className="w-full justify-start" onClick={() => exportMainLevees(db, list)}>
              Registre complet des mains levées
            </Btn>
            <Btn
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                downloadCSV("globitrans-synthese-declarants.csv", [
                  ["Déclarant", "Total", "Déposés", "Reçus Finance"],
                  ...byDeclarant.map((r) => [r.label, r.total, r.deposited, r.received]),
                ])
              }
            >
              Synthèse par déclarant
            </Btn>
            <Btn
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                downloadCSV("globitrans-anomalies.csv", [
                  ["Référence", "Date", "Anomalie", "Message"],
                  ...list
                    .filter((m) => m.anomaly)
                    .map((m) => [m.reference, m.releaseDate, m.anomaly ?? "", m.anomalyMessage ?? ""]),
                ])
              }
            >
              Journal des anomalies
            </Btn>
          </div>
        </Surface>
      </div>
    </>
  );
}
