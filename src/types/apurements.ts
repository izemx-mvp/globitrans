export type ApurementLineStatus = "AVAILABLE" | "PRESELECTED" | "CLEARED";

export interface ApurementLine {
  id: string;
  fileId: string;
  reference: string;
  client: string;
  regimeCode: string;
  /** ISO yyyy-mm-dd */
  date: string;
  /** kg */
  weight: number;
  /** € */
  value: number;
  declarant: string;
  source: string;
  status: ApurementLineStatus;
  /** Colonnes additionnelles détectées dans le fichier importé */
  extra: Record<string, string>;
}

export interface ApurementFile {
  id: string;
  name: string;
  rows: number;
  /** ISO yyyy-mm-dd */
  importedAt: string;
  status: "READY";
  columns: string[];
}

export type SearchPriority = "EXACT_MIN_LINES" | "MIN_LINES" | "OLDEST" | "NEWEST" | "CLOSEST";

export interface ExtraRule {
  id: string;
  column: string;
  operator: "eq" | "neq" | "contains";
  value: string;
}

/** Une ligne de composition : matière première + pourcentage. */
export interface CompositionItem {
  id: string;
  material: string;
  percentage: number;
}

export interface SearchCriteria {
  /** Article recherché (Chemise, Pantalon, ...). */
  material: string;
  /** Composition en matières premières de l'article. */
  composition: CompositionItem[];
  targetWeight: number;
  targetValue: number;
  weightTolerance: number;
  valueTolerance: number;
  client: string;
  reference: string;
  regimeCode: string;
  declarant: string;
  source: string;
  dateFrom: string;
  dateTo: string;
  lineStatus: "" | ApurementLineStatus;
  priority: SearchPriority;
  rules: ExtraRule[];
}

export interface Solution {
  id: string;
  lineIds: string[];
  weight: number;
  value: number;
  targetWeight: number;
  targetValue: number;
  deltaWeight: number;
  deltaValue: number;
  exact: boolean;
}

export interface ApurementRecord {
  number: string;
  /** ISO datetime */
  at: string;
  fileId: string;
  fileName: string;
  client: string;
  regimeCode: string;
  targetWeight: number;
  obtainedWeight: number;
  targetValue: number;
  obtainedValue: number;
  lineIds: string[];
  exact: boolean;
  user: string;
}

export interface LastSearch {
  criteria: SearchCriteria;
  solutions: Solution[];
  fileId: string;
  at: string;
}

export interface ApurementState {
  files: ApurementFile[];
  lines: ApurementLine[];
  records: ApurementRecord[];
  lastSearch: LastSearch | null;
}
