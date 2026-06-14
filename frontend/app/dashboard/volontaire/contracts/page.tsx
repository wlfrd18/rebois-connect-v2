"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { contractsApi } from "@/lib/api";
import { FileText, CheckCircle, Clock, PenLine, Download } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft:    "bg-gray-100 text-gray-600",
  pending:  "bg-yellow-100 text-yellow-700",
  signed:   "bg-green-100 text-green-700",
  cancelled:"bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  draft:    "Brouillon",
  pending:  "En attente de signatures",
  signed:   "Signé ✓",
  cancelled:"Annulé",
};

export default function VolontaireContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    contractsApi.list()
      .then((r) => setContracts(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSign = async (id: string) => {
    if (!confirm("Confirmer la signature de ce contrat ?")) return;
    try {
      await contractsApi.sign(id);
      setContracts((prev) => prev.map((c) =>
        c.id === id ? { ...c, signed_by_volontaire: true } : c
      ));
    } catch { alert("Erreur lors de la signature"); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mes contrats</h1>
          <p className="text-gray-500 text-sm">Contrats de reforestation vous concernant</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucun contrat pour le moment</p>
            <p className="text-gray-400 text-sm mt-1">Les contrats apparaissent une fois votre terrain approuvé et financé</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{c.project_title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Créé le {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-bold text-gray-800">{c.total_budget} {c.currency}</div>
                    <div className="text-xs text-gray-400">Budget total</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-bold text-gray-800">{c.duration_months} mois</div>
                    <div className="text-xs text-gray-400">Durée</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-bold text-green-700">{c.co2_estimated_tons}t CO₂</div>
                    <div className="text-xs text-gray-400">Estimé</div>
                  </div>
                </div>

                {/* Statut signatures */}
                <div className="flex gap-3 mb-4">
                  {[
                    { label: "Vous",       signed: c.signed_by_volontaire },
                    { label: "Structure",  signed: c.signed_by_structure },
                    { label: "Plateforme", signed: c.signed_by_admin },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-1 text-xs">
                      {s.signed
                        ? <CheckCircle size={14} className="text-green-600" />
                        : <Clock size={14} className="text-gray-400" />}
                      <span className={s.signed ? "text-green-700" : "text-gray-400"}>{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {!c.signed_by_volontaire && c.status !== "cancelled" && (
                    <button onClick={() => handleSign(c.id)}
                      className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800 transition">
                      <PenLine size={14} />
                      Signer le contrat
                    </button>
                  )}
                  {c.pdf_file && (
                    <a href={c.pdf_file.replace("http://minio:9000", "http://192.168.56.102:9000")}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition">
                      <Download size={14} />
                      Télécharger PDF
                    </a>
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
