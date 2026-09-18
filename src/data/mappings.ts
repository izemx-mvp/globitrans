import { REGIMES } from "./regimes";
import type { MappingSheet } from "@/types";

export const MAPPING_COLUMNS = [
  "Code régime",
  "Source d'identification",
  "Code / référence client",
  "Client",
  "Alias / valeur attendue",
  "Déclarant",
  "Commentaire",
  "Statut",
] as const;

const SOURCE_TEXT: Record<string, string> = {
  CASE_2: "Case 2",
  CASE_8: "Case 8",
  UNUSED: "Non utilisé",
};

/** Référentiel par défaut de l'automatisation (image du fichier Excel métier). */
export function defaultMappingSheet(): MappingSheet {
  return {
    columns: [...MAPPING_COLUMNS],
    rows: REGIMES.map((r, i) => ({
      id: `MAP-${String(i + 1).padStart(4, "0")}`,
      values: {
        "Code régime": r.code,
        "Source d'identification": SOURCE_TEXT[r.identificationSource] ?? "Case 8",
        "Code / référence client": "",
        Client: "",
        "Alias / valeur attendue": "",
        Déclarant: "",
        Commentaire: r.label,
        Statut: r.identificationSource === "UNUSED" ? "Non utilisé" : "Actif",
      },
    })),
    fileName: "referentiel-codes-regimes-clients.xlsx",
    importedAt: undefined,
  };
}

/** Les codes régimes doivent rester du texte : 010 ne doit jamais devenir 10. */
export function normalizeRegimeText(value: string): string {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return /^\d{1,3}$/.test(v) ? v.padStart(3, "0") : v;
}
