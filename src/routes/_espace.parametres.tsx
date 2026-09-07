import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Chip, InfoRow, PageHeader, Surface } from "@/components/app/bits";
import { Btn, Field, Modal, inputClass } from "@/components/app/dialogs";
import { resetDemoData, updateSettings, useDB } from "@/services/db";
import { useSession } from "@/services/auth";
import { formatDateTime } from "@/services/business";

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

function SettingsPage() {
  const db = useDB();
  const session = useSession();
  const navigate = useNavigate();
  const s = db.settings;
  const [resetOpen, setResetOpen] = useState(false);

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

        <Surface title="Rapprochement des clients" description="Seuils de confiance appliqués à l'identification.">
          <div className="space-y-3">
            <Field label={`Seuil d'identification automatique : ${s.autoThreshold} %`}>
              <input
                type="range"
                min={50}
                max={100}
                value={s.autoThreshold}
                onChange={(e) => updateSettings({ autoThreshold: Number(e.target.value) })}
                className="w-full accent-[var(--corporate)]"
              />
            </Field>
            <Field label={`Seuil de validation manuelle : ${s.manualThreshold} %`}>
              <input
                type="range"
                min={30}
                max={95}
                value={s.manualThreshold}
                onChange={(e) => updateSettings({ manualThreshold: Number(e.target.value) })}
                className="w-full accent-[var(--corporate)]"
              />
            </Field>
            {(
              [
                ["normalizeNames", "Normaliser les raisons sociales"],
                ["ignoreLegalSuffix", "Ignorer les suffixes juridiques (SARL, SA...)"],
                ["useAliases", "Utiliser les alias clients"],
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

        <Surface title="Notifications">
          <div className="space-y-2.5">
            {(
              [
                ["notifyNewMainLevee", "Nouvelle main levée détectée"],
                ["notifyAnomaly", "Anomalie détectée"],
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
