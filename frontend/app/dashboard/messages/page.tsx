"use client";
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Send, MessageCircle } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  volontaire: "Volontaire", mecene: "Mécène",
  structure: "Structure",   admin: "Admin",
};

export default function MessagesPage() {
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser,  setSelectedUser]  = useState<any>(null);
  const [messages,      setMessages]      = useState<any[]>([]);
  const [text,          setText]          = useState("");
  const [loading,       setLoading]       = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/gamification/messages/conversations/")
      .then((r) => setConversations(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    api.get(`/gamification/messages/?with=${selectedUser.id}`)
      .then((r) => setMessages(r.data.results || r.data));
  }, [selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return;
    try {
      const r = await api.post("/gamification/messages/send/", {
        recipient: selectedUser.id, content: text,
      });
      setMessages((prev) => [...prev, r.data]);
      setText("");
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Messagerie</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex h-[600px] overflow-hidden">
          {/* Conversations */}
          <div className="w-72 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-600">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400 text-sm">Chargement...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  <MessageCircle size={24} className="mx-auto mb-2 text-gray-300" />
                  Aucune conversation
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.user.id}
                    onClick={() => setSelectedUser(conv.user)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${selectedUser?.id === conv.user.id ? "bg-green-50" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                      {conv.user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-800">{conv.user.username}</div>
                      <div className="text-xs text-gray-400 truncate">{conv.last_message}</div>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat */}
          {selectedUser ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-800">{selectedUser.username}</div>
                  <div className="text-xs text-gray-400">{ROLE_LABELS[selectedUser.role]}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.sender === user?.id || msg.sender_username === user?.username;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                        isMe ? "bg-green-700 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}>
                        {msg.content}
                        <div className={`text-xs mt-1 ${isMe ? "text-green-200" : "text-gray-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="bg-green-700 text-white p-2 rounded-xl hover:bg-green-800 transition"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
