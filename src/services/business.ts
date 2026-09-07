import type {
  Client,
  CustomsRegime,
  DB,
  EmailClassification,
  IdentificationSource,
  MainLevee,
  MainLeveeStatus,
} from "@/types";

/* ---------- Formatage ---------- */

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function formatLongDate(iso?: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
}

export function formatTime(iso?: string): string {
  if (!iso) return "—";
  return iso.slice(11, 16);
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return `${formatDate(iso)} à ${formatTime(iso)}`;
}

export function nowISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ---------- Règles métier ---------- */

export function normalizeRegimeCode(code: string): string {
  const digits = (code ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(3, "0").slice(-3);
}

export function getRegimeRule(regimes: CustomsRegime[], code: string): CustomsRegime | undefined {
  return regimes.find((r) => r.code === normalizeRegimeCode(code));
}

const LEGAL_SUFFIXES = [
  "SARL AU", "S.A.R.L. AU", "SARL", "S.A.R.L.", "S.A.R.L", "SA", "S.A.",
  "SAS", "S.A.S.", "SNC", "SCS", "GIE", "LTD", "GMBH", "SL", "SPA", "AU",
];

export function normalizeCompanyName(raw: string): string {
  let name = (raw ?? "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:'"()\-_/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const suffix of LEGAL_SUFFIXES) {
    const s = suffix.replace(/[.]/g, "");
    if (name.endsWith(` ${s}`)) name = name.slice(0, -(s.length + 1)).trim();
  }
  return name.replace(/\s+/g, " ").trim();
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 100;
  const tokensA = new Set(a.split(" "));
  const tokensB = new Set(b.split(" "));
  let common = 0;
  tokensA.forEach((tk) => {
    if (tokensB.has(tk)) common += 1;
  });
  const jaccard = common / new Set([...tokensA, ...tokensB]).size;
  const containment = a.includes(b) || b.includes(a) ? 0.25 : 0;
  return Math.min(99, Math.round((jaccard + containment) * 100));
}

export interface MatchResult {
  client?: Client;
  confidence: number;
  candidates: { client: Client; confidence: number }[];
  verdict: "AUTO" | "TO_CONFIRM" | "NOT_FOUND";
}

export function identifyCustomer(
  clients: Client[],
  extractedName: string,
  autoThreshold = 90,
  manualThreshold = 70,
): MatchResult {
  const target = normalizeCompanyName(extractedName);
  const scored = clients
    .map((client) => {
      const names = [client.companyName, ...client.aliases].map(normalizeCompanyName);
      const confidence = Math.max(...names.map((n) => similarity(target, n)));
      return { client, confidence };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const best = scored[0];
  const candidates = scored.filter((c) => c.confidence >= 40).slice(0, 5);
  if (!best || best.confidence < manualThreshold) {
    return { confidence: best?.confidence ?? 0, candidates, verdict: "NOT_FOUND" };
  }
  if (best.confidence >= autoThreshold) {
    return { client: best.client, confidence: best.confidence, candidates, verdict: "AUTO" };
  }
  return { client: best.client, confidence: best.confidence, candidates, verdict: "TO_CONFIRM" };
}

export function assignDeclarant(clients: Client[], clientId?: string): string | undefined {
  return clients.find((c) => c.id === clientId)?.declarantId || undefined;
}

export function classifyEmail(
  subject: string,
  keywords: string[],
  hasAttachment: boolean,
): { classification: EmailClassification; confidence: number } {
  const s = subject.toLowerCase();
  const hit = keywords.some((k) => s.includes(k.toLowerCase()));
  if (hit && hasAttachment) return { classification: "MAIN_LEVEE", confidence: 95 + Math.floor(Math.random() * 5) };
  if (hit) return { classification: "UNCERTAIN", confidence: 62 };
  return { classification: "IGNORED", confidence: 18 };
}

/* ---------- Libellés ---------- */

export const STATUS_LABELS: Record<MainLeveeStatus, string> = {
  NEW: "Nouveau",
  ANALYZING: "Analyse en cours",
  CLIENT_IDENTIFIED: "Client identifié",
  REVIEW_REQUIRED: "À vérifier",
  TO_DEPOSIT: "À déposer",
  DEPOSITED: "Déposé",
  FINANCE_RECEIVED: "Reçu Finance",
};

export const SOURCE_LABELS: Record<IdentificationSource, string> = {
  CASE_2: "Case 2",
  CASE_8: "Case 8",
  UNUSED: "Non utilisé",
};

export const ANOMALY_LABELS: Record<string, string> = {
  CLIENT_NOT_FOUND: "Client non identifié",
  MULTIPLE_MATCHES: "Plusieurs correspondances client",
  UNKNOWN_REGIME: "Code régime inconnu",
  UNUSED_REGIME: "Code régime non exploitable",
  DOCUMENT_UNREADABLE: "Document illisible",
  DECLARANT_NOT_ASSIGNED: "Aucun déclarant affecté",
  EMAIL_CLASSIFICATION_UNCERTAIN: "Classification email incertaine",
};

export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  FINANCE: "Finance",
  DECLARANT: "Déclarant",
} as const;

/* ---------- Sélecteurs ---------- */

export const clientName = (db: DB, id?: string) =>
  db.clients.find((c) => c.id === id)?.companyName ?? "Non identifié";

export const declarantName = (db: DB, id?: string) => {
  const d = db.declarants.find((x) => x.id === id);
  return d ? `${d.firstName} ${d.lastName}` : "Non affecté";
};

export const todayList = (db: DB, today: string) =>
  db.mainLevees.filter((m) => m.releaseDate === today);

export function generateFinanceDailyList(db: DB, date: string) {
  return db.mainLevees.filter((m) => m.releaseDate === date);
}

export function generateDeclarantDailyList(db: DB, declarantId: string, date?: string) {
  return db.mainLevees.filter(
    (m) => m.declarantId === declarantId && (!date || m.releaseDate === date),
  );
}

/* ---------- Export ---------- */

export function toCSV(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = "\uFEFF" + toCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMainLevees(db: DB, list: MainLevee[], filename = "globitrans-dossiers.csv") {
  const rows: (string | number)[][] = [
    ["Date", "Référence", "Client", "Code régime", "Source identification", "Déclarant", "Déposé", "Date dépôt", "Reçu", "Date réception"],
    ...list.map((m) => [
      formatDate(m.releaseDate),
      m.reference,
      clientName(db, m.clientId),
      m.regimeCode,
      SOURCE_LABELS[m.identificationSource],
      declarantName(db, m.declarantId),
      m.deposited ? "Oui" : "Non",
      m.depositedAt ? formatDateTime(m.depositedAt) : "",
      m.receivedByFinance ? "Oui" : "Non",
      m.receivedAtFinance ? formatDateTime(m.receivedAtFinance) : "",
    ]),
  ];
  downloadCSV(filename, rows);
}
