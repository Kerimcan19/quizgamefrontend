"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../services/api";
import { useUserStore } from "../../../store/useUserStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { setToken, user } = useUserStore();
  const token = useUserStore((s) => s.token);

  useEffect(() => {
    if (token && user) {
      router.push("/");
    }
  }, [token, user, router]);

  const login = async () => {
    if (!email || !password) {
      setError("Email ve şifre gerekli");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      setToken(res.data.token, res.data.user);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Giriş hatası");
    } finally {
      setLoading(false);
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
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <h1 style={{ fontSize: "32px", textAlign: "center", margin: "0 0 28px 0", color: "#0f172a", fontWeight: "700" }}>
          Sign In
        </h1>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            color: "#dc2626",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "14px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Email
          </label>
          <input
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && login()}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxSizing: "border-box",
              transition: "all 0.2s",
              outline: "none",
              background: "rgba(255, 255, 255, 0.5)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.background = "white";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && login()}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxSizing: "border-box",
              transition: "all 0.2s",
              outline: "none",
              background: "rgba(255, 255, 255, 0.5)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.background = "white";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <button
          onClick={login}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "15px",
            fontWeight: "600",
            border: "none",
            borderRadius: "10px",
            background: loading ? "#cbd5e1" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s",
            marginBottom: "16px",
            boxShadow: loading ? "none" : "0 4px 15px rgba(59, 130, 246, 0.3)",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div style={{ textAlign: "center", color: "#64748b" }}>
          <p style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Don't have an account?</p>
          <button
            onClick={() => router.push("/auth/register")}
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#3b82f6")}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
