"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

const schema = z.object({
  email:    z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router   = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser   = useAuthStore((s) => s.setUser);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login(data.email, data.password);
      setTokens(res.data.access, res.data.refresh);
      const me = await authApi.me();
      setUser(me.data);
      const role = me.data.role;
      router.push(`/dashboard/${role}`);
    } catch (e: any) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌱</div>
          <h1 className="text-2xl font-bold text-green-800">Rebois Connect</h1>
          <p className="text-gray-500 text-sm mt-1">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="vous@exemple.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
             >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

	  <div className="text-right">
  	    <Link href="/forgot-password" className="text-xs text-green-700 hover:underline">
    	    Mot de passe oublié ?
  	    </Link>
	  </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-green-700 font-medium hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
