import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ancien module « Codes régimes » — déplacé dans Automatisation. */
export const Route = createFileRoute("/_espace/codes-regimes")({
  beforeLoad: () => {
    throw redirect({ to: "/codes-clients", replace: true });
  },
  component: () => null,
});
