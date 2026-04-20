"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../services/api";
import { useUserStore } from "../../../store/useUserStore";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    if (token && user) {
      router.push("/");
    }
  }, [token, user, router]);

  const register = async () => {
    setError("");
    setSuccess("");

    if (!email || !username || !password || !passwordConfirm) {
      setError("Tüm alanlar zorunlu");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        email,
        username,
        password,
      });
      setSuccess("Kayıt başarılı! Giriş yapmak için yönlendiriliyorsunuz...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Kayıt hatası");
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
          📝 Kayıt Ol
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

        {success && (
          <div style={{
            background: "#e8f5e9",
            color: "#2e7d32",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}>
            {success}
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
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              boxSizing: "border-box",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px", color: "#333" }}>
            Kullanıcı Adı
          </label>
          <input
            type="text"
            placeholder="kullanıcıadı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              boxSizing: "border-box",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px", color: "#333" }}>
            Şifre
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              boxSizing: "border-box",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
          />
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px", color: "#333" }}>
            Şifre Onayla
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && register()}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              boxSizing: "border-box",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
          />
        </div>

        <button
          onClick={register}
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
            marginBottom: "15px",
          }}
        >
          {loading ? "Kayıt Yapılıyor..." : "Kayıt Ol"}
        </button>

        <div style={{ textAlign: "center", color: "#666" }}>
          <p style={{ margin: "0 0 10px 0" }}>Zaten hesabınız var mı?</p>
          <button
            onClick={() => router.push("/auth/login")}
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
            Giriş Yap
          </button>
        </div>
      </div>
    </div>
  );
}
