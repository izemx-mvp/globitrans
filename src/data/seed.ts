import { REGIMES } from "./regimes";
import { defaultMappingSheet } from "./mappings";
import type {
  Client,
  DB,
  Declarant,
  EmailRecord,
  HistoryEntry,
  MainLevee,
  MainLeveeStatus,
  Notification,
  User,
} from "@/types";

export const TODAY = "2026-09-07";
export const TODAY_LABEL = "07 septembre 2026";

const t = (date: string, hh: number, mm: number) =>
  `${date}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;

export const declarants: Declarant[] = [
  { id: "DEC-01", firstName: "Youssef", lastName: "El Amrani", email: "y.elamrani@globitrans.demo", phone: "+212 5 22 45 11 02", avatar: "YE", active: true },
  { id: "DEC-02", firstName: "Amine", lastName: "Berrada", email: "a.berrada@globitrans.demo", phone: "+212 5 22 45 11 08", avatar: "AB", active: true },
  { id: "DEC-03", firstName: "Mehdi", lastName: "Alaoui", email: "m.alaoui@globitrans.demo", phone: "+212 5 22 45 11 14", avatar: "MA", active: true },
  { id: "DEC-04", firstName: "Salma", lastName: "Idrissi", email: "s.idrissi@globitrans.demo", phone: "+212 5 22 45 11 21", avatar: "SI", active: true },
  { id: "DEC-05", firstName: "Omar", lastName: "Bennani", email: "o.bennani@globitrans.demo", phone: "+212 5 22 45 11 33", avatar: "OB", active: true },
];

export const users: User[] = [
  { id: "USR-01", firstName: "Karim", lastName: "Tazi", email: "admin@globitrans.demo", password: "demo123", role: "ADMIN", avatar: "KT", active: true, lastLogin: t(TODAY, 8, 42) },
  { id: "USR-02", firstName: "Sara", lastName: "Benali", email: "finance@globitrans.demo", password: "demo123", role: "FINANCE", avatar: "SB", active: true, lastLogin: t(TODAY, 9, 5) },
  { id: "USR-03", firstName: "Youssef", lastName: "El Amrani", email: "declarant@globitrans.demo", password: "demo123", role: "DECLARANT", avatar: "YE", active: true, declarantId: "DEC-01", lastLogin: t(TODAY, 8, 12) },
  { id: "USR-04", firstName: "Nadia", lastName: "Chraibi", email: "n.chraibi@globitrans.demo", password: "demo123", role: "FINANCE", avatar: "NC", active: true, lastLogin: t("2026-09-04", 16, 20) },
  { id: "USR-05", firstName: "Rachid", lastName: "Moukhtari", email: "r.moukhtari@globitrans.demo", password: "demo123", role: "FINANCE", avatar: "RM", active: true, lastLogin: t("2026-09-03", 11, 45) },
  { id: "USR-06", firstName: "Amine", lastName: "Berrada", email: "a.berrada@globitrans.demo", password: "demo123", role: "DECLARANT", avatar: "AB", active: true, declarantId: "DEC-02", lastLogin: t(TODAY, 8, 30) },
];

const rawClients: [string, string, string[], string, string][] = [
  ["CLI-0045", "Atlas Industrie SARL", ["ATLAS INDUSTRIE SARL", "ATLAS INDUSTRIE", "ATLAS INDUSTRIE S.A.R.L.", "ATLAS IND."], "001234567890123", "DEC-01"],
  ["CLI-0046", "Maghreb Distribution SA", ["MAGHREB DISTRIBUTION SA", "MAGHREB DISTRIB", "MAGHREB DISTRIBUTION"], "001987654321098", "DEC-02"],
  ["CLI-0047", "Nova Textile Maroc", ["NOVA TEXTILE MAROC", "NOVA TEXTILE", "NOVATEX MAROC"], "002345678901234", "DEC-02"],
  ["CLI-0048", "Horizon Automotive", ["HORIZON AUTOMOTIVE", "HORIZON AUTO SARL", "HORIZON AUTOMOTIVE SA"], "003456789012345", "DEC-03"],
  ["CLI-0049", "Delta Packaging Maroc", ["DELTA PACKAGING MAROC", "DELTA PACKAGING", "DELTA PACK"], "004567890123456", "DEC-03"],
  ["CLI-0050", "Atlas Components", ["ATLAS COMPONENTS", "ATLAS COMPONENTS SARL", "ATLAS COMP."], "005678901234567", "DEC-01"],
  ["CLI-0051", "Mediterranea Trading", ["MEDITERRANEA TRADING", "MEDITERRANEA TRADING SA", "MEDITERRANEA"], "006789012345678", "DEC-04"],
  ["CLI-0052", "Green Supply Morocco", ["GREEN SUPPLY MOROCCO", "GREEN SUPPLY", "GREENSUPPLY MAROC"], "007890123456789", "DEC-04"],
  ["CLI-0053", "Technometal Industries", ["TECHNOMETAL INDUSTRIES", "TECHNOMETAL", "TECHNO METAL IND."], "008901234567890", "DEC-05"],
  ["CLI-0054", "Casablanca Équipements", ["CASABLANCA EQUIPEMENTS", "CASA EQUIPEMENTS", "CASABLANCA EQUIP."], "009012345678901", "DEC-05"],
  ["CLI-0055", "North Africa Logistics", ["NORTH AFRICA LOGISTICS", "NA LOGISTICS", "NORTH AFRICA LOG."], "001122334455667", "DEC-02"],
  ["CLI-0056", "Maroc Process Industries", ["MAROC PROCESS INDUSTRIES", "MAROC PROCESS", "MAROC PROCESS IND."], "002233445566778", "DEC-03"],
];

export const clients: Client[] = rawClients.map(([code, companyName, aliases, ice, declarantId]) => ({
  id: code,
  code,
  companyName,
  aliases,
  ice,
  email: `contact@${companyName.split(" ")[0]!.toLowerCase().replace(/[^a-z]/g, "")}.demo`,
  phone: "+212 5 22 XX XX XX",
  declarantId,
  active: true,
  createdAt: "2025-11-12T09:00:00",
  updatedAt: "2026-08-30T11:24:00",
}));

const FOREIGN = [
  "EXPORT MAROC SA",
  "DESTINATION EUROPE SAS",
  "IBERIA TRADE SL",
  "GLOBAL FREIGHT LTD",
  "MEDPORT SHIPPING SA",
  "EUROLINE LOGISTICS GMBH",
];

const CASE8_POOL = ["010", "020", "022", "040", "051", "300", "081", "094", "023", "085"];
const CASE2_POOL = ["060", "061", "070", "077", "751", "086", "769", "005"];

const regimeOf = (code: string) => REGIMES.find((r) => r.code === code)!;

const todayPattern: MainLeveeStatus[] = [
  "FINANCE_RECEIVED", "TO_DEPOSIT", "REVIEW_REQUIRED", "FINANCE_RECEIVED",
  "FINANCE_RECEIVED", "REVIEW_REQUIRED", "DEPOSITED", "FINANCE_RECEIVED",
  "TO_DEPOSIT", "REVIEW_REQUIRED", "FINANCE_RECEIVED", "FINANCE_RECEIVED",
  "DEPOSITED", "FINANCE_RECEIVED", "TO_DEPOSIT", "FINANCE_RECEIVED",
  "FINANCE_RECEIVED", "TO_DEPOSIT", "DEPOSITED", "FINANCE_RECEIVED",
  "TO_DEPOSIT", "FINANCE_RECEIVED", "FINANCE_RECEIVED", "TO_DEPOSIT",
];

const financeUsers = ["Sara Benali", "Nadia Chraibi", "Rachid Moukhtari"];

function buildHistory(ml: MainLevee, clientName: string, declarantName: string): HistoryEntry[] {
  const d = ml.receivedAt.slice(0, 10);
  const hh = Number(ml.receivedAt.slice(11, 13));
  const mm = Number(ml.receivedAt.slice(14, 16));
  const at = (offset: number) => t(d, hh + Math.floor((mm + offset) / 60), (mm + offset) % 60);
  const h: HistoryEntry[] = [
    { at: at(0), label: "Email reçu depuis la boîte opérations.", author: "Agent Email" },
    { at: at(1), label: "Main levée identifiée par l'Agent Email.", author: "Agent Email" },
    { at: at(1), label: `Document ${ml.attachmentName} ouvert et analysé.`, author: "Agent Email" },
    { at: at(2), label: `Code régime ${ml.regimeCode} détecté en case 1.`, author: "Agent Email" },
  ];
  if (ml.identificationSource === "UNUSED") {
    h.push({ at: at(2), label: `Code régime ${ml.regimeCode} configuré comme non utilisé — identification suspendue.`, author: "Agent Email" });
    return h;
  }
  h.push({
    at: at(2),
    label: `Règle ${ml.identificationSource === "CASE_2" ? "Case 2" : "Case 8"} appliquée pour l'identification du client.`,
    author: "Agent Email",
  });
  if (!ml.clientId) {
    h.push({ at: at(3), label: `Raison sociale « ${ml.extractedCustomerName} » non rapprochée du référentiel client.`, author: "Agent Email" });
    return h;
  }
  h.push({ at: at(3), label: `${clientName} identifié avec ${ml.matchingConfidence} % de confiance.`, author: "Agent Email" });
  if (!ml.declarantId) {
    h.push({ at: at(3), label: "Aucun déclarant attitré trouvé pour ce client.", author: "Agent Email" });
    return h;
  }
  h.push({ at: at(3), label: `${declarantName} affecté au dossier.`, author: "Agent Email" });
  if (ml.depositedAt) h.push({ at: ml.depositedAt, label: "Dossier déposé auprès du département Finance.", author: declarantName });
  if (ml.receivedAtFinance) h.push({ at: ml.receivedAtFinance, label: `Réception confirmée par ${ml.receivedBy}.`, author: ml.receivedBy! });
  return h;
}

