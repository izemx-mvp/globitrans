import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Download, FileText, Printer, Send } from "lucide-react";
import {
  Chip,
  EmptyState,
  Kpi,
  Mono,
  PageHeader,
  Surface,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/app/bits";
import { Btn, Modal, Textarea, inputClass, selectClass } from "@/components/app/dialogs";
import { TODAY, markAsFinanceReceived, useDB } from "@/services/db";
import { fullName, useSession } from "@/services/auth";
import {
  clientName,
  declarantName,
  exportMainLevees,
  formatDate,
  formatLongDate,
  formatTime,
} from "@/services/business";

export const Route = createFileRoute("/_espace/liste-finance")({
  head: () => ({
    meta: [
      { title: "Liste Finance — GLOBITRANS" },
      {
        name: "description",
        content:
          "Liste consolidée des dossiers de main levée clôturés transmis au département Finance : dépôts, réceptions et récapitulatif du jour.",
      },
      { property: "og:title", content: "Liste Finance — GLOBITRANS" },
      { property: "og:description", content: "Dossiers clôturés transmis au département Finance." },
    ],
  }),
  component: ListeFinancePage,
});

function ListeFinancePage() {
  const db = useDB();
  const session = useSession();
  const author = session ? fullName(session) : "Finance";
  const [date, setDate] = useState(TODAY);
  const [q, setQ] = useState("");
  const [declarantId, setDeclarantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [regime, setRegime] = useState("");
  const [depositFilter, setDepositFilter] = useState("");
  const [receiptFilter, setReceiptFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [note, setNote] = useState("");

  const dayList = useMemo(() => db.mainLevees.filter((m) => m.releaseDate === date), [db.mainLevees, date]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return dayList.filter((m) => {
      if (term && !`${m.reference} ${clientName(db, m.clientId)}`.toLowerCase().includes(term)) return false;
      if (declarantId && m.declarantId !== declarantId) return false;
      if (clientId && m.clientId !== clientId) return false;
      if (regime && m.regimeCode !== regime) return false;
      if (depositFilter === "yes" && !m.deposited) return false;
      if (depositFilter === "no" && m.deposited) return false;
      if (receiptFilter === "yes" && !m.receivedByFinance) return false;
      if (receiptFilter === "no" && m.receivedByFinance) return false;
      return true;
    });
  }, [dayList, q, declarantId, clientId, regime, depositFilter, receiptFilter, db]);

  const deposited = dayList.filter((m) => m.deposited);
  const received = dayList.filter((m) => m.receivedByFinance);
  const toReceive = dayList.filter((m) => m.deposited && !m.receivedByFinance);
  const toDeposit = dayList.filter((m) => !m.deposited);

  const byDeclarant = db.declarants
    .map((d) => {
      const items = dayList.filter((m) => m.declarantId === d.id);
      return {
        declarant: d,
        total: items.length,
        deposited: items.filter((m) => m.deposited).length,
        received: items.filter((m) => m.receivedByFinance).length,
      };
    })
    .filter((r) => r.total > 0);

  const toggle = (ref: string) =>
    setSelected((prev) => (prev.includes(ref) ? prev.filter((r) => r !== ref) : [...prev, ref]));

  const confirmBulk = () => {
    markAsFinanceReceived(selected, author, note || undefined);
    toast.success(`${selected.length} dossier(s) marqué(s) comme reçus.`);
    setSelected([]);
    setNote("");
    setBulkOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Dossiers à réceptionner"
        subtitle="Liste consolidée des dossiers clôturés transmis au département Finance."
        actions={
          <>
            <div className="text-right">
              <p className="label-xs">Aujourd'hui</p>
              <p className="text-[13.5px] font-medium">{formatLongDate(date)}</p>
            </div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-[160px]`} />
            <Btn variant="outline" onClick={() => exportMainLevees(db, rows, `globitrans-finance-${date}.csv`)}>
              <Download className="size-4" /> Exporter
            </Btn>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Dossiers clôturés" value={dayList.length} hint="Mains levées du jour" tone="primary" />
        <Kpi label="À déposer" value={toDeposit.length} hint="Chez les déclarants" tone="warning" />
        <Kpi label="Déposés" value={deposited.length} hint="Transmis à la Finance" />
        <Kpi label="Reçus" value={received.length} hint="Réception confirmée" tone="success" />
        <Kpi label="À réceptionner" value={toReceive.length} hint="En attente de contrôle" tone="danger" />
      </div>

      <div className="card-surface mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un dossier, un client..."
            className={`${inputClass} w-[240px]`}
          />
          <select value={declarantId} onChange={(e) => setDeclarantId(e.target.value)} className={`${selectClass} w-[180px]`}>
            <option value="">Tous les déclarants</option>
            {db.declarants.map((d) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </option>
            ))}
          </select>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={`${selectClass} w-[190px]`}>
            <option value="">Tous les clients</option>
            {db.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
          <select value={regime} onChange={(e) => setRegime(e.target.value)} className={`${selectClass} w-[130px]`}>
            <option value="">Régime</option>
            {Array.from(new Set(dayList.map((m) => m.regimeCode)))
              .sort()
              .map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
          </select>
          <select value={depositFilter} onChange={(e) => setDepositFilter(e.target.value)} className={`${selectClass} w-[160px]`}>
            <option value="">Déposé / Non déposé</option>
            <option value="yes">Déposé</option>
            <option value="no">Non déposé</option>
          </select>
          <select value={receiptFilter} onChange={(e) => setReceiptFilter(e.target.value)} className={`${selectClass} w-[150px]`}>
            <option value="">Reçu / Non reçu</option>
            <option value="yes">Reçu</option>
            <option value="no">Non reçu</option>
          </select>
          <Btn
            variant="ghost"
            onClick={() => {
              setQ("");
              setDeclarantId("");
              setClientId("");
              setRegime("");
              setDepositFilter("");
              setReceiptFilter("");
            }}
          >
            Réinitialiser
          </Btn>
        </div>

        {selected.length ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-soft px-4 py-2.5">
            <p className="text-[13px] font-medium text-deep">
              {selected.length} dossier{selected.length > 1 ? "s" : ""} sélectionné{selected.length > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Btn size="sm" variant="success" onClick={() => setBulkOpen(true)}>
                <CheckCircle2 className="size-4" /> Marquer comme reçus
              </Btn>
              <Btn
                size="sm"
                variant="outline"
                onClick={() =>
                  exportMainLevees(
                    db,
                    rows.filter((m) => selected.includes(m.reference)),
                    "globitrans-selection.csv",
                  )
                }
              >
                <Download className="size-4" /> Exporter
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => setSelected([])}>
                Annuler la sélection
              </Btn>
            </div>
          </div>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState
            title="Aucun dossier à réceptionner"
            description="Tous les dossiers déposés ont été réceptionnés."
            icon={<CheckCircle2 className="size-8" />}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th className="w-9">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    className="size-3.5 accent-[var(--corporate)]"
                    checked={selected.length === rows.length && rows.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? rows.map((m) => m.reference) : [])}
                  />
                </Th>
                <Th>Référence</Th>
                <Th>Date ML</Th>
                <Th>Client</Th>
                <Th>Régime</Th>
                <Th>Déclarant</Th>
                <Th>Document</Th>
                <Th>Dépôt</Th>
                <Th>Heure dépôt</Th>
                <Th>Reçu</Th>
                <Th>Heure réception</Th>
                <Th>Commentaire</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <Tr key={m.id}>
                  <Td>
                    <input
                      type="checkbox"
                      aria-label={m.reference}
                      className="size-3.5 accent-[var(--corporate)]"
                      checked={selected.includes(m.reference)}
                      onChange={() => toggle(m.reference)}
                    />
                  </Td>
                  <Td>
                    <Link
                      to="/mains-levees/$reference"
                      params={{ reference: m.reference }}
                      className="mono text-[13px] font-medium text-primary hover:underline"
                    >
                      {m.reference}
                    </Link>
                  </Td>
                  <Td className="mono whitespace-nowrap text-[12.5px]">{formatDate(m.releaseDate)}</Td>
                  <Td className="max-w-[190px] truncate text-[13px]">{clientName(db, m.clientId)}</Td>
                  <Td>
                    <Mono>{m.regimeCode}</Mono>
                  </Td>
                  <Td className="whitespace-nowrap text-[13px]">{declarantName(db, m.declarantId)}</Td>
                  <Td>
                    <Link
                      to="/mains-levees/$reference"
                      params={{ reference: m.reference }}
                      className="inline-flex text-muted-foreground hover:text-primary"
                      title={m.attachmentName}
                    >
                      <FileText className="size-4" />
                    </Link>
                  </Td>
                  <Td>
                    {m.deposited ? <Chip tone="blue">Déposé</Chip> : <Chip tone="warning">Non déposé</Chip>}
                  </Td>
                  <Td className="mono text-[12.5px] text-muted-foreground">{formatTime(m.depositedAt)}</Td>
                  <Td>
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--corporate)]"
                        checked={m.receivedByFinance}
                        disabled={!m.deposited || m.receivedByFinance}
                        onChange={() => {
                          markAsFinanceReceived([m.reference], author);
                          toast.success(`${m.reference} marqué comme reçu.`);
                        }}
                      />
                      <span
                        className={`text-[12.5px] font-medium ${m.receivedByFinance ? "text-success" : "text-muted-foreground"}`}
                      >
                        {m.receivedByFinance ? "Reçu" : "Non reçu"}
                      </span>
                    </label>
                  </Td>
                  <Td className="mono text-[12.5px] text-muted-foreground">{formatTime(m.receivedAtFinance)}</Td>
                  <Td className="max-w-[170px] truncate text-[12.5px] text-muted-foreground">{m.financeNote ?? "—"}</Td>
                  <Td className="text-right">
                    <Link to="/mains-levees/$reference" params={{ reference: m.reference }}>
                      <Btn variant="outline" size="sm">
                        Ouvrir
                      </Btn>
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Surface title="Récapitulatif du jour" description={formatLongDate(date)}>
          <div className="space-y-1.5 text-[13.5px]">
            <p>
              <span className="mono font-semibold">{dayList.length}</span> mains levées
            </p>
            <p>
              <span className="mono font-semibold">{deposited.length}</span> dossiers déposés
            </p>
            <p>
              <span className="mono font-semibold">{received.length}</span> dossiers reçus
            </p>
            <p>
              <span className="mono font-semibold">{toDeposit.length}</span> dossiers à déposer
            </p>
            <p>
              <span className="mono font-semibold">{toReceive.length}</span> dossiers déposés en attente de réception
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn variant="outline" size="sm" onClick={() => exportMainLevees(db, dayList, `globitrans-recap-${date}.csv`)}>
              Exporter Excel
            </Btn>
            <Btn variant="outline" size="sm" onClick={() => exportMainLevees(db, dayList, `globitrans-recap-${date}.csv`)}>
              Exporter CSV
            </Btn>
            <Btn variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" /> Imprimer
            </Btn>
            <Btn
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("Envoi simulé.", { description: "Le récapitulatif a été transmis au département Finance." })
              }
            >
              <Send className="size-4" /> Simuler l'envoi
            </Btn>
          </div>
        </Surface>

        <Surface title="Répartition par déclarant" description="Suivi des dépôts et réceptions par portefeuille." bodyClassName="p-0">
          <TableWrap>
            <thead>
              <tr>
                <Th>Déclarant</Th>
                <Th>Dossiers</Th>
                <Th>Déposés</Th>
                <Th>Reçus</Th>
                <Th>Taux de dépôt</Th>
              </tr>
            </thead>
            <tbody>
              {byDeclarant.map((r) => (
                <Tr key={r.declarant.id}>
                  <Td>
                    <Link
                      to="/declarants/$declarantId"
                      params={{ declarantId: r.declarant.id }}
                      className="text-[13px] font-medium text-primary hover:underline"
                    >
                      {r.declarant.firstName} {r.declarant.lastName}
                    </Link>
                  </Td>
                  <Td className="mono">{r.total}</Td>
                  <Td className="mono">{r.deposited}</Td>
                  <Td className="mono">{r.received}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-corporate"
                          style={{ width: `${Math.round((r.deposited / r.total) * 100)}%` }}
                        />
                      </div>
                      <span className="mono text-[12px] text-muted-foreground">
                        {Math.round((r.deposited / r.total) * 100)} %
                      </span>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Surface>
      </div>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Confirmer la réception des dossiers"
        description={`Vous êtes sur le point de confirmer la réception de ${selected.length} dossier(s).`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setBulkOpen(false)}>
              Annuler
            </Btn>
            <Btn variant="success" onClick={confirmBulk}>
              Confirmer la réception
            </Btn>
          </>
        }
      >
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Commentaire Finance (optionnel)" />
      </Modal>
    </>
  );
}
