"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { Search, Users, UserPlus } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  volontaire: "Volontaire", mecene: "Mécène",
  structure: "Structure",   admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  volontaire: "bg-green-100 text-green-700",
  mecene:     "bg-blue-100 text-blue-700",
  structure:  "bg-purple-100 text-purple-700",
  admin:      "bg-red-100 text-red-700",
};

export default function MembersPage() {
  const router   = useRouter();
  const [users,   setUsers]   = useState<any[]>([]);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/members/")
      .then((r) => setUsers(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = u.username?.toLowerCase().includes(search.toLowerCase()) ||
                        u.first_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || u.role === filter;
    return matchSearch && matchFilter;
  });

  const handleFollow = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    try {
      await api.post(`/auth/profile/${userId}/follow/`);
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, is_followed_by_me: !u.is_followed_by_me } : u
      ));
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Communauté</h1>
          <p className="text-gray-500 text-sm">{users.length} membres actifs</p>
        </div>

        {/* Recherche + filtres */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un membre..."
              className="w-full pl-9 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {["all", "volontaire", "mecene", "structure"].map((r) => (
            <button key={r} onClick={() => setFilter(r)}
              className={`px-4 py-2 rounded-xl text-sm transition ${filter === r ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {r === "all" ? "Tous" : ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((u) => (
              <div key={u.id} onClick={() => router.push(`/dashboard/profile/${u.username}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center font-bold text-green-700 text-xl overflow-hidden">
                    {u.avatar ? <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" /> : u.username?.[0]?.toUpperCase()}
                  </div>
                  <button onClick={(e) => handleFollow(e, u.id)}
                    className={`p-2 rounded-full transition ${u.is_followed_by_me ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700"}`}>
                    <UserPlus size={14} />
                  </button>
                </div>
                <div className="font-semibold text-gray-800 text-sm truncate">{u.first_name || u.username}</div>
                <div className="text-xs text-gray-400 mb-2">@{u.username}</div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                  <span className="text-xs text-gray-400">
                    <Users size={10} className="inline mr-1" />{u.followers_count || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
