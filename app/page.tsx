"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../store/useUserStore";

export default function Home() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    if (!token || !user) {
      router.push("/auth/login");
    }
  }, [token, user, router]);

  if (!user) {
    return null;
  }

  const logout = () => {
    const { logout: logoutAction } = useUserStore.getState();
    logoutAction();
    router.push("/auth/login");
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
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "48px", margin: "0 0 10px 0", color: "#333" }}>🎮 Quiz Game</h1>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "16px" }}>
          Hoşgeldiniz, <strong>{user.username}</strong>!
        </p>

        <div style={{ marginBottom: "30px", padding: "15px", background: "#f5f5f5", borderRadius: "10px" }}>
          <p style={{ margin: "0", color: "#666" }}>💰 Krediniz: <strong style={{ fontSize: "20px", color: "#667eea" }}>{user.credits}</strong></p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
        }}>
          <button
            onClick={() => router.push("/lobby")}
            style={{
              padding: "20px",
              fontSize: "16px",
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
            🎯 Lobby
          </button>

          <button
            onClick={() => router.push("/leaderboard")}
            style={{
              padding: "20px",
              fontSize: "16px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🏆 Sıralama
          </button>

          <button
            onClick={() => router.push("/friends")}
            style={{
              padding: "20px",
              fontSize: "16px",
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
            👥 Arkadaşlar
          </button>

          <button
            onClick={() => router.push("/store")}
            style={{
              padding: "20px",
              fontSize: "16px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🛍️ Mağaza
          </button>
        </div>

        <button
          onClick={logout}
          style={{
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: "bold",
            border: "2px solid #ddd",
            borderRadius: "8px",
            background: "white",
            color: "#666",
            cursor: "pointer",
            width: "100%",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#ff4444";
            e.currentTarget.style.color = "#ff4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.color = "#666";
          }}
        >
          Çıkış
        </button>
      </div>
    </div>
  );
}
