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
      alert("Lütfen bir arkadaş seçin");
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
      alert(`Davet gönderildi! Arkadaşın kabul etmesini bekleyin...`);
      // Oyun sayfasında bekleyecek, arkadaş katılınca başlayacak
      router.push(`/game/${gameId}`);
    } catch (err) {
      console.error("Failed to create game:", err);
      alert("Oyun oluşturulamadı");
    }
  };

  const joinPrivateGame = async (gameId: string) => {
    if (!userId) {
      alert("Kullanıcı ID bulunamadı");
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
      alert(err.response?.data?.message || "Oyuna katılamadınız");
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
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "48px", margin: "0 0 10px 0", color: "#333" }}>🎯 Lobby</h1>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "16px" }}>
          Hoşgeldiniz, <strong>{user?.username}</strong>!
        </p>

        {!gameMode && !searching ? (
          <div>
            <p style={{ color: "#666", marginBottom: "30px", fontSize: "16px" }}>
              Oyun türünü seçin
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => setGameMode("MATCHED")}
                style={{
                  width: "100%",
                  padding: "20px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                🎮 Eşleştirmeli (Kredi kazanılır)
              </button>
              <button
                onClick={() => setGameMode("PRIVATE")}
                style={{
                  width: "100%",
                  padding: "20px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: "white",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                👥 Özel (Arkadaşlarla)
              </button>
            </div>
          </div>
        ) : gameMode === "MATCHED" ? (
          <div style={{ marginBottom: "20px" }}>
            {!searching ? (
              <>
                <p style={{ color: "#666", marginBottom: "20px", fontSize: "16px" }}>
                  Eşleştirmeli oyunda rakip aranıyor...
                </p>
                <button
                  onClick={joinQueue}
                  style={{
                    width: "100%",
                    padding: "20px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    marginBottom: "12px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  🎮 Oyna
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
                  fontSize: "32px",
                  animation: "spin 1s linear infinite",
                }}>
                  ⏳
                </div>
                <p style={{ color: "#666", fontSize: "18px", margin: 0 }}>
                  Oyuncu aranıyor...
                </p>
              </div>
            )}
            <button
              onClick={cancelQueue}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                border: "2px solid #ff4444",
                borderRadius: "8px",
                background: "white",
                color: "#ff4444",
                cursor: "pointer",
              }}
            >
              İptal Et
            </button>
          </div>
        ) : gameMode === "PRIVATE" ? (
          <div>
            {!privateGameMode ? (
              <div>
                <p style={{ color: "#666", marginBottom: "20px", fontSize: "16px" }}>
                  Özel oyun seçeneği seçin
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button
                    onClick={() => setPrivateGameMode("CREATE")}
                    style={{
                      width: "100%",
                      padding: "16px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      border: "none",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    ➕ Arkadaşını Davet Et
                  </button>
                </div>
                <button
                  onClick={cancelQueue}
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
                    marginTop: "12px",
                  }}
                >
                  ← Geri
                </button>
              </div>
            ) : privateGameMode === "CREATE" ? (
              <div>
                <p style={{ color: "#666", marginBottom: "20px", fontSize: "16px" }}>
                  Arkadaş seçin
                </p>
                {friends.length === 0 ? (
                  <div style={{
                    background: "#f5f5f5",
                    padding: "20px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    color: "#666",
                  }}>
                    <p style={{ margin: 0 }}>Henüz arkadaşınız yok</p>
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
                          borderRadius: "8px",
                          border: selectedFriend === friend.id ? "3px solid #667eea" : "2px solid #ddd",
                          background: selectedFriend === friend.id ? "#f0f0ff" : "white",
                          color: "#333",
                          cursor: "pointer",
                          fontSize: "16px",
                          fontWeight: selectedFriend === friend.id ? "bold" : "normal",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = selectedFriend === friend.id ? "#f0f0ff" : "white")}
                      >
                        👤 {friend.username}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={createPrivateGame}
                  disabled={!selectedFriend}
                  style={{
                    width: "100%",
                    padding: "16px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: "8px",
                    background: selectedFriend ? "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" : "#ccc",
                    color: "white",
                    cursor: selectedFriend ? "pointer" : "not-allowed",
                    marginBottom: "12px",
                  }}
                >
                  ✓ Oyun Oluştur
                </button>
                <button
                  onClick={() => setPrivateGameMode(null)}
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
              fontWeight: "bold",
              border: "2px solid #ddd",
              borderRadius: "8px",
              background: "white",
              color: "#666",
              cursor: "pointer",
            }}
          >
            ← Ana Sayfa
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