import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  Chip,
  EmptyState,
  Mono,
  PageHeader,
  StatusBadge,
  Surface,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/app/bits";
import { Btn, Field, Modal, inputClass, selectClass } from "@/components/app/dialogs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  TODAY,
  markAsDeposited,
  markAsFinanceReceived,
  reverseReception,
  syncEmails,
  updateMainLevee,
  useDB,
} from "@/services/db";
import { ReceptionModal } from "./_espace.mes-dossiers.$reference";
import { fullName, useSession } from "@/services/auth";
import {
  ANOMALY_LABELS,
  SOURCE_LABELS,
  clientName,
  declarantName,
  exportMainLevees,
  formatDate,
  formatTime,
} from "@/services/business";
import type { MainLevee } from "@/types";

export const Route = createFileRoute("/_espace/mes-dossiers/")({
  head: () => ({
    meta: [
      { title: "Mes dossiers — GLOBITRANS" },
      {
        name: "description",
        content:
          "Répertoire centralisé des dossiers ayant obtenu leur main levée douanière : statut, client, déclarant, dépôt et réception Finance.",
      },
      { property: "og:title", content: "Mes dossiers — GLOBITRANS" },
      { property: "og:description", content: "Répertoire centralisé des dossiers ayant obtenu leur main levée." },
    ],
  }),
  component: MesDossiersPage,
});

