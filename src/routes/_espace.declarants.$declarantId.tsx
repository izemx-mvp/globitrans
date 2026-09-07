import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  Avatar,
  Chip,
  EmptyState,
  InfoRow,
  Kpi,
  Mono,
  StatusBadge,
  Surface,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/app/bits";
import { Btn } from "@/components/app/dialogs";
import { TODAY, useDB } from "@/services/db";
import { formatDate, formatTime } from "@/services/business";

export const Route = createFileRoute("/_espace/declarants/$declarantId")({
  head: () => ({
    meta: [
      { title: "Fiche déclarant — GLOBITRANS" },
      {
        name: "description",
        content: "Fiche déclarant : portefeuille clients, dossiers du jour, dépôts et réceptions Finance.",
      },
      { property: "og:title", content: "Fiche déclarant — GLOBITRANS" },
      { property: "og:description", content: "Portefeuille clients et dossiers du déclarant." },
    ],
  }),
  component: DeclarantDetailPage,
});

const TABS = ["Vue générale", "Clients", "Dossiers", "Historique"] as const;

function DeclarantDetailPage() {
  const { declarantId } = useParams({ from: "/_espace/declarants/$declarantId" });
  const db = useDB();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Vue générale");

  const declarant = db.declarants.find((d) => d.id === declarantId);
  if (!declarant) {
    return (
      <div className="card-surface">
        <EmptyState
          title="Déclarant introuvable"
          action={
            <Link to="/declarants">
              <Btn variant="outline">
                <ArrowLeft className="size-4" /> Retour aux déclarants
              </Btn>
            </Link>
          }
        />
      </div>
    );
  }

  const clients = db.clients.filter((c) => c.declarantId === declarant.id);
  const all = db.mainLevees.filter((m) => m.declarantId === declarant.id);
  const today = all.filter((m) => m.releaseDate === TODAY);

  return (
    <>
      <div className="mb-4 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link to="/declarants" className="hover:text-foreground">
          Déclarants
        </Link>
        <span className="text-border">/</span>
        <span className="font-medium text-foreground">
          {declarant.firstName} {declarant.lastName}
        </span>
      </div>

      <div className="mb-5 flex items-center gap-4 border-b border-border pb-5">
        <Avatar initials={declarant.avatar} className="size-12 text-[15px]" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] leading-9 font-semibold tracking-tight">
              {declarant.firstName} {declarant.lastName}
            </h1>
            <Chip tone="blue">Déclarant</Chip>
          </div>
          <p className="text-[13.5px] text-muted-foreground">
            {declarant.email} — {declarant.phone}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3.5 py-2 text-[13.5px] transition-colors duration-150 ${
              tab === t
                ? "border-corporate font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Vue générale" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Clients attribués" value={clients.length} hint="Portefeuille" tone="primary" />
            <Kpi label="Dossiers du jour" value={today.length} hint="Mains levées" />
            <Kpi label="À déposer" value={today.filter((m) => !m.deposited).length} hint="En attente" tone="warning" />
            <Kpi label="Déposés" value={today.filter((m) => m.deposited).length} hint="Transmis" tone="success" />
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Surface title="Synthèse du portefeuille">
              <InfoRow label="Dossiers totaux" value={all.length} />
              <InfoRow label="Dossiers reçus par la Finance" value={all.filter((m) => m.receivedByFinance).length} />
              <InfoRow label="Dossiers en attente de dépôt" value={all.filter((m) => !m.deposited).length} />
              <InfoRow
                label="Taux de réception"
                value={`${Math.round((all.filter((m) => m.receivedByFinance).length / Math.max(all.length, 1)) * 100)} %`}
              />
            </Surface>
            <Surface title="Clients du portefeuille" bodyClassName="p-0">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Code</Th>
                    <Th>Raison sociale</Th>
                    <Th>Dossiers</Th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <Tr key={c.id}>
                      <Td>
                        <Mono>{c.code}</Mono>
                      </Td>
                      <Td>
                        <Link
                          to="/clients/$clientId"
                          params={{ clientId: c.id }}
                          className="text-[13px] text-primary hover:underline"
                        >
                          {c.companyName}
                        </Link>
                      </Td>
                      <Td className="mono">{db.mainLevees.filter((m) => m.clientId === c.id).length}</Td>
                    </Tr>
                  ))}
                </tbody>
              </TableWrap>
            </Surface>
          </div>
        </>
      ) : null}

      {tab === "Clients" ? (
        <div className="card-surface overflow-hidden">
          <TableWrap>
            <thead>
              <tr>
                <Th>Code client</Th>
                <Th>Raison sociale</Th>
                <Th>ICE</Th>
                <Th>Dossiers</Th>
                <Th>En attente Finance</Th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Mono>{c.code}</Mono>
                  </Td>
                  <Td>
                    <Link
                      to="/clients/$clientId"
                      params={{ clientId: c.id }}
                      className="text-[13px] font-medium text-primary hover:underline"
                    >
                      {c.companyName}
                    </Link>
                  </Td>
                  <Td>
                    <Mono className="text-[12.5px]">{c.ice}</Mono>
                  </Td>
                  <Td className="mono">{db.mainLevees.filter((m) => m.clientId === c.id).length}</Td>
                  <Td className="mono">
                    {db.mainLevees.filter((m) => m.clientId === c.id && !m.receivedByFinance).length}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      ) : null}

      {tab === "Dossiers" ? (
        <div className="card-surface overflow-hidden">
          <TableWrap>
            <thead>
              <tr>
                <Th>Référence</Th>
                <Th>Date</Th>
                <Th>Client</Th>
                <Th>Statut</Th>
                <Th>Dépôt</Th>
                <Th>Réception</Th>
              </tr>
            </thead>
            <tbody>
              {all.slice(0, 40).map((m) => (
                <Tr key={m.id}>
                  <Td>
                    <Link
                      to="/mes-dossiers/$reference"
                      params={{ reference: m.reference }}
                      className="mono text-[13px] font-medium text-primary hover:underline"
                    >
                      {m.reference}
                    </Link>
                  </Td>
                  <Td className="mono text-[12.5px]">{formatDate(m.releaseDate)}</Td>
                  <Td className="text-[13px]">{db.clients.find((c) => c.id === m.clientId)?.companyName ?? "—"}</Td>
                  <Td>
                    <StatusBadge status={m.status} />
                  </Td>
                  <Td className="mono text-[12.5px] text-muted-foreground">{formatTime(m.depositedAt)}</Td>
                  <Td className="mono text-[12.5px] text-muted-foreground">{formatTime(m.receivedAtFinance)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      ) : null}

      {tab === "Historique" ? (
        <Surface title="Activité du déclarant">
          <ul className="space-y-3">
            {all
              .filter((m) => m.depositedAt)
              .slice(0, 15)
              .map((m) => (
                <li key={m.id} className="border-b border-border/70 pb-2.5 last:border-0">
                  <p className="text-[13.5px]">
                    Dépôt du dossier <Mono className="font-medium">{m.reference}</Mono>
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {formatDate(m.releaseDate)} à {formatTime(m.depositedAt)} —{" "}
                    {m.receivedByFinance ? `réceptionné par ${m.receivedBy}` : "en attente de réception"}
                  </p>
                </li>
              ))}
          </ul>
        </Surface>
      ) : null}
    </>
  );
}
