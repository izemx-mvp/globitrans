import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancienne fiche dossier — désormais servie par « Mes dossiers ». */
export const Route = createFileRoute("/_espace/mains-levees/$reference")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/mes-dossiers/$reference",
      params: { reference: params.reference },
      replace: true,
    });
  },
  component: () => null,
});
