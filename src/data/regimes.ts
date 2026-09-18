import type { CustomsRegime, IdentificationSource } from "@/types";

export const CASE_2_CODES = [
  "060", "061", "680", "069", "070", "700", "072", "074", "075", "751", "752",
  "077", "770", "771", "772", "078", "079", "086", "681", "682", "761", "762",
  "763", "764", "765", "766", "767", "768", "769", "856", "866", "002", "005",
];

export const CASE_8_CODES = [
  "010", "020", "021", "022", "023", "241", "242", "243", "300", "301", "302",
  "303", "310", "311", "312", "321", "322", "323", "331", "332", "035", "036",
  "037", "381", "385", "382", "383", "384", "386", "080", "081", "817", "082",
  "820", "821", "822", "083", "084", "849", "040", "430", "044", "046", "047",
  "048", "085", "051", "510", "511", "052", "053", "054", "055", "056", "087",
  "090", "092", "093", "094", "095", "097", "098", "099", "050", "221", "231",
  "855", "004", "006", "007",
];

export const UNUSED_CODES = ["003", "008", "009", "800", "900"];

const LABELS: Record<string, string> = {
  "010": "Mise à la consommation directe",
  "020": "Mise à la consommation après entrepôt",
  "021": "Mise à la consommation après admission temporaire",
  "022": "Mise à la consommation après ATPA",
  "023": "Mise à la consommation après transit",
  "035": "Réimportation en l'état",
  "036": "Réimportation après perfectionnement",
  "037": "Réimportation après réparation",
  "040": "Admission temporaire",
  "044": "Admission temporaire pour perfectionnement actif",
  "046": "Entrepôt industriel franc",
  "050": "Entrepôt de stockage",
  "051": "Entrepôt public",
  "052": "Entrepôt privé",
  "060": "Exportation simple",
  "061": "Exportation définitive après entrepôt",
  "069": "Exportation temporaire",
  "070": "Exportation temporaire pour perfectionnement passif",
  "072": "Exportation en suite d'admission temporaire",
  "074": "Exportation après ATPA",
  "075": "Exportation de produits compensateurs",
  "077": "Réexportation en l'état",
  "078": "Réexportation après entrepôt",
  "079": "Réexportation après admission temporaire",
  "080": "Transit national",
  "081": "Transit international",
  "082": "Transit vers zone franche",
  "083": "Transit inter-bureaux",
  "084": "Transit maritime",
  "085": "Cabotage",
  "086": "Transit à l'exportation",
  "087": "Transbordement",
  "090": "Régime suspensif divers",
  "092": "Dépôt temporaire",
  "093": "Magasin et aire de dédouanement",
  "094": "Zone d'accélération industrielle",
  "095": "Avitaillement",
  "097": "Franchise diplomatique",
  "098": "Admission exceptionnelle",
  "099": "Opération diverse",
  "002": "Déclaration sommaire export",
  "003": "Code technique réservé",
  "004": "Déclaration complémentaire import",
  "005": "Déclaration simplifiée export",
  "006": "Déclaration simplifiée import",
  "007": "Déclaration provisoire import",
  "008": "Code technique non exploité",
  "009": "Code technique non exploité",
  "300": "Entrepôt de stockage — import",
  "310": "Entrepôt industriel — import",
  "800": "Code réservé administration",
  "900": "Code réservé administration",
};

const CATEGORY = (code: string, source: IdentificationSource) => {
  if (source === "UNUSED") return "Technique";
  if (source === "CASE_2") return "Exportation / Réexportation";
  const n = Number(code);
  if (n >= 80 && n <= 87) return "Transit";
  if ((n >= 40 && n <= 56) || (n >= 300 && n <= 332)) return "Régime suspensif";
  return "Importation / Mise à la consommation";
};

function build(codes: string[], source: IdentificationSource): CustomsRegime[] {
  return codes.map((code) => ({
    code,
    label: LABELS[code] ?? `Régime douanier ${code}`,
    category: CATEGORY(code, source),
    identificationSource: source,
    updatedAt: "2026-08-14T10:00:00",
  }));
}

export const REGIMES: CustomsRegime[] = [
  ...build(CASE_8_CODES, "CASE_8"),
  ...build(CASE_2_CODES, "CASE_2"),
  ...build(UNUSED_CODES, "UNUSED"),
].sort((a, b) => a.code.localeCompare(b.code));
