"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Heart, MessageCircle, Share2, Plus, X, Image, Link, Trash2 } from "lucide-react";

const POST_TYPES = [
  { value: "partage",    label: "Partage",    emoji: "🔗", color: "bg-blue-100 text-blue-700" },
  { value: "astuce",     label: "Astuce",     emoji: "💡", color: "bg-yellow-100 text-yellow-700" },
  { value: "formation",  label: "Formation",  emoji: "📚", color: "bg-purple-100 text-purple-700" },
  { value: "annonce",    label: "Annonce",    emoji: "📣", color: "bg-red-100 text-red-700" },
  { value: "actualite",  label: "Actualité",  emoji: "🌍", color: "bg-green-100 text-green-700" },
];

const ROLE_LABELS: Record<string, string> = {
  volontaire: "Volontaire", mecene: "Mécène",
  structure: "Structure",   admin: "Admin",
};

export default function CommunityPage() {
  const user = useAuthStore((s) => s.user);
  const [posts,       setPosts]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [filter,      setFilter]      = useState("");
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments,    setComments]    = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState("");
  const [form, setForm] = useState({
    post_type: "partage", title: "", content: "", link_url: "",
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = () => {
    setLoading(true);
    const params = filter ? `?type=${filter}` : "";
    api.get(`/gamification/posts/${params}`)
      .then((r) => setPosts(r.data.results || r.data))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
      if (mediaFile) data.append("image", mediaFile);
      const r = await api.post("/gamification/posts/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPosts((prev) => [r.data, ...prev]);
      setShowCreate(false);
      setForm({ post_type: "partage", title: "", content: "", link_url: "" });
      setMediaFile(null);
      setMediaPreview(null);
    } catch {
      alert("Erreur lors de la publication");
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const r = await api.post(`/gamification/posts/${postId}/like/`);
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, likes_count: r.data.likes_count, is_liked_by_me: r.data.liked } : p
      ));
    } catch {}
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Supprimer ce post ?")) return;
    try {
      await api.delete(`/gamification/posts/${postId}/`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {}
  };

  const loadComments = async (postId: string) => {
    if (expandedComments === postId) { setExpandedComments(null); return; }
    const r = await api.get(`/gamification/posts/${postId}/comments/`);
    setComments((prev) => ({ ...prev, [postId]: r.data }));
    setExpandedComments(postId);
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      const r = await api.post(`/gamification/posts/${postId}/comments/`, { content: commentText });
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), r.data] }));
      setCommentText("");
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
    } catch {}
  };

  const typeInfo = (type: string) => POST_TYPES.find((t) => t.value === type) || POST_TYPES[0];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Communauté</h1>
            <p className="text-gray-500 text-sm">Partagez, apprenez, échangez</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition"
          >
            <Plus size={16} />
            Publier
          </button>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter("")}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${!filter ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Tout
          </button>
          {POST_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${filter === t.value ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Modal création */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Nouvelle publication</h2>
                <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {POST_TYPES.map((t) => (
                    <button
                      key={t.value} type="button"
                      onClick={() => setForm((p) => ({ ...p, post_type: t.value }))}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${form.post_type === t.value ? "bg-green-700 text-white" : t.color}`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
                <input
                  value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Titre (optionnel)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <textarea
                  value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Qu'est-ce que vous souhaitez partager ?" rows={4} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  value={form.link_url} onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))}
                  placeholder="Lien (optionnel)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
		{/* Upload média */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier (image, vidéo, audio)
                  </label>
                  <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-3 cursor-pointer hover:border-green-400 transition">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,video/*,audio/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setMediaFile(f);
                          if (f.type.startsWith("image/")) {
                            setMediaPreview(URL.createObjectURL(f));
                          } else {
                            setMediaPreview(null);
                          }
                        }
                      }}
                    />
                    <span className="text-2xl">📎</span>
                    <span className="text-sm text-gray-500">
                      {mediaFile ? mediaFile.name : "Cliquez pour ajouter un fichier"}
                    </span>
                  </label>
                  {mediaPreview && (
                    <img src={mediaPreview} alt="preview" className="mt-2 rounded-lg max-h-32 object-cover" />
                  )}
                  {mediaFile && !mediaPreview && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                      ✓ {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(1)} MB)
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
                    Annuler
                  </button>
                  <button type="submit"
                    className="flex-1 bg-green-700 text-white py-2 rounded-lg text-sm hover:bg-green-800">
                    Publier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-400">Aucune publication pour le moment</p>
            <p className="text-gray-400 text-sm mt-1">Soyez le premier à partager !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const type = typeInfo(post.post_type);
              return (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                        {post.author_username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-800">{post.author_username}</div>
                        <div className="text-xs text-gray-400">
                          {ROLE_LABELS[post.author_role]} · {new Date(post.created_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${type.color}`}>
                        {type.emoji} {type.label}
                      </span>
                      {(post.author === user?.id || user?.role === "admin") && (
                        <button onClick={() => handleDelete(post.id)} className="text-gray-300 hover:text-red-500 transition">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {post.title && <div className="font-semibold text-gray-800 mb-1">{post.title}</div>}
                    <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>
		    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="media"
                        className="mt-3 rounded-xl w-full max-h-64 object-cover"
                      />
                    )}
                    {post.link_url && (
                      <a href={post.link_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 mt-2 text-xs text-green-700 hover:underline">
                        <Link size={12} />
                        {post.link_url}
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-3 flex items-center gap-4 border-t border-gray-50 pt-3">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm transition ${post.is_liked_by_me ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                    >
                      <Heart size={16} fill={post.is_liked_by_me ? "currentColor" : "none"} />
                      {post.likes_count}
                    </button>
                    <button
                      onClick={() => loadComments(post.id)}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-700 transition"
                    >
                      <MessageCircle size={16} />
                      {post.comments_count}
                    </button>
                  </div>

                  {/* Comments */}
                  {expandedComments === post.id && (
                    <div className="px-4 pb-4 border-t border-gray-50">
                      <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                        {(comments[post.id] || []).map((c) => (
                          <div key={c.id} className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                              {c.author_username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                              <div className="text-xs font-medium text-gray-700">{c.author_username}</div>
                              <div className="text-xs text-gray-600">{c.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Votre commentaire..."
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                          onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-800"
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
