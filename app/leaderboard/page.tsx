"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../services/api";

type User = {
  username: string;
  totalScore: number;
};

export default function Leaderboard() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get("/leaderboard")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}️⃣`;
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return "#ffd700";
    if (index === 1) return "#c0c0c0";
    if (index === 2) return "#cd7f32";
    return "#e8e8e8";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "40px 20px",
          marginBottom: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}>
          <h1 style={{ fontSize: "48px", textAlign: "center", margin: "0 0 30px 0", color: "#333" }}>
            🏆 Sıralama
          </h1>

          {loading ? (
            <div style={{ textAlign: "center", color: "#666", fontSize: "18px" }}>
              Yükleniyor...
            </div>
          ) : data.length === 0 ? (
            <div style={{ textAlign: "center", color: "#666", fontSize: "16px" }}>
              Henüz oyuncu yok
            </div>
          ) : (
            <div>
              {data.map((user, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: getMedalColor(idx),
                    padding: "16px 20px",
                    marginBottom: "10px",
                    borderRadius: "12px",
                    color: idx === 0 ? "#333" : "white",
                    fontWeight: idx < 3 ? "bold" : "normal",
                    fontSize: idx < 3 ? "16px" : "14px",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "28px" }}>{getMedalEmoji(idx)}</span>
                    <span>{user.username}</span>
                  </div>
                  <span style={{ fontSize: "18px" }}>{user.totalScore.toLocaleString()}</span>
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
            border: "2px solid white",
            borderRadius: "8px",
            background: "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          ← Geri
        </button>
      </div>
    </div>
  );
}