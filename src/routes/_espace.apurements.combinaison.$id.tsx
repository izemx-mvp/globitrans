import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Download, Layers } from "lucide-react";
import { Chip, EmptyState, InfoRow, Mono, PageHeader, Surface, TableWrap, Td, Th, Tr } from "@/components/app/bits";
import { Btn, Modal } from "@/components/app/dialogs";
import { fullName, useSession } from "@/services/auth";
import { formatDate, formatDateTime } from "@/services/business";
import {
  LINE_STATUS_LABELS,
  exportApurement,
  formatDelta,
  formatValue,
  formatWeight,
  useApurements,
  validateApurement,
} from "@/services/apurements";
import type { ApurementLine } from "@/types/apurements";

export const Route = createFileRoute("/_espace/apurements/combinaison/$id")({
  head: () => ({
    meta: [
      { title: "Détail de la combinaison — GLOBITRANS" },
      {
        name: "description",
        content:
          "Lignes constituant la combinaison d'apurement, totaux de poids et de valeur, écarts par rapport à l'objectif.",
      },
      { property: "og:title", content: "Détail de la combinaison — GLOBITRANS" },
      { property: "og:description", content: "Détail des lignes retenues pour un apurement GLOBITRANS." },
    ],
  }),
  component: CombinaisonPage,
});

