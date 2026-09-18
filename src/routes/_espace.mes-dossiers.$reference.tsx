import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Maximize2,
  MessageSquarePlus,
  Pencil,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  Avatar,
  Chip,
  EmptyState,
  InfoRow,
  Mono,
  StatusBadge,
  Stepper,
  Surface,
} from "@/components/app/bits";
import { Btn, Field, Modal, Textarea, inputClass, selectClass } from "@/components/app/dialogs";
import {
  addNote,
  assignDossierDeclarant,
  markAsDeposited,
  markAsFinanceReceived,
  resolveAnomaly,
  reverseReception,
  updateMainLevee,
  useDB,
} from "@/services/db";
import { fullName, useSession } from "@/services/auth";
import {
  ANOMALY_LABELS,
  SOURCE_LABELS,
  clientName,
  declarantName,
  formatDateTime,
  formatLongDate,
  identifyCustomer,
} from "@/services/business";

export const Route = createFileRoute("/_espace/mes-dossiers/$reference")({
  head: () => ({
    meta: [
      { title: "Dossier de main levée — GLOBITRANS" },
      {
        name: "description",
        content:
          "Détail d'un dossier de main levée : informations douanières, identification client, déclarant responsable, dépôt et réception Finance.",
      },
      { property: "og:title", content: "Dossier de main levée — GLOBITRANS" },
      { property: "og:description", content: "Suivi complet d'un dossier de main levée jusqu'à sa réception Finance." },
    ],
  }),
  component: DossierPage,
});

const TABS = ["Vue générale", "Document douanier", "Email source"] as const;

