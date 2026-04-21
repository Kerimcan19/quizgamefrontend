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
      alert("Please sign in first");
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

      alert("Purchase successful ✅");
    } catch (err: any) {
      alert(err.response?.data?.message || "Hata oluştu");
      setPurchasing(null);
    }
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
          <h1 style={{ fontSize: "42px", textAlign: "center", margin: "0 0 8px 0", color: "#0f172a", fontWeight: "700" }}>
            Store
          </h1>

          <div style={{
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.05), rgba(51, 65, 85, 0.05))",
            padding: "16px 20px",
            borderRadius: "12px",
            marginBottom: "32px",
            border: "1px solid rgba(51, 65, 85, 0.1)",
          }}>
            <p style={{ margin: "0", color: "#64748b", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Available Credits</p>
            <p style={{ margin: "8px 0 0 0", fontSize: "28px", fontWeight: "700", color: "#0f172a" }}>
              {user?.credits || 0}
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: "15px" }}>
              Loading items...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: "15px" }}>
              No items available
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px",
                    background: "white",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}>
                    <h3 style={{ margin: 0, color: "#0f172a", fontSize: "15px", fontWeight: "600" }}>
                      {item.name}
                    </h3>
                    <span style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}>
                      {item.price}
                    </span>
                  </div>

                  <button
                    onClick={() => buy(item.id)}
                    disabled={purchasing === item.id || !user || user.credits < item.price}
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "14px",
                      fontWeight: "600",
                      border: "none",
                      borderRadius: "10px",
                      background: (purchasing === item.id || !user || user.credits < item.price)
                        ? "#cbd5e1"
                        : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      color: "white",
                      cursor: (purchasing === item.id || !user || user.credits < item.price)
                        ? "not-allowed"
                        : "pointer",
                      transition: "all 0.3s",
                      boxShadow: (purchasing !== item.id && user && user.credits >= item.price) ? "0 4px 15px rgba(59, 130, 246, 0.3)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (purchasing !== item.id && user && user.credits >= item.price) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      if (purchasing !== item.id && user && user.credits >= item.price) {
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.3)";
                      }
                    }}
                  >
                    {purchasing === item.id ? "Purchasing..." : "Buy"}
                  </button>

                  {user && user.credits < item.price && (
                    <p style={{
                      margin: "8px 0 0 0",
                      color: "#ef4444",
                      fontSize: "12px",
                      textAlign: "center",
                    }}>
                      Insufficient credits
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