function CombinaisonPage() {
  const { id } = useParams({ from: "/_espace/apurements/combinaison/$id" });
  const state = useApurements();
  const navigate = useNavigate();
  const session = useSession();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const record = state.records.find((r) => r.number === id);
  const solution = state.lastSearch?.solutions.find((s) => s.id === id);

  const lineById = useMemo(() => new Map(state.lines.map((l) => [l.id, l] as const)), [state.lines]);
  const ids = record?.lineIds ?? solution?.lineIds ?? [];
  const lines = ids.map((lid) => lineById.get(lid)).filter(Boolean) as ApurementLine[];

  if (!record && !solution) {
    return (
      <>
        <PageHeader title="Détail de la combinaison" />
        <div className="card-surface">
          <EmptyState
            icon={<Layers className="size-8" />}
            title="Combinaison introuvable"
            description="Cette combinaison n'est plus disponible. Relancez une recherche d'apurement."
            action={
              <Btn variant="outline" onClick={() => navigate({ to: "/apurements" })}>
                <ArrowLeft className="size-4" /> Retour aux résultats
              </Btn>
            }
          />
        </div>
      </>
    );
  }

  const targetWeight = record?.targetWeight ?? solution!.targetWeight;
  const targetValue = record?.targetValue ?? solution!.targetValue;
  const weight = record?.obtainedWeight ?? solution!.weight;
  const value = record?.obtainedValue ?? solution!.value;
  const exact = record?.exact ?? solution!.exact;
  const deltaWeight = Number((weight - targetWeight).toFixed(3));
  const deltaValue = Number((value - targetValue).toFixed(2));
  const totalWeight = Number(lines.reduce((a, l) => a + l.weight, 0).toFixed(3));
  const totalValue = Number(lines.reduce((a, l) => a + l.value, 0).toFixed(2));

  const doExport = () =>
    void exportApurement({
      filename: `${record?.number ?? "apurement-combinaison"}.xlsx`,
      reference: record?.number ?? "Combinaison proposée",
      date: record ? formatDateTime(record.at) : formatDate(new Date().toISOString().slice(0, 10)),
      targetWeight,
      targetValue,
      obtainedWeight: weight,
      obtainedValue: value,
      lines,
    });

  const confirm = () => {
    if (!solution) return;
    const created = validateApurement(solution, session ? fullName(session) : "Système");
    setConfirmOpen(false);
    toast.success("Apurement validé avec succès.", { description: `Référence ${created.number}.` });
    navigate({ to: "/apurements" });
  };

  return (
    <>
      <PageHeader
        title="Détail de la combinaison"
        subtitle={
          record
            ? `Apurement ${record.number} validé par ${record.user} le ${formatDateTime(record.at)}.`
            : "Lignes proposées par le moteur de recherche pour atteindre votre objectif."
        }
        actions={
          <>
            <Btn variant="outline" onClick={() => navigate({ to: "/apurements" })}>
              <ArrowLeft className="size-4" /> Retour aux résultats
            </Btn>
            <Btn variant="outline" onClick={doExport}>
              <Download className="size-4" /> Exporter
            </Btn>
            {solution ? (
              <Btn onClick={() => setConfirmOpen(true)}>
                <CheckCircle2 className="size-4" /> Valider l'apurement
              </Btn>
            ) : null}
          </>
        }
      />

      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        <Surface title="Objectif">
          <InfoRow label="Poids cible" value={<Mono>{formatWeight(targetWeight)}</Mono>} />
          <InfoRow label="Valeur cible" value={<Mono>{formatValue(targetValue)}</Mono>} />
        </Surface>
        <Surface title="Résultat">
          <InfoRow label="Poids obtenu" value={<Mono>{formatWeight(weight)}</Mono>} />
          <InfoRow label="Valeur obtenue" value={<Mono>{formatValue(value)}</Mono>} />
        </Surface>
        <Surface title="Synthèse">
          <InfoRow label="Écart poids" value={<Mono>{formatDelta(deltaWeight, "kg")}</Mono>} />
          <InfoRow label="Écart valeur" value={<Mono>{formatDelta(deltaValue, "€")}</Mono>} />
          <InfoRow label="Nombre de lignes" value={<Mono>{lines.length}</Mono>} />
          <InfoRow
            label="Statut"
            value={
              <Chip tone={exact ? "success" : "warning"}>
                {exact ? "Correspondance exacte" : "Correspondance proche"}
              </Chip>
            }
          />
        </Surface>
      </div>

      <Surface title="Lignes de la combinaison" description={`${lines.length} ligne(s) retenue(s)`} bodyClassName="p-0">
        <TableWrap>
          <thead>
            <tr>
              <Th>Référence</Th>
              <Th>Client</Th>
              <Th>Code régime</Th>
              <Th>Date</Th>
              <Th className="text-right">Poids</Th>
              <Th className="text-right">Valeur</Th>
              <Th>Déclarant</Th>
              <Th>Source</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <Tr key={l.id}>
                <Td><Mono>{l.reference}</Mono></Td>
                <Td className="text-[13.5px]">{l.client}</Td>
                <Td><Mono>{l.regimeCode}</Mono></Td>
                <Td className="text-[13px] whitespace-nowrap">{formatDate(l.date)}</Td>
                <Td className="mono text-right text-[13px]">{formatWeight(l.weight)}</Td>
                <Td className="mono text-right text-[13px]">{formatValue(l.value)}</Td>
                <Td className="text-[13px]">{l.declarant}</Td>
                <Td className="text-[13px]">{l.source}</Td>
                <Td>
                  <Chip tone={l.status === "CLEARED" ? "neutral" : "blue"}>{LINE_STATUS_LABELS[l.status]}</Chip>
                </Td>
              </Tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/70">
              <Td colSpan={4} className="text-[13px] font-semibold tracking-[0.04em] uppercase">
                Total
              </Td>
              <Td className="mono text-right text-[14px] font-semibold">{formatWeight(totalWeight)}</Td>
              <Td className="mono text-right text-[14px] font-semibold">{formatValue(totalValue)}</Td>
              <Td colSpan={3} />
            </tr>
          </tfoot>
        </TableWrap>
      </Surface>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmer l'apurement de cette combinaison ?"
        description={`${lines.length} ligne(s) · ${formatWeight(totalWeight)} · ${formatValue(totalValue)}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setConfirmOpen(false)}>Annuler</Btn>
            <Btn onClick={confirm}>
              <CheckCircle2 className="size-4" /> Valider l'apurement
            </Btn>
          </>
        }
      >
        <p className="text-[13.5px] text-muted-foreground">
          Un numéro d'apurement sera généré automatiquement et les lignes sélectionnées passeront au statut « Apurée ».
        </p>
      </Modal>
    </>
  );
}
