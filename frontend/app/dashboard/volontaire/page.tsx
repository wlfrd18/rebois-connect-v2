"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { proposalsApi } from "@/lib/api";
import { Map, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:         { label: "Brouillon",       color: "bg-gray-100 text-gray-700" },
  pending:       { label: "En attente",      color: "bg-yellow-100 text-yellow-700" },
  pre_validated: { label: "Pré-validé",      color: "bg-blue-100 text-blue-700" },
  site_visit:    { label: "Visite terrain",  color: "bg-purple-100 text-purple-700" },
  approved:      { label: "Approuvé ✓",      color: "bg-green-100 text-green-700" },
  rejected:      { label: "Rejeté",          color: "bg-red-100 text-red-700" },
};

export default function VolontaireDashboard() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    proposalsApi.list().then((r) => setProposals(r.data.results || [])).finally(() => setLoading(false));
  }, []);

  const stats = {
    total:    proposals.length,
    pending:  proposals.filter((p) => p.status === "pending").length,
    approved: proposals.filter((p) => p.status === "approved").length,
    rejected: proposals.filter((p) => p.status === "rejected").length,
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mes terrains</h1>
            <p className="text-gray-500 text-sm">Gérez vos propositions de reforestation</p>
          </div>
          <Link
            href="/dashboard/volontaire/proposals/new"
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition"
          >
            <Plus size={16} />
            Nouveau terrain
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total",    value: stats.total,    icon: <Map size={20} />,          color: "text-gray-600" },
            { label: "En attente", value: stats.pending,  icon: <Clock size={20} />,        color: "text-yellow-600" },
            { label: "Approuvés", value: stats.approved, icon: <CheckCircle size={20} />,  color: "text-green-600" },
            { label: "Rejetés",  value: stats.rejected, icon: <XCircle size={20} />,      color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Liste des terrains */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Map size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Vous n&apos;avez pas encore soumis de terrain</p>
            <Link href="/dashboard/volontaire/proposals/new" className="text-green-700 font-medium text-sm mt-2 inline-block hover:underline">
              Soumettre mon premier terrain →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">{p.title}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {p.address_country || "Localisation en cours..."} · {p.surface_hectares} ha
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {p.co2_estimated_tons && (
                    <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                      ~{p.co2_estimated_tons}t CO₂
                    </div>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[p.status]?.color}`}>
                    {STATUS_LABELS[p.status]?.label || p.status}
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
