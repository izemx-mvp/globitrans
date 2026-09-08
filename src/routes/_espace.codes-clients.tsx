import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Download,
  Plus,
  Search,
  Table2,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Chip,
  EmptyState,
  Kpi,
  PageHeader,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/app/bits";
import { Btn, Field, Modal, inputClass, selectClass } from "@/components/app/dialogs";
import {
  addMappingRow,
  deleteMappingRow,
  importMappingSheet,
  updateMappingCell,
  useDB,
} from "@/services/db";
import { fullName, useSession } from "@/services/auth";
import { downloadCSV, formatDateTime } from "@/services/business";
import { normalizeRegimeText } from "@/data/mappings";
import type { MappingRow } from "@/types";

export const Route = createFileRoute("/_espace/codes-clients")({
  head: () => ({
    meta: [
      { title: "Codes régimes / Clients — GLOBITRANS" },
      {
        name: "description",
        content:
          "Référentiel d'automatisation reliant les codes régimes douaniers aux clients : import de fichier, édition en ligne et export.",
      },
      { property: "og:title", content: "Codes régimes / Clients — GLOBITRANS" },
      {
        property: "og:description",
        content: "Référentiel reliant les codes régimes douaniers aux clients de GLOBITRANS.",
      },
    ],
  }),
  component: CodesClientsPage,
});

const PAGE_SIZE = 25;
const REGIME_COL = "Code régime";