function makeMainLevee(index: number, refNum: number, date: string, status: MainLeveeStatus): MainLevee {
  const hour = 8 + (index % 9);
  const minute = (index * 13) % 60;
  const client = clients[index % clients.length]!;
  const declarant = declarants.find((d) => d.id === client.declarantId)!;
  const isCase2 = index % 3 === 1;
  let code = isCase2 ? CASE2_POOL[index % CASE2_POOL.length]! : CASE8_POOL[index % CASE8_POOL.length]!;

  const reference = `ML-2026-${String(refNum).padStart(5, "0")}`;
  let anomaly: MainLevee["anomaly"];
  let anomalyMessage: string | undefined;
  let clientId: string | undefined = client.id;
  let declarantId: string | undefined = declarant.id;
  let confidence = 90 + ((index * 7) % 10);
  let extracted = client.aliases[index % client.aliases.length]!;

  if (status === "REVIEW_REQUIRED") {
    const kind = refNum % 3;
    if (kind === 2) {
      code = "003";
      anomaly = "UNUSED_REGIME";
      anomalyMessage = "Le code régime 003 est configuré comme non utilisé pour l'identification automatique du client.";
      clientId = undefined;
      declarantId = undefined;
      confidence = 0;
      extracted = "—";
    } else if (kind === 1) {
      anomaly = "CLIENT_NOT_FOUND";
      anomalyMessage = "La raison sociale extraite ne correspond à aucun client du référentiel.";
      extracted = "ABC INDUSTRIES";
      clientId = undefined;
      declarantId = undefined;
      confidence = 48;
    } else {
      anomaly = "DECLARANT_NOT_ASSIGNED";
      anomalyMessage = "Le client identifié ne dispose d'aucun déclarant attitré dans le référentiel.";
      declarantId = undefined;
      confidence = 93;
    }
  }

  const regime = regimeOf(code);
  const case2Value = isCase2 || regime.identificationSource === "CASE_2" ? extracted : FOREIGN[index % FOREIGN.length]!;
  const case8Value = regime.identificationSource === "CASE_8" ? extracted : FOREIGN[(index + 2) % FOREIGN.length]!;

  const deposited = status === "DEPOSITED" || status === "FINANCE_RECEIVED";
  const received = status === "FINANCE_RECEIVED";
  const depositHour = 13 + (index % 4);
  const receivedByFinanceUser = financeUsers[index % financeUsers.length]!;

  const ml: MainLevee = {
    id: reference,
    reference,
    emailId: `EML-${date.replace(/-/g, "")}-${String(index + 1).padStart(3, "0")}`,
    receivedAt: t(date, hour, minute),
    releaseDate: date,
    declarationNumber: `DUM-2026-${48500 + refNum - 900}`,
    attachmentName: `ML_DUM_${48500 + refNum - 900}.pdf`,
    regimeCode: code,
    regimeLabel: regime.label,
    case2Value,
    case8Value,
    identificationSource: regime.identificationSource,
    extractedCustomerName: extracted,
    clientId,
    matchingConfidence: confidence,
    declarantId,
    status,
    anomaly,
    anomalyMessage,
    deposited,
    depositedAt: deposited ? t(date, depositHour, (index * 11) % 60) : undefined,
    depositedBy: deposited ? `${declarant.firstName} ${declarant.lastName}` : undefined,
    receivedByFinance: received,
    receivedAtFinance: received ? t(date, depositHour + 1, (index * 17) % 60) : undefined,
    receivedBy: received ? receivedByFinanceUser : undefined,
    financeNote: received ? "Dossier complet." : undefined,
    notes: [],
    history: [],
  };
  ml.history = buildHistory(ml, client.companyName, `${declarant.firstName} ${declarant.lastName}`);
  return ml;
}

