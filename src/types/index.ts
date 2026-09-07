export type Role = "ADMIN" | "FINANCE" | "DECLARANT";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  avatar: string;
  active: boolean;
  declarantId?: string | undefined;
  lastLogin?: string | undefined;
}

export interface Client {
  id: string;
  code: string;
  companyName: string;
  aliases: string[];
  ice: string;
  email: string;
  phone: string;
  declarantId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Declarant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  active: boolean;
}

export type IdentificationSource = "CASE_2" | "CASE_8" | "UNUSED";

export interface CustomsRegime {
  code: string;
  label: string;
  category: string;
  identificationSource: IdentificationSource;
  updatedAt: string;
}

export type EmailClassification = "MAIN_LEVEE" | "IGNORED" | "UNCERTAIN";

export interface EmailRecord {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  receivedAt: string;
  attachments: { name: string; size: string; type: string }[];
  classification: EmailClassification;
  confidence: number;
  status: "PROCESSED" | "IGNORED" | "REVIEW";
  mainLeveeId?: string | undefined;
}

export type MainLeveeStatus =
  | "NEW"
  | "ANALYZING"
  | "CLIENT_IDENTIFIED"
  | "REVIEW_REQUIRED"
  | "TO_DEPOSIT"
  | "DEPOSITED"
  | "FINANCE_RECEIVED";

export type AnomalyType =
  | "CLIENT_NOT_FOUND"
  | "MULTIPLE_MATCHES"
  | "UNKNOWN_REGIME"
  | "UNUSED_REGIME"
  | "DOCUMENT_UNREADABLE"
  | "DECLARANT_NOT_ASSIGNED"
  | "EMAIL_CLASSIFICATION_UNCERTAIN";

export interface HistoryEntry {
  at: string;
  label: string;
  author?: string | undefined;
}

export interface Note {
  at: string;
  author: string;
  text: string;
}

export interface MainLevee {
  id: string;
  reference: string;
  emailId: string;
  receivedAt: string;
  releaseDate: string;
  declarationNumber: string;
  attachmentName: string;
  regimeCode: string;
  regimeLabel: string;
  case2Value: string;
  case8Value: string;
  identificationSource: IdentificationSource;
  extractedCustomerName: string;
  clientId?: string | undefined;
  matchingConfidence: number;
  declarantId?: string | undefined;
  status: MainLeveeStatus;
  anomaly?: AnomalyType | undefined;
  anomalyMessage?: string | undefined;
  deposited: boolean;
  depositedAt?: string | undefined;
  depositedBy?: string | undefined;
  receivedByFinance: boolean;
  receivedAtFinance?: string | undefined;
  receivedBy?: string | undefined;
  financeNote?: string | undefined;
  notes: Note[];
  history: HistoryEntry[];
}

export interface Notification {
  id: string;
  title: string;
  detail: string;
  at: string;
  read: boolean;
  kind: "info" | "warning" | "success";
}

export interface Settings {
  agentActive: boolean;
  watchedEmail: string;
  syncInterval: number;
  allowedSenders: string[];
  keywords: string[];
  formats: string[];
  autoThreshold: number;
  manualThreshold: number;
  normalizeNames: boolean;
  ignoreLegalSuffix: boolean;
  useAliases: boolean;
  lastSync: string;
  nextSync: string;
  notifyNewMainLevee: boolean;
  notifyAnomaly: boolean;
  notifyDeposit: boolean;
}

export interface MappingRow {
  id: string;
  values: Record<string, string>;
}

export interface MappingSheet {
  columns: string[];
  rows: MappingRow[];
  fileName?: string | undefined;
  importedAt?: string | undefined;
}

export interface DB {
  users: User[];
  clients: Client[];
  declarants: Declarant[];
  regimes: CustomsRegime[];
  emails: EmailRecord[];
  mainLevees: MainLevee[];
  notifications: Notification[];
  activity: HistoryEntry[];
  settings: Settings;
  mappings: MappingSheet;
}
