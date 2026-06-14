"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { proposalsApi } from "@/lib/api";
import { Map, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    proposalsApi.list().then((r) => setProposals(r.data.results || [])).finally(() => setLoading(false));
  }, []);

  const pending    = proposals.filter((p) => p.status === "pending");
  const siteVisit  = proposals.filter((p) => p.status === "site_visit");
  const approved   = proposals.filter((p) => p.status === "approved");

  const handlePreValidate = async (id: string) => {
    const note = prompt("Note de validation (optionnel) :");
    if (note === null) return;
    try {
      await proposalsApi.preValidate(id, note);
      setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: "pre_validated" } : p));
    } catch (e) {
      alert("Erreur lors de la validation");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Raison du rejet (obligatoire) :");
    if (!reason) return;
    try {
      await proposalsApi.reject(id, reason);
      setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: "rejected" } : p));
    } catch (e) {
      alert("Erreur lors du rejet");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Tableau de bord Admin</h1>
          <p className="text-gray-500 text-sm">Gérez et validez les projets de reforestation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total terrains",     value: proposals.length, icon: <Map size={20} />,          color: "text-gray-600" },
            { label: "En attente",         value: pending.length,   icon: <Clock size={20} />,        color: "text-yellow-600" },
            { label: "Visite terrain",     value: siteVisit.length, icon: <AlertCircle size={20} />,  color: "text-purple-600" },
            { label: "Approuvés",          value: approved.length,  icon: <CheckCircle size={20} />,  color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Terrains en attente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Terrains en attente de validation</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <CheckCircle size={32} className="mx-auto text-green-300 mb-2" />
              <p>Aucun terrain en attente</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pending.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{p.title}</div>
                    <div className="text-sm text-gray-500">
                      {p.address_country || "Localisation..."} · {p.surface_hectares} ha
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Soumis par : {p.volontaire_username}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreValidate(p.id)}
                      className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle size={14} />
                      Pré-valider
                    </button>
                    <button
                      onClick={() => handleReject(p.id)}
                      className="flex items-center gap-1 bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
                    >
                      <XCircle size={14} />
                      Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
