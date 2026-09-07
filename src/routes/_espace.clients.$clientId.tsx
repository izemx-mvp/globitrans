import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import {
  Avatar,
  Chip,
  EmptyState,
  InfoRow,
  Mono,
  StatusBadge,
  Surface,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/app/bits";
import { Btn, Modal, inputClass } from "@/components/app/dialogs";
import { ClientModal } from "./_espace.clients.index";
import { upsertClient, useDB } from "@/services/db";
import { useSession } from "@/services/auth";
import { formatDate, formatDateTime, normalizeCompanyName } from "@/services/business";

export const Route = createFileRoute("/_espace/clients/$clientId")({
  head: () => ({
    meta: [
      { title: "Fiche client — GLOBITRANS" },
      {
        name: "description",
        content: "Fiche client : informations, alias d'identification, dossiers de main levée et historique.",
      },
      { property: "og:title", content: "Fiche client — GLOBITRANS" },
      { property: "og:description", content: "Informations client, alias d'identification et dossiers rattachés." },
    ],
  }),
  component: ClientDetailPage,
});

const TABS = ["Informations", "Dossiers", "Identification", "Historique"] as const;

function ClientDetailPage() {
  const { clientId } = useParams({ from: "/_espace/clients/$clientId" });
  const db = useDB();
  const session = useSession();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Informations");
  const [editOpen, setEditOpen] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);
  const [alias, setAlias] = useState("");

  const client = db.clients.find((c) => c.id === clientId);
  if (!client) {
    return (
      <div className="card-surface">
        <EmptyState
          title="Client introuvable"
          description="Ce client n'existe plus dans le référentiel."
          action={
            <Link to="/clients">
              <Btn variant="outline">
                <ArrowLeft className="size-4" /> Retour aux clients
              </Btn>
            </Link>
          }
        />
      </div>
    );
  }

  const declarant = db.declarants.find((d) => d.id === client.declarantId);
  const dossiers = db.mainLevees.filter((m) => m.clientId === client.id);

  return (
    <>
      <div className="mb-4 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link to="/clients" className="hover:text-foreground">
          Clients
        </Link>
        <span className="text-border">/</span>
        <span className="font-medium text-foreground">{client.companyName}</span>
      </div>

      <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-9 font-semibold tracking-tight">{client.companyName}</h1>
            <Mono className="rounded bg-muted px-2 py-0.5 text-[12.5px]">{client.code}</Mono>
            {client.active ? <Chip tone="success">Actif</Chip> : <Chip tone="neutral">Inactif</Chip>}
          </div>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {dossiers.length} dossiers de main levée — déclarant attitré :{" "}
            {declarant ? `${declarant.firstName} ${declarant.lastName}` : "non affecté"}
          </p>
        </div>
        {session?.role === "ADMIN" ? (
          <Btn variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Modifier le client
          </Btn>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3.5 py-2 text-[13.5px] transition-colors duration-150 ${
              tab === t
                ? "border-corporate font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Informations" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Surface title="Informations client">
            <InfoRow label="Raison sociale" value={client.companyName} />
            <InfoRow label="ICE" value={<Mono>{client.ice}</Mono>} />
            <InfoRow label="Email" value={client.email} />
            <InfoRow label="Téléphone" value={client.phone} />
            <InfoRow
              label="Déclarant"
              value={declarant ? `${declarant.firstName} ${declarant.lastName}` : "Non affecté"}
            />
            <InfoRow label="Créé le" value={formatDate(client.createdAt)} />
            <InfoRow label="Dernière mise à jour" value={formatDateTime(client.updatedAt)} />
          </Surface>

          <Surface
            title="Noms et alias d'identification"
            description="Utilisés pour le rapprochement des raisons sociales extraites."
            actions={
              session?.role === "ADMIN" ? (
                <Btn variant="outline" size="sm" onClick={() => setAliasOpen(true)}>
                  <Plus className="size-4" /> Ajouter un alias
                </Btn>
              ) : null
            }
          >
            <ul className="space-y-2">
              {client.aliases.map((a) => (
                <li key={a} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <Mono className="text-[12.5px]">{a}</Mono>
                  <span className="text-[11.5px] text-muted-foreground">{normalizeCompanyName(a)}</span>
                </li>
              ))}
            </ul>
          </Surface>

          {declarant ? (
            <Surface title="Déclarant responsable">
              <div className="flex items-center gap-3">
                <Avatar initials={declarant.avatar} className="size-10 text-[13px]" />
                <div>
                  <p className="text-[14px] font-medium">
                    {declarant.firstName} {declarant.lastName}
                  </p>
                  <p className="text-[12.5px] text-muted-foreground">{declarant.email}</p>
                </div>
                <Link to="/declarants/$declarantId" params={{ declarantId: declarant.id }} className="ml-auto">
                  <Btn variant="outline" size="sm">
                    Voir la fiche
                  </Btn>
                </Link>
              </div>
            </Surface>
          ) : null}
        </div>
      ) : null}

      {tab === "Dossiers" ? (
        <div className="card-surface overflow-hidden">
          {dossiers.length === 0 ? (
            <EmptyState title="Aucun dossier" description="Ce client n'a aucun dossier de main levée enregistré." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Référence</Th>
                  <Th>Date</Th>
                  <Th>Régime</Th>
                  <Th>Statut</Th>
                  <Th>Dépôt</Th>
                  <Th>Réception</Th>
                </tr>
              </thead>
              <tbody>
                {dossiers.slice(0, 30).map((m) => (
                  <Tr key={m.id}>
                    <Td>
                      <Link
                        to="/mains-levees/$reference"
                        params={{ reference: m.reference }}
                        className="mono text-[13px] font-medium text-primary hover:underline"
                      >
                        {m.reference}
                      </Link>
                    </Td>
                    <Td className="mono text-[12.5px]">{formatDate(m.releaseDate)}</Td>
                    <Td>
                      <Mono>{m.regimeCode}</Mono>
                    </Td>
                    <Td>
                      <StatusBadge status={m.status} />
                    </Td>
                    <Td className="text-[12.5px]">{m.deposited ? "Déposé" : "—"}</Td>
                    <Td className="text-[12.5px]">{m.receivedByFinance ? "Reçu" : "Non reçu"}</Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      ) : null}

      {tab === "Identification" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Surface title="Règles de rapprochement" description="Paramètres appliqués lors de l'identification automatique.">
            <InfoRow label="Seuil automatique" value={`${db.settings.autoThreshold} %`} />
            <InfoRow label="Seuil de validation manuelle" value={`${db.settings.manualThreshold} %`} />
            <InfoRow label="Normalisation des raisons sociales" value={db.settings.normalizeNames ? "Activée" : "Désactivée"} />
            <InfoRow label="Suffixes juridiques ignorés" value={db.settings.ignoreLegalSuffix ? "Oui" : "Non"} />
            <InfoRow label="Utilisation des alias" value={db.settings.useAliases ? "Oui" : "Non"} />
          </Surface>
          <Surface title="Sources d'identification observées">
            <InfoRow
              label="Dossiers identifiés via Case 2"
              value={dossiers.filter((m) => m.identificationSource === "CASE_2").length}
            />
            <InfoRow
              label="Dossiers identifiés via Case 8"
              value={dossiers.filter((m) => m.identificationSource === "CASE_8").length}
            />
            <InfoRow
              label="Confiance moyenne"
              value={`${Math.round(
                dossiers.reduce((a, m) => a + m.matchingConfidence, 0) / Math.max(dossiers.length, 1),
              )} %`}
            />
          </Surface>
        </div>
      ) : null}

      {tab === "Historique" ? (
        <Surface title="Historique du client">
          <ul className="space-y-3">
            {dossiers.slice(0, 12).map((m) => (
              <li key={m.id} className="border-b border-border/70 pb-2.5 last:border-0">
                <p className="text-[13.5px]">
                  <Mono className="font-medium">{m.reference}</Mono> — {m.regimeLabel}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {formatDate(m.releaseDate)} — {m.receivedByFinance ? "reçu par la Finance" : m.deposited ? "déposé" : "en attente de dépôt"}
                </p>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      <ClientModal open={editOpen} onClose={() => setEditOpen(false)} client={client} />

      <Modal
        open={aliasOpen}
        onClose={() => setAliasOpen(false)}
        title="Ajouter un alias"
        description="L'alias sera utilisé pour reconnaître la raison sociale extraite des documents."
        footer={
          <>
            <Btn variant="outline" onClick={() => setAliasOpen(false)}>
              Annuler
            </Btn>
            <Btn
              onClick={() => {
                if (!alias.trim()) {
                  toast.error("Alias vide.");
                  return;
                }
                upsertClient({ ...client, aliases: [...client.aliases, alias.trim().toUpperCase()] });
                setAlias("");
                setAliasOpen(false);
                toast.success("Alias ajouté.");
              }}
            >
              Ajouter
            </Btn>
          </>
        }
      >
        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="ATLAS IND."
          className={inputClass}
        />
      </Modal>
    </>
  );
}
