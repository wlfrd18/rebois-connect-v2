"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { User, ShieldCheck, ShieldX, Ban } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  volontaire: "Volontaire", mecene: "Mécène",
  structure: "Structure",   admin: "Admin",
};

const KYC_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending:  "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    api.get("/auth/admin/users/")
      .then((r) => setUsers(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSuspend = async (userId: string, active: boolean) => {
    if (!confirm(`${active ? "Suspendre" : "Réactiver"} cet utilisateur ?`)) return;
    try {
      await api.patch(`/auth/admin/users/${userId}/`, { is_active: !active });
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, is_active: !active } : u
      ));
    } catch { alert("Erreur"); }
  };

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
          <p className="text-gray-500 text-sm">{users.length} utilisateur(s) enregistrés</p>
        </div>

        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {filtered.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <User size={18} className="text-green-700" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{u.username}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${KYC_COLORS[u.kyc_status] || "bg-gray-100 text-gray-600"}`}>
                        KYC {u.kyc_status}
                      </span>
                      {!u.is_active && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Suspendu</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSuspend(u.id, u.is_active)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition ${
                      u.is_active
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    {u.is_active ? <><Ban size={14} /> Suspendre</> : <><ShieldCheck size={14} /> Réactiver</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
