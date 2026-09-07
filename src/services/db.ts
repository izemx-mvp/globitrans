import { useSyncExternalStore } from "react";
import { seedDB, TODAY } from "@/data/seed";
import type {
  Client,
  CustomsRegime,
  DB,
  Declarant,
  EmailRecord,
  IdentificationSource,
  MainLevee,
  Settings,
} from "@/types";
import { identifyCustomer, nowISO } from "./business";

const KEY = "globitrans.db.v1";

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* ignore */
  }
  return seedDB();
}

let state: DB = typeof window === "undefined" ? seedDB() : load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function commit(next: DB) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const getSnapshot = () => state;

export function useDB(): DB {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const getDB = () => state;

function logActivity(next: DB, label: string, author: string) {
  next.activity = [{ at: nowISO(), label, author }, ...next.activity].slice(0, 60);
}

function notify(next: DB, title: string, detail: string, kind: "info" | "warning" | "success") {
  next.notifications = [
    { id: `NTF-${Math.random().toString(36).slice(2, 8)}`, title, detail, at: nowISO(), read: false, kind },
    ...next.notifications,
  ].slice(0, 40);
}

function patchMainLevees(
  next: DB,
  refs: string[],
  fn: (ml: MainLevee) => MainLevee,
): DB {
  next.mainLevees = next.mainLevees.map((m) => (refs.includes(m.reference) ? fn({ ...m }) : m));
  return next;
}

/* ---------- Dossiers ---------- */

export function markAsDeposited(refs: string[], author: string) {
  const next = structuredClone(state);
  const at = nowISO();
  patchMainLevees(next, refs, (m) => {
    m.deposited = true;
    m.depositedAt = at;
    m.depositedBy = author;
    m.status = "DEPOSITED";
    m.history = [...m.history, { at, label: "Dossier déposé auprès du département Finance.", author }];
    return m;
  });
  logActivity(next, `${author} a déposé ${refs.length} dossier${refs.length > 1 ? "s" : ""}.`, author);
  notify(next, `${refs.length} dossier(s) déposé(s)`, `Dépôt effectué par ${author}.`, "success");
  commit(next);
}

export function markAsFinanceReceived(refs: string[], author: string, note?: string) {
  const next = structuredClone(state);
  const at = nowISO();
  patchMainLevees(next, refs, (m) => {
    m.receivedByFinance = true;
    m.receivedAtFinance = at;
    m.receivedBy = author;
    m.status = "FINANCE_RECEIVED";
    if (!m.deposited) {
      m.deposited = true;
      m.depositedAt = at;
    }
    if (note) m.financeNote = note;
    m.history = [
      ...m.history,
      { at, label: `Réception confirmée par ${author}.${note ? ` Commentaire : ${note}` : ""}`, author },
    ];
    return m;
  });
  refs.forEach((r) => logActivity(next, `Dossier ${r} reçu par Finance.`, author));
  commit(next);
}

export function reverseReception(reference: string, author: string) {
  const next = structuredClone(state);
  const at = nowISO();
  patchMainLevees(next, [reference], (m) => {
    m.receivedByFinance = false;
    delete m.receivedAtFinance;
    delete m.receivedBy;
    delete m.financeNote;
    m.status = "DEPOSITED";
    m.history = [...m.history, { at, label: "Réception Finance annulée.", author }];
    return m;
  });
  logActivity(next, `Réception du dossier ${reference} annulée.`, author);
  commit(next);
}

export function addNote(reference: string, author: string, text: string) {
  const next = structuredClone(state);
  const at = nowISO();
  patchMainLevees(next, [reference], (m) => {
    m.notes = [...m.notes, { at, author, text }];
    m.history = [...m.history, { at, label: `Note ajoutée : ${text}`, author }];
    return m;
  });
  commit(next);
}

export function updateMainLevee(
  reference: string,
  patch: Partial<MainLevee>,
  historyLabel: string,
  author: string,
) {
  const next = structuredClone(state);
  const at = nowISO();
  patchMainLevees(next, [reference], (m) => {
    Object.assign(m, patch);
    m.history = [...m.history, { at, label: historyLabel, author }];
    return m;
  });
  logActivity(next, `${historyLabel} (${reference})`, author);
  commit(next);
}

export function resolveAnomaly(reference: string, clientId: string, author: string) {
  const next = structuredClone(state);
  const at = nowISO();
  const client = next.clients.find((c) => c.id === clientId);
  patchMainLevees(next, [reference], (m) => {
    m.clientId = clientId;
    m.matchingConfidence = 100;
    m.extractedCustomerName = m.extractedCustomerName === "—" ? client?.companyName ?? "" : m.extractedCustomerName;
    m.declarantId = client?.declarantId;
    delete m.anomaly;
    delete m.anomalyMessage;
    m.status = m.deposited ? (m.receivedByFinance ? "FINANCE_RECEIVED" : "DEPOSITED") : "TO_DEPOSIT";
    m.history = [
      ...m.history,
      { at, label: `Identification validée manuellement : ${client?.companyName}.`, author },
      { at, label: `Déclarant affecté selon le référentiel client.`, author },
    ];
    return m;
  });
  logActivity(next, `Anomalie résolue sur ${reference}.`, author);
  commit(next);
}

/* ---------- Référentiels ---------- */

export function upsertClient(client: Client) {
  const next = structuredClone(state);
  const idx = next.clients.findIndex((c) => c.id === client.id);
  if (idx >= 0) next.clients[idx] = { ...client, updatedAt: nowISO() };
  else next.clients = [{ ...client, createdAt: nowISO(), updatedAt: nowISO() }, ...next.clients];
  logActivity(next, `Client ${client.companyName} ${idx >= 0 ? "modifié" : "créé"}.`, "Référentiel");
  commit(next);
}

export function deleteClient(id: string) {
  const next = structuredClone(state);
  next.clients = next.clients.filter((c) => c.id !== id);
  commit(next);
}

export function upsertDeclarant(declarant: Declarant) {
  const next = structuredClone(state);
  const idx = next.declarants.findIndex((d) => d.id === declarant.id);
  if (idx >= 0) next.declarants[idx] = declarant;
  else next.declarants = [declarant, ...next.declarants];
  commit(next);
}

export function updateRegime(code: string, source: IdentificationSource, author: string) {
  const next = structuredClone(state);
  next.regimes = next.regimes.map((r): CustomsRegime =>
    r.code === code ? { ...r, identificationSource: source, updatedAt: nowISO() } : r,
  );
  logActivity(next, `Règle d'identification du code ${code} modifiée.`, author);
  commit(next);
}

export function updateSettings(patch: Partial<Settings>) {
  const next = structuredClone(state);
  next.settings = { ...next.settings, ...patch };
  commit(next);
}

/* ---------- Notifications ---------- */

export function markNotificationRead(id?: string) {
  const next = structuredClone(state);
  next.notifications = next.notifications.map((n) =>
    !id || n.id === id ? { ...n, read: true } : n,
  );
  commit(next);
}

/* ---------- Agent Email ---------- */

const SYNC_SENDERS = ["notifications@douane.mock", "declarations@douane.mock"];

export function syncEmails(author: string): { analyzed: number; detected: number } {
  const next = structuredClone(state);
  const at = nowISO();
  const time = at.slice(11, 16);
  const maxRef = next.mainLevees.reduce(
    (acc, m) => Math.max(acc, Number(m.reference.split("-")[2] ?? 0)),
    0,
  );
  const detected = 2;
  const analyzed = 3;
  const newEmails: EmailRecord[] = [];

  for (let i = 0; i < detected; i++) {
    const client = next.clients[(maxRef + i) % next.clients.length]!;
    const refNum = maxRef + 1 + i;
    const reference = `ML-2026-${String(refNum).padStart(5, "0")}`;
    const dum = `DUM-2026-${48700 + refNum - 900}`;
    const emailId = `EML-SYNC-${refNum}`;
    const match = identifyCustomer(next.clients, client.companyName, next.settings.autoThreshold, next.settings.manualThreshold);
    const regime = next.regimes.find((r) => r.code === "010")!;

    newEmails.push({
      id: emailId,
      sender: SYNC_SENDERS[i % SYNC_SENDERS.length]!,
      recipient: next.settings.watchedEmail,
      subject: `Main levée – ${dum.replace("DUM-", "").replace("-", "/")}`,
      body: `La main levée du dossier ${dum} a été accordée. Document en pièce jointe.`,
      receivedAt: at,
      attachments: [{ name: `ML_${dum.replace("DUM-2026-", "")}.pdf`, size: "412 KB", type: "PDF" }],
      classification: "MAIN_LEVEE",
      confidence: 97,
      status: "PROCESSED",
      mainLeveeId: reference,
    });

    next.mainLevees = [
      {
        id: reference,
        reference,
        emailId,
        receivedAt: at,
        releaseDate: at.slice(0, 10),
        declarationNumber: dum,
        attachmentName: `ML_${dum.replace("DUM-2026-", "")}.pdf`,
        regimeCode: "010",
        regimeLabel: regime.label,
        case2Value: "EXPORT MAROC SA",
        case8Value: client.companyName.toUpperCase(),
        identificationSource: "CASE_8",
        extractedCustomerName: client.companyName.toUpperCase(),
        clientId: match.client?.id,
        matchingConfidence: match.confidence,
        declarantId: match.client?.declarantId,
        status: "TO_DEPOSIT",
        deposited: false,
        receivedByFinance: false,
        notes: [],
        history: [
          { at, label: "Email reçu depuis la boîte opérations.", author: "Agent Email" },
          { at, label: "Main levée identifiée par l'Agent Email.", author: "Agent Email" },
          { at, label: "Code régime 010 détecté en case 1.", author: "Agent Email" },
          { at, label: "Règle Case 8 appliquée pour l'identification du client.", author: "Agent Email" },
          { at, label: `${client.companyName} identifié avec ${match.confidence} % de confiance.`, author: "Agent Email" },
          { at, label: "Déclarant attitré affecté automatiquement.", author: "Agent Email" },
        ],
      },
      ...next.mainLevees,
    ];
  }

  newEmails.push({
    id: `EML-SYNC-IGN-${maxRef}`,
    sender: "news@logistique-mock.demo",
    recipient: next.settings.watchedEmail,
    subject: "Actualités logistiques de la semaine",
    body: "Message hors périmètre.",
    receivedAt: at,
    attachments: [],
    classification: "IGNORED",
    confidence: 14,
    status: "IGNORED",
  });

  next.emails = [...newEmails, ...next.emails];
  next.settings = {
    ...next.settings,
    lastSync: at,
    nextSync: `${at.slice(0, 11)}${String(Number(at.slice(11, 13))).padStart(2, "0")}:${String(
      (Number(at.slice(14, 16)) + next.settings.syncInterval) % 60,
    ).padStart(2, "0")}:00`,
  };
  logActivity(next, `${detected} nouvelles mains levées détectées à ${time}.`, author);
  notify(next, `${detected} nouvelles mains levées détectées`, `${analyzed} emails analysés par l'Agent Email.`, "info");
  commit(next);
  return { analyzed, detected };
}

/* ---------- Démo ---------- */

export function resetDemoData() {
  commit(seedDB());
}

export { TODAY };
