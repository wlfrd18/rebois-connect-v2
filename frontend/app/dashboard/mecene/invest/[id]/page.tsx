"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { proposalsApi, api } from "@/lib/api";
import { TreePine, Upload, CheckCircle } from "lucide-react";

export default function InvestPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [proposal, setProposal] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [step,     setStep]     = useState<"confirm" | "payment" | "proof" | "done">("confirm");
  const [amount,   setAmount]   = useState("");
  const [proof,    setProof]    = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    proposalsApi.get(id)
      .then((r) => setProposal(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCommit = async () => {
    if (!amount || parseFloat(amount) < 100) {
      setError("Le montant minimum est de 100€");
      return;
    }
    setStep("payment");
  };

  const handleProofUpload = async () => {
    if (!proof) { setError("Veuillez joindre votre preuve de virement"); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("amount",   amount);
      form.append("currency", "EUR");
      form.append("escrow_project_id", id);
      form.append("payment_proof", proof);
      await api.post("/wallet/commit/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStep("done");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Erreur lors de la soumission");
    } finally { setSubmitting(false); }
  };

  if (loading) return <DashboardLayout><div className="text-center py-12 text-gray-400">Chargement...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Investir dans ce projet</h1>
          <p className="text-gray-500 text-sm">{proposal?.title}</p>
        </div>

        {/* Résumé projet */}
        <div className="bg-gradient-to-br from-green-800 to-emerald-700 rounded-xl p-5 text-white mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TreePine size={20} />
            <span className="font-semibold">{proposal?.title}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-green-200">Localisation</div>
              <div className="font-medium">{proposal?.address_country}</div>
            </div>
            <div>
              <div className="text-green-200">Surface</div>
              <div className="font-medium">{proposal?.surface_hectares} ha</div>
            </div>
            <div>
              <div className="text-green-200">CO₂ estimé</div>
              <div className="font-medium">{proposal?.co2_estimated_tons || "—"}t</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

          {step === "confirm" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">Étape 1 — Choisissez votre montant</h2>
              <div className="grid grid-cols-4 gap-2">
                {["500", "1000", "2500", "5000"].map((v) => (
                  <button key={v} type="button" onClick={() => setAmount(v)}
                    className={`py-2 rounded-lg text-sm font-medium transition ${amount === v ? "bg-green-700 text-white" : "bg-gray-50 text-gray-700 hover:bg-green-50"}`}>
                    {v}€
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ou entrez un montant personnalisé</label>
                <div className="relative">
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    min="100" placeholder="Minimum 100€"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                </div>
              </div>
              {amount && parseFloat(amount) >= 100 && (
                <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
                  <div className="font-medium">Votre impact estimé :</div>
                  <div>~{(parseFloat(amount) / 100 * 2).toFixed(1)} tonnes CO₂ séquestrées sur 30 ans</div>
                </div>
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button onClick={handleCommit}
                className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition">
                Confirmer l'investissement
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">Étape 2 — Effectuez le virement</h2>
              <div className="bg-blue-50 rounded-lg p-4 text-sm space-y-2">
                <div className="font-medium text-blue-800">Coordonnées bancaires Rebois Connect</div>
                <div><span className="text-gray-500">Bénéficiaire :</span> <span className="font-medium">Rebois Connect SAS</span></div>
                <div><span className="text-gray-500">IBAN :</span> <span className="font-mono font-medium">FR76 XXXX XXXX XXXX XXXX XXXX XXX</span></div>
                <div><span className="text-gray-500">BIC :</span> <span className="font-mono font-medium">XXXXXXXX</span></div>
                <div><span className="text-gray-500">Montant :</span> <span className="font-bold text-green-700">{amount}€</span></div>
                <div><span className="text-gray-500">Référence :</span> <span className="font-mono font-medium">RC-{id.slice(0, 8).toUpperCase()}</span></div>
              </div>
              <p className="text-xs text-gray-400">Indiquez la référence dans le libellé de votre virement pour que nous puissions l'identifier.</p>
              <button onClick={() => setStep("proof")}
                className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition">
                J'ai effectué le virement →
              </button>
            </div>
          )}

          {step === "proof" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">Étape 3 — Joignez votre preuve de virement</h2>
              <p className="text-sm text-gray-500">Uploadez une capture d'écran ou un relevé bancaire confirmant le virement.</p>
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-lg p-4 cursor-pointer hover:border-green-400 transition">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setProof(e.target.files?.[0] || null)} />
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500">
                  {proof ? proof.name : "PDF, JPG ou PNG"}
                </span>
              </label>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button onClick={handleProofUpload} disabled={submitting}
                className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition disabled:opacity-50">
                {submitting ? "Envoi..." : "Soumettre ma preuve de virement"}
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Investissement enregistré !</h2>
              <p className="text-gray-500 text-sm mb-6">
                Votre preuve de virement a été reçue. Un admin va la vérifier sous 24-48h.
                Vous recevrez vos certificats CO₂ une fois le projet terminé.
              </p>
              <button onClick={() => router.push("/dashboard/mecene")}
                className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition">
                Retour à la marketplace
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
