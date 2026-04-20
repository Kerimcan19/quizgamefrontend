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
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <h1 style={{ fontSize: "36px", textAlign: "center", margin: "0 0 30px 0", color: "#333" }}>
          🎮 Giriş Yap
        </h1>

        {error && (
          <div style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px", color: "#333" }}>
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
              border: "2px solid #ddd",
              borderRadius: "8px",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
          />
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px", color: "#333" }}>
            Şifre
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
              border: "2px solid #ddd",
              borderRadius: "8px",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
          />
        </div>

        <button
          onClick={login}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            fontWeight: "bold",
            border: "none",
            borderRadius: "8px",
            background: loading ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            marginBottom: "15px",
          }}
        >
          {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>

        <div style={{ textAlign: "center", color: "#666" }}>
          <p style={{ margin: "0 0 10px 0" }}>Hesabınız yok mu?</p>
          <button
            onClick={() => router.push("/auth/register")}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              textDecoration: "underline",
            }}
          >
            Kayıt Ol
          </button>
        </div>
      </div>
    </div>
  );
}
