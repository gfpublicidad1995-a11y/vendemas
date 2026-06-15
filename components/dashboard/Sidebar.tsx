"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Ruler,
  PackageCheck,
  MessagesSquare,
  Lightbulb,
  Radar,
  Sunrise,
  CalendarDays,
  BarChart3,
  Wallet,
  MessageCircle,
  Target,
  Activity,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "General",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/businesses", label: "Negocios", icon: Store },
    ],
  },
  {
    title: "Producción",
    items: [
      { href: "/dashboard/orders", label: "Pedidos", icon: ClipboardList },
      { href: "/dashboard/content", label: "Piezas generadas", icon: FileText },
      { href: "/dashboard/visuals", label: "Imágenes", icon: ImageIcon },
      { href: "/dashboard/campaigns", label: "Campañas", icon: Megaphone },
      { href: "/dashboard/creative-specs", label: "Specs Meta Ads", icon: Ruler },
      { href: "/dashboard/deliveries", label: "Entregas", icon: PackageCheck },
    ],
  },
  {
    title: "Inteligencia",
    items: [
      { href: "/dashboard/strategy", label: "Estrategia", icon: Target },
      { href: "/dashboard/conversations", label: "Conversaciones", icon: MessagesSquare },
      { href: "/dashboard/insights", label: "Aprendizajes", icon: Lightbulb },
      { href: "/dashboard/opportunities", label: "Oportunidades", icon: Radar },
      { href: "/dashboard/digests", label: "Ideas para mañana", icon: Sunrise },
      { href: "/dashboard/reports/weekly", label: "Reporte semanal", icon: BarChart3 },
      { href: "/dashboard/optimization", label: "Resultados y optimización", icon: Activity },
    ],
  },
  {
    title: "Planificación",
    items: [
      { href: "/dashboard/calendar", label: "Calendario", icon: CalendarDays },
      { href: "/dashboard/budget-planner", label: "Planificador de pauta", icon: Wallet },
      { href: "/dashboard/forecast", label: "Simulador de resultados", icon: TrendingUp },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { href: "/dashboard/simulator", label: "Simulador WhatsApp", icon: MessageCircle },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
        V
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold text-stone-900">VendeMás</div>
        <div className="text-[11px] text-stone-400">Agencia por WhatsApp</div>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-8">
      {NAV.map((group) => (
        <div key={group.title}>
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            {group.title}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                      active
                        ? "bg-emerald-50 font-medium text-emerald-700"
                        : "text-stone-600 hover:bg-stone-100"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Sidebar fijo para desktop. */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
      <div className="px-5 py-5">
        <Brand />
      </div>
      <NavList />
    </aside>
  );
}

/** Barra superior + drawer para mobile. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:hidden">
        <Brand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-5">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
