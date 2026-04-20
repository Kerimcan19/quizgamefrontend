"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../services/api";
import { useUserStore } from "../../store/useUserStore";

type Friend = {
  id: string;
  username: string;
  email: string;
};

type FriendRequest = {
  id: string;
  senderId: string;
  sender: Friend;
  status: string;
};

export default function Friends() {
  const userId = useUserStore((s) => s.user?.id);
  const user = useUserStore((s) => s.user);
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResult, setSearchResult] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/friends/${userId}`);
      setFriends(res.data);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  };

  const fetchPendingRequests = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/friends/pending/${userId}`);
      setPendingRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
    }
  };

  useEffect(() => {
    if (!userId) {
      router.push("/auth/login");
      return;
    }
    fetchFriends();
    fetchPendingRequests();
  }, [userId, router]);

  const searchUsersHandler = async (value: string) => {
    setSearchUsername(value);
    if (value.length < 2) {
      setSearchResult(null);
      return;
    }

    try {
      const res = await api.get(`/friends/search/users?username=${value}`);
      if (res.data.length > 0) {
        setSearchResult(res.data[0]);
      } else {
        setSearchResult(null);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResult(null);
    }
  };

  const sendFriendRequest = async () => {
    if (!searchResult || !userId) return;
    setLoading(true);
    try {
      await api.post("/friends/request", {
        senderId: userId,
        receiverId: searchResult.id,
      });
      setSearchUsername("");
      setSearchResult(null);
      alert("Arkadaşlık isteği gönderildi!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await api.post(`/friends/accept/${requestId}`);
      setPendingRequests(pendingRequests.filter((r) => r.id !== requestId));
      fetchFriends();
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await api.post(`/friends/reject/${requestId}`);
      setPendingRequests(pendingRequests.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error("Failed to reject request:", err);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "40px",
        maxWidth: "600px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <h1 style={{ fontSize: "40px", margin: "0 0 10px 0", color: "#333" }}>👥 Arkadaşlar</h1>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "16px" }}>
          <strong>{user?.username}</strong>'ın arkadaş listesi
        </p>

        {/* Arkadaşlık İsteği Gönder */}
        <div style={{
          background: "#f9f9f9",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "30px",
          border: "2px solid #ddd",
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>➕ Arkadaşlık İsteği Gönder</h3>
          <input
            type="text"
            placeholder="Kullanıcı adı ile ara..."
            value={searchUsername}
            onChange={(e) => searchUsersHandler(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "14px",
              marginBottom: "10px",
              boxSizing: "border-box",
            }}
          />
          {searchResult && (
            <div style={{
              background: "white",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ color: "#333" }}>{searchResult.username}</span>
              <button
                onClick={sendFriendRequest}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Gönderiliyor..." : "İstek Gönder"}
              </button>
            </div>
          )}
        </div>

        {/* Bekleyen İstekler */}
        {pendingRequests.length > 0 && (
          <div style={{
            background: "#fff9e6",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "30px",
            border: "2px solid #ffc107",
          }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>⏳ Bekleyen İstekler ({pendingRequests.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pendingRequests.map((req) => (
                <div key={req.id} style={{
                  background: "white",
                  padding: "10px",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span style={{ color: "#333" }}>{req.sender.username}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => acceptRequest(req.id)}
                      style={{
                        padding: "8px 12px",
                        background: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ✓ Kabul
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id)}
                      style={{
                        padding: "8px 12px",
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ✕ Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Arkadaş Listesi */}
        <div style={{
          background: "#e8f5e9",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "2px solid #4caf50",
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>✓ Arkadaşlar ({friends.length})</h3>
          {friends.length === 0 ? (
            <p style={{ color: "#666", margin: 0 }}>Henüz arkadaşınız yok</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {friends.map((friend) => (
                <div key={friend.id} style={{
                  background: "white",
                  padding: "10px",
                  borderRadius: "8px",
                  color: "#333",
                }}>
                  👤 {friend.username}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => router.push("/")}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            fontWeight: "bold",
            border: "2px solid #ddd",
            borderRadius: "8px",
            background: "white",
            color: "#666",
            cursor: "pointer",
          }}
        >
          ← Geri
        </button>
      </div>
    </div>
  );
}
