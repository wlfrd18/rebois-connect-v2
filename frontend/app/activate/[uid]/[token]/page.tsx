"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

export default function ActivatePage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get(`/auth/activate/${uid}/${token}/`)
      .then((r) => { setStatus("success"); setMessage(r.data.detail); })
      .catch((e) => { setStatus("error"); setMessage(e.response?.data?.detail || "Lien invalide ou expiré."); });
  }, [uid, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <img src="/logo.png" alt="Rebois Connect" className="h-16 object-contain mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-green-800 mb-2">Rebois Connect</h1>

        {status === "loading" && (
          <p className="text-gray-500">Activation en cours...</p>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Compte activé !</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link href="/login"
              className="block w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition">
              Se connecter
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Lien invalide</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link href="/register"
              className="block w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition">
              Créer un nouveau compte
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
