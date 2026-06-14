"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { contractsApi } from "@/lib/api";
import { FileText, Download, CheckCircle, Clock, Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft:    "bg-gray-100 text-gray-600",
  pending:  "bg-yellow-100 text-yellow-700",
  signed:   "bg-green-100 text-green-700",
  cancelled:"bg-red-100 text-red-700",
};

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    contractsApi.list()
      .then((r) => setContracts(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSign = async (id: string) => {
    try {
      await contractsApi.sign(id);
      setContracts((prev) => prev.map((c) =>
        c.id === id ? { ...c, signed_by_admin: true } : c
      ));
    } catch { alert("Erreur lors de la signature"); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Contrats</h1>
            <p className="text-gray-500 text-sm">{contracts.length} contrat(s) au total</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucun contrat pour le moment</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {contracts.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-800">{c.project_title}</div>
                    <div className="text-sm text-gray-500">
                      {c.total_budget} {c.currency} · {c.duration_months} mois
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[c.status]}`}>
                    {c.status}
                  </span>
                </div>

                <div className="flex gap-3 mb-3">
                  {[
                    { label: "Volontaire",  signed: c.signed_by_volontaire },
                    { label: "Structure",   signed: c.signed_by_structure },
                    { label: "Admin",       signed: c.signed_by_admin },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-1 text-xs">
                      {s.signed
                        ? <CheckCircle size={12} className="text-green-600" />
                        : <Clock size={12} className="text-gray-400" />}
                      <span className={s.signed ? "text-green-700" : "text-gray-400"}>{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {!c.signed_by_admin && (
                    <button onClick={() => handleSign(c.id)}
                      className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
                      <CheckCircle size={12} />
                      Signer (Admin)
                    </button>
                  )}
                  {c.pdf_file && (
                    <a href={c.pdf_file.replace("http://minio:9000", "http://192.168.56.102:9000")}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
                      <Download size={12} />
                      PDF
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
