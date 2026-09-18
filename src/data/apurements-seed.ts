import type { ApurementFile, ApurementLine, ApurementState } from "@/types/apurements";

/** [référence, client, code régime, date, poids (kg), valeur (€), déclarant, source, matière première] */
type Raw = [string, string, string, string, number, number, string, string, string];

const FILE_ID = "FIC-2026-09-01";

/* Combinaison exacte en 4 lignes : 100 kg / 1 000 € */
const groupA: Raw[] = [
  ["OP-2026-0101", "Atlas Industrie SARL", "010", "2026-09-01", 12.5, 125, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0102", "Atlas Industrie SARL", "010", "2026-09-02", 27.5, 275, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0103", "Atlas Industrie SARL", "010", "2026-09-03", 35, 350, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0104", "Atlas Industrie SARL", "010", "2026-09-04", 25, 250, "Youssef El Amrani", "Import Excel", "Coton"],
];

/* Combinaison exacte en 7 lignes : 100 kg / 1 000 € */
const groupB: Raw[] = [
  ["OP-2026-0111", "Atlas Industrie SARL", "010", "2026-09-05", 8, 80, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0112", "Atlas Industrie SARL", "010", "2026-09-05", 12, 120, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0113", "Atlas Industrie SARL", "010", "2026-09-06", 15, 150, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0114", "Atlas Industrie SARL", "010", "2026-09-06", 10, 100, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0115", "Atlas Industrie SARL", "010", "2026-09-07", 20, 200, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0116", "Atlas Industrie SARL", "010", "2026-09-08", 17, 170, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0117", "Atlas Industrie SARL", "010", "2026-09-08", 18, 180, "Youssef El Amrani", "Import Excel", "Coton"],
];

/* Combinaison proche en 3 lignes : 99,8 kg / 998 € */
const groupC: Raw[] = [
  ["OP-2026-0121", "Atlas Industrie SARL", "010", "2026-09-09", 30.4, 304, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0122", "Atlas Industrie SARL", "010", "2026-09-09", 34.7, 347, "Youssef El Amrani", "Import Excel", "Coton"],
  ["OP-2026-0123", "Atlas Industrie SARL", "010", "2026-09-10", 34.7, 347, "Youssef El Amrani", "Import Excel", "Coton"],
];

/* Lignes complémentaires (ratios volontairement variés) */
const fillers: Raw[] = [
  ["OP-2026-0131", "Maghreb Distribution SA", "020", "2026-09-01", 42.3, 611, "Amine Berrada", "Import Excel", "Polyester"],
  ["OP-2026-0132", "Maghreb Distribution SA", "020", "2026-09-02", 118.6, 2044, "Amine Berrada", "Import Excel", "Polyester"],
  ["OP-2026-0133", "Nova Textile Maroc", "021", "2026-09-02", 64.9, 1477, "Amine Berrada", "Import Excel", "Lin"],
  ["OP-2026-0134", "Nova Textile Maroc", "021", "2026-09-03", 21.7, 498, "Amine Berrada", "EDI Douane", "Lin"],
  ["OP-2026-0135", "Horizon Automotive", "022", "2026-09-03", 305.4, 8320, "Mehdi Alaoui", "Import Excel", "Viscose"],
  ["OP-2026-0136", "Horizon Automotive", "022", "2026-09-04", 77.2, 2143, "Mehdi Alaoui", "Import Excel", "Viscose"],
  ["OP-2026-0137", "Delta Packaging Maroc", "040", "2026-09-04", 156.8, 1893, "Mehdi Alaoui", "Import Excel", "Viscose"],
  ["OP-2026-0138", "Delta Packaging Maroc", "040", "2026-09-05", 48.1, 592, "Mehdi Alaoui", "Saisie manuelle", "Viscose"],
  ["OP-2026-0139", "Atlas Components", "010", "2026-09-05", 91.4, 1622, "Youssef El Amrani", "Import Excel", "Viscose"],
  ["OP-2026-0140", "Atlas Components", "010", "2026-09-06", 33.6, 604, "Youssef El Amrani", "Import Excel", "Viscose"],
  ["OP-2026-0141", "Mediterranea Trading", "300", "2026-09-06", 212.5, 3187, "Salma Idrissi", "Import Excel", "Lin"],
  ["OP-2026-0142", "Mediterranea Trading", "300", "2026-09-07", 59.3, 872, "Salma Idrissi", "Import Excel", "Lin"],
  ["OP-2026-0143", "Green Supply Morocco", "040", "2026-09-07", 27.9, 431, "Salma Idrissi", "EDI Douane", "Élasthanne"],
  ["OP-2026-0144", "Green Supply Morocco", "040", "2026-09-08", 84.6, 1298, "Salma Idrissi", "Import Excel", "Élasthanne"],
  ["OP-2026-0145", "Technometal Industries", "023", "2026-09-08", 448.2, 5710, "Omar Bennani", "Import Excel", "Laine"],
  ["OP-2026-0146", "Technometal Industries", "023", "2026-09-09", 137.5, 1744, "Omar Bennani", "Import Excel", "Laine"],
  ["OP-2026-0147", "Casablanca Équipements", "020", "2026-09-09", 66.4, 1521, "Omar Bennani", "Import Excel", "Laine"],
  ["OP-2026-0148", "Casablanca Équipements", "020", "2026-09-10", 23.8, 549, "Omar Bennani", "Saisie manuelle", "Laine"],
  ["OP-2026-0149", "North Africa Logistics", "021", "2026-09-10", 189.7, 2411, "Amine Berrada", "Import Excel", "Autre"],
  ["OP-2026-0150", "North Africa Logistics", "021", "2026-09-11", 52.6, 673, "Amine Berrada", "Import Excel", "Autre"],
  ["OP-2026-0151", "Maroc Process Industries", "022", "2026-09-11", 98.3, 2261, "Mehdi Alaoui", "Import Excel", "Élasthanne"],
  ["OP-2026-0152", "Maroc Process Industries", "022", "2026-09-12", 31.2, 718, "Mehdi Alaoui", "Import Excel", "Élasthanne"],
  ["OP-2026-0153", "Atlas Industrie SARL", "020", "2026-09-12", 73.9, 1109, "Youssef El Amrani", "Import Excel", "Lin"],
  ["OP-2026-0154", "Atlas Industrie SARL", "020", "2026-08-28", 44.7, 671, "Youssef El Amrani", "Import Excel", "Lin"],
  ["OP-2026-0155", "Nova Textile Maroc", "010", "2026-08-29", 128.4, 2183, "Amine Berrada", "Import Excel", "Lin"],
  ["OP-2026-0156", "Horizon Automotive", "010", "2026-08-29", 39.6, 891, "Mehdi Alaoui", "Import Excel", "Viscose"],
  ["OP-2026-0157", "Delta Packaging Maroc", "300", "2026-08-30", 261.3, 3134, "Mehdi Alaoui", "Import Excel", "Viscose"],
  ["OP-2026-0158", "Green Supply Morocco", "300", "2026-08-31", 18.4, 267, "Salma Idrissi", "Import Excel", "Élasthanne"],
  ["OP-2026-0159", "Technometal Industries", "040", "2026-08-31", 302.7, 3856, "Omar Bennani", "Import Excel", "Laine"],
  ["OP-2026-0160", "Mediterranea Trading", "021", "2026-09-01", 45.8, 1042, "Salma Idrissi", "Import Excel", "Lin"],
  ["OP-2026-0161", "Atlas Components", "023", "2026-09-02", 158.2, 2687, "Youssef El Amrani", "Import Excel", "Viscose"],
  ["OP-2026-0162", "Casablanca Équipements", "010", "2026-09-03", 87.1, 1998, "Omar Bennani", "Import Excel", "Laine"],
  ["OP-2026-0163", "North Africa Logistics", "040", "2026-09-04", 36.5, 468, "Amine Berrada", "EDI Douane", "Autre"],
  ["OP-2026-0164", "Maroc Process Industries", "010", "2026-09-05", 119.8, 2754, "Mehdi Alaoui", "Import Excel", "Élasthanne"],
  ["OP-2026-0165", "Maghreb Distribution SA", "023", "2026-09-06", 74.3, 1279, "Amine Berrada", "Import Excel", "Polyester"],
  ["OP-2026-0166", "Maghreb Distribution SA", "010", "2026-09-07", 29.6, 512, "Amine Berrada", "Import Excel", "Polyester"],
];

/* Lignes déjà apurées lors des apurements historiques */
const cleared: Raw[] = [
  ["OP-2026-0091", "Nova Textile Maroc", "010", "2026-08-20", 120, 2400, "Amine Berrada", "Import Excel", "Lin"],
  ["OP-2026-0092", "Nova Textile Maroc", "010", "2026-08-21", 130, 2600, "Amine Berrada", "Import Excel", "Lin"],
  ["OP-2026-0093", "Horizon Automotive", "022", "2026-08-22", 250, 7500, "Mehdi Alaoui", "Import Excel", "Viscose"],
  ["OP-2026-0094", "Horizon Automotive", "022", "2026-08-24", 150, 4500, "Mehdi Alaoui", "Import Excel", "Viscose"],
];

function toLine(raw: Raw, index: number, status: ApurementLine["status"]): ApurementLine {
  const [reference, client, regimeCode, date, weight, value, declarant, source, goods] = raw;
  return {
    id: `LGN-${String(index + 1).padStart(4, "0")}`,
    fileId: FILE_ID,
    reference,
    client,
    regimeCode,
    date,
    weight,
    value,
    declarant,
    source,
    status,
    extra: { Matière: goods },
  };
}

export function seedApurements(): ApurementState {
  const available = [...groupA, ...groupB, ...groupC, ...fillers];
  const lines: ApurementLine[] = [
    ...available.map((r, i) => toLine(r, i, "AVAILABLE")),
    ...cleared.map((r, i) => toLine(r, available.length + i, "CLEARED")),
  ];

  const files: ApurementFile[] = [
    {
      id: FILE_ID,
      name: "apurements_septembre.xlsx",
      rows: lines.length,
      importedAt: "2026-09-14",
      status: "READY",
      columns: ["Référence", "Client", "Code régime", "Date", "Poids", "Valeur", "Déclarant", "Source", "Matière"],
    },
  ];

  const byRef = (ref: string) => lines.find((l) => l.reference === ref)!.id;

  return {
    files,
    lines,
    records: [
      {
        number: "APU-2026-00123",
        at: "2026-08-25T10:24:00",
        fileId: FILE_ID,
        fileName: "apurements_aout.xlsx",
        client: "Nova Textile Maroc",
        regimeCode: "010",
        targetWeight: 250,
        obtainedWeight: 250,
        targetValue: 5000,
        obtainedValue: 5000,
        lineIds: [byRef("OP-2026-0091"), byRef("OP-2026-0092")],
        exact: true,
        user: "Sara Benali",
      },
      {
        number: "APU-2026-00124",
        at: "2026-08-27T15:08:00",
        fileId: FILE_ID,
        fileName: "apurements_aout.xlsx",
        client: "Horizon Automotive",
        regimeCode: "022",
        targetWeight: 400,
        obtainedWeight: 400,
        targetValue: 12000,
        obtainedValue: 12000,
        lineIds: [byRef("OP-2026-0093"), byRef("OP-2026-0094")],
        exact: true,
        user: "Karim Tazi",
      },
    ],
    lastSearch: null,
  };
}