const TABS = [
  { id: "all", label: "Toutes" },
  { id: "today", label: "Aujourd'hui" },
  { id: "to_deposit", label: "À déposer" },
  { id: "deposited", label: "Déposées" },
  { id: "received", label: "Reçues Finance" },
  { id: "review", label: "À vérifier" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PAGE_SIZE = 12;

function matchTab(m: MainLevee, tab: TabId) {
  switch (tab) {
    case "today":
      return m.releaseDate === TODAY;
    case "to_deposit":
      return !m.deposited && m.status !== "REVIEW_REQUIRED";
    case "deposited":
      return m.deposited;
    case "received":
      return m.receivedByFinance;
    case "review":
      return m.status === "REVIEW_REQUIRED";
    default:
      return true;
  }
}

function MesDossiersPage() {
  const db = useDB();
  const session = useSession();
  const [tab, setTab] = useState<TabId>("all");
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [clientId, setClientId] = useState("");
  const [declarantId, setDeclarantId] = useState("");
  const [regime, setRegime] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [reception, setReception] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftRegime, setDraftRegime] = useState("");
  const [draftSource, setDraftSource] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [draftReception, setDraftReception] = useState("");
  const [page, setPage] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [receptionRef, setReceptionRef] = useState<string | null>(null);
  const [financeNote, setFinanceNote] = useState("");
  const [cancelRef, setCancelRef] = useState<string | null>(null);
  const [depositRef, setDepositRef] = useState<string | null>(null);

  const author = session ? fullName(session) : "Système";
  const isDeclarant = session?.role === "DECLARANT";
  const canReceive = session?.role === "FINANCE" || session?.role === "ADMIN";
  const subtitle = isDeclarant
    ? "Vos dossiers de mains levées : dépôt auprès du département Finance et suivi de la réception."
    : session?.role === "FINANCE"
      ? "Dossiers de mains levées déposés par les déclarants et à réceptionner par la Finance."
      : "Source unique des dossiers de mains levées : identification, dépôt et réception Finance.";

  const scoped = useMemo(
    () =>
      session?.role === "DECLARANT"
        ? db.mainLevees.filter((m) => m.declarantId === session.declarantId)
        : db.mainLevees,
    [db.mainLevees, session],
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(TABS.map((t) => [t.id, scoped.filter((m) => matchTab(m, t.id)).length])) as Record<
        TabId,
        number
      >,
    [scoped],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return scoped.filter((m) => {
      if (!matchTab(m, tab)) return false;
      if (term) {
        const hay = `${m.reference} ${m.declarationNumber} ${clientName(db, m.clientId)} ${m.extractedCustomerName}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (date && m.releaseDate !== date) return false;
      if (clientId && m.clientId !== clientId) return false;
      if (declarantId && m.declarantId !== declarantId) return false;
      if (regime && m.regimeCode !== regime) return false;
      if (source && m.identificationSource !== source) return false;
      if (status && m.status !== status) return false;
      if (reception === "received" && !m.receivedByFinance) return false;
      if (reception === "pending" && m.receivedByFinance) return false;
      return true;
    });
  }, [scoped, tab, q, date, clientId, declarantId, regime, source, status, reception, db]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const reset = () => {
    setQ("");
    setDate("");
    setClientId("");
    setDeclarantId("");
    setRegime("");
    setSource("");
    setStatus("");
    setReception("");
    setPage(1);
  };

  const sync = () => {
    setSyncing(true);
    window.setTimeout(() => {
      const res = syncEmails(session ? fullName(session) : "Agent Email");
      setSyncing(false);
      toast.success("Synchronisation terminée.", {
        description: `${res.analyzed} emails analysés – ${res.detected} mains levées détectées.`,
      });
    }, 1200);
  };

  const pendingDeposit = useMemo(
    () => filtered.filter((m) => !m.deposited && m.status !== "REVIEW_REQUIRED"),
    [filtered],
  );

  const regimeOptions = useMemo(
    () => Array.from(new Set(scoped.map((m) => m.regimeCode))).sort(),
    [scoped],
  );
  const advancedFilterCount = [regime, source, status, reception].filter(Boolean).length;
  const selectedDate = date ? new Date(`${date}T12:00:00`) : undefined;

  const openAdvancedFilters = (open: boolean) => {
    if (open) {
      setDraftRegime(regime);
      setDraftSource(source);
      setDraftStatus(status);
      setDraftReception(reception);
    }
    setFiltersOpen(open);
  };

  return (
    <>
      <PageHeader
        title="Mes dossiers"
        subtitle={subtitle}
        actions={
          <>
            <Btn variant="outline" onClick={sync} disabled={syncing}>
              {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Synchroniser les emails
            </Btn>
            {isDeclarant ? null : (
              <Btn variant="outline" onClick={() => setManualOpen(true)}>
                <Plus className="size-4" /> Ajouter manuellement
              </Btn>
            )}
            {isDeclarant ? (
              <Btn
                disabled={!pendingDeposit.length}
                variant="outline"
                onClick={() => {
                  markAsDeposited(
                    pendingDeposit.map((m) => m.reference),
                    author,
                  );
                  toast.success(`${pendingDeposit.length} dossier(s) marqué(s) comme déposé(s).`);
                }}
              >
                <CheckCircle2 className="size-4" /> Tout marquer comme déposé
              </Btn>
            ) : null}
            <Btn onClick={() => exportMainLevees(db, filtered, "globitrans-mes-dossiers.csv")}>
              <Download className="size-4" /> Exporter
            </Btn>
          </>
        }
      />

      <div className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 pt-2.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-[13px] transition-colors duration-150 ${
                tab === t.id
                  ? "border-corporate font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              <span className="mono rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5 xl:flex-nowrap">
          <div className="relative min-w-[250px] flex-1 xl:max-w-[340px]">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher une référence, un client..."
              className={`${inputClass} h-10 pl-9`}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Btn variant="outline" className="h-10 w-[150px] justify-start font-normal">
                <CalendarDays className="size-4 text-muted-foreground" />
                <span className="truncate">{date ? formatDate(date) : "Date"}</span>
              </Btn>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(value) => {
                  setDate(
                    value
                      ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
                      : "",
                  );
                  setPage(1);
                }}
                className="pointer-events-auto p-3"
              />
            </PopoverContent>
          </Popover>
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setPage(1);
            }}
            className={`${selectClass} h-10 w-[180px] shrink-0`}
            aria-label="Client"
          >
            <option value="">Client</option>
            {db.clients.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>
          <select
            value={declarantId}
            onChange={(e) => {
              setDeclarantId(e.target.value);
              setPage(1);
            }}
            className={`${selectClass} h-10 w-[180px] shrink-0`}
            aria-label="Déclarant"
          >
            <option value="">Déclarant</option>
            {db.declarants.map((d) => (
              <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
            ))}
          </select>
          <Popover open={filtersOpen} onOpenChange={openAdvancedFilters}>
            <PopoverTrigger asChild>
              <Btn variant="outline" className="h-10">
                <SlidersHorizontal className="size-4" />
                Filtres{advancedFilterCount ? ` · ${advancedFilterCount}` : ""}
              </Btn>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[360px] p-0">
              <div className="space-y-3 p-4">
                <Field label="Code régime">
                  <select value={draftRegime} onChange={(e) => setDraftRegime(e.target.value)} className={selectClass}>
                    <option value="">Tous</option>
                    {regimeOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Source client">
                  <select value={draftSource} onChange={(e) => setDraftSource(e.target.value)} className={selectClass}>
                    <option value="">Toutes</option>
                    <option value="CASE_2">Case 2</option>
                    <option value="CASE_8">Case 8</option>
                    <option value="UNUSED">Non déterminée</option>
                  </select>
                </Field>
                <Field label="Statut dossier">
                  <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)} className={selectClass}>
                    <option value="">Tous</option>
                    <option value="NEW">Nouveau</option>
                    <option value="ANALYZING">Analyse en cours</option>
                    <option value="CLIENT_IDENTIFIED">Client identifié</option>
                    <option value="REVIEW_REQUIRED">À vérifier</option>
                    <option value="TO_DEPOSIT">À déposer</option>
                    <option value="DEPOSITED">Déposé</option>
                    <option value="FINANCE_RECEIVED">Reçu Finance</option>
                  </select>
                </Field>
                <Field label="Réception Finance">
                  <select value={draftReception} onChange={(e) => setDraftReception(e.target.value)} className={selectClass}>
                    <option value="">Tous</option>
                    <option value="received">Reçu</option>
                    <option value="pending">Non reçu</option>
                  </select>
                </Field>
              </div>
              <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3">
                <Btn
                  variant="ghost"
                  onClick={() => {
                    setDraftRegime("");
                    setDraftSource("");
                    setDraftStatus("");
                    setDraftReception("");
                  }}
                >
                  Réinitialiser
                </Btn>
                <Btn
                  onClick={() => {
                    setRegime(draftRegime);
                    setSource(draftSource);
                    setStatus(draftStatus);
                    setReception(draftReception);
                    setPage(1);
                    setFiltersOpen(false);
                  }}
                >
                  Appliquer
                </Btn>
              </div>
            </PopoverContent>
          </Popover>
          <Btn variant="ghost" className="h-10" onClick={reset}>Réinitialiser</Btn>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Aucun dossier ne correspond"
            description="Ajustez les filtres ou réinitialisez la recherche pour afficher les dossiers."
            action={
              <Btn variant="outline" onClick={reset}>
                Réinitialiser les filtres
              </Btn>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th className="w-9" />
                <Th>Référence</Th>
                <Th>Date / Heure</Th>
                <Th>Client</Th>
                <Th>Code régime</Th>
                <Th>Source</Th>
                <Th>Déclarant</Th>
                <Th>Statut dossier</Th>
                <Th>Dépôt</Th>
                <Th>Réception Finance</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <Tr key={m.id}>
                  <Td>
                    <input type="checkbox" className="size-3.5 accent-[var(--corporate)]" aria-label={m.reference} />
                  </Td>
                  <Td>
                    <Link
                      to="/mes-dossiers/$reference"
                      params={{ reference: m.reference }}
                      className="mono text-[13px] font-medium text-primary hover:underline"
                    >
                      {m.reference}
                    </Link>
                    {m.anomaly ? (
                      <p className="text-[11.5px] text-danger">{ANOMALY_LABELS[m.anomaly]}</p>
                    ) : null}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <span className="mono text-[12.5px]">{formatDate(m.releaseDate)}</span>
                    <p className="mono text-[11.5px] text-muted-foreground">{formatTime(m.receivedAt)}</p>
                  </Td>
                  <Td className="max-w-[200px]">
                    <span className="block truncate text-[13px]">{clientName(db, m.clientId)}</span>
                    {!m.clientId ? (
                      <span className="text-[11.5px] text-danger">{m.extractedCustomerName}</span>
                    ) : null}
                  </Td>
                  <Td>
                    <Mono>{m.regimeCode}</Mono>
                  </Td>
                  <Td>
                    <Chip tone={m.identificationSource === "UNUSED" ? "danger" : "blue"}>
                      {SOURCE_LABELS[m.identificationSource]}
                    </Chip>
                  </Td>
                  <Td className="whitespace-nowrap text-[13px]">{declarantName(db, m.declarantId)}</Td>
                  <Td>
                    <StatusBadge status={m.status} />
                  </Td>
                  <Td className="whitespace-nowrap">
                    {m.deposited ? (
                      <>
                        <span className="text-[12.5px] font-medium text-deep">Déposé</span>
                        <p className="mono text-[11.5px] text-muted-foreground">{formatTime(m.depositedAt)}</p>
                      </>
                    ) : (
                      <span className="text-[12.5px] text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {canReceive ? (
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          className="size-3.5 accent-[var(--corporate)]"
                          checked={m.receivedByFinance}
                          onChange={() =>
                            m.receivedByFinance ? setCancelRef(m.reference) : setReceptionRef(m.reference)
                          }
                          aria-label={`Réception ${m.reference}`}
                        />
                        {m.receivedByFinance ? (
                          <span>
                            <span className="block text-[12.5px] font-medium text-success">Reçu</span>
                            <span className="mono block text-[11.5px] text-muted-foreground">
                              {formatTime(m.receivedAtFinance)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[12.5px] text-muted-foreground">Non reçu</span>
                        )}
                      </label>
                    ) : m.receivedByFinance ? (
                      <>
                        <span className="text-[12.5px] font-medium text-success">✓ Reçu</span>
                        <p className="mono text-[11.5px] text-muted-foreground">{formatTime(m.receivedAtFinance)}</p>
                      </>
                    ) : (
                      <span className="text-[12.5px] text-muted-foreground">Non reçu</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to="/mes-dossiers/$reference" params={{ reference: m.reference }}>
                        <Btn variant="ghost" size="sm" title="Ouvrir le dossier">
                          <Eye className="size-4" />
                        </Btn>
                      </Link>
                      {!m.deposited && (session?.role === "ADMIN" || session?.declarantId === m.declarantId) ? (
                        <Btn variant="outline" size="sm" onClick={() => setDepositRef(m.reference)}>
                          Marquer comme déposé
                        </Btn>
                      ) : null}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-[12.5px] text-muted-foreground">
            {filtered.length} dossier{filtered.length > 1 ? "s" : ""} — page {current} sur {pages}
          </p>
          <div className="flex items-center gap-1">
            <Btn variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              <ChevronLeft className="size-4" /> Précédent
            </Btn>
            <Btn variant="outline" size="sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>
              Suivant <ChevronRight className="size-4" />
            </Btn>
          </div>
        </div>
      </div>

      <ManualModal open={manualOpen} onClose={() => setManualOpen(false)} />

      <ReceptionModal
        open={Boolean(receptionRef)}
        onClose={() => setReceptionRef(null)}
        reference={receptionRef ?? ""}
        client={clientName(db, db.mainLevees.find((m) => m.reference === receptionRef)?.clientId)}
        declarant={declarantName(db, db.mainLevees.find((m) => m.reference === receptionRef)?.declarantId)}
        depositedAt={formatDate(db.mainLevees.find((m) => m.reference === receptionRef)?.releaseDate)}
        note={financeNote}
        setNote={setFinanceNote}
        onConfirm={() => {
          if (receptionRef) markAsFinanceReceived([receptionRef], author, financeNote || undefined);
          setReceptionRef(null);
          setFinanceNote("");
          toast.success("Réception confirmée.", { description: "Le dossier est prêt pour traitement Finance." });
        }}
      />

      <Modal
        open={Boolean(cancelRef)}
        onClose={() => setCancelRef(null)}
        title="Annuler la réception du dossier"
        description={`Confirmez-vous l'annulation de la réception du dossier ${cancelRef} ?`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setCancelRef(null)}>
              Annuler
            </Btn>
            <Btn
              onClick={() => {
                if (cancelRef) reverseReception(cancelRef, author);
                setCancelRef(null);
                toast.success("Réception annulée.");
              }}
            >
              Confirmer l'annulation
            </Btn>
          </>
        }
      />

      <Modal
        open={Boolean(depositRef)}
        onClose={() => setDepositRef(null)}
        title="Confirmer le dépôt du dossier"
        description={`Confirmez-vous avoir déposé le dossier ${depositRef} auprès du département Finance ?`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setDepositRef(null)}>
              Annuler
            </Btn>
            <Btn
              onClick={() => {
                if (depositRef) markAsDeposited([depositRef], author);
                setDepositRef(null);
                toast.success("Dossier marqué comme déposé.");
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

function ManualModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useDB();
  const session = useSession();
  const [reference, setReference] = useState("");
  const [declaration, setDeclaration] = useState("");
  const [regimeCode, setRegimeCode] = useState("010");
  const [clientId, setClientId] = useState(db.clients[0]?.id ?? "");

  const submit = () => {
    if (!reference || !declaration) {
      toast.error("Référence et numéro de déclaration requis.");
      return;
    }
    updateMainLevee(
      reference,
      { declarationNumber: declaration, regimeCode, clientId },
      "Dossier saisi manuellement.",
      session ? fullName(session) : "Système",
    );
    toast.success("Saisie enregistrée.", {
      description: "Le dossier sera rattaché lors de la prochaine analyse documentaire.",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter une main levée manuellement"
      description="Utilisez cette saisie lorsque le document n'a pas été reçu par email."
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Annuler
          </Btn>
          <Btn onClick={submit}>Enregistrer</Btn>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Référence du dossier">
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="ML-2026-00970" className={inputClass} />
        </Field>
        <Field label="Numéro de déclaration">
          <input value={declaration} onChange={(e) => setDeclaration(e.target.value)} placeholder="DUM-2026-48620" className={inputClass} />
        </Field>
        <Field label="Code régime" hint="Le code est normalisé sur 3 chiffres.">
          <input value={regimeCode} onChange={(e) => setRegimeCode(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Client">
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={selectClass}>
            {db.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}
