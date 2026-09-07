import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { MainLeveeStatus } from "@/types";
import { STATUS_LABELS } from "@/services/business";

export function PageHeader({
  title,
  subtitle,
  actions,
  meta,
}: {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-[28px] leading-9 font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-3xl text-[14px] text-muted-foreground">{subtitle}</p> : null}
        {meta}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Surface({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("card-surface overflow-hidden", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
            {description ? <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
  icon?: ReactNode;
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <div className="card-surface px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="label-xs">{label}</span>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <div className={cn("mono mt-2 text-[26px] leading-8 font-semibold", toneClass)}>{value}</div>
      {hint ? <p className="mt-0.5 text-[12.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const STATUS_STYLES: Record<MainLeveeStatus, string> = {
  NEW: "bg-muted text-neutral border-border",
  ANALYZING: "bg-soft text-corporate border-soft",
  CLIENT_IDENTIFIED: "bg-soft text-deep border-soft",
  REVIEW_REQUIRED: "bg-danger/10 text-danger border-danger/25",
  TO_DEPOSIT: "bg-warning/10 text-warning border-warning/25",
  DEPOSITED: "bg-deep/10 text-deep border-deep/20",
  FINANCE_RECEIVED: "bg-success/10 text-success border-success/25",
};

export function StatusBadge({ status, className }: { status: MainLeveeStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] font-medium whitespace-nowrap",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-muted text-neutral border-border",
    blue: "bg-soft text-corporate border-soft",
    success: "bg-success/10 text-success border-success/25",
    warning: "bg-warning/10 text-warning border-warning/25",
    danger: "bg-danger/10 text-danger border-danger/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("mono text-[13px]", className)}>{children}</span>;
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border/70 py-2.5 last:border-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right text-[13.5px] font-medium text-foreground">{value}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon ? <div className="mb-3 text-muted-foreground/70">{icon}</div> : null}
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-md text-[13px] text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-soft text-[12px] font-semibold text-deep",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function Timeline({
  items,
}: {
  items: { at: string; label: string; author?: string | undefined }[];
}) {
  if (!items.length) return <EmptyState title="Aucun évènement" description="L'historique est vide." />;
  return (
    <ol className="relative space-y-4 pl-5">
      <span className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-border" aria-hidden />
      {items.map((item, i) => (
        <li key={`${item.at}-${i}`} className="relative">
          <span className="absolute top-1.5 -left-5 size-[11px] rounded-full border-2 border-card bg-corporate" aria-hidden />
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="mono text-[12.5px] font-medium text-muted-foreground">{item.at.slice(11, 16)}</span>
            <p className="text-[13.5px] text-foreground">{item.label}</p>
          </div>
          {item.author ? <p className="mt-0.5 text-[12px] text-muted-foreground">{item.author}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function Stepper({
  steps,
}: {
  steps: { label: string; at?: string | undefined; done: boolean }[];
}) {
  return (
    <ol className="relative space-y-5 pl-6">
      <span className="absolute top-2 bottom-2 left-[7px] w-px bg-border" aria-hidden />
      {steps.map((s) => (
        <li key={s.label} className="relative">
          <span
            className={cn(
              "absolute top-0.5 -left-6 flex size-4 items-center justify-center rounded-full border text-[9px] font-bold",
              s.done
                ? "border-success bg-success text-success-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
            aria-hidden
          >
            {s.done ? "✓" : ""}
          </span>
          <p className={cn("text-[13.5px] font-medium", s.done ? "text-foreground" : "text-muted-foreground")}>
            {s.label}
          </p>
          <p className="mono text-[12px] text-muted-foreground">{s.at ? s.at.slice(11, 16) : "En attente"}</p>
        </li>
      ))}
    </ol>
  );
}

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 border-b border-border bg-muted/70 px-3 py-2.5 text-left text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap text-muted-foreground uppercase backdrop-blur",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("border-b border-border/70 px-3 py-2.5 align-middle", className)} {...props}>
      {children}
    </td>
  );
}

export function Tr({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("transition-colors duration-150 hover:bg-soft/50", className)} {...props}>
      {children}
    </tr>
  );
}
