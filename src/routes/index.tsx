import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import loginVisual from "@/assets/login-visual.jpg";
import { login, useSession } from "@/services/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion — GLOBITRANS Bureau d'Ordre Digital" },
      {
        name: "description",
        content:
          "Accédez au Bureau d'Ordre Digital GLOBITRANS : centralisation, identification et suivi des mains levées jusqu'à leur réception par la Finance.",
      },
      { property: "og:title", content: "GLOBITRANS — Bureau d'Ordre Digital des Mains Levées" },
      {
        property: "og:description",
        content:
          "Plateforme interne de centralisation et de suivi des dossiers de main levée douanière jusqu'à leur réception par le département Finance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const DEMO = [
  { role: "Administrateur", email: "admin@globitrans.demo" },
  { role: "Finance", email: "finance@globitrans.demo" },
  { role: "Déclarant", email: "declarant@globitrans.demo" },
];

function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@globitrans.demo");
  const [password, setPassword] = useState("demo123");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/accueil", replace: true });
  }, [session, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    window.setTimeout(() => {
      const res = login(email, password, remember);
      setLoading(false);
      if (!res.ok) setError(res.error ?? "Connexion impossible.");
      else navigate({ to: "/accueil", replace: true });
    }, 450);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy px-12 py-12 text-navy-foreground lg:flex">
        <img
          src={loginVisual}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-35"
        />
        <div className="relative flex items-center gap-3">
          <span className="mono flex size-10 items-center justify-center rounded-md bg-corporate text-[14px] font-bold text-primary-foreground">
            GT
          </span>
          <div>
            <p className="text-[15px] font-semibold tracking-[0.1em]">GLOBITRANS</p>
            <p className="text-[12px] text-navy-foreground/60">Bureau d'Ordre Digital</p>
          </div>
        </div>

        <div className="relative max-w-[520px]">
          <h1 className="text-[38px] leading-[1.15] font-semibold tracking-tight">Bureau d'Ordre Digital</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-navy-foreground/75">
            Centralisez, identifiez et suivez vos dossiers de main levée jusqu'à leur réception par la Finance.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ["Détection", "Agent Email"],
              ["Identification", "Case 2 / Case 8"],
              ["Traçabilité", "Dépôt & réception"],
            ].map(([title, sub]) => (
              <div key={title} className="rounded-md border border-navy-foreground/12 bg-navy-foreground/5 px-3 py-2.5">
                <p className="text-[12.5px] font-medium">{title}</p>
                <p className="text-[11.5px] text-navy-foreground/55">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[12px] text-navy-foreground/45">
          Plateforme interne — Direction des Opérations Douanières
        </p>
      </section>

      <section className="flex items-center justify-center bg-card px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <p className="text-[15px] font-semibold tracking-[0.1em]">GLOBITRANS</p>
            <p className="text-[12px] text-muted-foreground">Bureau d'Ordre Digital</p>
          </div>
          <h2 className="text-[26px] font-semibold tracking-tight">Connexion</h2>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Accédez à votre espace GLOBITRANS.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-card pr-3 pl-9 text-[13.5px] outline-none transition-colors duration-150 focus:border-ring"
                  placeholder="prenom.nom@globitrans.demo"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-card pr-3 pl-9 text-[13.5px] outline-none transition-colors duration-150 focus:border-ring"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-md border border-danger/25 bg-danger/8 px-3 py-2 text-[13px] text-danger">{error}</p>
            ) : null}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-border accent-[var(--corporate)]"
                />
                Se souvenir de moi
              </label>
              <button type="button" className="text-[13px] font-medium text-primary hover:underline">
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13.5px] font-medium text-primary-foreground transition-colors duration-150 hover:bg-deep disabled:opacity-70"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {loading ? "Connexion..." : "Se connecter"}
              {!loading ? <ArrowRight className="size-4" /> : null}
            </button>
          </form>

          <div className="mt-8 rounded-md border border-border bg-muted/60 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              <ShieldCheck className="size-3.5" /> Comptes de démonstration
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {DEMO.map((d) => (
                <li key={d.email} className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">{d.role}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(d.email);
                      setPassword("demo123");
                    }}
                    className="mono text-[12.5px] font-medium text-primary hover:underline"
                  >
                    {d.email}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[12px] text-muted-foreground">
              Mot de passe : <span className="mono">demo123</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
