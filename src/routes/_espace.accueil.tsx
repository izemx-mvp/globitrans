import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Inbox,
  Landmark,
  Loader2,
  RefreshCw,
  UserCheck,
  Users,
} from "lucide-react";
import { PageHeader, Kpi, Surface, Timeline, Chip, Mono, EmptyState } from "@/components/app/bits";
import { Btn } from "@/components/app/dialogs";
import { TODAY, useDB } from "@/services/db";
import { useSession } from "@/services/auth";
import { ANOMALY_LABELS, formatTime } from "@/services/business";
import { TODAY_LABEL } from "@/data/seed";

export const Route = createFileRoute("/_espace/accueil")({
  head: () => ({
    meta: [
      { title: "Accueil — GLOBITRANS Bureau d'Ordre Digital" },
      {
        name: "description",
        content:
          "Vue opérationnelle des mains levées du jour : dossiers à déposer, dossiers reçus par la Finance et anomalies à traiter.",
      },
      { property: "og:title", content: "Accueil — GLOBITRANS" },
      { property: "og:description", content: "Vue opérationnelle des mains levées et des dossiers à transmettre." },
    ],
  }),
  component: AccueilPage,
});

function AccueilPage() {
  const db = useDB();
  const session = useSession();
  const [refreshing, setRefreshing] = useState(false);

  const today = db.mainLevees.filter((m) => m.releaseDate === TODAY);
  const identified = today.filter((m) => m.clientId);
  const assigned = today.filter((m) => m.declarantId);
  const deposited = today.filter((m) => m.deposited);
  const received = today.filter((m) => m.receivedByFinance);
  const toDeposit = today.filter((m) => !m.deposited);
  const anomalies = today.filter((m) => m.status === "REVIEW_REQUIRED");
  const emailsToday = db.emails.filter((e) => e.receivedAt.slice(0, 10) === TODAY);

  const refresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      toast.success("Données actualisées.", { description: `${today.length} mains levées enregistrées aujourd'hui.` });
    }, 700);
  };

  const steps = [
    { label: "Emails détectés", value: emailsToday.length, icon: Inbox, state: "Analysés" },
    { label: "Mains levées", value: today.length, icon: FileCheck2, state: "Identifiées" },
    { label: "Clients identifiés", value: identified.length, icon: Users, state: `${Math.round((identified.length / Math.max(today.length, 1)) * 100)} %` },
    { label: "Dossiers affectés", value: assigned.length, icon: UserCheck, state: "Déclarants" },
    { label: "Déposés", value: deposited.length, icon: Landmark, state: "Finance" },
    { label: "Reçus Finance", value: received.length, icon: CheckCircle2, state: "Clôturés" },
  ];

  return (
    <>
      <PageHeader
        title={`Bonjour, ${session?.firstName ?? ""}`}
        subtitle="Vue opérationnelle des mains levées et des dossiers à transmettre aujourd'hui."
        actions={
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="label-xs">Journée</p>
              <p className="text-[13.5px] font-medium">{TODAY_LABEL}</p>
            </div>
            <Btn variant="outline" onClick={refresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Actualiser
            </Btn>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Mains levées du jour" value={today.length} hint="+6 depuis ce matin" tone="primary" />
        <Kpi
          label="Clients identifiés"
          value={identified.length}
          hint={`${((identified.length / Math.max(today.length, 1)) * 100).toFixed(1).replace(".", ",")} % automatiquement`}
        />
        <Kpi label="À déposer" value={toDeposit.length} hint="Dossiers en attente" tone="warning" />
        <Kpi label="Reçus par Finance" value={received.length} hint="Dossiers réceptionnés" tone="success" />
        <Kpi label="À vérifier" value={anomalies.length} hint="Anomalies détectées" tone="danger" />
      </div>

      <div className="mt-4">
        <Surface title="État du traitement aujourd'hui" description="Progression du flux de traitement des mains levées.">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-1 items-center gap-3">
                  <div className="flex-1 rounded-md border border-border bg-muted/40 px-3.5 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="size-3.5" strokeWidth={1.8} />
                      <span className="text-[12px] font-medium tracking-[0.02em] uppercase">{s.label}</span>
                    </div>
                    <p className="mono mt-1.5 text-[22px] leading-7 font-semibold">{s.value}</p>
                    <p className="text-[12px] text-muted-foreground">{s.state}</p>
                  </div>
                  {i < steps.length - 1 ? (
                    <ArrowRight className="hidden size-4 shrink-0 text-border lg:block" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </Surface>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <Surface
          title="Points nécessitant une attention"
          description="Dossiers bloqués ou nécessitant une validation manuelle."
          bodyClassName="p-0"
          actions={
            <Link to="/mes-dossiers" className="text-[12.5px] font-medium text-primary hover:underline">
              Voir tout
            </Link>
          }
        >
          {anomalies.length === 0 ? (
            <EmptyState title="Aucune anomalie" description="Tous les dossiers du jour ont été traités automatiquement." />
          ) : (
            <ul>
              {anomalies.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-3 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <AlertTriangle className="size-4 shrink-0 text-danger" />
                    <div className="min-w-0">
                      <Mono className="font-medium">{m.reference}</Mono>
                      <p className="truncate text-[12.5px] text-muted-foreground">
                        {ANOMALY_LABELS[m.anomaly ?? ""] ?? "Validation manuelle requise"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="mono text-[12.5px] text-muted-foreground">{formatTime(m.receivedAt)}</span>
                    <Link to="/mes-dossiers/$reference" params={{ reference: m.reference }}>
                      <Btn variant="outline" size="sm">
                        Examiner
                      </Btn>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface title="Activité récente" description="Derniers évènements du bureau d'ordre.">
          <Timeline items={db.activity.slice(0, 8)} />
        </Surface>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Surface title="Questions clés — Finance">
          <p className="text-[13.5px] text-muted-foreground">Quels dossiers clôturés dois-je encore recevoir ?</p>
          <p className="mono mt-3 text-[26px] font-semibold text-warning">
            {db.mainLevees.filter((m) => m.deposited && !m.receivedByFinance).length}
          </p>
          <Link to="/mes-dossiers" className="mt-2 inline-flex text-[12.5px] font-medium text-primary hover:underline">
            Ouvrir la liste Finance
          </Link>
        </Surface>
        <Surface title="Questions clés — Déclarant">
          <p className="text-[13.5px] text-muted-foreground">Quels dossiers dois-je encore déposer ?</p>
          <p className="mono mt-3 text-[26px] font-semibold text-primary">{toDeposit.length}</p>
          <Link to="/mes-dossiers" className="mt-2 inline-flex text-[12.5px] font-medium text-primary hover:underline">
            Ouvrir mes dossiers
          </Link>
        </Surface>
        <Surface title="Questions clés — Administration">
          <p className="text-[13.5px] text-muted-foreground">Quels dossiers nécessitent une intervention ?</p>
          <p className="mono mt-3 text-[26px] font-semibold text-danger">{anomalies.length}</p>
          <div className="mt-2 flex items-center gap-2">
            <Chip tone="danger">Anomalies</Chip>
            <Chip tone="blue">Validation manuelle</Chip>
          </div>
        </Surface>
      </div>
    </>
  );
}
