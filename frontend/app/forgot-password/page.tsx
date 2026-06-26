"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/password-reset/", { email });
      setSent(true);
    } catch {
      setSent(true); // Même message pour ne pas révéler si l'email existe
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Rebois Connect" className="h-16 object-contain mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-green-800">Mot de passe oublié</h1>
          <p className="text-gray-500 text-sm mt-1">Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="font-bold text-gray-800 mb-2">Email envoyé !</h2>
            <p className="text-gray-500 text-sm mb-6">
              Si cet email est associé à un compte, vous recevrez un lien de réinitialisation dans quelques minutes.
              Vérifiez aussi vos spams.
            </p>
            <Link href="/login" className="text-green-700 font-medium hover:underline text-sm">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="vous@exemple.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-lg transition disabled:opacity-50">
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-green-700 hover:underline">Retour à la connexion</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