function DossierPage() {
  const { reference } = useParams({ from: "/_espace/mes-dossiers/$reference" });
  const db = useDB();
  const session = useSession();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Vue générale");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [receptionOpen, setReceptionOpen] = useState(false);
  const [financeNote, setFinanceNote] = useState("");
  const [resolveOpen, setResolveOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignId, setAssignId] = useState("");

  const ml = db.mainLevees.find((m) => m.reference === reference);
  const author = session ? fullName(session) : "Système";

  if (!ml) {
    return (
      <div className="card-surface">
        <EmptyState
          title="Dossier introuvable"
          description={`Aucun dossier ne correspond à la référence ${reference}.`}
          action={
            <Link to="/mes-dossiers">
              <Btn variant="outline">
                <ArrowLeft className="size-4" /> Retour au répertoire
              </Btn>
            </Link>
          }
        />
      </div>
    );
  }

  const client = db.clients.find((c) => c.id === ml.clientId);
  const declarant = db.declarants.find((d) => d.id === ml.declarantId);
  const email = db.emails.find((e) => e.id === ml.emailId);
  const canReceive = session?.role === "FINANCE" || session?.role === "ADMIN";
  const canDeposit =
    session?.role === "ADMIN" || (session?.role === "DECLARANT" && session.declarantId === ml.declarantId);

  return (
    <>
      <div className="mb-4 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link to="/mes-dossiers" className="hover:text-foreground">
          Mes dossiers
        </Link>
        <span className="text-border">/</span>
        <Mono className="font-medium text-foreground">{ml.reference}</Mono>
      </div>

      <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="mono text-[28px] leading-9 font-semibold tracking-tight">{ml.reference}</h1>
            <StatusBadge status={ml.status} />
            {ml.anomaly ? <Chip tone="danger">{ANOMALY_LABELS[ml.anomaly]}</Chip> : null}
          </div>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Déclaration <Mono>{ml.declarationNumber}</Mono> — main levée du {formatLongDate(ml.releaseDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="outline" onClick={() => setTab("Document douanier")}>
            <FileText className="size-4" /> Voir document
          </Btn>
          {session?.role === "ADMIN" ? (
            <Btn variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Modifier
            </Btn>
          ) : null}
          <Btn variant="outline" onClick={() => setNoteOpen(true)}>
            <MessageSquarePlus className="size-4" /> Ajouter une note
          </Btn>
          {ml.receivedByFinance && canReceive ? (
            <Btn
              variant="ghost"
              onClick={() => {
                reverseReception(ml.reference, author);
                toast.success("Réception annulée.", { description: "Le dossier repasse en attente de réception." });
              }}
            >
              <RotateCcw className="size-4" /> Annuler la réception
            </Btn>
          ) : null}
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
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <Surface title="Informations douanières">
              <InfoRow label="Code régime" value={<Mono>{ml.regimeCode}</Mono>} />
              <InfoRow label="Libellé" value={ml.regimeLabel} />
              <InfoRow label="Numéro de déclaration" value={<Mono>{ml.declarationNumber}</Mono>} />
              <InfoRow label="Date de main levée" value={formatLongDate(ml.releaseDate)} />
              <InfoRow
                label="Case d'identification"
                value={<Chip tone={ml.identificationSource === "UNUSED" ? "danger" : "blue"}>{SOURCE_LABELS[ml.identificationSource]}</Chip>}
              />
              <InfoRow label="Pièce jointe" value={<Mono>{ml.attachmentName}</Mono>} />
            </Surface>

            <Surface title="Identification du client">
              <InfoRow label="Valeur extraite" value={<Mono>{ml.extractedCustomerName}</Mono>} />
              <InfoRow label="Client rapproché" value={client ? client.companyName : "Non identifié"} />
              <InfoRow label="Code client" value={client ? <Mono>{client.code}</Mono> : "—"} />
              <InfoRow label="Source d'identification" value={SOURCE_LABELS[ml.identificationSource]} />
              <InfoRow label="Confiance" value={`${ml.matchingConfidence} %`} />
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      ml.matchingConfidence >= db.settings.autoThreshold
                        ? "bg-success"
                        : ml.matchingConfidence >= db.settings.manualThreshold
                          ? "bg-warning"
                          : "bg-danger"
                    }`}
                    style={{ width: `${Math.max(ml.matchingConfidence, 3)}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {ml.matchingConfidence >= db.settings.autoThreshold && client ? (
                    <Chip tone="success">Identification automatique</Chip>
                  ) : (
                    <>
                      <Chip tone="warning">Validation requise</Chip>
                      <Btn size="sm" onClick={() => setResolveOpen(true)}>
                        Confirmer le client
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            </Surface>

            <Surface title="Déclarant responsable">
              {declarant ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={declarant.avatar} className="size-10 text-[13px]" />
                    <div>
                      <p className="text-[14px] font-medium">
                        {declarant.firstName} {declarant.lastName}
                      </p>
                      <p className="text-[12.5px] text-muted-foreground">{declarant.email}</p>
                      <p className="mt-1 text-[12.5px] text-muted-foreground">
                        {db.mainLevees.filter((m) => m.declarantId === declarant.id && !m.receivedByFinance).length} dossiers
                        actifs
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Chip tone="blue">Déclarant attitré</Chip>
                    <p className="mt-2 max-w-[220px] text-[12px] text-muted-foreground">
                      Affectation automatique selon le référentiel client.
                    </p>
                    {session?.role === "ADMIN" ? (
                      <Btn
                        variant="ghost"
                        size="sm"
                        className="mt-1"
                        onClick={() => {
                          setAssignId(ml.declarantId ?? "");
                          setAssignOpen(true);
                        }}
                      >
                        Modifier l'affectation
                      </Btn>
                    ) : null}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Aucun déclarant affecté"
                  description="Le client identifié ne dispose pas de déclarant attitré dans le référentiel."
                  action={
                    session?.role === "ADMIN" ? (
                      <Btn
                        onClick={() => {
                          setAssignId("");
                          setAssignOpen(true);
                        }}
                      >
                        Affecter un déclarant
                      </Btn>
                    ) : undefined
                  }
                />
              )}
            </Surface>
          </div>

          <div className="space-y-4">
            <Surface title="Avancement du dossier">
              <Stepper
                steps={[
                  { label: "Main levée reçue", at: ml.history[0]?.at, done: true },
                  { label: "Document analysé", at: ml.history[2]?.at, done: true },
                  { label: "Client identifié", at: ml.clientId ? ml.history[4]?.at : undefined, done: Boolean(ml.clientId) },
                  { label: "Déclarant affecté", at: ml.declarantId ? ml.history[5]?.at : undefined, done: Boolean(ml.declarantId) },
                  { label: "Dossier déposé", at: ml.depositedAt, done: ml.deposited },
                  { label: "Réception Finance", at: ml.receivedAtFinance, done: ml.receivedByFinance },
                ]}
              />
            </Surface>

            <Surface title="Réception Finance">
              {ml.receivedByFinance ? (
                <>
                  <Chip tone="success">Dossier reçu</Chip>
                  <div className="mt-3">
                    <InfoRow label="Déposé par" value={ml.depositedBy ?? "—"} />
                    <InfoRow label="Date de dépôt" value={formatDateTime(ml.depositedAt)} />
                    <InfoRow label="Reçu par" value={ml.receivedBy ?? "—"} />
                    <InfoRow label="Date de réception" value={formatDateTime(ml.receivedAtFinance)} />
                    <InfoRow label="Note Finance" value={ml.financeNote ?? "—"} />
                  </div>
                </>
              ) : (
                <>
                  <label className="flex items-start gap-3 rounded-md border border-border bg-muted/40 px-3.5 py-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-[var(--corporate)]"
                      checked={false}
                      onChange={() => canReceive && setReceptionOpen(true)}
                      disabled={!canReceive}
                    />
                    <span>
                      <span className="block text-[13.5px] font-medium">Dossier reçu par la Finance</span>
                      <span className="block text-[12.5px] text-muted-foreground">
                        {ml.deposited
                          ? `Déposé le ${formatDateTime(ml.depositedAt)} par ${ml.depositedBy}.`
                          : "Le dossier n'a pas encore été déposé par le déclarant."}
                      </span>
                    </span>
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canReceive ? (
                      <Btn onClick={() => setReceptionOpen(true)}>Confirmer la réception</Btn>
                    ) : null}
                    {canDeposit && !ml.deposited ? (
                      <Btn
                        variant="outline"
                        onClick={() => {
                          markAsDeposited([ml.reference], author);
                          toast.success("Dossier marqué comme déposé.");
                        }}
                      >
                        Marquer comme déposé
                      </Btn>
                    ) : null}
                  </div>
                </>
              )}
            </Surface>

            <Surface title="Notes opérationnelles">
              {ml.notes.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">Aucune note enregistrée sur ce dossier.</p>
              ) : (
                <ul className="space-y-3">
                  {ml.notes.map((n, i) => (
                    <li key={i} className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
                      <p className="text-[13px]">{n.text}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {n.author} — {formatDateTime(n.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Surface>
          </div>
        </div>
      ) : null}

      {tab === "Document douanier" ? (
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Surface
            title={ml.attachmentName}
            description="Aperçu du document douanier reçu en pièce jointe."
            actions={
              <div className="flex items-center gap-1">
                <Btn variant="ghost" size="sm" title="Page précédente">
                  <ChevronLeft className="size-4" />
                </Btn>
                <span className="mono text-[12px] text-muted-foreground">1 / 2</span>
                <Btn variant="ghost" size="sm" title="Page suivante">
                  <ChevronRight className="size-4" />
                </Btn>
                <Btn variant="ghost" size="sm" title="Zoom arrière">
                  <ZoomOut className="size-4" />
                </Btn>
                <Btn variant="ghost" size="sm" title="Zoom avant">
                  <ZoomIn className="size-4" />
                </Btn>
                <Btn variant="ghost" size="sm" title="Télécharger">
                  <Download className="size-4" />
                </Btn>
                <Btn variant="ghost" size="sm" title="Plein écran">
                  <Maximize2 className="size-4" />
                </Btn>
              </div>
            }
            bodyClassName="bg-muted/50 p-6"
          >
            <div className="mx-auto max-w-[620px] bg-card p-8 shadow-[var(--shadow-raised)]">
              <div className="border-b border-border pb-3 text-center">
                <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  Royaume du Maroc — Administration des Douanes
                </p>
                <p className="mt-1 text-[15px] font-semibold">Déclaration Unique de Marchandises</p>
                <p className="mono text-[12.5px] text-muted-foreground">{ml.declarationNumber}</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-[12.5px]">
                <div className={`rounded-md border p-3 ${ml.identificationSource === "CASE_2" ? "border-corporate bg-soft" : "border-border"}`}>
                  <p className="label-xs">Case 2 — Exportateur</p>
                  <p className="mono mt-1 font-medium">{ml.case2Value}</p>
                </div>
                <div className={`rounded-md border p-3 ${ml.identificationSource === "CASE_8" ? "border-corporate bg-soft" : "border-border"}`}>
                  <p className="label-xs">Case 8 — Destinataire</p>
                  <p className="mono mt-1 font-medium">{ml.case8Value}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="label-xs">Case 1 — Régime</p>
                  <p className="mono mt-1 font-medium">{ml.regimeCode}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="label-xs">Date de main levée</p>
                  <p className="mono mt-1 font-medium">{formatLongDate(ml.releaseDate)}</p>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                {[80, 95, 70, 88, 60].map((w, i) => (
                  <div key={i} className="h-2 rounded bg-muted" style={{ width: `${w}%` }} />
                ))}
              </div>
              <p className="mt-6 text-center text-[11.5px] tracking-[0.08em] text-muted-foreground uppercase">
                Main levée accordée — Bureau de Casablanca Port
              </p>
            </div>
          </Surface>

          <Surface title="Données extraites" description="Lecture automatique du document par l'Agent Email.">
            <InfoRow label="Case 1 — Code régime" value={<Mono>{ml.regimeCode}</Mono>} />
            <InfoRow label="Case 2" value={<Mono>{ml.case2Value}</Mono>} />
            <InfoRow label="Case 8" value={<Mono>{ml.case8Value}</Mono>} />
            <InfoRow label="Déclaration" value={<Mono>{ml.declarationNumber}</Mono>} />
            <InfoRow label="Date" value={formatLongDate(ml.releaseDate)} />
            <InfoRow
              label="Identification retenue"
              value={<Chip tone={ml.identificationSource === "UNUSED" ? "danger" : "blue"}>{SOURCE_LABELS[ml.identificationSource]}</Chip>}
            />
            <InfoRow label="Client" value={clientName(db, ml.clientId)} />
            <InfoRow label="Confiance" value={`${ml.matchingConfidence} %`} />
          </Surface>
        </div>
      ) : null}

      {tab === "Email source" ? (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Surface title="Email source" description="Message ayant déclenché la création du dossier.">
            {email ? (
              <>
                <InfoRow label="Expéditeur" value={<Mono>{email.sender}</Mono>} />
                <InfoRow label="Destinataire" value={<Mono>{email.recipient}</Mono>} />
                <InfoRow label="Objet" value={email.subject} />
                <InfoRow label="Reçu le" value={formatDateTime(email.receivedAt)} />
                <p className="mt-4 rounded-md border border-border bg-muted/40 p-4 text-[13px] whitespace-pre-line">
                  {email.body}
                </p>
                {email.attachments.map((a) => (
                  <div key={a.name} className="mt-3 flex items-center justify-between rounded-md border border-border px-3.5 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="size-5 text-corporate" />
                      <div>
                        <p className="mono text-[13px] font-medium">{a.name}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {a.type} – {a.size}
                        </p>
                      </div>
                    </div>
                    <Btn variant="outline" size="sm" onClick={() => setTab("Document douanier")}>
                      Ouvrir
                    </Btn>
                  </div>
                ))}
              </>
            ) : (
              <EmptyState title="Aucun email rattaché" description="Ce dossier a été saisi manuellement." />
            )}
          </Surface>
          <Surface title="Analyse Agent Email">
            <InfoRow label="Classification" value={<Chip tone="blue">Main levée</Chip>} />
            <InfoRow label="Confiance" value={`${email?.confidence ?? 0} %`} />
            <InfoRow label="Pièce jointe détectée" value={email?.attachments.length ? "Oui" : "Non"} />
            <InfoRow label="Code régime" value={<Mono>{ml.regimeCode}</Mono>} />
            <InfoRow label="Source client" value={SOURCE_LABELS[ml.identificationSource]} />
            <InfoRow label="Client" value={clientName(db, ml.clientId)} />
            <InfoRow label="Déclarant" value={declarantName(db, ml.declarantId)} />
            <InfoRow label="Dossier généré" value={<Mono>{ml.reference}</Mono>} />
          </Surface>
        </div>
      ) : null}

      {/* Modales */}
      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Ajouter une note"
        description="La note sera enregistrée dans l'historique du dossier."
        footer={
          <>
            <Btn variant="outline" onClick={() => setNoteOpen(false)}>
              Annuler
            </Btn>
            <Btn
              onClick={() => {
                if (!noteText.trim()) {
                  toast.error("La note est vide.");
                  return;
                }
                addNote(ml.reference, author, noteText.trim());
                setNoteText("");
                setNoteOpen(false);
                toast.success("Note ajoutée.");
              }}
            >
              Enregistrer la note
            </Btn>
          </>
        }
      >
        <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Commentaire opérationnel..." />
      </Modal>

      <ReceptionModal
        open={receptionOpen}
        onClose={() => setReceptionOpen(false)}
        reference={ml.reference}
        client={clientName(db, ml.clientId)}
        declarant={declarantName(db, ml.declarantId)}
        depositedAt={formatDateTime(ml.depositedAt)}
        note={financeNote}
        setNote={setFinanceNote}
        onConfirm={() => {
          markAsFinanceReceived([ml.reference], author, financeNote || undefined);
          setReceptionOpen(false);
          setFinanceNote("");
          toast.success("Réception confirmée.", { description: `${ml.reference} est désormais reçu par la Finance.` });
        }}
      />

      <EditModal open={editOpen} onClose={() => setEditOpen(false)} reference={ml.reference} />
      <ResolveModal open={resolveOpen} onClose={() => setResolveOpen(false)} reference={ml.reference} />

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={declarant ? "Réaffecter le déclarant" : "Affecter un déclarant"}
        description={`Dossier ${ml.reference} — client ${clientName(db, ml.clientId)}.`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setAssignOpen(false)}>
              Annuler
            </Btn>
            <Btn
              disabled={!assignId}
              onClick={() => {
                assignDossierDeclarant(ml.reference, assignId, author);
                setAssignOpen(false);
                toast.success("Déclarant affecté.", {
                  description: `${declarantName(db, assignId)} est désormais responsable de ce dossier.`,
                });
              }}
            >
              Enregistrer l'affectation
            </Btn>
          </>
        }
      >
        <InfoRow label="Déclarant actuel" value={declarant ? declarantName(db, ml.declarantId) : "Non affecté"} />
        <div className="mt-4" />
        <Field label="Déclarant responsable">
          <select value={assignId} onChange={(e) => setAssignId(e.target.value)} className={selectClass}>
            <option value="">Sélectionner un déclarant…</option>
            {db.declarants.map((d) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName} — {d.email}
              </option>
            ))}
          </select>
        </Field>
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          L'affectation est enregistrée dans l'historique du dossier et visible par le déclarant concerné.
        </p>
      </Modal>
    </>
  );
}

export function ReceptionModal({
  open,
  onClose,
  reference,
  client,
  declarant,
  depositedAt,
  note,
  setNote,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  reference: string;
  client: string;
  declarant: string;
  depositedAt: string;
  note: string;
  setNote: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmer la réception du dossier"
      description={`Vous êtes sur le point de confirmer la réception du dossier ${reference}.`}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Annuler
          </Btn>
          <Btn variant="success" onClick={onConfirm}>
            Confirmer la réception
          </Btn>
        </>
      }
    >
      <InfoRow label="Client" value={client} />
      <InfoRow label="Déclarant" value={declarant} />
      <InfoRow label="Date de dépôt" value={depositedAt} />
      <div className="mt-4">
        <Field label="Commentaire Finance">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dossier complet." />
        </Field>
      </div>
    </Modal>
  );
}

function EditModal({ open, onClose, reference }: { open: boolean; onClose: () => void; reference: string }) {
  const db = useDB();
  const session = useSession();
  const ml = db.mainLevees.find((m) => m.reference === reference)!;
  const [clientId, setClientId] = useState(ml.clientId ?? "");
  const [declarantId, setDeclarantId] = useState(ml.declarantId ?? "");
  const [regimeCode, setRegimeCode] = useState(ml.regimeCode);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier le dossier"
      description="Les modifications sont enregistrées dans l'historique."
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Annuler
          </Btn>
          <Btn
            onClick={() => {
              const regime = db.regimes.find((r) => r.code === regimeCode);
              updateMainLevee(
                reference,
                {
                  clientId: clientId || undefined,
                  declarantId: declarantId || undefined,
                  regimeCode,
                  regimeLabel: regime?.label ?? ml.regimeLabel,
                  identificationSource: regime?.identificationSource ?? ml.identificationSource,
                  status: ml.status === "REVIEW_REQUIRED" && clientId && declarantId ? "TO_DEPOSIT" : ml.status,
                  anomaly: clientId && declarantId ? undefined : ml.anomaly,
                },
                "Informations du dossier modifiées.",
                session ? fullName(session) : "Système",
              );
              onClose();
              toast.success("Dossier mis à jour.");
            }}
          >
            Enregistrer
          </Btn>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Client">
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={selectClass}>
            <option value="">Non identifié</option>
            {db.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Déclarant affecté">
          <select value={declarantId} onChange={(e) => setDeclarantId(e.target.value)} className={selectClass}>
            <option value="">Non affecté</option>
            {db.declarants.map((d) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Code régime" hint="Le code est normalisé sur 3 chiffres.">
          <input value={regimeCode} onChange={(e) => setRegimeCode(e.target.value)} className={inputClass} />
        </Field>
      </div>
    </Modal>
  );
}

function ResolveModal({ open, onClose, reference }: { open: boolean; onClose: () => void; reference: string }) {
  const db = useDB();
  const session = useSession();
  const ml = db.mainLevees.find((m) => m.reference === reference)!;
  const match = identifyCustomer(db.clients, ml.extractedCustomerName, db.settings.autoThreshold, db.settings.manualThreshold);
  const [selected, setSelected] = useState(match.client?.id ?? "");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Résolution du dossier"
      description="Validez l'identification du client pour débloquer le dossier."
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Annuler
          </Btn>
          <Btn
            disabled={!selected}
            onClick={() => {
              resolveAnomaly(reference, selected, session ? fullName(session) : "Système");
              onClose();
              toast.success("Identification validée.", { description: "Le déclarant attitré a été affecté." });
            }}
          >
            Valider l'identification
          </Btn>
        </>
      }
    >
      <InfoRow label="Client extrait" value={<Mono>{ml.extractedCustomerName}</Mono>} />
      <p className="label-xs mt-4 mb-2">Correspondances suggérées</p>
      <ul className="space-y-2">
        {(match.candidates.length ? match.candidates : db.clients.slice(0, 5).map((c) => ({ client: c, confidence: 0 }))).map(
          (c) => (
            <li key={c.client.id}>
              <label
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors duration-150 ${
                  selected === c.client.id ? "border-corporate bg-soft" : "border-border hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="client-match"
                    checked={selected === c.client.id}
                    onChange={() => setSelected(c.client.id)}
                    className="size-4 accent-[var(--corporate)]"
                  />
                  <span>
                    <span className="block text-[13.5px] font-medium">{c.client.companyName}</span>
                    <span className="mono block text-[12px] text-muted-foreground">{c.client.code}</span>
                  </span>
                </span>
                <Chip tone={c.confidence >= 90 ? "success" : c.confidence >= 70 ? "warning" : "neutral"}>
                  {c.confidence} %
                </Chip>
              </label>
            </li>
          ),
        )}
      </ul>
      <p className="mt-3 text-[12.5px] text-muted-foreground">
        Aucun client ne correspond ? Créez-le depuis le module Clients puis revenez valider ce dossier.
      </p>
    </Modal>
  );
}
