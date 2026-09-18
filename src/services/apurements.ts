import { useSyncExternalStore } from "react";
import { seedApurements } from "@/data/apurements-seed";
import type {
  ApurementFile,
  ApurementLine,
  ApurementRecord,
  CompositionItem,
  ApurementState,
  SearchCriteria,
  SearchPriority,
  Solution,
} from "@/types/apurements";

const KEY = "globitrans.apurements.v2";

function load(): ApurementState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const stored = JSON.parse(raw) as ApurementState;
      if (stored.lastSearch) {
        stored.lastSearch.criteria = { ...defaultCriteria(), ...stored.lastSearch.criteria };
      }
      return stored;
    }
  } catch {
    /* ignore */
  }
  return seedApurements();
}

let state: ApurementState = typeof window === "undefined" ? seedApurements() : load();
const listeners = new Set<() => void>();

function commit(next: ApurementState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const getSnapshot = () => state;

export function useApurements(): ApurementState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const getApurements = () => state;

/* ---------- Formatage ---------- */

export const formatWeight = (kg: number) =>
  `${kg.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`;

export const formatValue = (eur: number) =>
  `${eur.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;

export const formatDelta = (n: number, unit: "kg" | "€") =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} ${unit}`;

export const LINE_STATUS_LABELS: Record<ApurementLine["status"], string> = {
  AVAILABLE: "Disponible",
  PRESELECTED: "Présélectionnée",
  CLEARED: "Apurée",
};

export const PRIORITY_LABELS: Record<SearchPriority, string> = {
  EXACT_MIN_LINES: "Correspondance exacte + minimum de lignes",
  MIN_LINES: "Utiliser le moins de lignes possible",
  OLDEST: "Prioriser les lignes les plus anciennes",
  NEWEST: "Prioriser les lignes les plus récentes",
  CLOSEST: "Combinaison la plus proche de l'objectif",
};

/* ---------- Articles et matières premières ---------- */

export const ARTICLES = ["Chemise", "Pantalon", "Veste", "T-shirt", "Pull", "Jupe", "Robe", "Autre"] as const;

export const RAW_MATERIALS = ["Coton", "Polyester", "Viscose", "Laine", "Élasthanne", "Lin", "Autre"] as const;

export function newCompositionItem(material = "", percentage = 0): CompositionItem {
  return { id: `CMP-${Math.random().toString(36).slice(2, 9)}`, material, percentage };
}

export function compositionTotal(items: CompositionItem[]): number {
  return Math.round(items.reduce((a, i) => a + (Number(i.percentage) || 0), 0) * 100) / 100;
}

/** Retourne le message d'erreur bloquant, ou null si la composition est valide. */
export function compositionError(items: CompositionItem[]): string | null {
  const filled = items.filter((i) => i.material.trim());
  if (!filled.length) return "Ajoutez au moins une matière première.";
  const seen = new Set<string>();
  for (const i of filled) {
    if (seen.has(i.material)) return `La matière première « ${i.material} » est saisie deux fois.`;
    seen.add(i.material);
    if (!(Number(i.percentage) > 0)) return `Renseignez un pourcentage pour « ${i.material} ».`;
  }
  const total = compositionTotal(filled);
  if (total > 100) return `Le total de la composition dépasse 100 % (${total} %).`;
  if (total < 100) return `Le total de la composition doit atteindre 100 % (actuellement ${total} %).`;
  return null;
}

export function defaultCriteria(): SearchCriteria {
  return {
    material: "Chemise",
    composition: [newCompositionItem("Coton", 70), newCompositionItem("Polyester", 30)],
    targetWeight: 100,
    targetValue: 1000,
    weightTolerance: 0,
    valueTolerance: 0,
    client: "",
    reference: "",
    regimeCode: "",
    declarant: "",
    source: "",
    dateFrom: "",
    dateTo: "",
    lineStatus: "",
    priority: "EXACT_MIN_LINES",
    rules: [],
  };
}

/* ---------- Filtrage ---------- */

export function filterLines(lines: ApurementLine[], c: SearchCriteria): ApurementLine[] {
  const ref = c.reference.trim().toLowerCase();
  return lines.filter((l) => {
    if (c.lineStatus ? l.status !== c.lineStatus : l.status === "CLEARED") return false;
    if (c.client && l.client !== c.client) return false;
    if (c.regimeCode && l.regimeCode !== c.regimeCode) return false;
    if (c.declarant && l.declarant !== c.declarant) return false;
    if (c.source && l.source !== c.source) return false;
    if (ref && !l.reference.toLowerCase().includes(ref)) return false;
    if (c.dateFrom && l.date < c.dateFrom) return false;
    if (c.dateTo && l.date > c.dateTo) return false;
    const comp = (c.composition ?? []).map((i) => i.material.trim().toLowerCase()).filter(Boolean);
    if (comp.length && !comp.includes(getLineMaterial(l).toLowerCase())) return false;
    for (const rule of c.rules) {
      if (!rule.column || !rule.value.trim()) continue;
      const raw = String(l.extra[rule.column] ?? "").toLowerCase();
      const target = rule.value.trim().toLowerCase();
      if (rule.operator === "eq" && raw !== target) return false;
      if (rule.operator === "neq" && raw === target) return false;
      if (rule.operator === "contains" && !raw.includes(target)) return false;
    }
    return true;
  });
}

export function getLineMaterial(line: ApurementLine): string {
  const entry = Object.entries(line.extra).find(([key]) => {
    const normalized = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return normalized === "matiere" || normalized === "type marchandise";
  });
  return String(entry?.[1] ?? "Autre").trim() || "Autre";
}

/* ---------- Moteur déterministe de recherche de combinaisons ---------- */

const MAX_LINES = 8;
const NODE_BUDGET = 600_000;

function score(dw: number, dv: number, tw: number, tv: number) {
  return Math.abs(dw) / Math.max(tw, 1) + Math.abs(dv) / Math.max(tv, 1);
}

function avgTime(lines: ApurementLine[]) {
  return lines.reduce((a, l) => a + new Date(`${l.date}T12:00:00`).getTime(), 0) / Math.max(lines.length, 1);
}

export interface SearchResult {
  solutions: Solution[];
  exactFound: boolean;
  scanned: number;
}

/**
 * Recherche déterministe (aucun calcul approximatif) de sous-ensembles de lignes
 * dont la somme des poids et la somme des valeurs atteignent les objectifs.
 * Les calculs sont réalisés en grammes et en centimes afin d'éviter toute
 * imprécision de virgule flottante.
 */
export function searchCombinations(lines: ApurementLine[], c: SearchCriteria): SearchResult {
  const pool = filterLines(lines, c);

  const sorted = [...pool].sort((a, b) => {
    if (c.priority === "OLDEST") return a.date.localeCompare(b.date) || b.weight - a.weight;
    if (c.priority === "NEWEST") return b.date.localeCompare(a.date) || b.weight - a.weight;
    return b.weight - a.weight;
  });

  const W = sorted.map((l) => Math.round(l.weight * 1000));
  const V = sorted.map((l) => Math.round(l.value * 100));
  const tw = Math.round(c.targetWeight * 1000);
  const tv = Math.round(c.targetValue * 100);
  const tolW = Math.round(Math.max(c.weightTolerance, 0) * 1000);
  const tolV = Math.round(Math.max(c.valueTolerance, 0) * 100);
  const maxW = tw + tolW;
  const maxV = tv + tolV;

  const found: { path: number[]; w: number; v: number }[] = [];
  const near: { path: number[]; w: number; v: number; s: number }[] = [];
  const path: number[] = [];
  let nodes = 0;

  const evaluate = (w: number, v: number) => {
    const dw = w - tw;
    const dv = v - tv;
    if (Math.abs(dw) <= tolW && Math.abs(dv) <= tolV) {
      if (found.length < 60) found.push({ path: [...path], w, v });
      return;
    }
    const s = score(dw / 1000, dv / 100, c.targetWeight, c.targetValue);
    if (near.length < 12) {
      near.push({ path: [...path], w, v, s });
      near.sort((a, b) => a.s - b.s || a.path.length - b.path.length);
    } else if (near.at(-1) && s < (near.at(-1)?.s ?? Number.POSITIVE_INFINITY)) {
      near[near.length - 1] = { path: [...path], w, v, s };
      near.sort((a, b) => a.s - b.s || a.path.length - b.path.length);
    }
  };

  const dfs = (start: number, w: number, v: number) => {
    if (nodes > NODE_BUDGET) return;
    if (path.length >= MAX_LINES) return;
    for (let j = start; j < W.length; j++) {
      const nw = w + W[j]!;
      const nv = v + V[j]!;
      if (nw > maxW || nv > maxV) continue;
      nodes++;
      if (nodes > NODE_BUDGET) return;
      path.push(j);
      evaluate(nw, nv);
      dfs(j + 1, nw, nv);
      path.pop();
    }
  };

  dfs(0, 0, 0);

  const build = (entry: { path: number[]; w: number; v: number }, i: number): Solution => {
    const picked = entry.path.map((idx) => sorted[idx]!);
    const weight = entry.w / 1000;
    const value = entry.v / 100;
    return {
      id: `SOL-${i + 1}`,
      lineIds: picked.map((l) => l.id),
      weight,
      value,
      targetWeight: c.targetWeight,
      targetValue: c.targetValue,
      deltaWeight: Number((weight - c.targetWeight).toFixed(3)),
      deltaValue: Number((value - c.targetValue).toFixed(2)),
      exact: entry.w === tw && entry.v === tv,
    };
  };

  const source = found.length ? found : near;
  const lineById = new Map(sorted.map((l) => [l.id, l] as const));

  const candidates = source.map((e, i) => build(e, i));
  const dedup = new Map<string, Solution>();
  for (const s of candidates) {
    const key = [...s.lineIds].sort().join("|");
    if (!dedup.has(key)) dedup.set(key, s);
  }

  const sortedSolutions = [...dedup.values()].sort((a, b) => {
    const sa = score(a.deltaWeight, a.deltaValue, c.targetWeight, c.targetValue);
    const sb = score(b.deltaWeight, b.deltaValue, c.targetWeight, c.targetValue);
    const linesA = a.lineIds.map((id) => lineById.get(id)!);
    const linesB = b.lineIds.map((id) => lineById.get(id)!);
    switch (c.priority) {
      case "MIN_LINES":
        return a.lineIds.length - b.lineIds.length || sa - sb;
      case "OLDEST":
        return avgTime(linesA) - avgTime(linesB) || sa - sb || a.lineIds.length - b.lineIds.length;
      case "NEWEST":
        return avgTime(linesB) - avgTime(linesA) || sa - sb || a.lineIds.length - b.lineIds.length;
      case "CLOSEST":
        return sa - sb || a.lineIds.length - b.lineIds.length;
      default:
        return Number(b.exact) - Number(a.exact) || a.lineIds.length - b.lineIds.length || sa - sb;
    }
  });

  const solutions = sortedSolutions.slice(0, 5).map((s, i) => ({ ...s, id: `SOL-${i + 1}` }));
  return { solutions, exactFound: solutions.some((s) => s.exact), scanned: pool.length };
}

/* ---------- Actions ---------- */

export function runSearch(criteria: SearchCriteria): SearchResult {
  const activeFileId = state.files[0]?.id;
  const activeLines = activeFileId ? state.lines.filter((line) => line.fileId === activeFileId) : state.lines;
  const result = searchCombinations(activeLines, criteria);
  const next = structuredClone(state);
  next.lastSearch = {
    criteria,
    solutions: result.solutions,
    fileId: next.files[0]?.id ?? "",
    at: new Date().toISOString(),
  };
  const ids = new Set(result.solutions.flatMap((s) => s.lineIds));
  next.lines = next.lines.map((l) =>
    l.status === "CLEARED" ? l : { ...l, status: ids.has(l.id) ? "PRESELECTED" : "AVAILABLE" },
  );
  commit(next);
  return result;
}

function nextNumber(records: ApurementRecord[]) {
  const max = records.reduce((acc, r) => {
    const n = Number(r.number.split("-")[2] ?? 0);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 124);
  return `APU-${new Date().getFullYear()}-${String(max + 1).padStart(5, "0")}`;
}

export function validateApurement(solution: Solution, user: string): ApurementRecord {
  const next = structuredClone(state);
  const picked = next.lines.filter((l) => solution.lineIds.includes(l.id));
  const criteria = next.lastSearch?.criteria;
  const file = next.files.find((f) => f.id === (next.lastSearch?.fileId ?? next.files[0]?.id));

  const record: ApurementRecord = {
    number: nextNumber(next.records),
    at: new Date().toISOString().slice(0, 19),
    fileId: file?.id ?? "",
    fileName: file?.name ?? "—",
    client: criteria?.client || (new Set(picked.map((l) => l.client)).size === 1 ? picked[0]?.client ?? "—" : "Multi-clients"),
    regimeCode: criteria?.regimeCode || (new Set(picked.map((l) => l.regimeCode)).size === 1 ? picked[0]?.regimeCode ?? "—" : "Multi-régimes"),
    targetWeight: solution.targetWeight,
    obtainedWeight: solution.weight,
    targetValue: solution.targetValue,
    obtainedValue: solution.value,
    lineIds: [...solution.lineIds],
    exact: solution.exact,
    user,
  };

  next.records = [record, ...next.records];
  next.lines = next.lines.map((l) =>
    solution.lineIds.includes(l.id) ? { ...l, status: "CLEARED" } : l.status === "PRESELECTED" ? { ...l, status: "AVAILABLE" } : l,
  );
  next.lastSearch = null;
  commit(next);
  return record;
}

export function importLines(file: ApurementFile, lines: ApurementLine[]) {
  const next = structuredClone(state);
  next.files = [file, ...next.files.filter((f) => f.id !== file.id)];
  next.lines = [...lines, ...next.lines];
  next.lastSearch = null;
  commit(next);
}

export function clearSearch() {
  if (!state.lastSearch) return;
  const next = structuredClone(state);
  next.lastSearch = null;
  next.lines = next.lines.map((l) => (l.status === "PRESELECTED" ? { ...l, status: "AVAILABLE" } : l));
  commit(next);
}

/* ---------- Import Excel / CSV ---------- */

const HEADER_MAP: Record<keyof Omit<ApurementLine, "id" | "fileId" | "status" | "extra">, string[]> = {
  reference: ["reference", "référence", "ref", "dossier", "numero", "numéro"],
  client: ["client", "societe", "société", "importateur"],
  regimeCode: ["code regime", "code régime", "regime", "régime"],
  date: ["date"],
  weight: ["poids", "poids net", "weight", "kg"],
  value: ["valeur", "montant", "value"],
  declarant: ["declarant", "déclarant"],
  source: ["source"],
};

const norm = (s: string) => s.toString().trim().toLowerCase().replace(/\s+/g, " ");

function matchColumn(headers: string[], keys: string[]) {
  return headers.find((h) => keys.some((k) => norm(h) === k)) ?? headers.find((h) => keys.some((k) => norm(h).includes(k)));
}

function toNumber(raw: unknown): number {
  if (typeof raw === "number") return raw;
  const cleaned = String(raw ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toDate(raw: unknown): string {
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  const s = String(raw ?? "").trim();
  const fr = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(s);
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

export async function parseImportedFile(file: File): Promise<{ meta: ApurementFile; lines: ApurementLine[] }> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  if (!sheet) throw new Error("Fichier vide");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!rows.length) throw new Error("Aucune ligne détectée dans le fichier.");

  const headers = Object.keys(rows[0]!);
  const cols = Object.fromEntries(
    Object.entries(HEADER_MAP).map(([field, keys]) => [field, matchColumn(headers, keys)]),
  ) as Record<string, string | undefined>;

  const usedHeaders = new Set(Object.values(cols).filter(Boolean) as string[]);
  const extraHeaders = headers.filter((h) => !usedHeaders.has(h));
  const fileId = `FIC-${Date.now()}`;

  const lines: ApurementLine[] = rows.map((row, i) => ({
    id: `LGN-${fileId}-${i}`,
    fileId,
    reference: String(row[cols["reference"] ?? ""] ?? `LIGNE-${i + 1}`),
    client: String(row[cols["client"] ?? ""] ?? "—"),
    regimeCode: String(row[cols["regimeCode"] ?? ""] ?? "—"),
    date: toDate(row[cols["date"] ?? ""]),
    weight: toNumber(row[cols["weight"] ?? ""]),
    value: toNumber(row[cols["value"] ?? ""]),
    declarant: String(row[cols["declarant"] ?? ""] ?? "—"),
    source: String(row[cols["source"] ?? ""] || "Import Excel"),
    status: "AVAILABLE",
    extra: Object.fromEntries(extraHeaders.map((h) => [h, String(row[h] ?? "")])),
  }));

  return {
    meta: {
      id: fileId,
      name: file.name,
      rows: lines.length,
      importedAt: new Date().toISOString().slice(0, 10),
      status: "READY",
      columns: headers,
    },
    lines,
  };
}

/* ---------- Export Excel ---------- */

export async function exportApurement(opts: {
  filename: string;
  reference: string;
  date: string;
  targetWeight: number;
  targetValue: number;
  obtainedWeight: number;
  obtainedValue: number;
  lines: ApurementLine[];
}) {
  const XLSX = await import("xlsx");
  const head: (string | number)[][] = [
    ["Référence apurement", opts.reference],
    ["Date", opts.date],
    ["Poids cible (kg)", opts.targetWeight],
    ["Poids obtenu (kg)", opts.obtainedWeight],
    ["Écart poids (kg)", Number((opts.obtainedWeight - opts.targetWeight).toFixed(3))],
    ["Valeur cible (€)", opts.targetValue],
    ["Valeur obtenue (€)", opts.obtainedValue],
    ["Écart valeur (€)", Number((opts.obtainedValue - opts.targetValue).toFixed(2))],
    ["Lignes utilisées", opts.lines.length],
    [],
    ["Référence", "Matière", "Client", "Code régime", "Date", "Poids (kg)", "Valeur (€)", "Déclarant", "Source", "Statut"],
    ...opts.lines.map((l) => [
      l.reference,
      getLineMaterial(l),
      l.client,
      l.regimeCode,
      l.date,
      l.weight,
      l.value,
      l.declarant,
      l.source,
      LINE_STATUS_LABELS[l.status],
    ]),
    [
      "TOTAL",
      "",
      "",
      "",
      Number(opts.lines.reduce((a, l) => a + l.weight, 0).toFixed(3)),
      Number(opts.lines.reduce((a, l) => a + l.value, 0).toFixed(2)),
      "",
      "",
      "",
    ],
  ];
  const ws = XLSX.utils.aoa_to_sheet(head);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Apurement");
  XLSX.writeFile(wb, opts.filename);
}

/* ---------- Analyse de la demande en langage naturel (déterministe) ---------- */

export function parseNaturalRequest(
  text: string,
  known: { materials: string[] },
): { patch: Partial<SearchCriteria>; summary: string[] } {
  const t = text.toLowerCase();
  const patch: Partial<SearchCriteria> = {};
  const summary: string[] = [];
  const material = known.materials.find((value) => t.includes(value.toLowerCase()));
  if (material) {
    patch.material = material;
    summary.push(`Matière : ${material}`);
  }


  const num = (raw: string) => Number(raw.replace(/[  ]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));

  const weight = /([\d  .,]+)\s*(kg|kilos?|kilogrammes?)/.exec(t);
  if (weight) {
    patch.targetWeight = num(weight[1]!);
    summary.push(`Poids cible : ${formatWeight(patch.targetWeight)}`);
  }

  const value = /([\d  .,]+)\s*(€|eur|euros?|dh|mad|dirhams?)/.exec(t);
  if (value) {
    patch.targetValue = num(value[1]!);
    summary.push(`Valeur cible : ${formatValue(patch.targetValue)}`);
  }

  const tol = /(?:tolérance|tolerance|±|\+\/-)\s*([\d.,]+)\s*(kg|€)?/.exec(t);
  if (tol) {
    const v = num(tol[1]!);
    if (tol[2] === "€") patch.valueTolerance = v;
    else patch.weightTolerance = v;
    summary.push(`Tolérance : ± ${v} ${tol[2] ?? "kg"}`);
  }

  return { patch, summary };
}
