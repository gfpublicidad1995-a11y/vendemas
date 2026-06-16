import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/labels";

const TONE_CLASSES: Record<Tone, string> = {
  gray: "bg-stone-100 text-stone-600 ring-stone-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
  emerald: "bg-emerald-600 text-white ring-emerald-700",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200/80 bg-white vm-shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex gap-2">{children}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = "gray",
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  tone?: Tone;
}) {
  const dotTone: Record<Tone, string> = {
    gray: "bg-stone-300",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-600",
  };
  const inner = (
    <Card className={cn("h-full p-4", href && "vm-lift")}>
      <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
        <span className={cn("h-2 w-2 rounded-full", dotTone[tone])} />
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-stone-900">
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-stone-400">{hint}</div> : null}
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function ActionCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full p-4 vm-lift hover:border-emerald-200">
        <div className="text-2xl">{icon}</div>
        <div className="mt-2 text-sm font-semibold text-stone-800 group-hover:text-emerald-700">
          {title}
        </div>
        <p className="mt-0.5 text-xs leading-snug text-stone-500">{desc}</p>
      </Card>
    </Link>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="p-10 text-center">
      <p className="text-sm font-medium text-stone-700">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-stone-400">
          {description}
        </p>
      ) : null}
    </Card>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition active:scale-[0.98]",
        variant === "primary"
          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/25"
          : "border border-stone-200 bg-white text-stone-700 shadow-sm hover:border-stone-300 hover:bg-stone-50",
        className
      )}
    >
      {children}
    </Link>
  );
}
