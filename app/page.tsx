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
        <h1 style={{ fontSize: "42px", margin: "0 0 8px 0", color: "#0f172a", fontWeight: "700" }}>Quiz Game</h1>
        <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "15px" }}>
          Welcome back, <strong style={{ color: "#0f172a" }}>{user.username}</strong>
        </p>

        <div style={{
          marginBottom: "32px",
          padding: "16px 20px",
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.05), rgba(51, 65, 85, 0.05))",
          borderRadius: "12px",
          border: "1px solid rgba(51, 65, 85, 0.1)"
        }}>
          <p style={{ margin: "0", color: "#64748b", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Credits Available</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "28px", fontWeight: "700", color: "#0f172a" }}>{user.credits}</p>
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
              padding: "16px",
              fontSize: "14px",
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
            Play Game
          </button>

          <button
            onClick={() => router.push("/leaderboard")}
            style={{
              padding: "16px",
              fontSize: "14px",
              fontWeight: "600",
              border: "none",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "white",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(139, 92, 246, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(139, 92, 246, 0.3)";
            }}
          >
            Leaderboard
          </button>

          <button
            onClick={() => router.push("/friends")}
            style={{
              padding: "16px",
              fontSize: "14px",
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
            Friends
          </button>

          <button
            onClick={() => router.push("/store")}
            style={{
              padding: "16px",
              fontSize: "14px",
              fontWeight: "600",
              border: "none",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "white",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(245, 158, 11, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(245, 158, 11, 0.3)";
            }}
          >
            Store
          </button>
        </div>

        <button
          onClick={logout}
          style={{
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: "600",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            background: "white",
            color: "#64748b",
            cursor: "pointer",
            width: "100%",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#ef4444";
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background = "#fff5f5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.background = "white";
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