function buildMainLevees(): MainLevee[] {
  const list: MainLevee[] = [];

  // Dossiers du jour (24)
  todayPattern.forEach((status, i) => list.push(makeMainLevee(i, 942 + i, TODAY, status)));

  // Explicit reference dossiers (scénario de démonstration)
  const ml942 = list[0]!;
  ml942.regimeCode = "010";
  ml942.regimeLabel = "Mise à la consommation directe";
  ml942.identificationSource = "CASE_8";
  ml942.case2Value = "EXPORT MAROC SA";
  ml942.case8Value = "ATLAS INDUSTRIE SARL";
  ml942.extractedCustomerName = "ATLAS INDUSTRIE SARL";
  ml942.clientId = "CLI-0045";
  ml942.declarantId = "DEC-01";
  ml942.matchingConfidence = 97;
  ml942.declarationNumber = "DUM-2026-48592";
  ml942.attachmentName = "ML_DUM_48592.pdf";
  ml942.receivedAt = t(TODAY, 9, 12);
  ml942.depositedAt = t(TODAY, 14, 23);
  ml942.depositedBy = "Youssef El Amrani";
  ml942.receivedAtFinance = t(TODAY, 15, 14);
  ml942.receivedBy = "Sara Benali";
  ml942.history = buildHistory(ml942, "Atlas Industrie SARL", "Youssef El Amrani");

  const ml943 = list[1]!;
  ml943.regimeCode = "060";
  ml943.regimeLabel = "Exportation simple";
  ml943.identificationSource = "CASE_2";
  ml943.case2Value = "NOVA TEXTILE MAROC";
  ml943.case8Value = "DESTINATION EUROPE SAS";
  ml943.extractedCustomerName = "NOVA TEXTILE MAROC";
  ml943.clientId = "CLI-0047";
  ml943.declarantId = "DEC-02";
  ml943.matchingConfidence = 98;
  ml943.declarationNumber = "DUM-2026-48593";
  ml943.attachmentName = "ML_DUM_48593.pdf";
  ml943.receivedAt = t(TODAY, 9, 34);
  ml943.history = buildHistory(ml943, "Nova Textile Maroc", "Amine Berrada");

  const ml944 = list[2]!;
  ml944.receivedAt = t(TODAY, 9, 42);
  ml944.history = buildHistory(ml944, "", "");

  list[5]!.receivedAt = t(TODAY, 10, 27);
  list[5]!.history = buildHistory(list[5]!, "", "");
  list[9]!.receivedAt = t(TODAY, 11, 4);
  list[9]!.history = buildHistory(list[9]!, clients[9]!.companyName, "");

  // Historique (100 dossiers clôturés)
  const pastDates = ["2026-09-04", "2026-09-03", "2026-09-02", "2026-09-01", "2026-08-31", "2026-08-28", "2026-08-27", "2026-08-26", "2026-08-25", "2026-08-24"];
  let ref = 842;
  pastDates.forEach((date, di) => {
    for (let i = 0; i < 10; i++) {
      list.push(makeMainLevee(di * 10 + i + 3, ref++, date, "FINANCE_RECEIVED"));
    }
  });

  return list.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

const IGNORED_SUBJECTS = [
  ["Relance facture fournisseur", "compta@fournisseur-mock.demo"],
  ["Confirmation de rendez-vous", "agenda@partenaire-mock.demo"],
  ["Newsletter transport & logistique", "news@logistique-mock.demo"],
  ["Devis transport routier", "commercial@transport-mock.demo"],
  ["Accusé de réception dossier", "support@portnet-mock.demo"],
  ["Planning des rotations navires", "planning@medport-mock.demo"],
  ["Mise à jour tarifaire", "tarifs@armateur-mock.demo"],
  ["Demande de documents", "clients@atlas-mock.demo"],
];

function buildEmails(mainLevees: MainLevee[]): EmailRecord[] {
  const emails: EmailRecord[] = [];
  const todays = mainLevees.filter((m) => m.releaseDate === TODAY);

  todays.forEach((ml, i) => {
    emails.push({
      id: ml.emailId,
      sender: "notifications@douane.mock",
      recipient: "operations@globitrans.demo",
      subject: `Main levée – DUM ${ml.declarationNumber.replace("DUM-", "").replace("-", "/")}`,
      body: `Bonjour,\n\nLa main levée du dossier ${ml.declarationNumber} a été accordée. Vous trouverez en pièce jointe le document douanier correspondant.\n\nAdministration des Douanes et Impôts Indirects\nBureau de Casablanca Port`,
      receivedAt: ml.receivedAt,
      attachments: [{ name: ml.attachmentName, size: `${380 + ((i * 37) % 220)} KB`, type: "PDF" }],
      classification: "MAIN_LEVEE",
      confidence: 94 + ((i * 3) % 6),
      status: "PROCESSED",
      mainLeveeId: ml.id,
    });
  });

  for (let i = 0; i < 22; i++) {
    const [subject, sender] = IGNORED_SUBJECTS[i % IGNORED_SUBJECTS.length]!;
    emails.push({
      id: `EML-IGN-${String(i + 1).padStart(3, "0")}`,
      sender: sender!,
      recipient: "operations@globitrans.demo",
      subject: subject!,
      body: "Message hors périmètre du bureau d'ordre des mains levées.",
      receivedAt: t(TODAY, 8 + (i % 9), (i * 7) % 60),
      attachments: i % 3 === 0 ? [{ name: `document_${i}.pdf`, size: "112 KB", type: "PDF" }] : [],
      classification: "IGNORED",
      confidence: 12 + ((i * 5) % 30),
      status: "IGNORED",
    });
  }

  emails.push({
    id: "EML-REV-001",
    sender: "declarations@douane.mock",
    recipient: "operations@globitrans.demo",
    subject: "Document douanier – dossier 2026/48610",
    body: "Veuillez trouver ci-joint le document relatif au dossier 2026/48610.",
    receivedAt: t(TODAY, 12, 18),
    attachments: [{ name: "scan_48610.pdf", size: "298 KB", type: "PDF" }],
    classification: "UNCERTAIN",
    confidence: 61,
    status: "REVIEW",
  });
  emails.push({
    id: "EML-REV-002",
    sender: "bureau.port@douane.mock",
    recipient: "operations@globitrans.demo",
    subject: "Notification bureau port – 2026/48611",
    body: "Notification automatique du bureau port.",
    receivedAt: t(TODAY, 13, 41),
    attachments: [{ name: "notification_48611.jpg", size: "874 KB", type: "JPG" }],
    classification: "UNCERTAIN",
    confidence: 58,
    status: "REVIEW",
  });

  return emails.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

const notifications: Notification[] = [
  { id: "NTF-01", title: "3 nouvelles mains levées détectées", detail: "L'Agent Email a créé 3 dossiers à 15:32.", at: t(TODAY, 15, 32), read: false, kind: "info" },
  { id: "NTF-02", title: "2 dossiers nécessitent une validation", detail: "Identification client à confirmer manuellement.", at: t(TODAY, 14, 55), read: false, kind: "warning" },
  { id: "NTF-03", title: "4 dossiers déposés par Youssef El Amrani", detail: "Dépôt effectué auprès du département Finance.", at: t(TODAY, 14, 23), read: false, kind: "success" },
  { id: "NTF-04", title: "3 dossiers restent à réceptionner", detail: "Dossiers déposés en attente de confirmation Finance.", at: t(TODAY, 13, 10), read: true, kind: "info" },
  { id: "NTF-05", title: "Synchronisation Agent Email terminée", detail: "48 emails analysés, 24 mains levées détectées.", at: t(TODAY, 12, 0), read: true, kind: "info" },
];

export function seedDB(): DB {
  const mainLevees = buildMainLevees();
  const emails = buildEmails(mainLevees);
  const activity: HistoryEntry[] = [
    { at: t(TODAY, 15, 14), label: "Dossier ML-2026-00942 reçu par Finance.", author: "Sara Benali" },
    { at: t(TODAY, 14, 23), label: "Youssef El Amrani a déposé 3 dossiers.", author: "Youssef El Amrani" },
    { at: t(TODAY, 13, 52), label: "Le client Maghreb Distribution a été identifié automatiquement.", author: "Agent Email" },
    { at: t(TODAY, 12, 41), label: "4 nouvelles mains levées détectées.", author: "Agent Email" },
    { at: t(TODAY, 11, 4), label: "Anomalie détectée sur ML-2026-00951 : aucun déclarant affecté.", author: "Agent Email" },
    { at: t(TODAY, 10, 27), label: "Anomalie détectée sur ML-2026-00947 : client non identifié.", author: "Agent Email" },
    { at: t(TODAY, 9, 42), label: "Anomalie détectée sur ML-2026-00944 : code régime non exploitable.", author: "Agent Email" },
    { at: t(TODAY, 9, 5), label: "Connexion de Sara Benali (Finance).", author: "Système" },
  ];

  return {
    users,
    clients,
    declarants,
    regimes: REGIMES,
    mappings: defaultMappingSheet(),
    emails,
    mainLevees,
    notifications,
    activity,
    settings: {
      agentActive: true,
      watchedEmail: "operations@globitrans.demo",
      syncInterval: 5,
      allowedSenders: ["notifications@douane.mock", "declarations@douane.mock", "bureau.port@douane.mock"],
      keywords: ["main levée", "main levee", "douane", "DUM", "bon à enlever"],
      formats: ["PDF", "JPG", "PNG"],
      autoThreshold: 90,
      manualThreshold: 70,
      normalizeNames: true,
      ignoreLegalSuffix: true,
      useAliases: true,
      lastSync: t(TODAY, 15, 32),
      nextSync: t(TODAY, 15, 37),
      notifyNewMainLevee: true,
      notifyAnomaly: true,
      notifyDeposit: true,
    },
  };
}
