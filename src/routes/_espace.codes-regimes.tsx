import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Chip, Kpi, Mono, PageHeader, TableWrap, Td, Th, Tr } from "@/components/app/bits";
import { Btn, Modal, inputClass, selectClass } from "@/components/app/dialogs";
import { updateRegime, useDB } from "@/services/db";
import { useSession } from "@/services/auth";
import { SOURCE_LABELS, downloadCSV, formatDateTime } from "@/services/business";
import type { CustomsRegime, IdentificationSource } from "@/types";

export const Route = createFileRoute("/_espace/codes-regimes")({
  head: () => ({
    meta: [
      { title: "Codes régimes — GLOBITRANS" },
      {
        name: "description",
        content: "Référentiel des codes régimes douaniers et de la case d'identification du client (Case 2 ou Case 8).",
      },
      { property: "og:title", content: "Codes régimes — GLOBITRANS" },
      { property: "og:description", content: "Règles d'identification par code régime douanier." },
    ],
  }),
  component: RegimesPage,
});

function RegimesPage() {
  const db = useDB();
  const session = useSession();
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [edit, setEdit] = useState<CustomsRegime | null>(null);
  const [newSource, setNewSource] = useState<IdentificationSource>("CASE_2");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.regimes.filter((r) => {
      if (source && r.identificationSource !== source) return false;
      if (!term) return true;
      return `${r.code} ${r.label} ${r.category}`.toLowerCase().includes(term);
    });
  }, [db.regimes, q, source]);

  return (
    <>
      <PageHeader
        title="Codes régimes douaniers"
        subtitle="Définit la case du document douanier utilisée pour identifier le client."
        actions={
          <Btn
            variant="outline"
            onClick={() =>
              downloadCSV("globitrans-codes-regimes.csv", [
                ["Code", "Libellé", "Catégorie", "Source d'identification"],
                ...rows.map((r) => [r.code, r.label, r.category, SOURCE_LABELS[r.identificationSource]]),
              ])
            }
          >
            <Download className="size-4" /> Exporter
          </Btn>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Codes configurés" value={db.regimes.length} hint="Référentiel complet" tone="primary" />
        <Kpi label="Identification Case 2" value={db.regimes.filter((r) => r.identificationSource === "CASE_2").length} hint="Déclarant / mandant" />
        <Kpi label="Identification Case 8" value={db.regimes.filter((r) => r.identificationSource === "CASE_8").length} hint="Destinataire" />
        <Kpi label="Codes non utilisés" value={db.regimes.filter((r) => r.identificationSource === "UNUSED").length} hint="Anomalie si détecté" tone="warning" />
      </div>

      <div className="card-surface mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un code ou un libellé..."
            className={`${inputClass} w-[260px]`}
          />
          <select value={source} onChange={(e) => setSource(e.target.value)} className={`${selectClass} w-[220px]`}>
            <option value="">Toutes les sources</option>
            <option value="CASE_2">Case 2</option>
            <option value="CASE_8">Case 8</option>
            <option value="UNUSED">Non utilisé</option>
          </select>
          <span className="ml-auto text-[12.5px] text-muted-foreground">{rows.length} codes affichés</span>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Libellé</Th>
              <Th>Catégorie</Th>
              <Th>Source d'identification</Th>
              <Th>Mise à jour</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.code}>
                <Td>
                  <Mono className="font-medium">{r.code}</Mono>
                </Td>
                <Td className="text-[13px]">{r.label}</Td>
                <Td className="text-[12.5px] text-muted-foreground">{r.category}</Td>
                <Td>
                  <Chip
                    tone={
                      r.identificationSource === "CASE_2" ? "blue" : r.identificationSource === "CASE_8" ? "success" : "warning"
                    }
                  >
                    {SOURCE_LABELS[r.identificationSource]}
                  </Chip>
                </Td>
                <Td className="mono text-[12px] text-muted-foreground">{formatDateTime(r.updatedAt)}</Td>
                <Td className="text-right">
                  {session?.role === "ADMIN" ? (
                    <Btn
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEdit(r);
                        setNewSource(r.identificationSource);
                      }}
                    >
                      Modifier
                    </Btn>
                  ) : (
                    <span className="text-[12px] text-muted-foreground">Lecture seule</span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={`Modifier le code ${edit?.code ?? ""}`}
        description="La source d'identification détermine quelle case du document désigne le client."
        footer={
          <>
            <Btn variant="outline" onClick={() => setEdit(null)}>
              Annuler
            </Btn>
            <Btn
              onClick={() => {
                if (!edit) return;
                updateRegime(edit.code, newSource, `${session?.firstName ?? ""} ${session?.lastName ?? "Admin"}`);
                toast.success("Règle mise à jour.", { description: `Code ${edit.code} — ${SOURCE_LABELS[newSource]}` });
                setEdit(null);
              }}
            >
              Enregistrer
            </Btn>
          </>
        }
      >
        <select value={newSource} onChange={(e) => setNewSource(e.target.value as IdentificationSource)} className={selectClass}>
          <option value="CASE_2">Case 2 — déclarant / mandant</option>
          <option value="CASE_8">Case 8 — destinataire</option>
          <option value="UNUSED">Non utilisé — génère une anomalie</option>
        </select>
      </Modal>
    </>
  );
}
