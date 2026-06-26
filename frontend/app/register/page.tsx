"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api";
import Link from "next/link";

const schema = z.object({
  email:               z.string().email("Email invalide"),
  username:            z.string().min(3, "Minimum 3 caractères"),
  role:                z.enum(["volontaire", "mecene", "structure"]),
  password:            z.string().min(10, "Minimum 10 caractères"),
  password2:           z.string(),
  first_name:          z.string().optional(),
  last_name:           z.string().optional(),
  country:             z.string().optional(),
  organization_name:   z.string().optional(),
  registration_number: z.string().optional(),
}).refine((d) => d.password === d.password2, {
  message: "Les mots de passe ne correspondent pas",
  path: ["password2"],
});

type FormData = z.infer<typeof schema>;

const ROLES = [
  { value: "volontaire", label: "Volontaire", desc: "Je possède un terrain à reboiser", icon: "🌳" },
  { value: "mecene",     label: "Mécène",     desc: "Je finance des projets de reforestation", icon: "💚" },
  { value: "structure",  label: "Structure technique", desc: "Je réalise des travaux de reforestation", icon: "🏗️" },
];

export default function RegisterPage() {
  const router  = useRouter();
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "volontaire" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      await authApi.register(data as Record<string, string>);
      router.push("/login?registered=1");
    } catch (e: any) {
      const msg = e.response?.data;
      setError(typeof msg === "object" ? Object.values(msg).flat().join(" ") : "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Rebois Connect" className="h-16 object-contain mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-green-800">Créer un compte</h1>
          <p className="text-gray-500 text-sm mt-1">Rejoignez la communauté Rebois Connect</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Choix du rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Je suis...</label>
            <div className="grid grid-cols-1 gap-2">
              {ROLES.map((r) => (
                <label key={r.value} className={`flex items-center gap-3 border-2 rounded-lg p-3 cursor-pointer transition ${selectedRole === r.value ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}>
                  <input {...register("role")} type="radio" value={r.value} className="hidden" />
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <div className="font-medium text-gray-800">{r.label}</div>
                    <div className="text-xs text-gray-500">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input {...register("first_name")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input {...register("last_name")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input {...register("email")} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pseudo *</label>
            <input {...register("username")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>

          {selectedRole === "structure" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;organisation *</label>
                <input {...register("organization_name")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro d&apos;enregistrement *</label>
                <input {...register("registration_number")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
              <input {...register("password")} type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer *</label>
              <input {...register("password2")} type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              {errors.password2 && <p className="text-red-500 text-xs mt-1">{errors.password2.message}</p>}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-green-700 font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