function parseDelimited(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const delimiter = (clean.split("\n")[0]?.split(";").length ?? 1) > 1 ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]!;
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function CodesClientsPage() {
  const db = useDB();
  const session = useSession();
  const sheet = db.mappings;
  const canEdit = session?.role === "ADMIN";
  const author = session ? fullName(session) : "Système";

  const [q, setQ] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [regimeFilter, setRegimeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortCol, setSortCol] = useState(REGIME_COL);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [preview, setPreview] = useState<{ columns: string[]; rows: MappingRow[]; fileName: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = sheet.rows.filter((r) => {
      if (term && !Object.values(r.values).join(" ").toLowerCase().includes(term)) return false;
      if (filterColumn && filterValue) {
        const v = (r.values[filterColumn] ?? "").toLowerCase();
        if (!v.includes(filterValue.toLowerCase())) return false;
      }
      if (regimeFilter && (r.values[REGIME_COL] ?? "") !== regimeFilter) return false;
      if (sourceFilter && (r.values["Source d'identification"] ?? "") !== sourceFilter) return false;
      if (clientFilter && (r.values["Client"] ?? "") !== clientFilter) return false;
      if (statusFilter && (r.values["Statut"] ?? "") !== statusFilter) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const av = a.values[sortCol] ?? "";
      const bv = b.values[sortCol] ?? "";
      return sortDir === "asc" ? av.localeCompare(bv, "fr") : bv.localeCompare(av, "fr");
    });
  }, [sheet.rows, q, filterColumn, filterValue, regimeFilter, sourceFilter, clientFilter, statusFilter, sortCol, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const mappedClients = sheet.rows.filter((r) => (r.values["Client"] ?? "").trim() !== "").length;
  const unusedRows = sheet.rows.filter((r) => (r.values["Statut"] ?? "") === "Non utilisé").length;
  const regimeOptions = useMemo(
    () => Array.from(new Set(sheet.rows.map((r) => r.values[REGIME_COL] ?? "").filter(Boolean))).sort(),
    [sheet.rows],
  );
  const clientOptions = useMemo(
    () => Array.from(new Set(sheet.rows.map((r) => r.values["Client"] ?? "").filter(Boolean))).sort(),
    [sheet.rows],
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(sheet.rows.map((r) => r.values["Statut"] ?? "").filter(Boolean))).sort(),
    [sheet.rows],
  );

  const handleFile = async (file: File) => {
    try {
      let matrix: string[][];
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]!]!;
        matrix = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: "" });
      } else {
        matrix = parseDelimited(await file.text());
      }
      const header = (matrix[0] ?? []).map((h, i) => String(h ?? "").trim() || `Colonne ${i + 1}`);
      if (!header.length) {
        toast.error("Fichier illisible : aucune colonne détectée.");
        return;
      }
      const body = matrix.slice(1).map((line, idx) => {
        const values: Record<string, string> = {};
        header.forEach((h, i) => {
          const raw = String(line[i] ?? "").trim();
          values[h] = h === REGIME_COL ? normalizeRegimeText(raw) : raw;
        });
        return { id: `MAP-IMP-${Date.now().toString(36)}-${idx}`, values };
      });
      setPreview({ columns: header, rows: body, fileName: file.name });
    } catch {
      toast.error("Import impossible.", { description: "Vérifiez le format du fichier (.xlsx, .xls ou .csv)." });
    }
  };

  const exportSheet = () => {
    downloadCSV("globitrans-codes-regimes-clients.csv", [
      sheet.columns,
      ...filtered.map((r) => sheet.columns.map((c) => r.values[c] ?? "")),
    ]);
  };

  return (
    <>
      <PageHeader
        title="Codes régimes / Clients"
        subtitle="Référentiel d'automatisation reliant les codes régimes douaniers aux clients GLOBITRANS."
        actions={
          <>
            {canEdit ? (
              <>
                <Btn variant="outline" onClick={() => setImportOpen(true)}>
                  <Upload className="size-4" /> Importer un fichier
                </Btn>
                <Btn
                  variant="outline"
                  onClick={() => {
                    addMappingRow();
                    setPage(1);
                    toast.success("Ligne ajoutée en haut du tableau.");
                  }}
                >
                  <Plus className="size-4" /> Ajouter une ligne
                </Btn>
              </>
            ) : null}
            <Btn onClick={exportSheet}>
              <Download className="size-4" /> Exporter
            </Btn>
          </>
        }
        meta={
          <p className="mt-2 text-[13px] text-muted-foreground">
            Fichier de référence : <span className="font-medium text-foreground">{sheet.fileName ?? "—"}</span>
            {sheet.importedAt ? ` — dernier import le ${formatDateTime(sheet.importedAt)}` : " — référentiel initial"}
          </p>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Lignes du référentiel" value={sheet.rows.length} hint="Codes et correspondances" tone="primary" />
        <Kpi label="Colonnes" value={sheet.columns.length} hint="Structure du fichier importé" />
        <Kpi label="Clients renseignés" value={mappedClients} hint="Lignes reliées à un client" tone="success" />
        <Kpi label="Codes non utilisés" value={unusedRows} hint="Aucune identification client" tone="warning" />
      </div>

      <div className="card-surface mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5 xl:flex-nowrap">
          <div className="relative min-w-[260px] flex-1 xl:max-w-[340px]">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher dans le référentiel..."
              className={`${inputClass} h-10 pl-9`}
            />
          </div>
          <select
            value={regimeFilter}
            onChange={(e) => {
              setRegimeFilter(e.target.value);
              setPage(1);
            }}
            className={`${selectClass} h-10 w-[140px] shrink-0 mono`}
            aria-label="Code régime"
          >
            <option value="">Code régime</option>
            {regimeOptions.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className={`${selectClass} h-10 w-[150px] shrink-0`}
            aria-label="Source"
          >
            <option value="">Source</option>
            <option value="Case 2">Case 2</option>
            <option value="Case 8">Case 8</option>
            <option value="Non utilisé">Non utilisé</option>
          </select>
          <select
            value={clientFilter}
            onChange={(e) => {
              setClientFilter(e.target.value);
              setPage(1);
            }}
            className={`${selectClass} h-10 w-[190px] shrink-0`}
            aria-label="Client"
          >
            <option value="">Client</option>
            {clientOptions.map((client) => <option key={client} value={client}>{client}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={`${selectClass} h-10 w-[150px] shrink-0`}
            aria-label="Statut"
          >
            <option value="">Statut</option>
            {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Btn
            variant="ghost"
            className="h-10"
            onClick={() => {
              setQ("");
              setFilterColumn("");
              setFilterValue("");
              setRegimeFilter("");
              setSourceFilter("");
              setClientFilter("");
              setStatusFilter("");
              setPage(1);
            }}
          >
            Réinitialiser
          </Btn>
          <span className="ml-auto hidden shrink-0 text-[12.5px] text-muted-foreground 2xl:inline">
            {canEdit ? "Cliquez dans une cellule pour la modifier." : "Consultation seule."}
          </span>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Aucune ligne à afficher"
            description="Importez le fichier de correspondance ou ajustez la recherche."
            icon={<Table2 className="size-8" />}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                {sheet.columns.map((c) => (
                  <Th key={c}>
                    <button
                      className="inline-flex items-center gap-1.5 hover:text-foreground"
                      onClick={() => {
                        if (sortCol === c) setSortDir(sortDir === "asc" ? "desc" : "asc");
                        else {
                          setSortCol(c);
                          setSortDir("asc");
                        }
                      }}
                    >
                      {c}
                      {sortCol === c ? (
                        sortDir === "asc" ? (
                          <ArrowUpAZ className="size-3.5" />
                        ) : (
                          <ArrowDownAZ className="size-3.5" />
                        )
                      ) : null}
                    </button>
                  </Th>
                ))}
                {canEdit ? <Th className="text-right">Actions</Th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.id}>
                  {sheet.columns.map((c) => (
                    <Td key={c} className={c === REGIME_COL ? "whitespace-nowrap" : ""}>
                      {canEdit ? (
                        <input
                          value={r.values[c] ?? ""}
                          onChange={(e) =>
                            updateMappingCell(r.id, c, c === REGIME_COL ? e.target.value : e.target.value)
                          }
                          onBlur={(e) => {
                            if (c === REGIME_COL) updateMappingCell(r.id, c, normalizeRegimeText(e.target.value));
                          }}
                          className={`w-full min-w-[110px] rounded-[4px] border border-transparent bg-transparent px-1.5 py-1 text-[12.5px] outline-none hover:border-border focus:border-corporate focus:bg-card ${
                            c === REGIME_COL ? "mono font-medium" : ""
                          }`}
                        />
                      ) : c === REGIME_COL ? (
                        <span className="mono text-[12.5px] font-medium">{r.values[c]}</span>
                      ) : c === "Statut" ? (
                        <Chip tone={r.values[c] === "Non utilisé" ? "danger" : "success"}>{r.values[c] || "—"}</Chip>
                      ) : (
                        <span className="text-[12.5px]">{r.values[c] || "—"}</span>
                      )}
                    </Td>
                  ))}
                  {canEdit ? (
                    <Td className="text-right">
                      <Btn variant="ghost" size="sm" title="Supprimer la ligne" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="size-4" />
                      </Btn>
                    </Td>
                  ) : null}
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-[12.5px] text-muted-foreground">
            {filtered.length} ligne{filtered.length > 1 ? "s" : ""} — page {current} sur {pages}
          </p>
          <div className="flex items-center gap-1">
            <Btn variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              Précédent
            </Btn>
            <Btn variant="outline" size="sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>
              Suivant
            </Btn>
          </div>
        </div>
      </div>

      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setPreview(null);
        }}
        title="Importer le fichier Codes régimes / Clients"
        description="Formats acceptés : .xlsx, .xls et .csv. Les codes régimes sont conservés en texte (010 reste 010)."
        footer={
          <>
            <Btn
              variant="outline"
              onClick={() => {
                setImportOpen(false);
                setPreview(null);
              }}
            >
              Annuler
            </Btn>
            <Btn
              disabled={!preview}
              onClick={() => {
                if (!preview) return;
                importMappingSheet(preview.columns, preview.rows, importMode, preview.fileName, author);
                setImportOpen(false);
                setPreview(null);
                setPage(1);
                toast.success("Référentiel importé.", {
                  description: `${preview.rows.length} lignes ${importMode === "replace" ? "remplacent" : "complètent"} le référentiel.`,
                });
              }}
            >
              Confirmer l'import
            </Btn>
          </>
        }
      >
        <div className="space-y-3.5">
          <Field label="Fichier à importer">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Mode d'import">
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as "append" | "replace")}
              className={selectClass}
            >
              <option value="append">Compléter le référentiel existant</option>
              <option value="replace">Remplacer entièrement le référentiel</option>
            </select>
          </Field>

          {preview ? (
            <div className="rounded-md border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
                <p className="text-[12.5px] font-medium">
                  Aperçu — {preview.rows.length} lignes, {preview.columns.length} colonnes
                </p>
                <Chip tone="blue">{preview.fileName}</Chip>
              </div>
              <div className="max-h-[220px] overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {preview.columns.map((c) => (
                        <Th key={c}>{c}</Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 8).map((r) => (
                      <Tr key={r.id}>
                        {preview.columns.map((c) => (
                          <Td key={c} className="whitespace-nowrap text-[12px]">
                            {r.values[c] || "—"}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              Sélectionnez un fichier pour afficher un aperçu avant validation.
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Supprimer la ligne"
        description="Cette ligne du référentiel sera définitivement retirée."
        footer={
          <>
            <Btn variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                if (deleteId) deleteMappingRow(deleteId);
                setDeleteId(null);
                toast.success("Ligne supprimée.");
              }}
            >
              Supprimer
            </Btn>
          </>
        }
      />
    </>
  );
}
