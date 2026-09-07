import { useEffect } from "react";
import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppShell, PATH_LABELS, ROUTE_ROLES } from "@/components/app/shell";
import { EmptyState } from "@/components/app/bits";
import { useSession } from "@/services/auth";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_espace")({
  ssr: false,
  component: EspaceLayout,
});

function EspaceLayout() {
  const session = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!session) navigate({ to: "/", replace: true });
  }, [session, navigate]);

  if (!session) return null;

  const base = `/${pathname.split("/")[1] ?? ""}`;
  const allowed = ROUTE_ROLES[base];
  const breadcrumb: string[] = [PATH_LABELS[base] ?? "Accueil"];
  const child = pathname.split("/")[2];
  if (child) breadcrumb.push(decodeURIComponent(child));

  return (
    <AppShell breadcrumb={breadcrumb}>
      {allowed && !allowed.includes(session.role) ? (
        <div className="card-surface">
          <EmptyState
            icon={<ShieldAlert className="size-8" />}
            title="Accès non autorisé"
            description="Votre profil ne dispose pas des droits nécessaires pour consulter ce module."
          />
        </div>
      ) : (
        <Outlet />
      )}
    </AppShell>
  );
}
