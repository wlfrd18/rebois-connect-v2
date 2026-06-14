"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { CheckSquare, Upload, Clock, CheckCircle, MapPin } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending:     "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  submitted:   "bg-yellow-100 text-yellow-700",
  validated:   "bg-green-100 text-green-700",
  rejected:    "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending:     "En attente",
  in_progress: "En cours",
  submitted:   "Preuves soumises",
  validated:   "Validé ✓",
  rejected:    "Rejeté",
};

export default function StructureMissionsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer les terrains assignés à cette structure
    api.get("/proposals/?status=site_visit")
      .then((r) => setProposals(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleUploadProof = async (milestoneId: string, file: File) => {
    setUploading(milestoneId);
    const form = new FormData();
    form.append("proof_type", "photo");
    form.append("file", file);
    form.append("description", "Preuve de travaux");
    try {
      await api.post(`/milestones/${milestoneId}/proofs/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Preuve uploadée avec succès !");
    } catch { alert("Erreur lors de l'upload"); }
    finally { setUploading(null); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mes missions</h1>
          <p className="text-gray-500 text-sm">Projets de reforestation qui vous sont assignés</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : proposals.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200">
            <CheckSquare size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucune mission assignée pour le moment</p>
            <p className="text-gray-400 text-sm mt-1">Les missions apparaîtront ici une fois assignées par un Admin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{p.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <MapPin size={12} />
                      {p.address_city || p.address_country || "Localisation..."} · {p.surface_hectares} ha
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    Visite terrain
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{p.description}</p>

                <div className="border-t border-gray-50 pt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Upload de preuves de travaux</div>
                  <label className={`flex items-center gap-2 border border-dashed border-gray-200 rounded-lg px-4 py-2 cursor-pointer hover:border-green-400 transition text-sm ${uploading ? "opacity-50" : ""}`}>
                    <input type="file" className="hidden" accept="image/*,.pdf"
                      disabled={!!uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadProof(p.id, f);
                      }} />
                    <Upload size={14} className="text-gray-400" />
                    <span className="text-gray-500">
                      {uploading === p.id ? "Upload en cours..." : "Ajouter une photo ou rapport"}
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
