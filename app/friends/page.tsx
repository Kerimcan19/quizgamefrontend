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
      alert("Friend request sent!");
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
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "16px",
        padding: "40px",
        maxWidth: "600px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <h1 style={{ fontSize: "40px", margin: "0 0 8px 0", color: "#0f172a", fontWeight: "700" }}>Friends</h1>
        <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "14px" }}>
          <strong style={{ color: "#0f172a" }}>{user?.username}</strong>'s friend list
        </p>

        {/* Send Friend Request */}
        <div style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.05), rgba(51, 65, 85, 0.05))",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "24px",
          border: "1px solid rgba(51, 65, 85, 0.1)",
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "15px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Add Friend</h3>
          <input
            type="text"
            placeholder="Search by username..."
            value={searchUsername}
            onChange={(e) => searchUsersHandler(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              fontSize: "14px",
              marginBottom: "10px",
              boxSizing: "border-box",
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {searchResult && (
            <div style={{
              background: "white",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid #e2e8f0",
            }}>
              <span style={{ color: "#0f172a", fontSize: "14px" }}>{searchResult.username}</span>
              <button
                onClick={sendFriendRequest}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  background: loading ? "#cbd5e1" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "Sending..." : "Send Request"}
              </button>
            </div>
          )}
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(249, 165, 0, 0.05), rgba(177, 136, 20, 0.05))",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid rgba(249, 165, 0, 0.2)",
          }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "15px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending Requests ({pendingRequests.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pendingRequests.map((req) => (
                <div key={req.id} style={{
                  background: "white",
                  padding: "12px",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid #e2e8f0",
                }}>
                  <span style={{ color: "#0f172a", fontSize: "14px" }}>{req.sender.username}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => acceptRequest(req.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#22c55e",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#16a34a")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#22c55e")}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friend List */}
        <div style={{
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(20, 184, 166, 0.05))",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "1px solid rgba(34, 197, 94, 0.2)",
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "15px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Friends ({friends.length})</h3>
          {friends.length === 0 ? (
            <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>No friends yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {friends.map((friend) => (
                <div key={friend.id} style={{
                  background: "white",
                  padding: "12px",
                  borderRadius: "10px",
                  color: "#0f172a",
                  fontSize: "14px",
                  border: "1px solid #e2e8f0",
                }}>
                  {friend.username}
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
            fontWeight: "600",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            background: "white",
            color: "#64748b",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
