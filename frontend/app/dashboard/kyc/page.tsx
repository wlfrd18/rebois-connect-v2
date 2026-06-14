"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { Upload, CheckCircle, Clock, FileText } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const DOC_TYPES: Record<string, { label: string; roles: string[] }> = {
  id_card:   { label: "Carte d'identité (obligatoire)", roles: ["volontaire","mecene","structure"] },
  passport:  { label: "Passeport",                      roles: ["volontaire","mecene","structure"] },
  residence: { label: "Justificatif de domicile",       roles: ["volontaire","mecene","structure"] },
  land_cert: { label: "Certificat foncier",             roles: ["volontaire"] },
  org_cert:  { label: "Certificat d'organisation",      roles: ["structure"] },
  tax_cert:  { label: "Attestation fiscale",            roles: ["mecene","structure"] },
};

export default function KYCPage() {
  const user = useAuthStore((s) => s.user);
  const [docs,     setDocs]    = useState<any[]>([]);
  const [loading,  setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [success,  setSuccess] = useState("");
  const [error,    setError]   = useState("");

  useEffect(() => {
    api.get("/kyc/my-documents/")
      .then((r) => setDocs(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    setError("");
    const form = new FormData();
    form.append("doc_type", docType);
    form.append("file", file);
    try {
      const r = await api.post("/kyc/upload/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocs((prev) => [...prev.filter((d) => d.doc_type !== docType), r.data]);
      setSuccess("Document uploadé avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur lors de l'upload. Vérifiez le format du fichier.");
    } finally {
      setUploading(null);
    }
  };

  const kycStatus = user?.kyc_status || "pending";
  const availableDocs = Object.entries(DOC_TYPES).filter(([, v]) =>
    v.roles.includes(user?.role || "")
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Vérification KYC</h1>
          <p className="text-gray-500 text-sm">Know Your Customer — Vérification d'identité requise</p>
        </div>

        {/* Statut KYC */}
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
          kycStatus === "approved" ? "bg-green-50 border border-green-200" :
          kycStatus === "rejected" ? "bg-red-50 border border-red-200" :
          "bg-yellow-50 border border-yellow-200"
        }`}>
          {kycStatus === "approved" ? <CheckCircle className="text-green-600" size={24} /> :
           kycStatus === "rejected" ? <Clock className="text-red-600" size={24} /> :
           <Clock className="text-yellow-600" size={24} />}
          <div>
            <div className="font-medium">
              {kycStatus === "approved" ? "KYC Approuvé ✓" :
               kycStatus === "rejected" ? "KYC Rejeté" :
               "KYC en attente de validation"}
            </div>
            <div className="text-sm text-gray-500">
              {kycStatus === "approved" ? "Vous avez accès à toutes les fonctionnalités." :
               kycStatus === "rejected" ? "Vos documents ont été rejetés. Veuillez les re-soumettre." :
               "Uploadez vos documents ci-dessous. Un admin les vérifiera sous 24-48h."}
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 mb-4 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Documents */}
        <div className="space-y-3">
          {availableDocs.map(([type, info]) => {
            const uploaded = docs.find((d) => d.doc_type === type);
            return (
              <div key={type} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className={uploaded ? "text-green-600" : "text-gray-400"} />
                    <div>
                      <div className="font-medium text-sm text-gray-800">{info.label}</div>
                      {uploaded && (
                        <div className="text-xs text-green-600">
                          ✓ Uploadé le {new Date(uploaded.uploaded_at).toLocaleDateString("fr-FR")}
                        </div>
                      )}
                    </div>
                  </div>
                  <label className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg cursor-pointer transition ${
                    uploading === type ? "bg-gray-100 text-gray-400" :
                    uploaded ? "bg-gray-50 text-gray-600 hover:bg-gray-100" :
                    "bg-green-700 text-white hover:bg-green-800"
                  }`}>
                    <Upload size={14} />
                    {uploading === type ? "Upload..." : uploaded ? "Remplacer" : "Uploader"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={!!uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(type, f);
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-gray-400">
          Formats acceptés : PDF, JPG, PNG · Taille max : 5MB
        </div>
      </div>
    </DashboardLayout>
  );
}
