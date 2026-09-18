import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronDown, RotateCcw } from "lucide-react";
import { Chip, InfoRow, PageHeader, Surface } from "@/components/app/bits";
import { Btn, Field, Modal, Textarea, inputClass } from "@/components/app/dialogs";
import { resetDemoData, updateSettings, useDB } from "@/services/db";
import { useSession } from "@/services/auth";
import { formatDateTime } from "@/services/business";
import type { WorkflowNotification, WorkflowStepKey } from "@/types";

export const Route = createFileRoute("/_espace/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — GLOBITRANS" },
      {
        name: "description",
        content: "Paramètres du bureau d'ordre : agent email, seuils de rapprochement, notifications et réinitialisation de la démonstration.",
      },
      { property: "og:title", content: "Paramètres — GLOBITRANS" },
      { property: "og:description", content: "Configuration de l'agent email, des seuils et des notifications." },
    ],
  }),
  component: SettingsPage,
});

const WORKFLOW_STEPS: [WorkflowStepKey, string, string][] = [
  ["deposit", "Dépôt du dossier", "Relances au déclarant tant que le dépôt n'est pas validé."],
  ["reception", "Validation de réception", "Relances à la Finance jusqu'à la confirmation de réception."],
  ["validation", "Validation du dossier", "Relances à la Finance jusqu'à la validation finale du dossier."],
];

/** Carte dépliable de configuration des emails d'une étape du workflow. */
function WorkflowNotificationCard({
  title,
  hint,
  value,
  open,
  onToggleOpen,
  onChange,
}: {
  title: string;
  hint: string;
  value: WorkflowNotification;
  open: boolean;
  onToggleOpen: () => void;
  onChange: (patch: Partial<WorkflowNotification>) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
        <button type="button" onClick={onToggleOpen} className="flex flex-1 items-center gap-2 text-left">
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          <span>
            <span className="block text-[13.5px] font-semibold">{title}</span>
            <span className="block text-[12px] text-muted-foreground">{hint}</span>
          </span>
        </button>
        <Chip tone={value.enabled ? "success" : "neutral"}>{value.enabled ? "Activé" : "Désactivé"}</Chip>
        <label className="flex items-center gap-2 text-[12.5px]">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="size-4 accent-[var(--corporate)]"
          />
          Activer
        </label>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-border px-3.5 py-3">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={value.toDeclarant}
                onChange={(e) => onChange({ toDeclarant: e.target.checked })}
                className="size-4 accent-[var(--corporate)]"
              />
              Notification au déclarant
            </label>
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={value.toFinance}
                onChange={(e) => onChange({ toFinance: e.target.checked })}
                className="size-4 accent-[var(--corporate)]"
              />
              Notification à la Finance
            </label>
          </div>
          <Field label="Période entre les relances (jours)">
            <input
              type="number"
              min={1}
              value={value.relanceDays}
              onChange={(e) => onChange({ relanceDays: Math.max(1, Number(e.target.value) || 1) })}
              className={`${inputClass} max-w-[140px]`}
            />
          </Field>
          <Field label="Objet de l'email">
            <input value={value.subject} onChange={(e) => onChange({ subject: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Message de notification">
            <Textarea value={value.message} onChange={(e) => onChange({ message: e.target.value })} rows={4} />
          </Field>
          <p className="text-[12px] text-muted-foreground">
            Variables disponibles : <span className="mono">{"{{reference_dossier}}"}</span>. Les relances s'arrêtent
            automatiquement dès que l'étape est validée.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SettingsPage() {
  const db = useDB();
  const session = useSession();
  const navigate = useNavigate();
  const s = db.settings;
  const [resetOpen, setResetOpen] = useState(false);
  const [openStep, setOpenStep] = useState<WorkflowStepKey | null>("deposit");

  const toggle = (key: keyof typeof s, value: boolean) => {
    updateSettings({ [key]: value });
    toast.success("Paramètre mis à jour.");
  };

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Configuration de la plateforme et du profil utilisateur." />

      <div className="grid gap-4 xl:grid-cols-2">
        <Surface title="Profil utilisateur">
          <InfoRow label="Nom" value={`${session?.firstName ?? ""} ${session?.lastName ?? ""}`} />
          <InfoRow label="Email" value={session?.email ?? "—"} />
          <InfoRow label="Rôle" value={<Chip tone="blue">{session?.role ?? "—"}</Chip>} />
          <InfoRow label="Connecté depuis" value={formatDateTime(session?.loggedAt)} />
        </Surface>

        <Surface title="Agent Email" description="Boîte surveillée et fréquence de lecture.">
          <div className="space-y-3">
            <Field label="Boîte surveillée">
              <input
                value={s.watchedEmail}
                onChange={(e) => updateSettings({ watchedEmail: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Intervalle de synchronisation (minutes)">
              <input
                type="number"
                min={1}
                value={s.syncInterval}
                onChange={(e) => updateSettings({ syncInterval: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={s.agentActive}
                onChange={(e) => toggle("agentActive", e.target.checked)}
                className="size-4 accent-[var(--corporate)]"
              />
              Agent actif
            </label>
          </div>
        </Surface>

        <Surface title="Notifications générales">
          <div className="space-y-2.5">
            {(
              [
                ["notifyNewMainLevee", "Nouvelle main levée détectée"],
                ["notifyDeposit", "Dépôt effectué par un déclarant"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={s[key]}
                  onChange={(e) => toggle(key, e.target.checked)}
                  className="size-4 accent-[var(--corporate)]"
                />
                {label}
              </label>
            ))}
          </div>
        </Surface>


        <Surface
          title="Données de démonstration"
          description="Réinitialise l'ensemble du registre à son état initial."
        >
          <Btn variant="outline" onClick={() => setResetOpen(true)}>
            <RotateCcw className="size-4" /> Réinitialiser la démonstration
          </Btn>
        </Surface>
      </div>

      <div className="mt-4">
        <Surface
          title="Notifications du workflow"
          description="Emails envoyés et relances automatiques pour chaque étape du traitement des dossiers."
        >
          <div className="space-y-2.5">
            {WORKFLOW_STEPS.map(([key, title, hint]) => (
              <WorkflowNotificationCard
                key={key}
                title={title}
                hint={hint}
                value={s.workflowNotifications[key]}
                open={openStep === key}
                onToggleOpen={() => setOpenStep(openStep === key ? null : key)}
                onChange={(patch) =>
                  updateSettings({
                    workflowNotifications: {
                      ...s.workflowNotifications,
                      [key]: { ...s.workflowNotifications[key], ...patch },
                    },
                  })
                }
              />
            ))}
          </div>
        </Surface>
      </div>


      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Réinitialiser les données"
        description="Toutes les modifications effectuées (dépôts, réceptions, notes, clients) seront perdues."
        footer={
          <>
            <Btn variant="outline" onClick={() => setResetOpen(false)}>
              Annuler
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                resetDemoData();
                setResetOpen(false);
                toast.success("Données de démonstration réinitialisées.");
                navigate({ to: "/accueil" });
              }}
            >
              Réinitialiser
            </Btn>
          </>
        }
      >
        <p className="text-[13px] text-muted-foreground">Cette action est immédiate et irréversible.</p>
      </Modal>
    </>
  );
}
