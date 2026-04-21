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
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      padding: "20px",
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "40px 20px",
          marginBottom: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <h1 style={{ fontSize: "42px", textAlign: "center", margin: "0 0 28px 0", color: "#0f172a", fontWeight: "700" }}>
            Leaderboard
          </h1>

          {loading ? (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: "15px" }}>
              Loading players...
            </div>
          ) : data.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: "15px" }}>
              No players yet
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
                    background: idx < 3 ? (idx === 0 ? "#fef3c7" : idx === 1 ? "#f3f4f6" : "#fed7aa") : "white",
                    padding: "16px 20px",
                    marginBottom: "10px",
                    borderRadius: "12px",
                    border: idx < 3 ? "1px solid " + (idx === 0 ? "#fcd34d" : idx === 1 ? "#d1d5db" : "#fdbf24") : "1px solid #e2e8f0",
                    color: "#0f172a",
                    fontWeight: idx < 3 ? "700" : "500",
                    fontSize: idx < 3 ? "15px" : "14px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{ fontSize: "20px", width: "24px", textAlign: "center", fontWeight: "700", color: idx === 0 ? "#f59e0b" : idx === 1 ? "#6b7280" : idx === 2 ? "#b45309" : "#64748b" }}>
                      {idx + 1}
                    </span>
                    <span>{user.username}</span>
                  </div>
                  <span style={{ fontSize: "16px", fontWeight: "700" }}>{user.totalScore.toLocaleString()}</span>
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
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "10px",
            background: "transparent",
            color: "white",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "white";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}