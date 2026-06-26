"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import {
  TreePine, Users, FileText, Globe, MessageSquare, Award, LayoutDashboard,
  LogOut, CheckSquare, Wallet, Map, ShieldCheck
} from "lucide-react";

const NAV_LINKS: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  volontaire: [
    { href: "/dashboard/volontaire",               label: "Vue d'ensemble",    icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/volontaire/proposals/new", label: "Soumettre terrain", icon: <Map size={18} /> },
    { href: "/dashboard/kyc",                      label: "Mon KYC",           icon: <ShieldCheck size={18} /> },
    { href: "/dashboard/volontaire/contracts",     label: "Mes contrats",      icon: <FileText size={18} /> },
    { href: "/dashboard/community",                label: "Communauté",        icon: <Globe size={18} /> },
    { href: "/dashboard/messages",                 label: "Messages",          icon: <MessageSquare size={18} /> },
    { href: "/dashboard/members", label: "Membres", icon: <Users size={18} /> },  
],
  mecene: [
    { href: "/dashboard/mecene",                   label: "Marketplace",       icon: <TreePine size={18} /> },
    { href: "/dashboard/mecene/certificates",      label: "Certificats CO₂",  icon: <Award size={18} /> },
    { href: "/dashboard/kyc",                      label: "Mon KYC",           icon: <ShieldCheck size={18} /> },
    { href: "/dashboard/community",                label: "Communauté",        icon: <Globe size={18} /> },
    { href: "/dashboard/messages",                 label: "Messages",          icon: <MessageSquare size={18} /> },
    { href: "/dashboard/members", label: "Membres", icon: <Users size={18} /> },  
],
  structure: [
    { href: "/dashboard/structure",                label: "Vue d'ensemble",    icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/structure/missions",       label: "Mes missions",      icon: <CheckSquare size={18} /> },
    { href: "/dashboard/kyc",                      label: "Mon KYC",           icon: <ShieldCheck size={18} /> },
    { href: "/dashboard/community",                label: "Communauté",        icon: <Globe size={18} /> },
    { href: "/dashboard/messages",                 label: "Messages",          icon: <MessageSquare size={18} /> },
    { href: "/dashboard/members", label: "Membres", icon: <Users size={18} /> },  
],
  admin: [
    { href: "/dashboard/admin",                    label: "Vue d'ensemble",    icon: <LayoutDashboard size={18} /> },
    { href: "/dashboard/admin/proposals",          label: "Terrains",          icon: <Map size={18} /> },
    { href: "/dashboard/admin/kyc",                label: "Validation KYC",    icon: <ShieldCheck size={18} /> },
    { href: "/dashboard/admin/users",              label: "Utilisateurs",      icon: <Users size={18} /> },
    { href: "/dashboard/community",                label: "Communauté",        icon: <Globe size={18} /> },
    { href: "/dashboard/messages",                 label: "Messages",          icon: <MessageSquare size={18} /> },
    { href: "/dashboard/members", label: "Membres", icon: <Users size={18} /> },  
],
};

const ROLE_LABELS: Record<string, string> = {
  volontaire: "Volontaire", mecene: "Mécène",
  structure: "Structure",   admin: "Administrateur",
};

const KYC_BADGE: Record<string, { label: string; cls: string }> = {
  approved: { label: "KYC ✓",         cls: "bg-green-700 text-green-100" },
  pending:  { label: "KYC en attente", cls: "bg-yellow-600 text-yellow-100" },
  rejected: { label: "KYC rejeté",    cls: "bg-red-700 text-red-100" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!user) {
      authApi.me().then((r) => setUser(r.data)).catch(() => { logout(); router.push("/login"); });
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) { try { await authApi.logout(refresh); } catch {} }
    logout();
    router.push("/login");
  };

  const links  = NAV_LINKS[user?.role || "volontaire"] || [];
  const kyc    = KYC_BADGE[user?.kyc_status || "pending"];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-green-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-green-800">
          <div className="text-2xl font-bold">🌱 Rebois</div>
          <div className="text-green-300 text-sm">Connect</div>
        </div>

        {user && (
	  <Link href="/dashboard/profile/edit" className="px-4 py-3 border-b border-green-800 flex items-center gap-3 hover:bg-green-800 transition cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0">
              {user.avatar
              ? <img src={user.avatar.replace("http://minio:9000", "http://192.168.56.102:9000")} alt="" className="w-full h-full object-cover" />
              : <span>{user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.first_name || user.username}</div>
              <div className="text-xs text-green-300">{ROLE_LABELS[user.role]}</div>
              <span className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${kyc.cls}`}>
                {kyc.label}
              </span>
            </div>
          </Link>
        )}

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <Link key={link.href} href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                pathname === link.href
                  ? "bg-green-700 text-white"
                  : "text-green-200 hover:bg-green-800 hover:text-white"
              }`}>
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-green-800">
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-green-300 hover:text-white text-sm w-full px-3 py-2 rounded-lg hover:bg-green-800 transition">
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
