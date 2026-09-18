import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileSearch,
  FileSpreadsheet,
  Layers,
  Plus,
  Trash2,
  Loader2,
  Scale,
  Sparkles,
  Table2,
  UploadCloud,
} from "lucide-react";
import { Chip, EmptyState, Kpi, Mono, PageHeader, Surface, TableWrap, Td, Th, Tr } from "@/components/app/bits";
import { Btn, Field, Modal, Textarea, inputClass, selectClass } from "@/components/app/dialogs";
import { fullName, useSession } from "@/services/auth";
import { formatDate, formatDateTime } from "@/services/business";
import {
  ARTICLES,
  RAW_MATERIALS,
  compositionError,
  compositionTotal,
  newCompositionItem,
  exportApurement,
  formatDelta,
  formatValue,
  formatWeight,
  getLineMaterial,
  importLines,
  parseImportedFile,
  parseNaturalRequest,
  runSearch,
  useApurements,
  validateApurement,
  defaultCriteria,
} from "@/services/apurements";
import type { ApurementLine, SearchCriteria, Solution } from "@/types/apurements";

export const Route = createFileRoute("/_espace/apurements/")({
  head: () => ({
    meta: [
      { title: "Gestion des apurements — GLOBITRANS" },
      { name: "description", content: "Importez un fichier et identifiez automatiquement les combinaisons correspondant à vos objectifs." },
      { property: "og:title", content: "Gestion des apurements — GLOBITRANS" },
      { property: "og:description", content: "Moteur de recherche de combinaisons pour l'apurement douanier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApurementsPage,
});


function ApurementsPage() {
  const state = useApurements();
  const session = useSession();
  const author = session ? fullName(session) : "Système";
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<"new" | "history">("new");
  const [subtab, setSubtab] = useState<"import" | "results">("import");
  const [criteria, setCriteria] = useState<SearchCriteria>(defaultCriteria);
  const [weightExact, setWeightExact] = useState(true);
  const [valueExact, setValueExact] = useState(true);
  const [searching, setSearching] = useState(false);
  const [nlText, setNlText] = useState("");
  const [nlSummary, setNlSummary] = useState<string[]>([]);
  const [confirmSolution, setConfirmSolution] = useState<Solution | null>(null);
  const [expandedSolution, setExpandedSolution] = useState<string | null>(state.lastSearch?.solutions[0]?.id ?? null);
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [hDate, setHDate] = useState("");
  const [hClient, setHClient] = useState("");
  const [hRef, setHRef] = useState("");
  const [hRegime, setHRegime] = useState("");
  const [hStatus, setHStatus] = useState("");

  const lines = state.lines;
  const activeFile = state.files[0];
  const available = lines.filter((line) => line.status !== "CLEARED");
  const clearedCount = lines.filter((line) => line.status === "CLEARED").length;
  const materials = useMemo(() => [...ARTICLES], []);
  const compTotal = compositionTotal(criteria.composition);
  const compError = compositionError(criteria.composition);
  const lineById = useMemo(() => new Map(lines.map((line) => [line.id, line] as const)), [lines]);
  const solutions = state.lastSearch?.solutions ?? [];
  const exactFound = solutions.some((solution) => solution.exact);
  const searchedFile = state.files.find((file) => file.id === state.lastSearch?.fileId) ?? activeFile;
  const searchedCriteria = state.lastSearch?.criteria;

  const set = <K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) =>
    setCriteria((current) => ({ ...current, [key]: value }));

  const addComposition = () =>
    setCriteria((current) => ({ ...current, composition: [...current.composition, newCompositionItem()] }));

  const removeComposition = (id: string) =>
    setCriteria((current) => ({ ...current, composition: current.composition.filter((i) => i.id !== id) }));

  const updateComposition = (id: string, patch: { material?: string; percentage?: number }) =>
    setCriteria((current) => ({
      ...current,
      composition: current.composition.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));

  const onFile = async (file: File) => {
    setImporting(true);
    try {
      const parsed = await parseImportedFile(file);
      importLines(parsed.meta, parsed.lines);
      toast.success("Fichier importé.", { description: `${parsed.lines.length} ligne(s) détectée(s) – prêt pour analyse.` });
    } catch (error) {
      toast.error("Import impossible.", { description: error instanceof Error ? error.message : "Format non reconnu." });
    } finally {
      setImporting(false);
    }
  };

  const analyseNl = () => {
    if (!nlText.trim()) return;
    const result = parseNaturalRequest(nlText, { materials });
    if (!result.summary.length) {
      toast.error("Demande non comprise.", { description: "Précisez une matière, un poids ou une valeur." });
      return;
    }
    setCriteria((current) => ({ ...current, ...result.patch, priority: "EXACT_MIN_LINES" }));
    if (result.patch.weightTolerance) setWeightExact(false);
    if (result.patch.valueTolerance) setValueExact(false);
    setNlSummary(result.summary);
    toast.success("Recherche pré-remplie.", { description: "Vous pouvez l'ajuster avant de lancer l'analyse." });
  };

  const launch = () => {
    if (!criteria.material) {
      toast.error("Sélectionnez d'abord un article.");
      return;
    }
    if (compError) {
      toast.error("Composition incomplète.", { description: compError });
      return;
    }
    if (!criteria.targetWeight || !criteria.targetValue) {
      toast.error("Renseignez le poids cible et la valeur cible.");
      return;
    }
    setSearching(true);
    window.setTimeout(() => {
      const result = runSearch({ ...criteria, priority: "EXACT_MIN_LINES" });
      setSearching(false);
      setExpandedSolution(result.solutions[0]?.id ?? null);
      setSubtab("results");
      if (result.solutions.length) {
        toast.success(result.exactFound ? "Correspondance exacte trouvée." : "Meilleures combinaisons identifiées.");
      }
    }, 850);
  };

  const exportSolution = (solution: Solution) => {
    const selectedLines = solution.lineIds.map((id) => lineById.get(id)).filter(Boolean) as ApurementLine[];
    void exportApurement({
      filename: `combinaison-${solution.id}.xlsx`,
      reference: solution.id,
      date: formatDate(new Date().toISOString().slice(0, 10)),
      targetWeight: solution.targetWeight,
      targetValue: solution.targetValue,
      obtainedWeight: solution.weight,
      obtainedValue: solution.value,
      lines: selectedLines,
    });
  };

  const confirm = () => {
    if (!confirmSolution) return;
    const record = validateApurement(confirmSolution, author);
    setConfirmSolution(null);
    toast.success("Apurement validé avec succès.", { description: `Référence ${record.number}.` });
    setTab("history");
  };

  const historyRows = useMemo(() => state.records.filter((record) => {
    if (hDate && !record.at.startsWith(hDate)) return false;
    if (hClient && record.client !== hClient) return false;
    if (hRef && !record.number.toLowerCase().includes(hRef.trim().toLowerCase())) return false;
    if (hRegime && record.regimeCode !== hRegime) return false;
    if (hStatus === "exact" && !record.exact) return false;
    if (hStatus === "near" && record.exact) return false;
    return true;
  }), [state.records, hDate, hClient, hRef, hRegime, hStatus]);

  return (
    <>
      <PageHeader
        title="Gestion des apurements"
        subtitle="Importez vos opérations, recherchez la meilleure combinaison et validez l'apurement."
        actions={(
          <>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onFile(file);
                event.target.value = "";
              }}
            />
            <Btn variant="outline" onClick={() => fileInput.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              Importer un fichier
            </Btn>
          </>
        )}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Fichiers analysés" value={state.files.length} icon={<FileSpreadsheet className="size-4" />} />
        <Kpi label="Lignes disponibles" value={available.length} tone="primary" icon={<Table2 className="size-4" />} />
        <Kpi label="Apurements réalisés" value={state.records.length} tone="success" icon={<CheckCircle2 className="size-4" />} />
        <Kpi label="Lignes déjà apurées" value={clearedCount} icon={<Layers className="size-4" />} />
      </div>

      <div className="card-surface mb-5 overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 pt-2.5">
          {([{ id: "new", label: "Nouvel apurement" }, { id: "history", label: "Historique" }] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-[13px] transition-colors duration-150 ${tab === item.id ? "border-corporate font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {item.label}
              {item.id === "history" ? <span className="mono rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{state.records.length}</span> : null}
            </button>
          ))}
        </div>

        {tab === "new" ? (
          <div>
            <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-5 pt-3">
              {([{ id: "import", label: "Import fichier", icon: UploadCloud }, { id: "results", label: "Résultat de recherche", icon: FileSearch }] as const).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSubtab(item.id)}
                    className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] transition-colors ${subtab === item.id ? "border-corporate font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    <Icon className="size-4" /> {item.label}
                  </button>
                );
              })}
            </div>

            {subtab === "import" ? (
              <div className="relative space-y-5 overflow-hidden px-5 py-5 animate-in fade-in-0 duration-300">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-soft/50 to-transparent" aria-hidden />
                <section className="relative">
                  <h2 className="mb-2 text-[15px] font-semibold">Importer les données</h2>
                  <div
                    onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      const file = event.dataTransfer.files?.[0];
                      if (file) void onFile(file);
                    }}
                    className={`flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-8 text-center transition-colors ${dragging ? "border-corporate bg-soft/60" : "border-border bg-muted/30"}`}
                  >
                    <UploadCloud className="mb-2 size-6 text-muted-foreground" />
                    <p className="text-[13.5px] font-medium">Glissez-déposez votre fichier ici</p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">Formats acceptés : .xlsx, .xls, .csv</p>
                    <Btn className="mt-3" variant="outline" onClick={() => fileInput.current?.click()} disabled={importing}>
                      {importing ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                      Importer un fichier
                    </Btn>
                  </div>
                  {activeFile ? (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium">{activeFile.name}</p>
                        <p className="mono mt-0.5 text-[12.5px] text-muted-foreground">{activeFile.rows} lignes détectées · Importé le {formatDate(activeFile.importedAt)}</p>
                      </div>
                      <Chip tone="success">● Prêt pour analyse</Chip>
                    </div>
                  ) : null}
                </section>

                <Surface title="Décrivez votre recherche" description="L'assistant prépare automatiquement la matière et les objectifs détectés.">
                  <Textarea
                    value={nlText}
                    onChange={(event) => setNlText(event.target.value)}
                    rows={2}
                    placeholder="Exemple : Trouve-moi 100 kg de chemises pour une valeur de 1 000 €."
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Btn variant="outline" onClick={analyseNl}><Sparkles className="size-4" /> Analyser la demande</Btn>
                    {nlSummary.map((summary) => <Chip key={summary} tone="blue">{summary}</Chip>)}
                  </div>
                </Surface>

                <Surface title="Nouvelle recherche d'apurement" description="Sélectionnez l'article, sa composition en matières premières, puis les objectifs et tolérances.">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <Field label="Matière (article)">
                      <select value={criteria.material} onChange={(event) => set("material", event.target.value)} className={selectClass}>
                        <option value="">Sélectionner</option>
                        {ARTICLES.map((article) => <option key={article} value={article}>{article}</option>)}
                      </select>
                    </Field>
                    <Field label="Poids cible">
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.001" value={criteria.targetWeight} onChange={(event) => set("targetWeight", Number(event.target.value))} className={inputClass} />
                        <span className="mono text-[13px] text-muted-foreground">kg</span>
                      </div>
                    </Field>
                    <Field label="Valeur cible">
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.01" value={criteria.targetValue} onChange={(event) => set("targetValue", Number(event.target.value))} className={inputClass} />
                        <span className="mono text-[13px] text-muted-foreground">€</span>
                      </div>
                    </Field>
                    <Field label="Tolérance poids">
                      <div className="flex items-center gap-2">
                        <select value={weightExact ? "exact" : "custom"} onChange={(event) => { const exact = event.target.value === "exact"; setWeightExact(exact); if (exact) set("weightTolerance", 0); }} className={selectClass}>
                          <option value="exact">Exact</option><option value="custom">± personnalisée</option>
                        </select>
                        {!weightExact ? <input type="number" step="0.01" value={criteria.weightTolerance} onChange={(event) => set("weightTolerance", Number(event.target.value))} className={`${inputClass} max-w-[90px]`} aria-label="Tolérance poids personnalisée" /> : null}
                      </div>
                    </Field>
                    <Field label="Tolérance valeur">
                      <div className="flex items-center gap-2">
                        <select value={valueExact ? "exact" : "custom"} onChange={(event) => { const exact = event.target.value === "exact"; setValueExact(exact); if (exact) set("valueTolerance", 0); }} className={selectClass}>
                          <option value="exact">Exacte</option><option value="custom">± personnalisée</option>
                        </select>
                        {!valueExact ? <input type="number" step="0.01" value={criteria.valueTolerance} onChange={(event) => set("valueTolerance", Number(event.target.value))} className={`${inputClass} max-w-[90px]`} aria-label="Tolérance valeur personnalisée" /> : null}
                      </div>
                    </Field>
                  </div>

                  {criteria.material ? (
                    <section className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-[14px] font-semibold">Composition en matières premières</h3>
                          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                            Indiquez les matières premières de l'article « {criteria.material} » et leur pourcentage.
                          </p>
                        </div>
                        <Chip tone={compTotal === 100 ? "success" : compTotal > 100 ? "danger" : "neutral"}>
                          Total composition : {compTotal.toLocaleString("fr-FR")} %
                        </Chip>
                      </div>

                      <div className="mt-3 space-y-2">
                        {criteria.composition.map((item) => (
                          <div key={item.id} className="flex flex-wrap items-center gap-2">
                            <select
                              value={item.material}
                              onChange={(event) => updateComposition(item.id, { material: event.target.value })}
                              className={`${selectClass} max-w-[220px]`}
                              aria-label="Matière première"
                            >
                              <option value="">Matière première</option>
                              {RAW_MATERIALS.map((raw) => <option key={raw} value={raw}>{raw}</option>)}
                            </select>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="0.1"
                                value={item.percentage}
                                onChange={(event) => updateComposition(item.id, { percentage: Number(event.target.value) })}
                                className={`${inputClass} max-w-[110px]`}
                                aria-label="Pourcentage"
                              />
                              <span className="mono text-[13px] text-muted-foreground">%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeComposition(item.id)}
                              disabled={criteria.composition.length <= 1}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-danger disabled:pointer-events-none disabled:opacity-40"
                              aria-label="Supprimer la matière première"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Btn variant="outline" size="sm" onClick={addComposition}>
                          <Plus className="size-4" /> Ajouter une matière première
                        </Btn>
                        {compError ? <span className="text-[12.5px] font-medium text-danger">{compError}</span> : null}
                      </div>
                    </section>
                  ) : null}

                  <div className="mt-5 flex items-center justify-end gap-3">
                    {!criteria.material ? (
                      <span className="text-[12.5px] text-muted-foreground">Sélectionnez d'abord un article.</span>
                    ) : null}
                    <Btn onClick={launch} disabled={searching || !activeFile || !criteria.material || Boolean(compError)}>
                      {searching ? <Loader2 className="size-4 animate-spin" /> : <Scale className="size-4" />}
                      {searching ? "Analyse des combinaisons en cours…" : "Lancer la recherche"}
                    </Btn>
                  </div>
                </Surface>
              </div>
            ) : (
              <div className="px-5 py-5 animate-in fade-in-0 slide-in-from-right-1 duration-300">
                {!state.lastSearch || !solutions.length ? (
                  <EmptyState
                    icon={<FileSearch className="size-8" />}
                    title="Aucun résultat pour le moment"
                    description="Importez un fichier et lancez une recherche d'apurement pour afficher les combinaisons disponibles."
                    action={<Btn onClick={() => setSubtab("import")}><UploadCloud className="size-4" /> Commencer un apurement</Btn>}
                  />
                ) : (
                  <div className="space-y-5">
                    <Surface title="Recherche effectuée">
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div><p className="label-xs">Article</p><p className="mt-1 text-[14px] font-semibold">{searchedCriteria?.material || "Tous"}</p><p className="mt-0.5 text-[12px] text-muted-foreground">{(searchedCriteria?.composition ?? []).filter((i) => i.material).map((i) => `${i.material} ${i.percentage} %`).join(" · ") || "—"}</p></div>
                        <div><p className="label-xs">Poids recherché</p><p className="mono mt-1 text-[14px] font-semibold">{formatWeight(searchedCriteria?.targetWeight ?? 0)}</p></div>
                        <div><p className="label-xs">Valeur recherchée</p><p className="mono mt-1 text-[14px] font-semibold">{formatValue(searchedCriteria?.targetValue ?? 0)}</p></div>
                        <div><p className="label-xs">Fichier</p><p className="mt-1 truncate text-[14px] font-semibold">{searchedFile?.name ?? "—"}</p></div>
                      </div>
                    </Surface>

                    <Surface
                      title="Combinaisons trouvées"
                      description={exactFound ? "Résultats classés par correspondance exacte, puis par nombre de lignes et écart." : "Aucune correspondance exacte trouvée. Voici les combinaisons les plus proches de votre objectif."}
                      bodyClassName="space-y-3"
                    >
                      {solutions.map((solution, index) => {
                        const selectedLines = solution.lineIds.map((id) => lineById.get(id)).filter(Boolean) as ApurementLine[];
                        const open = expandedSolution === solution.id;
                        return (
                          <div key={solution.id} className="overflow-hidden rounded-md border border-border bg-card">
                            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <Btn variant="ghost" size="sm" onClick={() => setExpandedSolution(open ? null : solution.id)} aria-expanded={open} aria-label={`${open ? "Fermer" : "Ouvrir"} la solution ${index + 1}`}>
                                  {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                </Btn>
                                <div><p className="text-[14px] font-semibold">Solution {index + 1}</p><p className="mt-0.5 text-[12.5px] text-muted-foreground">{solution.lineIds.length} ligne(s) · {formatWeight(solution.weight)} · {formatValue(solution.value)}</p></div>
                              </div>
                              <Chip tone={solution.exact ? "success" : "warning"}>{solution.exact ? "Correspondance exacte" : "Correspondance proche"}</Chip>
                            </div>
                            {open ? (
                              <div className="border-t border-border animate-in fade-in-0 duration-200">
                                <div className="grid gap-3 bg-muted/30 px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
                                  <ResultMetric label="Poids recherché" value={formatWeight(solution.targetWeight)} />
                                  <ResultMetric label="Poids obtenu" value={formatWeight(solution.weight)} />
                                  <ResultMetric label="Valeur recherchée" value={formatValue(solution.targetValue)} />
                                  <ResultMetric label="Valeur obtenue" value={formatValue(solution.value)} />
                                  <ResultMetric label="Écart poids" value={formatDelta(solution.deltaWeight, "kg")} />
                                  <ResultMetric label="Écart valeur" value={formatDelta(solution.deltaValue, "€")} />
                                  <ResultMetric label="Nombre de lignes" value={String(solution.lineIds.length)} />
                                </div>
                                <TableWrap>
                                  <thead><tr><Th>Référence</Th><Th>Matière</Th><Th className="text-right">Poids</Th><Th className="text-right">Valeur</Th><Th>Date</Th></tr></thead>
                                  <tbody>
                                    {selectedLines.map((line) => (
                                      <Tr key={line.id}><Td><Mono>{line.reference}</Mono></Td><Td className="text-[13.5px]">{getLineMaterial(line)}</Td><Td className="mono text-right text-[13px]">{formatWeight(line.weight)}</Td><Td className="mono text-right text-[13px]">{formatValue(line.value)}</Td><Td className="text-[13px]">{formatDate(line.date)}</Td></Tr>
                                    ))}
                                    <tr className="bg-muted/50 font-semibold"><Td>TOTAL</Td><Td /><Td className="mono text-right text-[13px]">{formatWeight(solution.weight)}</Td><Td className="mono text-right text-[13px]">{formatValue(solution.value)}</Td><Td /></tr>
                                  </tbody>
                                </TableWrap>
                                <div className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3">
                                  <Btn variant="outline" size="sm" onClick={() => exportSolution(solution)}><Download className="size-4" /> Exporter Excel</Btn>
                                  <Btn size="sm" onClick={() => setConfirmSolution(solution)}><CheckCircle2 className="size-4" /> Valider l'apurement</Btn>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </Surface>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
              <input value={hRef} onChange={(event) => setHRef(event.target.value)} placeholder="N° apurement" className={`${inputClass} h-10 max-w-[200px] basis-[200px] flex-none`} />
              <input type="date" value={hDate} onChange={(event) => setHDate(event.target.value)} className={`${inputClass} h-10 max-w-[170px] basis-[170px] flex-none`} aria-label="Date" />
              <select value={hClient} onChange={(event) => setHClient(event.target.value)} className={`${selectClass} h-10 max-w-[200px] basis-[200px] flex-none`} aria-label="Client"><option value="">Client</option>{Array.from(new Set(state.records.map((record) => record.client))).map((client) => <option key={client} value={client}>{client}</option>)}</select>
              <select value={hRegime} onChange={(event) => setHRegime(event.target.value)} className={`${selectClass} h-10 max-w-[150px] basis-[150px] flex-none`} aria-label="Code régime"><option value="">Code régime</option>{Array.from(new Set(state.records.map((record) => record.regimeCode))).map((regime) => <option key={regime} value={regime}>{regime}</option>)}</select>
              <select value={hStatus} onChange={(event) => setHStatus(event.target.value)} className={`${selectClass} h-10 max-w-[190px] basis-[190px] flex-none`} aria-label="Statut"><option value="">Statut</option><option value="exact">Correspondance exacte</option><option value="near">Correspondance proche</option></select>
            </div>
            <TableWrap>
              <thead><tr><Th>N° apurement</Th><Th>Date</Th><Th>Fichier source</Th><Th>Client</Th><Th className="text-right">Poids cible</Th><Th className="text-right">Poids obtenu</Th><Th className="text-right">Valeur cible</Th><Th className="text-right">Valeur obtenue</Th><Th className="text-right">Lignes</Th><Th>Statut</Th><Th>Utilisateur</Th><Th className="text-right">Actions</Th></tr></thead>
              <tbody>
                {historyRows.map((record) => (
                  <Tr key={record.number}>
                    <Td><Mono className="font-semibold">{record.number}</Mono></Td><Td className="text-[13px] whitespace-nowrap">{formatDateTime(record.at)}</Td><Td className="text-[13px]">{record.fileName}</Td><Td className="text-[13.5px]">{record.client}</Td><Td className="mono text-right text-[13px]">{formatWeight(record.targetWeight)}</Td><Td className="mono text-right text-[13px]">{formatWeight(record.obtainedWeight)}</Td><Td className="mono text-right text-[13px]">{formatValue(record.targetValue)}</Td><Td className="mono text-right text-[13px]">{formatValue(record.obtainedValue)}</Td><Td className="mono text-right text-[13px]">{record.lineIds.length}</Td>
                    <Td><Chip tone={record.exact ? "success" : "warning"}>{record.exact ? "Correspondance exacte" : "Correspondance proche"}</Chip></Td><Td className="text-[13px]">{record.user}</Td>
                    <Td><div className="flex items-center justify-end gap-1.5"><Link to="/apurements/combinaison/$id" params={{ id: record.number }}><Btn variant="outline" size="sm"><Eye className="size-4" /> Consulter</Btn></Link><Btn variant="ghost" size="sm" onClick={() => void exportApurement({ filename: `${record.number}.xlsx`, reference: record.number, date: formatDateTime(record.at), targetWeight: record.targetWeight, targetValue: record.targetValue, obtainedWeight: record.obtainedWeight, obtainedValue: record.obtainedValue, lines: record.lineIds.map((id) => lineById.get(id)).filter(Boolean) as ApurementLine[] })}><Download className="size-4" /> Exporter</Btn></div></Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
            {!historyRows.length ? <EmptyState title="Aucun apurement" description="Les apurements validés apparaîtront ici avec leur numéro et leurs lignes." /> : null}
          </div>
        )}
      </div>

      <Modal
        open={!!confirmSolution}
        onClose={() => setConfirmSolution(null)}
        title="Confirmer l'apurement de cette combinaison ?"
        description={confirmSolution ? `${confirmSolution.lineIds.length} ligne(s) · ${formatWeight(confirmSolution.weight)} · ${formatValue(confirmSolution.value)}` : undefined}
        footer={<><Btn variant="outline" onClick={() => setConfirmSolution(null)}>Annuler</Btn><Btn onClick={confirm}><CheckCircle2 className="size-4" /> Valider l'apurement</Btn></>}
      >
        <p className="text-[13.5px] text-muted-foreground">Un numéro d'apurement sera généré automatiquement et les lignes sélectionnées passeront au statut « Apurée ».</p>
      </Modal>
    </>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return <div><p className="label-xs">{label}</p><p className="mono mt-1 text-[14px] font-semibold">{value}</p></div>;
}
