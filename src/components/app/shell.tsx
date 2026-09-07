import { useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  ChartBarBig,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Files,
  LayoutDashboard,
  Landmark,
  LogOut,
  MailCheck,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDB, markNotificationRead, TODAY } from "@/services/db";
import { fullName, logout, useSession, type Session } from "@/services/auth";
import { ROLE_LABELS, clientName, declarantName, formatTime } from "@/services/business";
import { Avatar, Chip } from "./bits";
import type { Role } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Files;
  roles: Role[];
  badge?: number;
}

export const PATH_LABELS: Record<string, string> = {
  "/accueil": "Accueil",
  "/mains-levees": "Mains levées",
  "/liste-finance": "Liste Finance",
  "/mes-dossiers": "Mes dossiers",
  "/agent-email": "Agent Email",
  "/clients": "Clients",
  "/declarants": "Déclarants",
  "/codes-regimes": "Codes régimes",
  "/rapports": "Rapports & Exports",
  "/utilisateurs": "Utilisateurs",
  "/parametres": "Paramètres",
};

export const ROUTE_ROLES: Record<string, Role[]> = {
  "/accueil": ["ADMIN", "FINANCE", "DECLARANT"],
  "/mains-levees": ["ADMIN", "FINANCE", "DECLARANT"],
  "/liste-finance": ["ADMIN", "FINANCE"],
  "/mes-dossiers": ["ADMIN", "DECLARANT"],
  "/agent-email": ["ADMIN"],
  "/clients": ["ADMIN", "FINANCE", "DECLARANT"],
  "/declarants": ["ADMIN", "FINANCE"],
  "/codes-regimes": ["ADMIN", "FINANCE"],
  "/rapports": ["ADMIN", "FINANCE", "DECLARANT"],
  "/utilisateurs": ["ADMIN"],
  "/parametres": ["ADMIN"],
};

function useNav(): { section: string; items: NavItem[] }[] {
  const db = useDB();
  const session = useSession();
  const today = db.mainLevees.filter((m) => m.releaseDate === TODAY);
  const toReceive = db.mainLevees.filter((m) => m.deposited && !m.receivedByFinance).length;
  const mine = db.mainLevees.filter(
    (m) => m.declarantId === session?.declarantId && !m.deposited,
  ).length;

  return [
    {
      section: "Pilotage",
      items: [{ to: "/accueil", label: "Accueil", icon: LayoutDashboard, roles: ROUTE_ROLES["/accueil"]! }],
    },
    {
      section: "Opérations",
      items: [
        { to: "/mains-levees", label: "Mains levées", icon: Files, roles: ROUTE_ROLES["/mains-levees"]!, badge: today.length },
        { to: "/liste-finance", label: "Liste Finance", icon: Landmark, roles: ROUTE_ROLES["/liste-finance"]!, badge: toReceive },
        { to: "/mes-dossiers", label: "Mes dossiers", icon: ClipboardList, roles: ROUTE_ROLES["/mes-dossiers"]!, badge: mine },
      ],
    },
    {
      section: "Automatisation",
      items: [{ to: "/agent-email", label: "Agent Email", icon: MailCheck, roles: ROUTE_ROLES["/agent-email"]! }],
    },
    {
      section: "Référentiel",
      items: [
        { to: "/clients", label: "Clients", icon: Building2, roles: ROUTE_ROLES["/clients"]! },
        { to: "/declarants", label: "Déclarants", icon: Users, roles: ROUTE_ROLES["/declarants"]! },
        { to: "/codes-regimes", label: "Codes régimes", icon: ScrollText, roles: ROUTE_ROLES["/codes-regimes"]! },
      ],
    },
    {
      section: "Analyse",
      items: [{ to: "/rapports", label: "Rapports & Exports", icon: ChartBarBig, roles: ROUTE_ROLES["/rapports"]! }],
    },
    {
      section: "Administration",
      items: [
        { to: "/utilisateurs", label: "Utilisateurs", icon: ShieldCheck, roles: ROUTE_ROLES["/utilisateurs"]! },
        { to: "/parametres", label: "Paramètres", icon: Settings, roles: ROUTE_ROLES["/parametres"]! },
      ],
    },
  ];
}

