"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { socket } from "../../services/socket";
import { useUserStore } from "../../store/useUserStore";

export default function Lobby() {
  const userId = useUserStore((s) => s.user?.id);
  const user = useUserStore((s) => s.user);
  const router = useRouter();
  const [searching, setSearching] = useState(false);

  const joinQueue = () => {
    console.log("JOIN QUEUE:", userId);
    setSearching(true);
    socket.emit("joinQueue", { userId });
  };

  const cancelQueue = () => {
    setSearching(false);
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

        {!searching ? (
          <div>
            <p style={{ color: "#666", marginBottom: "30px", fontSize: "16px" }}>
              Bir oyuncu bulmak için "Oyna" butonuna basın
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
                marginBottom: "15px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              🎮 Oyna
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: "20px" }}>
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
        )}

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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}