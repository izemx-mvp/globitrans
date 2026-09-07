import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancien module « Mains levées » — fusionné dans « Mes dossiers ». */
export const Route = createFileRoute("/_espace/mains-levees/")({
  beforeLoad: () => {
    throw redirect({ to: "/mes-dossiers", replace: true });
  },
  component: () => null,
});
