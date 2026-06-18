"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderKanban,
  Landmark,
  Settings,
  Plus,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/banks", label: "Banks", icon: Landmark },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardShell({
  user,
  children,
}: {
  user?: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop collapse

  useEffect(() => {
    setCollapsed(localStorage.getItem("ii-sidebar-collapsed") === "1");
  }, []);

  function toggleCollapse() {
    setCollapsed((c) => {
      localStorage.setItem("ii-sidebar-collapsed", c ? "0" : "1");
      return !c;
    });
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Glass backdrop — gradient + blurred blobs */}
      <div className="bg-blob fixed inset-0 -z-20 bg-gradient-to-br from-gray-50 via-slate-50 to-indigo-50/60 dark:from-[#08070f] dark:via-[#0a091b] dark:to-[#080710]" />
      <div className="bg-blob pointer-events-none fixed -top-[20%] right-[-8%] -z-10 h-[50vw] w-[50vw] rounded-full bg-violet-400/15 blur-[140px] dark:bg-violet-600/12" />
      <div className="bg-blob pointer-events-none fixed bottom-[-20%] left-[-8%] -z-10 h-[45vw] w-[45vw] rounded-full bg-blue-400/12 blur-[120px] dark:bg-blue-700/10" />
      <div className="bg-blob pointer-events-none fixed left-[30%] top-[35%] -z-10 h-[30vw] w-[30vw] rounded-full bg-indigo-300/10 blur-[100px] dark:bg-indigo-600/8" />

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 border-r border-black/[0.06] bg-white/80 backdrop-blur-2xl transition-[width] duration-200 md:flex dark:border-white/[0.07] dark:bg-[#09080f]/85 ${
          collapsed ? "w-[64px]" : "w-[212px]"
        }`}
      >
        <SidebarInner
          collapsed={collapsed}
          isActive={isActive}
          user={user}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[230px] flex-col border-r border-black/[0.06] bg-white/95 backdrop-blur-2xl transition-transform duration-200 md:hidden dark:border-white/[0.07] dark:bg-[#09080f]/95 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarInner
          collapsed={false}
          isActive={isActive}
          user={user}
          onClose={() => setOpen(false)}
          showClose
        />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Topbar — mobile only */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-black/[0.06] bg-white/70 px-4 py-2.5 backdrop-blur-xl md:hidden dark:border-white/[0.07] dark:bg-[#0d0c17]/70">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-black/[0.05] dark:text-white/50 dark:hover:bg-white/[0.06]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-white/85">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-xs text-white">
              ⚡
            </span>
            Instant Invoice
          </span>
        </header>

        <main
          key={pathname}
          className="animate-in mx-auto w-full max-w-5xl flex-1 px-4 py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarInner({
  collapsed,
  isActive,
  user,
  onToggleCollapse,
  onClose,
  showClose,
}: {
  collapsed: boolean;
  isActive: (href: string) => boolean;
  user?: SessionUser;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  showClose?: boolean;
}) {
  const displayName = user?.name ?? "Account";
  const initial = (user?.name ?? user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div
        className={`flex h-14 items-center border-b border-black/[0.05] dark:border-white/[0.06] ${
          collapsed ? "justify-center px-0" : "justify-between px-3"
        }`}
      >
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2"
          title="Instant Invoice"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm text-white shadow-sm">
            ⚡
          </span>
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white/90">
              Instant Invoice
            </span>
          )}
        </Link>

        {!collapsed && showClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {!collapsed && !showClose && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="rounded-md p-1 text-gray-400 hover:bg-black/[0.05] dark:text-white/40 dark:hover:bg-white/[0.06]"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all ${
                collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2"
              } ${
                active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "text-gray-500 hover:bg-gray-100/70 hover:text-gray-900 dark:text-white/40 dark:hover:bg-white/[0.05] dark:hover:text-white/80"
              }`}
            >
              <Icon
                className={`h-[15px] w-[15px] shrink-0 ${
                  active ? "text-indigo-600 dark:text-indigo-400" : ""
                }`}
              />
              {!collapsed && item.label}
            </Link>
          );
        })}

        <Link
          href="/dashboard/invoices/new"
          onClick={onClose}
          title={collapsed ? "New Invoice" : undefined}
          className={`mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 font-semibold text-white shadow-sm transition hover:opacity-90 ${
            collapsed ? "py-2.5" : "px-3 py-2 text-[13px]"
          }`}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && "New Invoice"}
        </Link>
      </nav>

      {/* Footer: account + theme + sign out */}
      <div className="border-t border-black/[0.05] p-2 dark:border-white/[0.06]">
        {collapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="mb-0.5 flex w-full items-center justify-center rounded-lg py-2.5 text-gray-500 transition hover:bg-gray-100/70 hover:text-gray-900 dark:text-white/40 dark:hover:bg-white/[0.05] dark:hover:text-white/80"
          >
            <ChevronRight className="h-[15px] w-[15px]" />
          </button>
        )}

        {/* Account */}
        <div
          className={`mb-1 flex items-center rounded-lg ${
            collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-2 py-2"
          }`}
          title={collapsed ? displayName : undefined}
        >
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={displayName}
              className="h-8 w-8 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/10"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">
              {initial}
            </span>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white/90">
                {displayName}
              </p>
              {user?.email && (
                <p className="truncate text-[11px] text-gray-400 dark:text-white/40">
                  {user.email}
                </p>
              )}
            </div>
          )}
        </div>

        <ThemeToggle collapsed={collapsed} />

        <button
          onClick={() => signOut({ callbackUrl: "/signin" })}
          title={collapsed ? "Sign out" : undefined}
          className={`flex w-full items-center gap-2.5 rounded-lg text-[13px] font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-300 ${
            collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2"
          }`}
        >
          <LogOut className="h-[15px] w-[15px] shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={collapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
      className={`flex w-full items-center gap-2.5 rounded-lg text-[13px] font-medium text-gray-500 transition hover:bg-gray-100/70 hover:text-gray-900 dark:text-white/40 dark:hover:bg-white/[0.05] dark:hover:text-white/80 ${
        collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2"
      }`}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-[15px] w-[15px] shrink-0" />
        ) : (
          <Moon className="h-[15px] w-[15px] shrink-0" />
        )
      ) : (
        <div className="h-[15px] w-[15px]" />
      )}
      {!collapsed && (isDark ? "Light mode" : "Dark mode")}
    </button>
  );
}
