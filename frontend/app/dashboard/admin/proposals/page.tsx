"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { proposalsApi } from "@/lib/api";
import { Map, CheckCircle, XCircle, Eye, Filter } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft:         "bg-gray-100 text-gray-600",
  pending:       "bg-yellow-100 text-yellow-700",
  pre_validated: "bg-blue-100 text-blue-700",
  site_visit:    "bg-purple-100 text-purple-700",
  approved:      "bg-green-100 text-green-700",
  rejected:      "bg-red-100 text-red-700",
  suspended:     "bg-orange-100 text-orange-700",
};

const STATUS_LABELS: Record<string, string> = {
  draft:         "Brouillon",
  pending:       "En attente",
  pre_validated: "Pré-validé",
  site_visit:    "Visite terrain",
  approved:      "Approuvé ✓",
  rejected:      "Rejeté",
  suspended:     "Suspendu",
};

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    proposalsApi.list()
      .then((r) => setProposals(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const handlePreValidate = async (id: string) => {
    const note = prompt("Note de validation (optionnel) :") ?? "";
    try {
      await proposalsApi.preValidate(id, note);
      setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: "pre_validated" } : p));
    } catch { alert("Erreur"); }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Approuver ce terrain et le mettre en marketplace ?")) return;
    try {
      await proposalsApi.approve(id);
      setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: "approved" } : p));
    } catch { alert("Erreur"); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Raison du rejet :");
    if (!reason) return;
    try {
      await proposalsApi.reject(id, reason);
      setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: "rejected" } : p));
    } catch { alert("Erreur"); }
  };

  const filtered = proposals.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase()) ||
                        p.address_country?.toLowerCase().includes(search.toLowerCase()) ||
                        p.volontaire_username?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestion des terrains</h1>
          <p className="text-gray-500 text-sm">{proposals.length} terrain(s) au total</p>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-48" />
          {["all", "pending", "pre_validated", "site_visit", "approved", "rejected"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs transition ${filter === s ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "all" ? "Tous" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Map size={32} className="mx-auto mb-2 text-gray-300" />
                Aucun terrain trouvé
              </div>
            ) : filtered.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-800">{p.title}</div>
                    <div className="text-sm text-gray-500">
                      {p.address_country || "Localisation..."} · {p.surface_hectares} ha · par {p.volontaire_username}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  {p.status === "pending" && (
                    <>
                      <button onClick={() => handlePreValidate(p.id)}
                        className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                        <CheckCircle size={12} />
                        Pré-valider
                      </button>
                      <button onClick={() => handleReject(p.id)}
                        className="flex items-center gap-1 bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                        <XCircle size={12} />
                        Rejeter
                      </button>
                    </>
                  )}
                  {p.status === "site_visit" && (
                    <button onClick={() => handleApprove(p.id)}
                      className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
                      <CheckCircle size={12} />
                      Approuver → Marketplace
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
