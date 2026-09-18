import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancien module « Liste Finance » — fusionné dans « Mes dossiers ». */
export const Route = createFileRoute("/_espace/liste-finance")({
  beforeLoad: () => {
    throw redirect({ to: "/mes-dossiers", replace: true });
  },
  component: () => null,
});
