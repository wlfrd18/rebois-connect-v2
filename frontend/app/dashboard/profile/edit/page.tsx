"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Camera, Save } from "lucide-react";

export default function EditProfilePage() {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    first_name: "", last_name: "", username: "", bio: "",
  });
  const [avatar,   setAvatar]   = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    api.get("/auth/me/").then((r) => {
      setForm({
        first_name: r.data.first_name || "",
        last_name:  r.data.last_name  || "",
        username:   r.data.username   || "",
        bio:        r.data.bio        || "",
      });
      if (r.data.avatar) setPreview(r.data.avatar);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (avatar) data.append("avatar", avatar);
      const r = await api.patch("/auth/me/update/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(r.data);
      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/profile/${r.data.username}`), 1500);
    } catch (e: any) {
      setError(e.response?.data?.username?.[0] || "Erreur lors de la mise à jour.");
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Modifier le profil</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-green-100 overflow-hidden border-4 border-green-50 shadow">
                {preview ? (
                  <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-green-700">
                    {form.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-700 rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-green-800 transition">
                <Camera size={14} className="text-white" />
                <input type="file" className="hidden" accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setAvatar(f); setPreview(URL.createObjectURL(f)); }
                  }} />
              </label>
            </div>
            <p className="text-xs text-gray-400">Cliquez sur l'icône pour changer la photo</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pl-7 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              rows={3} placeholder="Parlez de vous en quelques mots..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm">✓ Profil mis à jour !</div>}

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-green-700 text-white py-2 rounded-lg text-sm hover:bg-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={14} />
              {loading ? "Enregistrement..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
