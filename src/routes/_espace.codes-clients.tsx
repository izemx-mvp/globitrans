import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Search, Table2 } from "lucide-react";
import { Chip, EmptyState, Kpi, PageHeader, TableWrap, Td, Th, Tr } from "@/components/app/bits";
import { Btn, inputClass, selectClass } from "@/components/app/dialogs";
import { downloadCSV } from "@/services/business";
import { REGIME_ENTRIES, REGIME_ROWS, type RegimeClient, type RegimeEntry } from "@/data/regimes-officiels";

export const Route = createFileRoute("/_espace/codes-clients")({
  head: () => ({
    meta: [
      { title: "Codes régimes / Clients — GLOBITRANS" },
      {
        name: "description",
        content:
          "Référentiel officiel des codes régimes douaniers et de la case client correspondante (case 2, case 8 ou non utilisé).",
      },
      { property: "og:title", content: "Codes régimes / Clients — GLOBITRANS" },
      {
        property: "og:description",
        content: "Référentiel officiel des codes régimes douaniers utilisés par GLOBITRANS.",
      },
    ],
  }),
  component: CodesClientsPage,
});

const CLIENT_TONE: Record<RegimeClient, "success" | "blue" | "neutral"> = {
  "case 8": "success",
  "case 2": "blue",
  "non utilisé": "neutral",
};

function CodesClientsPage() {
  const [codeQuery, setCodeQuery] = useState("");
  const [labelQuery, setLabelQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<"" | RegimeClient>("");

  const filtering = codeQuery.trim() !== "" || labelQuery.trim() !== "" || clientFilter !== "";

  /** Conserve l'ordre du fichier officiel et masque les titres devenus vides après filtrage. */
  const entries = useMemo(() => {
    const code = codeQuery.trim().toLowerCase();
    const label = labelQuery.trim().toLowerCase();
    const keep = (e: RegimeEntry) => {
      if (e.kind !== "row") return true;
      if (code && !e.code.toLowerCase().includes(code)) return false;
      if (label && !e.label.toLowerCase().includes(label)) return false;
      if (clientFilter && e.client !== clientFilter) return false;
      return true;
    };
    const kept = REGIME_ENTRIES.filter(keep);
    return kept.filter((e, i) => {
      if (e.kind !== "section") return true;
      for (let j = i + 1; j < kept.length; j++) {
        const next = kept[j]!;
        if (next.kind === "row") return true;
        if (next.level <= e.level) return false;
      }
      return false;
    });
  }, [codeQuery, labelQuery, clientFilter]);

  const visibleRows = entries.filter((e): e is Extract<RegimeEntry, { kind: "row" }> => e.kind === "row");

  const counts = useMemo(
    () => ({
      case8: REGIME_ROWS.filter((r) => r.client === "case 8").length,
      case2: REGIME_ROWS.filter((r) => r.client === "case 2").length,
      unused: REGIME_ROWS.filter((r) => r.client === "non utilisé").length,
    }),
    [],
  );

  const exportSheet = () =>
    downloadCSV("globitrans-codes-regimes.csv", [
      ["Code", "Libellé du régime", "Client"],
      ...visibleRows.map((r) => [r.code, r.label, r.client]),
    ]);

  return (
    <>
      <PageHeader
        title="Codes régimes / Clients"
        subtitle="Référentiel officiel des régimes douaniers et de la case d'identification du client."
        actions={
          <Btn onClick={exportSheet}>
            <Download className="size-4" /> Exporter
          </Btn>
        }
        meta={
          <p className="mt-2 text-[13px] text-muted-foreground">
            Source : Circulaire ADII n° 6047/312 du 20 mai 2020 — structure, codes et libellés identiques au fichier
            officiel.
          </p>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Codes régimes" value={REGIME_ROWS.length} hint="Référentiel officiel" tone="primary" />
        <Kpi label="Client en case 8" value={counts.case8} hint="Opérations à l'import" tone="success" />
        <Kpi label="Client en case 2" value={counts.case2} hint="Opérations à l'export" />
        <Kpi label="Codes non utilisés" value={counts.unused} hint="Aucune identification client" tone="warning" />
      </div>

      <div className="card-surface mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
          <div className="relative min-w-[180px] basis-[200px]">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={codeQuery}
              onChange={(e) => setCodeQuery(e.target.value)}
              placeholder="Rechercher un code..."
              className={`${inputClass} mono h-10 pl-9`}
              aria-label="Rechercher un code"
            />
          </div>
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={labelQuery}
              onChange={(e) => setLabelQuery(e.target.value)}
              placeholder="Rechercher un libellé de régime..."
              className={`${inputClass} h-10 pl-9`}
              aria-label="Rechercher un libellé"
            />
          </div>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value as "" | RegimeClient)}
            className={`${selectClass} h-10 max-w-[170px] basis-[170px] flex-none`}
            aria-label="Client"
          >
            <option value="">Tous les clients</option>
            <option value="case 2">case 2</option>
            <option value="case 8">case 8</option>
            <option value="non utilisé">non utilisé</option>
          </select>
          <Btn
            variant="ghost"
            className="h-10"
            onClick={() => {
              setCodeQuery("");
              setLabelQuery("");
              setClientFilter("");
            }}
          >
            Réinitialiser
          </Btn>
        </div>

        {visibleRows.length === 0 ? (
          <EmptyState
            title="Aucun code régime trouvé"
            description="Ajustez la recherche ou le filtre client."
            icon={<Table2 className="size-8" />}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th className="w-[110px]">Code</Th>
                <Th>Libellé du régime</Th>
                <Th className="w-[150px]">Client</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) =>
                e.kind === "section" ? (
                  <tr key={`s-${i}`} className={e.level === 1 ? "bg-soft" : "bg-muted/50"}>
                    <td
                      colSpan={3}
                      className={
                        e.level === 1
                          ? "px-4 py-2 text-[12.5px] font-semibold tracking-wide text-deep uppercase"
                          : "px-4 py-1.5 pl-6 text-[12px] font-medium text-muted-foreground uppercase"
                      }
                    >
                      {e.title}
                    </td>
                  </tr>
                ) : (
                  <Tr key={`r-${e.code}-${i}`}>
                    <Td className="mono whitespace-nowrap text-[12.5px] font-medium">{e.code}</Td>
                    <Td className="text-[12.5px]">{e.label}</Td>
                    <Td>
                      <Chip tone={CLIENT_TONE[e.client]}>{e.client}</Chip>
                    </Td>
                  </Tr>
                ),
              )}
            </tbody>
          </TableWrap>
        )}

        <div className="border-t border-border px-4 py-3">
          <p className="text-[12.5px] text-muted-foreground">
            {visibleRows.length} code{visibleRows.length > 1 ? "s" : ""} affiché{visibleRows.length > 1 ? "s" : ""}
            {filtering ? ` sur ${REGIME_ROWS.length}` : ""}
          </p>
        </div>
      </div>
    </>
  );
}