function Sidebar({ session, collapsed, onToggle }: { session: Session; collapsed: boolean; onToggle: () => void }) {
  const nav = useNav();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col bg-navy text-navy-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-[72px]" : "w-[250px]",
      )}
    >
      <div className={cn("flex items-center gap-2.5 px-4 pt-5 pb-4", collapsed && "justify-center px-0")}>
        <span className="mono flex size-9 shrink-0 items-center justify-center rounded-md bg-corporate text-[13px] font-bold text-primary-foreground">
          GT
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-semibold tracking-[0.08em]">GLOBITRANS</p>
            <p className="truncate text-[11.5px] text-navy-foreground/55">Bureau d'Ordre Digital</p>
          </div>
        ) : null}
      </div>

      <div className="mx-4 h-px bg-navy-foreground/10" />

      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        {nav.map((group) => {
          const items = group.items.filter((i) => i.roles.includes(session.role));
          if (!items.length) return null;
          return (
            <div key={group.section} className="mb-4">
              {!collapsed ? (
                <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold tracking-[0.12em] text-navy-foreground/40 uppercase">
                  {group.section}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={item.label}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] transition-colors duration-150",
                          active
                            ? "bg-corporate/25 font-medium text-navy-foreground shadow-[inset_2px_0_0_0_var(--accent-strong)]"
                            : "text-navy-foreground/70 hover:bg-navy-foreground/8 hover:text-navy-foreground",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        <Icon className="size-4 shrink-0" strokeWidth={1.8} />
                        {!collapsed ? (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge ? (
                              <span className="mono rounded bg-navy-foreground/12 px-1.5 py-0.5 text-[11px] font-semibold">
                                {item.badge}
                              </span>
                            ) : null}
                          </>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-navy-foreground/10 p-2.5">
        <button
          onClick={onToggle}
          className="mb-1.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-navy-foreground/60 transition-colors hover:bg-navy-foreground/8 hover:text-navy-foreground"
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed ? "Réduire le menu" : null}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-navy-foreground/8",
              collapsed && "justify-center px-0",
            )}
          >
            <Avatar initials={session.avatar} className="bg-corporate text-primary-foreground" />
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{fullName(session)}</p>
                <p className="truncate text-[11.5px] text-navy-foreground/55">{ROLE_LABELS[session.role]}</p>
              </div>
            ) : null}
          </button>
          {menuOpen ? (
            <div className="card-surface absolute bottom-full left-0 mb-2 w-[220px] overflow-hidden py-1 text-foreground">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate({ to: "/parametres" });
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-muted"
              >
                <UserCog className="size-4" /> Mon profil
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate({ to: "/parametres" });
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-muted"
              >
                <Settings className="size-4" /> Paramètres
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-danger/8"
              >
                <LogOut className="size-4" /> Se déconnecter
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function GlobalSearch() {
  const db = useDB();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const term = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (term.length < 2) return null;
    return {
      dossiers: db.mainLevees
        .filter(
          (m) =>
            m.reference.toLowerCase().includes(term) ||
            m.declarationNumber.toLowerCase().includes(term) ||
            clientName(db, m.clientId).toLowerCase().includes(term),
        )
        .slice(0, 5),
      clients: db.clients
        .filter((c) => c.companyName.toLowerCase().includes(term) || c.code.toLowerCase().includes(term))
        .slice(0, 4),
      declarants: db.declarants
        .filter((d) => `${d.firstName} ${d.lastName}`.toLowerCase().includes(term))
        .slice(0, 4),
      emails: db.emails.filter((e) => e.subject.toLowerCase().includes(term)).slice(0, 3),
    };
  }, [db, term]);

  const go = (to: string) => {
    setQ("");
    navigate({ to });
  };

  return (
    <div className="relative w-full max-w-[520px]">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un dossier, un client, un déclarant..."
        className="h-9 w-full rounded-md border border-border bg-muted/60 pr-8 pl-9 text-[13px] outline-none transition-colors duration-150 focus:border-ring focus:bg-card"
      />
      {q ? (
        <button onClick={() => setQ("")} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground">
          <X className="size-4" />
        </button>
      ) : null}

      {results ? (
        <div className="card-surface absolute top-11 left-0 z-40 max-h-[420px] w-full overflow-y-auto shadow-[var(--shadow-raised)]">
          {results.dossiers.length === 0 &&
          results.clients.length === 0 &&
          results.declarants.length === 0 &&
          results.emails.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">Aucun résultat pour « {q} ».</p>
          ) : null}
          {results.dossiers.length ? (
            <div className="py-2">
              <p className="label-xs px-4 pb-1">Dossiers</p>
              {results.dossiers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => go(`/mains-levees/${m.reference}`)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-1.5 text-left hover:bg-muted"
                >
                  <span className="mono text-[13px] font-medium">{m.reference}</span>
                  <span className="truncate text-[12.5px] text-muted-foreground">{clientName(db, m.clientId)}</span>
                </button>
              ))}
            </div>
          ) : null}
          {results.clients.length ? (
            <div className="border-t border-border py-2">
              <p className="label-xs px-4 pb-1">Clients</p>
              {results.clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => go(`/clients/${c.id}`)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-1.5 text-left hover:bg-muted"
                >
                  <span className="mono text-[13px]">{c.code}</span>
                  <span className="truncate text-[12.5px] text-muted-foreground">{c.companyName}</span>
                </button>
              ))}
            </div>
          ) : null}
          {results.declarants.length ? (
            <div className="border-t border-border py-2">
              <p className="label-xs px-4 pb-1">Déclarants</p>
              {results.declarants.map((d) => (
                <button
                  key={d.id}
                  onClick={() => go(`/declarants/${d.id}`)}
                  className="block w-full px-4 py-1.5 text-left text-[13px] hover:bg-muted"
                >
                  {d.firstName} {d.lastName}
                </button>
              ))}
            </div>
          ) : null}
          {results.emails.length ? (
            <div className="border-t border-border py-2">
              <p className="label-xs px-4 pb-1">Emails</p>
              {results.emails.map((e) => (
                <button
                  key={e.id}
                  onClick={() => go(`/agent-email/${e.id}`)}
                  className="block w-full truncate px-4 py-1.5 text-left text-[13px] hover:bg-muted"
                >
                  {e.subject}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Notifications() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const unread = db.notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors duration-150 hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unread ? (
          <span className="mono absolute -top-1.5 -right-1.5 flex size-4.5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="card-surface absolute right-0 z-40 mt-2 w-[360px] overflow-hidden shadow-[var(--shadow-raised)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-[13.5px] font-semibold">Notifications</p>
            <button
              onClick={() => markNotificationRead()}
              className="text-[12px] font-medium text-primary hover:underline"
            >
              Tout marquer comme lu
            </button>
          </div>
          <ul className="max-h-[380px] overflow-y-auto">
            {db.notifications.slice(0, 12).map((n) => (
              <li key={n.id} className={cn("border-b border-border/70 px-4 py-3", !n.read && "bg-soft/60")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{n.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">{n.detail}</p>
                  </div>
                  <span className="mono text-[11.5px] text-muted-foreground">{formatTime(n.at)}</span>
                </div>
                {!n.read ? (
                  <button
                    onClick={() => markNotificationRead(n.id)}
                    className="mt-1.5 text-[12px] font-medium text-primary hover:underline"
                  >
                    Marquer comme lu
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Header({ session, breadcrumb }: { session: Session; breadcrumb: string[] }) {
  const db = useDB();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card/95 px-5 backdrop-blur">
      <nav className="hidden min-w-[180px] shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground xl:flex">
        <span>Bureau d'ordre</span>
        {breadcrumb.map((b) => (
          <span key={b} className="flex items-center gap-1.5">
            <span className="text-border">/</span>
            <span className="font-medium text-foreground">{b}</span>
          </span>
        ))}
      </nav>
      <div className="flex flex-1 justify-center">
        <GlobalSearch />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Chip tone={db.settings.agentActive ? "success" : "danger"} className="hidden md:inline-flex">
          <span className="mr-1.5 size-1.5 rounded-full bg-current" />
          {db.settings.agentActive ? "Agent Email actif" : "Agent Email arrêté"}
        </Chip>
        <Notifications />
        <div className="flex items-center gap-2">
          <Avatar initials={session.avatar} />
          <div className="hidden leading-tight md:block">
            <p className="text-[13px] font-medium">{fullName(session)}</p>
            <p className="text-[11.5px] text-muted-foreground">{ROLE_LABELS[session.role]}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children, breadcrumb }: { children: ReactNode; breadcrumb: string[] }) {
  const session = useSession();
  const [collapsed, setCollapsed] = useState(false);
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar session={session} collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-[250px]")}>
        <Header session={session} breadcrumb={breadcrumb} />
        <main className="mx-auto max-w-[1560px] px-5 py-6">{children}</main>
      </div>
    </div>
  );
}

export { declarantName, clientName };
