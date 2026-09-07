import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import {
  Chip,
  EmptyState,
  InfoRow,
  Kpi,
  Mono,
  PageHeader,
  Surface,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/app/bits";
import { Btn, Modal, inputClass, selectClass } from "@/components/app/dialogs";
import { syncEmails, updateSettings, useDB } from "@/services/db";
import { useSession } from "@/services/auth";
import { formatDateTime, formatTime } from "@/services/business";
import type { EmailRecord } from "@/types";

export const Route = createFileRoute("/_espace/agent-email")({
  head: () => ({
    meta: [
      { title: "Agent Email — GLOBITRANS" },
      {
        name: "description",
        content: "Supervision de l'agent de lecture des emails : classification, pièces jointes et journal de synchronisation.",
      },
      { property: "og:title", content: "Agent Email — GLOBITRANS" },
      { property: "og:description", content: "Supervision de la classification automatique des emails reçus." },
    ],
  }),
  component: AgentEmailPage,
});

const CLASS_LABELS: Record<string, string> = {
  MAIN_LEVEE: "Main levée",
  IGNORED: "Ignoré",
  UNCERTAIN: "Incertain",
};

function AgentEmailPage() {
  const db = useDB();
  const session = useSession();
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<EmailRecord | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.emails.filter((e) => {
      if (filter && e.classification !== filter) return false;
      if (!term) return true;
      return `${e.sender} ${e.subject}`.toLowerCase().includes(term);
    });
  }, [db.emails, filter, q]);

  const sync = () => {
    setBusy(true);
    setTimeout(() => {
      const r = syncEmails(`${session?.firstName ?? ""} ${session?.lastName ?? "Agent"}`);
      setBusy(false);
      toast.success("Synchronisation terminée.", {
        description: `${r.analyzed} emails analysés, ${r.detected} mains levées détectées.`,
      });
    }, 900);
  };

  return (
    <>
      <PageHeader
        title="Agent Email"
        subtitle="Lecture, classification et extraction automatiques des emails de mains levées."
        actions={
          <>
            <Btn variant="outline" onClick={() => updateSettings({ agentActive: !db.settings.agentActive })}>
              {db.settings.agentActive ? "Suspendre l'agent" : "Activer l'agent"}
            </Btn>
            <Btn onClick={sync} disabled={busy}>
              <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} /> Synchroniser
            </Btn>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="État de l'agent"
          value={db.settings.agentActive ? "Actif" : "Suspendu"}
          hint={db.settings.watchedEmail}
          tone={db.settings.agentActive ? "success" : "warning"}
        />
        <Kpi label="Emails analysés" value={db.emails.length} hint="Journée en cours" />
        <Kpi
          label="Mains levées détectées"
          value={db.emails.filter((e) => e.classification === "MAIN_LEVEE").length}
          hint="Classées automatiquement"
          tone="primary"
        />
        <Kpi
          label="À vérifier"
          value={db.emails.filter((e) => e.classification === "UNCERTAIN").length}
          hint="Classification incertaine"
          tone="warning"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="card-surface overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un expéditeur, un objet..."
              className={`${inputClass} w-[260px]`}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${selectClass} w-[180px]`}>
              <option value="">Toutes les classifications</option>
              <option value="MAIN_LEVEE">Mains levées</option>
              <option value="IGNORED">Ignorés</option>
              <option value="UNCERTAIN">Incertains</option>
            </select>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="Aucun email" description="Aucun email ne correspond aux critères." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Heure</Th>
                  <Th>Expéditeur</Th>
                  <Th>Objet</Th>
                  <Th>Pièces jointes</Th>
                  <Th>Classification</Th>
                  <Th>Confiance</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <Tr key={e.id}>
                    <Td className="mono text-[12.5px]">{formatTime(e.receivedAt)}</Td>
                    <Td className="text-[13px]">{e.sender}</Td>
                    <Td className="max-w-[320px] truncate text-[13px]">{e.subject}</Td>
                    <Td className="text-[12.5px] text-muted-foreground">{e.attachments.length}</Td>
                    <Td>
                      <Chip
                        tone={
                          e.classification === "MAIN_LEVEE" ? "success" : e.classification === "UNCERTAIN" ? "warning" : "neutral"
                        }
                      >
                        {CLASS_LABELS[e.classification]}
                      </Chip>
                    </Td>
                    <Td className="mono text-[12.5px]">{e.confidence} %</Td>
                    <Td className="text-right">
                      <Btn variant="outline" size="sm" onClick={() => setSelected(e)}>
                        Ouvrir
                      </Btn>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>

        <div className="space-y-4">
          <Surface title="Configuration de lecture">
            <InfoRow label="Boîte surveillée" value={<Mono className="text-[12px]">{db.settings.watchedEmail}</Mono>} />
            <InfoRow label="Intervalle" value={`${db.settings.syncInterval} minutes`} />
            <InfoRow label="Dernière synchro." value={formatDateTime(db.settings.lastSync)} />
            <InfoRow label="Prochaine synchro." value={formatDateTime(db.settings.nextSync)} />
            <InfoRow label="Formats acceptés" value={db.settings.formats.join(", ")} />
          </Surface>
          <Surface title="Mots-clés de détection">
            <div className="flex flex-wrap gap-1.5">
              {db.settings.keywords.map((k) => (
                <Chip key={k} tone="blue">
                  {k}
                </Chip>
              ))}
            </div>
          </Surface>
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Email source"
        description={selected?.subject}
        footer={
          <>
            {selected?.mainLeveeId ? (
              <Link to="/mes-dossiers">
                <Btn variant="outline">Voir les dossiers</Btn>
              </Link>
            ) : null}
            <Btn onClick={() => setSelected(null)}>Fermer</Btn>
          </>
        }
      >
        {selected ? (
          <div className="space-y-3">
            <InfoRow label="Expéditeur" value={selected.sender} />
            <InfoRow label="Destinataire" value={selected.recipient} />
            <InfoRow label="Reçu le" value={formatDateTime(selected.receivedAt)} />
            <InfoRow label="Classification" value={CLASS_LABELS[selected.classification]} />
            <div className="rounded-md border border-border bg-muted/40 p-3 text-[13px] whitespace-pre-line">
              {selected.body}
            </div>
            <ul className="space-y-1.5">
              {selected.attachments.map((a) => (
                <li key={a.name} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <Mono className="text-[12px]">{a.name}</Mono>
                  <span className="text-[11.5px] text-muted-foreground">{a.size}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
