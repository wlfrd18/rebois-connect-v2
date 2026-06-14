"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

export default function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const router = useRouter();
  const [form, setForm]     = useState({ password: "", password2: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post(`/auth/password-reset/${uid}/${token}/`, form);
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Lien invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌱</div>
          <h1 className="text-2xl font-bold text-green-800">Nouveau mot de passe</h1>
        </div>

        {done ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-bold text-gray-800 mb-2">Mot de passe modifié !</h2>
            <p className="text-gray-500 text-sm">Redirection vers la connexion...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input type="password" value={form.password} required
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 10 caractères"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input type="password" value={form.password2} required
                onChange={(e) => setForm((p) => ({ ...p, password2: e.target.value }))}
                placeholder="Répétez le mot de passe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-lg transition disabled:opacity-50">
              {loading ? "Enregistrement..." : "Changer le mot de passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
