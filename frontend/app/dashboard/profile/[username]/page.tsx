"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { MessageSquare, UserPlus, UserMinus, Users } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  volontaire: "Volontaire", mecene: "Mécène",
  structure: "Structure",   admin: "Administrateur",
};

const ROLE_COLORS: Record<string, string> = {
  volontaire: "bg-green-100 text-green-700",
  mecene:     "bg-blue-100 text-blue-700",
  structure:  "bg-purple-100 text-purple-700",
  admin:      "bg-red-100 text-red-700",
};

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router       = useRouter();
  const currentUser  = useAuthStore((s) => s.user);
  const [profile,    setProfile]    = useState<any>(null);
  const [posts,      setPosts]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [following,  setFollowing]  = useState(false);
  const [followers,  setFollowers]  = useState(0);
  const [following_count, setFollowingCount] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get(`/auth/profile/${username}/`),
      api.get(`/gamification/posts/?author=${username}`),
    ]).then(([profileRes, postsRes]) => {
      setProfile(profileRes.data);
      setPosts(postsRes.data.results || postsRes.data);
      setFollowing(profileRes.data.is_followed_by_me);
      setFollowers(profileRes.data.followers_count);
      setFollowingCount(profileRes.data.following_count);
    }).finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    try {
      const r = await api.post(`/auth/profile/${username}/follow/`);
      setFollowing(r.data.following);
      setFollowers((prev) => r.data.following ? prev + 1 : prev - 1);
    } catch {}
  };

  const handleMessage = () => {
    router.push(`/dashboard/messages?with=${profile?.id}`);
  };

  if (loading) return <DashboardLayout><div className="text-center py-12 text-gray-400">Chargement...</div></DashboardLayout>;
  if (!profile) return <DashboardLayout><div className="text-center py-12 text-gray-400">Profil introuvable</div></DashboardLayout>;

  const isMe = currentUser?.username === username;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Cover */}
        <div className="bg-gradient-to-br from-green-800 to-emerald-600 rounded-2xl h-36 mb-0 relative">
          {isMe && (
            <button onClick={() => router.push("/dashboard/profile/edit")}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition">
              Modifier le profil
            </button>
          )}
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 pt-4 pb-6 -mt-8 mx-4 relative">
          <div className="flex items-end justify-between mb-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-green-100 border-4 border-white shadow-md flex items-center justify-center -mt-12 overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-green-700">{profile.username?.[0]?.toUpperCase()}</span>
              )}
            </div>

            {/* Actions */}
            {!isMe && (
              <div className="flex gap-2">
                <button onClick={handleFollow}
                  className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full font-medium transition ${
                    following ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-green-700 text-white hover:bg-green-800"
                  }`}>
                  {following ? <><UserMinus size={14} /> Ne plus suivre</> : <><UserPlus size={14} /> Suivre</>}
                </button>
                <button onClick={handleMessage}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium">
                  <MessageSquare size={14} /> Message
                </button>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{profile.first_name} {profile.last_name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[profile.role]}`}>
                {ROLE_LABELS[profile.role]}
              </span>
            </div>
            <div className="text-gray-500 text-sm mb-2">@{profile.username}</div>
            {profile.bio && <p className="text-gray-700 text-sm">{profile.bio}</p>}
          </div>

          {/* Stats LinkedIn-style */}
          <div className="flex gap-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="font-bold text-gray-900">{followers}</div>
              <div className="text-xs text-gray-500">Abonnés</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-900">{following_count}</div>
              <div className="text-xs text-gray-500">Abonnements</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-900">{posts.length}</div>
              <div className="text-xs text-gray-500">Publications</div>
            </div>
          </div>
        </div>

        {/* Publications */}
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 px-1">Publications</h2>
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">Aucune publication pour le moment</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="text-xs text-gray-400 mb-2">
                  {new Date(post.created_at).toLocaleDateString("fr-FR")} · {post.post_type_display}
                </div>
                {post.title && <div className="font-medium text-gray-800 mb-1">{post.title}</div>}
                <p className="text-gray-600 text-sm">{post.content}</p>
                {post.image_url && (
                  <img src={post.image_url} alt="" className="mt-3 rounded-lg w-full max-h-48 object-cover" />
                )}
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span>❤️ {post.likes_count}</span>
                  <span>💬 {post.comments_count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
