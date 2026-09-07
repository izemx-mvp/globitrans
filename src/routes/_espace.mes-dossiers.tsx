import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Download, FileText } from "lucide-react";
import {
  Chip,
  EmptyState,
  Kpi,
  Mono,
  PageHeader,
  StatusBadge,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/app/bits";
import { Btn, Modal, inputClass } from "@/components/app/dialogs";
import { TODAY, markAsDeposited, useDB } from "@/services/db";
import { fullName, useSession } from "@/services/auth";
import {
  SOURCE_LABELS,
  clientName,
  exportMainLevees,
  formatDate,
  formatTime,
} from "@/services/business";
import { TODAY_LABEL } from "@/data/seed";

export const Route = createFileRoute("/_espace/mes-dossiers")({
  head: () => ({
    meta: [
      { title: "Mes dossiers du jour — GLOBITRANS" },
      {
        name: "description",
        content:
          "Liste quotidienne du déclarant : dossiers ayant obtenu leur main levée et devant être transmis au département Finance.",
      },
      { property: "og:title", content: "Mes dossiers du jour — GLOBITRANS" },
      { property: "og:description", content: "Dossiers à transmettre au département Finance." },
    ],
  }),
  component: MesDossiersPage,
});

function MesDossiersPage() {
  const db = useDB();
  const session = useSession();
  const [date, setDate] = useState(TODAY);
  const [confirmRef, setConfirmRef] = useState<string | null>(null);
  const author = session ? fullName(session) : "Système";

  const declarantId = session?.declarantId ?? db.declarants[0]?.id;
  const list = useMemo(
    () => db.mainLevees.filter((m) => m.declarantId === declarantId && m.releaseDate === date),
    [db.mainLevees, declarantId, date],
  );

  const toDeposit = list.filter((m) => !m.deposited);
  const deposited = list.filter((m) => m.deposited);
  const received = list.filter((m) => m.receivedByFinance);

  return (
    <>
      <PageHeader
        title="Mes dossiers du jour"
        subtitle="Dossiers ayant obtenu leur main levée et devant être transmis au département Finance."
        actions={
          <>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-[160px]`} />
            <Btn variant="outline" onClick={() => exportMainLevees(db, list, "globitrans-mes-dossiers.csv")}>
              <Download className="size-4" /> Exporter ma liste
            </Btn>
            <Btn
              disabled={!toDeposit.length}
              onClick={() => {
                markAsDeposited(
                  toDeposit.map((m) => m.reference),
                  author,
                );
                toast.success(`${toDeposit.length} dossier(s) marqué(s) comme déposé(s).`);
              }}
            >
              <CheckCircle2 className="size-4" /> Tout marquer comme déposé
            </Btn>
          </>
        }
        meta={
          <p className="mt-2 text-[13px] text-muted-foreground">
            Journée du <span className="font-medium text-foreground">{date === TODAY ? TODAY_LABEL : formatDate(date)}</span>
          </p>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Dossiers" value={list.length} hint="Mains levées du jour" tone="primary" />
        <Kpi label="À déposer" value={toDeposit.length} hint="En attente de dépôt" tone="warning" />
        <Kpi label="Déposés" value={deposited.length} hint="Transmis à la Finance" />
        <Kpi label="Reçus Finance" value={received.length} hint="Réception confirmée" tone="success" />
      </div>

      <div className="card-surface mt-4 overflow-hidden">
        {list.length === 0 ? (
          <EmptyState
            title="Aucun dossier à déposer"
            description="Tous vos dossiers du jour ont été transmis à la Finance."
            icon={<FileText className="size-8" />}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Référence</Th>
                <Th>Main levée</Th>
                <Th>Client</Th>
                <Th>Régime</Th>
                <Th>Document</Th>
                <Th>Dépôt</Th>
                <Th>Finance</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <Tr key={m.id}>
                  <Td>
                    <Link
                      to="/mains-levees/$reference"
                      params={{ reference: m.reference }}
                      className="mono text-[13px] font-medium text-primary hover:underline"
                    >
                      {m.reference}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <span className="mono text-[12.5px]">{formatDate(m.releaseDate)}</span>
                    <p className="mono text-[11.5px] text-muted-foreground">{formatTime(m.receivedAt)}</p>
                  </Td>
                  <Td className="text-[13px]">{clientName(db, m.clientId)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Mono>{m.regimeCode}</Mono>
                      <Chip tone="blue">{SOURCE_LABELS[m.identificationSource]}</Chip>
                    </div>
                  </Td>
                  <Td>
                    <Link
                      to="/mains-levees/$reference"
                      params={{ reference: m.reference }}
                      className="mono inline-flex items-center gap-1.5 text-[12.5px] text-primary hover:underline"
                    >
                      <FileText className="size-3.5" /> {m.attachmentName}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {m.deposited ? (
                      <>
                        <span className="text-[12.5px] font-medium text-deep">Déposé</span>
                        <p className="mono text-[11.5px] text-muted-foreground">{formatTime(m.depositedAt)}</p>
                      </>
                    ) : (
                      <StatusBadge status={m.status} />
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {m.receivedByFinance ? (
                      <span className="text-[12.5px] font-medium text-success">✓ Reçu {formatTime(m.receivedAtFinance)}</span>
                    ) : (
                      <span className="text-[12.5px] text-muted-foreground">Non reçu</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    {!m.deposited ? (
                      <Btn size="sm" onClick={() => setConfirmRef(m.reference)}>
                        Marquer comme déposé
                      </Btn>
                    ) : (
                      <Link to="/mains-levees/$reference" params={{ reference: m.reference }}>
                        <Btn variant="outline" size="sm">
                          Consulter
                        </Btn>
                      </Link>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>

      <Modal
        open={Boolean(confirmRef)}
        onClose={() => setConfirmRef(null)}
        title="Confirmer le dépôt du dossier"
        description={`Confirmez-vous avoir déposé le dossier ${confirmRef} auprès du département Finance ?`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setConfirmRef(null)}>
              Annuler
            </Btn>
            <Btn
              onClick={() => {
                if (confirmRef) {
                  markAsDeposited([confirmRef], author);
                  toast.success("Dossier marqué comme déposé.", {
                    description: "Le département Finance peut désormais confirmer sa réception.",
                  });
                }
                setConfirmRef(null);
              }}
            >
              Confirmer le dépôt
            </Btn>
          </>
        }
      />
    </>
  );
}
