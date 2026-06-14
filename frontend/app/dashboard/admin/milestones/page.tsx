"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, FileText, Clock } from "lucide-react";

export default function AdminMilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    // Récupérer les milestones avec preuves soumises
    api.get("/milestones/?status=submitted")
      .then((r) => setMilestones(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleValidate = async (id: string) => {
    if (!confirm("Valider ce milestone et débloquer le paiement ?")) return;
    try {
      await api.post(`/milestones/${id}/validate/`);
      setMilestones((prev) => prev.map((m) =>
        m.id === id ? { ...m, status: "validated" } : m
      ));
    } catch { alert("Erreur lors de la validation"); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Raison du rejet :");
    if (!reason) return;
    try {
      await api.post(`/milestones/${id}/reject/`, { reason });
      setMilestones((prev) => prev.map((m) =>
        m.id === id ? { ...m, status: "rejected" } : m
      ));
    } catch { alert("Erreur lors du rejet"); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Validation des milestones</h1>
          <p className="text-gray-500 text-sm">Vérifiez les preuves et déverrouillez les paiements</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : milestones.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200">
            <CheckCircle size={40} className="mx-auto text-green-300 mb-3" />
            <p className="text-gray-500">Aucun milestone en attente de validation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((m) => (
              <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">
                      Milestone {m.order} — {m.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{m.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-700">{m.amount_to_release}€</div>
                    <div className="text-xs text-gray-400">{m.payment_percent}% du budget</div>
                  </div>
                </div>

                {/* Preuves soumises */}
                {m.proofs && m.proofs.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 mb-2">Preuves soumises :</div>
                    <div className="flex flex-wrap gap-2">
                      {m.proofs.map((proof: any) => (
                        <a key={proof.id}
                          href={proof.file?.replace("http://minio:9000", "http://192.168.56.102:9000")}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg transition">
                          <FileText size={12} />
                          {proof.proof_type}
                          {proof.gps_match === true && <span className="text-green-600 ml-1">✓ GPS</span>}
                          {proof.gps_match === false && <span className="text-red-500 ml-1">✗ GPS</span>}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => handleValidate(m.id)}
                    className="flex items-center gap-1 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition">
                    <CheckCircle size={14} />
                    Valider — Débloquer paiement
                  </button>
                  <button onClick={() => handleReject(m.id)}
                    className="flex items-center gap-1 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg hover:bg-red-100 transition">
                    <XCircle size={14} />
                    Rejeter
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
