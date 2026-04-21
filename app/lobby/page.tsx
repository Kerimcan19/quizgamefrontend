"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { socket } from "../../services/socket";
import { useUserStore } from "../../store/useUserStore";
import api from "../../services/api";

type Friend = {
  id: string;
  username: string;
  email: string;
};

type PrivateGame = {
  id: string;
  createdBy: string;
  status: string;
  players: Array<{
    user: {
      id: string;
      username: string;
    };
  }>;
};

export default function Lobby() {
  const userId = useUserStore((s) => s.user?.id);
  const user = useUserStore((s) => s.user);
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [gameMode, setGameMode] = useState<"MATCHED" | "PRIVATE" | null>(null);
  const [privateGameMode, setPrivateGameMode] = useState<"CREATE" | "JOIN" | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [availableGames, setAvailableGames] = useState<PrivateGame[]>([]);

  useEffect(() => {
    if (gameMode === "PRIVATE" && userId) {
      const fetchFriends = async () => {
        try {
          const res = await api.get(`/friends/${userId}`);
          setFriends(res.data);
        } catch (err) {
          console.error("Failed to fetch friends:", err);
        }
      };
      const fetchAvailableGames = async () => {
        try {
          const res = await api.get(`/games/private/${userId}`);
          setAvailableGames(res.data);
        } catch (err) {
          console.error("Failed to fetch available games:", err);
        }
      };
      fetchFriends();
      fetchAvailableGames();
    }
  }, [gameMode, userId]);

  const joinQueue = () => {
    console.log("JOIN QUEUE:", userId);
    setSearching(true);
    socket.emit("joinQueue", { userId });
  };

  const createPrivateGame = async () => {
    if (!userId || !selectedFriend) {
      alert("Please select a friend");
      return;
    }

    try {
      const res = await api.post("/games", {
        type: "PRIVATE",
        createdBy: userId,
        invitedUserId: selectedFriend,
      });
      const gameId = res.data.id;
      setSearching(false);
      setGameMode(null);
      setPrivateGameMode(null);
      alert(`Invitation sent! Waiting for your friend to accept...`);
      // Oyun sayfasında bekleyecek, arkadaş katılınca başlayacak
      router.push(`/game/${gameId}`);
    } catch (err) {
      console.error("Failed to create game:", err);
      alert("Oyun oluşturulamadı");
    }
  };

  const joinPrivateGame = async (gameId: string) => {
    if (!userId) {
      alert("User ID not found");
      return;
    }

    try {
      await api.post(`/games/${gameId}/join`, {
        userId,
      });
      setGameMode(null);
      setPrivateGameMode(null);
      router.push(`/game/${gameId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Could not join game");
    }
  };

  const cancelQueue = () => {
    setSearching(false);
    if (gameMode === "PRIVATE") {
      setPrivateGameMode(null);
    } else {
      setGameMode(null);
    }
    socket.emit("leaveQueue", { userId });
  };

  useEffect(() => {
    console.log("LISTENER ACTIVE");

    socket.on("startGame", (data: any) => {
      console.log("🔥 MATCH FOUND:", data);
      setSearching(false);
      router.push(`/game/${data.gameId}`);
    });

    return () => {
      socket.off("startGame");
    };
  }, [router]);

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
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
        textAlign: "center",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <h1 style={{ fontSize: "42px", margin: "0 0 8px 0", color: "#0f172a", fontWeight: "700" }}>Game Lobby</h1>
        <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "15px" }}>
          Welcome, <strong style={{ color: "#0f172a" }}>{user?.username}</strong>!
        </p>

        {!gameMode && !searching ? (
          <div>
            <p style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
              Select Game Mode
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => setGameMode("MATCHED")}
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "15px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.3)";
                }}
              >
                Matched Game (Earn Credits)
              </button>
              <button
                onClick={() => setGameMode("PRIVATE")}
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "15px",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 15px rgba(6, 182, 212, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(6, 182, 212, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(6, 182, 212, 0.3)";
                }}
              >
                Private Game (Play with Friends)
              </button>
            </div>
          </div>
        ) : gameMode === "MATCHED" ? (
          <div style={{ marginBottom: "20px" }}>
            {!searching ? (
              <>
                <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "15px" }}>
                  Find an opponent and earn credits
                </p>
                <button
                  onClick={joinQueue}
                  style={{
                    width: "100%",
                    padding: "16px",
                    fontSize: "15px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "white",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    marginBottom: "12px",
                    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.3)";
                  }}
                >
                  Start Game
                </button>
              </>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "30px",
              }}>
                <div style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid #e2e8f0",
                  borderTop: "2px solid #3b82f6",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}/>
                <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>
                  Searching for opponent...
                </p>
              </div>
            )}
            <button
              onClick={cancelQueue}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ef4444";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              Cancel
            </button>
          </div>
        ) : gameMode === "PRIVATE" ? (
          <div>
            {!privateGameMode ? (
              <div>
                <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
                  Private Game Options
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button
                    onClick={() => setPrivateGameMode("CREATE")}
                    style={{
                      width: "100%",
                      padding: "16px",
                      fontSize: "15px",
                      fontWeight: "600",
                      border: "none",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                      color: "white",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 4px 15px rgba(6, 182, 212, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 25px rgba(6, 182, 212, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 15px rgba(6, 182, 212, 0.3)";
                    }}
                  >
                    Invite Friend
                  </button>
                </div>
                <button
                  onClick={cancelQueue}
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
                    marginTop: "12px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                >
                  Back
                </button>
              </div>
            ) : privateGameMode === "CREATE" ? (
              <div>
                <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
                  Select a Friend
                </p>
                {friends.length === 0 ? (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.05), rgba(51, 65, 85, 0.05))",
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    color: "#64748b",
                    border: "1px solid rgba(51, 65, 85, 0.1)",
                  }}>
                    <p style={{ margin: 0 }}>No friends yet</p>
                  </div>
                ) : (
                  <div style={{
                    maxHeight: "250px",
                    overflowY: "auto",
                    marginBottom: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}>
                    {friends.map((friend) => (
                      <button
                        key={friend.id}
                        onClick={() => setSelectedFriend(friend.id)}
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          border: selectedFriend === friend.id ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                          background: selectedFriend === friend.id ? "rgba(59, 130, 246, 0.1)" : "white",
                          color: "#0f172a",
                          cursor: "pointer",
                          fontSize: "15px",
                          fontWeight: selectedFriend === friend.id ? "600" : "500",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = selectedFriend === friend.id ? "rgba(59, 130, 246, 0.1)" : "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = selectedFriend === friend.id ? "rgba(59, 130, 246, 0.1)" : "white")}
                      >
                        {friend.username}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={createPrivateGame}
                  disabled={!selectedFriend}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "15px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "10px",
                    background: selectedFriend ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" : "#cbd5e1",
                    color: "white",
                    cursor: selectedFriend ? "pointer" : "not-allowed",
                    marginBottom: "12px",
                    transition: "all 0.3s",
                    boxShadow: selectedFriend ? "0 4px 15px rgba(6, 182, 212, 0.3)" : "none",
                  }}
                >
                  Create Game
                </button>
                <button
                  onClick={() => setPrivateGameMode(null)}
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
                  Back
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {!gameMode && !searching && (
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
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}