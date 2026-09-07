import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancien module « Rapports & Exports » — supprimé, exports disponibles dans Mes dossiers. */
export const Route = createFileRoute("/_espace/rapports")({
  beforeLoad: () => {
    throw redirect({ to: "/mes-dossiers", replace: true });
  },
  component: () => null,
});
