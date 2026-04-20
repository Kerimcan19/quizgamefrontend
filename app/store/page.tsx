"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../services/api";
import { useUserStore } from "../../store/useUserStore";

type Item = {
  id: string;
  name: string;
  price: number;
};

export default function Store() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const user = useUserStore((s) => s.user);
  const userId = useUserStore((s) => s.user?.id);
  const router = useRouter();

  useEffect(() => {
    api.get("/store")
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }, []);

  const buy = async (id: string) => {
    if (!userId) {
      alert("Önce giriş yap");
      return;
    }

    setPurchasing(id);

    try {
      const res = await api.post("/store/buy", {
        userId,
        itemId: id,
      });

      // User bilgilerini güncelle
      const { setUser } = useUserStore.getState();
      if (res.data.user) {
        setUser(res.data.user);
      }

      alert("Satın alındı ✅");
    } catch (err: any) {
      alert(err.response?.data?.message || "Hata oluştu");
      setPurchasing(null);
    }
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
          <h1 style={{ fontSize: "48px", textAlign: "center", margin: "0 0 10px 0", color: "#333" }}>
            🛍️ Mağaza
          </h1>

          <div style={{
            textAlign: "center",
            background: "#f5f5f5",
            padding: "15px",
            borderRadius: "12px",
            marginBottom: "30px",
          }}>
            <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>Mevcut Krediniz</p>
            <p style={{ margin: "5px 0 0 0", fontSize: "28px", fontWeight: "bold", color: "#667eea" }}>
              💰 {user?.credits || 0}
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#666", fontSize: "18px" }}>
              Yükleniyor...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", color: "#666", fontSize: "16px" }}>
              Mağazada ürün yok
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "2px solid #ddd",
                    borderRadius: "12px",
                    padding: "16px",
                    background: "#f9f9f9",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}>
                    <h3 style={{ margin: 0, color: "#333", fontSize: "16px" }}>
                      ✨ {item.name}
                    </h3>
                    <span style={{
                      background: "#667eea",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}>
                      💰 {item.price}
                    </span>
                  </div>

                  <button
                    onClick={() => buy(item.id)}
                    disabled={purchasing === item.id || !user || user.credits < item.price}
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      border: "none",
                      borderRadius: "8px",
                      background: (purchasing === item.id || !user || user.credits < item.price)
                        ? "#ccc"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      cursor: (purchasing === item.id || !user || user.credits < item.price)
                        ? "not-allowed"
                        : "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (purchasing !== item.id && user && user.credits >= item.price) {
                        e.currentTarget.style.transform = "scale(1.02)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {purchasing === item.id ? "Satın Alınıyor..." : "Satın Al"}
                  </button>

                  {user && user.credits < item.price && (
                    <p style={{
                      margin: "8px 0 0 0",
                      color: "#ff4444",
                      fontSize: "12px",
                      textAlign: "center",
                    }}>
                      Yeterli krediniz yok
                    </p>
                  )}
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