"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard, Map, ShieldCheck, FileText, Award, TreePine,
  CheckSquare, Users, Wallet, LogOut, Globe, MessageSquare, Menu, X
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  volontaire: "Volontaire", mecene: "Mécène",
  structure: "Structure",   admin: "Administrateur",
};

const NAV_LINKS: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  volontaire: [
    { href: "/dashboard/volontaire",               label: "Vue d'ensemble",    icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/volontaire/proposals/new", label: "Soumettre terrain", icon: <Map size={18} /> },
    { href: "/dashboard/kyc",                      label: "Mon KYC",           icon: <ShieldCheck size={18} /> },
    { href: "/dashboard/volontaire/contracts",     label: "Mes contrats",      icon: <FileText size={18} /> },
    { href: "/dashboard/community",                label: "Communauté",        icon: <Globe size={18} /> },
    { href: "/dashboard/messages",                 label: "Messages",          icon: <MessageSquare size={18} /> },
    { href: "/dashboard/members",                  label: "Membres",           icon: <Users size={18} /> },
  ],
  mecene: [
    { href: "/dashboard/mecene",                   label: "Marketplace",       icon: <TreePine size={18} /> },
    { href: "/dashboard/mecene/certificates",      label: "Certificats CO₂",  icon: <Award size={18} /> },
    { href: "/dashboard/kyc",                      label: "Mon KYC",           icon: <ShieldCheck size={18} /> },
    { href: "/dashboard/community",                label: "Communauté",        icon: <Globe size={18} /> },
    { href: "/dashboard/messages",                 label: "Messages",          icon: <MessageSquare size={18} /> },
    { href: "/dashboard/members",                  label: "Membres",           icon: <Users size={18} /> },
  ],
  structure: [
    { href: "/dashboard/structure",                label: "Vue d'ensemble",    icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/structure/missions",       label: "Mes missions",      icon: <CheckSquare size={18} /> },
    { href: "/dashboard/kyc",                      label: "Mon KYC",           icon: <ShieldCheck size={18} /> },
    { href: "/dashboard/community",                label: "Communauté",        icon: <Globe size={18} /> },
    { href: "/dashboard/messages",                 label: "Messages",          icon: <MessageSquare size={18} /> },
    { href: "/dashboard/members",                  label: "Membres",           icon: <Users size={18} /> },
  ],
  admin: [
    { href: "/dashboard/admin",                    label: "Vue d'ensemble",    icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/admin/proposals",          label: "Terrains",          icon: <Map size={18} /> },
    { href: "/dashboard/admin/kyc",                label: "Validation KYC",    icon: <ShieldCheck size={18} /> },
    { href: "/dashboard/admin/users",              label: "Utilisateurs",      icon: <Users size={18} /> },
    { href: "/dashboard/admin/contracts",          label: "Contrats",          icon: <FileText size={18} /> },
    { href: "/dashboard/admin/milestones",         label: "Milestones",        icon: <CheckSquare size={18} /> },
    { href: "/dashboard/community",                label: "Communauté",        icon: <Globe size={18} /> },
    { href: "/dashboard/messages",                 label: "Messages",          icon: <MessageSquare size={18} /> },
    { href: "/dashboard/members",                  label: "Membres",           icon: <Users size={18} /> },
  ],
};

const KYC_STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: "KYC ✓",         cls: "bg-green-500 text-white" },
  pending:  { label: "KYC en attente", cls: "bg-orange-400 text-white" },
  rejected: { label: "KYC rejeté",    cls: "bg-red-500 text-white" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const logout    = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  const links = NAV_LINKS[user?.role || "volontaire"] || [];
  const kyc   = KYC_STATUS[user?.kyc_status || "pending"] || KYC_STATUS.pending;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-green-800 flex items-center justify-between">
        <div>
          <img src="/logo.png" alt="Rebois Connect" className="h-10 object-contain brightness-0 invert" />
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-green-300 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Profile */}
      {user && (
        <Link href={`/dashboard/profile/${user.username}`}
          onClick={() => setOpen(false)}
          className="px-4 py-3 border-b border-green-800 flex items-center gap-3 hover:bg-green-800 transition cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0">
            {(user as any).avatar
              ? <img src={(user as any).avatar} alt="" className="w-full h-full object-cover" />
              : <span>{user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{user.first_name || user.username}</div>
            <div className="text-xs text-green-300">{ROLE_LABELS[user.role]}</div>
            <span className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${kyc.cls}`}>
              {kyc.label}
            </span>
          </div>
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => (
          <Link key={link.href} href={link.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              pathname === link.href
                ? "bg-green-700 text-white"
                : "text-green-200 hover:bg-green-800 hover:text-white"
            }`}>
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 text-green-300 hover:text-white hover:bg-green-800 transition text-sm border-t border-green-800 w-full">
        <LogOut size={18} />
        Déconnexion
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar desktop — fixe */}
      <aside className="hidden md:flex w-64 bg-green-900 text-white flex-col fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-green-900 text-white flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Topbar mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-green-900 text-white px-4 py-3 flex items-center justify-between">
        <button onClick={() => setOpen(true)} className="text-white">
          <Menu size={24} />
        </button>
        <div className="text-sm font-bold">🌱 Rebois Connect</div>
        {user && (
          <Link href={`/dashboard/profile/${user?.username}`}>
            <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center font-bold text-white overflow-hidden">
              {(user as any).avatar
                ? <img src={(user as any).avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-sm">{user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}</span>
              }
            </div>
          </Link>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
