"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, FileText, User } from "lucide-react";

export default function AdminKYCPage() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/kyc/admin/pending/")
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDecision = async (userId: string, approved: boolean) => {
    const note = approved ? "" : prompt("Raison du rejet :") || "";
    if (!approved && !note) return;
    try {
      await api.post(`/kyc/admin/approve/${userId}/`, { approved, note });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      alert("Erreur lors de la décision KYC");
    }
  };

  const ROLE_LABELS: Record<string, string> = {
    volontaire: "Volontaire", mecene: "Mécène",
    structure: "Structure",  admin: "Admin",
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Validation KYC</h1>
          <p className="text-gray-500 text-sm">{users.length} utilisateur(s) en attente</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
            <CheckCircle size={40} className="mx-auto text-green-300 mb-3" />
            <p className="text-gray-500">Aucun KYC en attente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <User size={18} className="text-green-700" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{u.username}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                      <div className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {ROLE_LABELS[u.role] || u.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(u.id, true)}
                      className="flex items-center gap-1 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle size={16} />
                      Approuver
                    </button>
                    <button
                      onClick={() => handleDecision(u.id, false)}
                      className="flex items-center gap-1 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg hover:bg-red-100 transition"
                    >
                      <XCircle size={16} />
                      Rejeter
                    </button>
                  </div>
                </div>

                {/* Documents */}
                <div className="p-4">
                  <div className="text-xs font-medium text-gray-500 mb-2">Documents soumis :</div>
                  {u.documents.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Aucun document soumis</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {u.documents.map((doc: any) => (
                        <a
                          key={doc.id}
                          href={doc.file_url || doc.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg transition"
                        >
                          <FileText size={12} />
                          {doc.doc_type_display}
                        </a>
                      ))}
                    </div>
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
