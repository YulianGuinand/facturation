"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCompany } from "@/lib/company-context";
import { cn } from "@/lib/utils";
import {
  Building2,
  ChevronLeft,
  ClipboardList,
  FileSignature,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/devis", label: "Devis", icon: FileText },
  { href: "/dashboard/factures", label: "Factures", icon: FileSignature },
  { href: "/dashboard/avoirs", label: "Avoirs", icon: FileSpreadsheet },
  {
    href: "/dashboard/bons-de-commande",
    label: "Bons de commande",
    icon: ClipboardList,
  },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/produits", label: "Produits", icon: Package },
];

const bottomItems = [
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { company, companies, setCompanyId } = useCompany();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-zinc-50 border-r border-zinc-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between h-14 px-3 border-b border-zinc-200">
        {!collapsed && company && (
          <div className="flex items-center gap-2 min-w-0 px-3">
            <Building2 className="h-4 w-4 shrink-0 text-zinc-500" />
            <span className="font-medium text-sm text-zinc-800 truncate">
              {company.name}
            </span>
          </div>
        )}
        {!collapsed && !company && (
          <span className="font-semibold text-zinc-800 text-sm tracking-tight">
            FACTURATION
          </span>
        )}
        <div className="flex items-center gap-0.5">
          {companies.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCompanyId(null)}
              className="text-zinc-400 hover:text-zinc-600 h-8 w-8"
              title="Changer de société"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-zinc-500 hover:text-zinc-800 h-8 w-8"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-3 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-zinc-300 text-zinc-700">
                YG
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-800 truncate">
                Yulian
              </p>
              <p className="text-xs text-zinc-500 truncate">
                yulian@exemple.fr
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-zinc-300 text-zinc-700">
                YG
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-md h-9 w-9 text-zinc-600 hover:bg-zinc-100 transition-colors outline-none">
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-zinc-50">
        <div className="flex items-center h-14 px-4 border-b border-zinc-200">
          <span className="font-semibold text-zinc-800 text-sm tracking-tight">
            FACTURATION
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-200 text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="p-3 space-y-1">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="flex items-center gap-3 px-3 py-3 mt-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-zinc-300 text-zinc-700">
                YG
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-800 truncate">
                Yulian
              </p>
              <p className="text-xs text-zinc-500 truncate">
                yulian@exemple.fr
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
