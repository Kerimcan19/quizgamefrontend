"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../store/useUserStore";
import { socket } from "../services/socket";

type GameInvite = {
  gameId: string;
  creatorName: string;
  creatorId: string;
};

export default function RootLayout({ children }: any) {
  const loadFromStorage = useUserStore((s) => s.loadFromStorage);
  const userId = useUserStore((s) => s.user?.id);
  const router = useRouter();
  const [invite, setInvite] = useState<GameInvite | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!userId) return;

    socket.on("gameInvite", (data: any) => {
      if (data.invitedUserId === userId) {
        setInvite({
          gameId: data.gameId,
          creatorName: data.creatorName,
          creatorId: data.creatorId,
        });
      }
    });

    return () => {
      socket.off("gameInvite");
    };
  }, [userId]);

  const handleAcceptInvite = async () => {
    if (!invite || !userId) return;

    const gameId = invite.gameId;
    setInvite(null); // Bildirimi kapat

    try {
      // Oyuna katıl
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/games/${gameId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      if (res.ok) {
        router.push(`/game/${gameId}`);
      }
    } catch (err) {
      console.error("Failed to join game:", err);
    }
  };

  const handleRejectInvite = () => {
    setInvite(null);
  };

  return (
    <html>
      <body>
        {children}

        {/* Davet Bildirimi */}
        {invite && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
              zIndex: 9999,
              maxWidth: "300px",
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "white", fontSize: "16px" }}>
              🎮 Oyun Daveti
            </h3>
            <p style={{ margin: "0 0 15px 0", color: "white", fontSize: "14px" }}>
              <strong>{invite.creatorName}</strong> seni özel oyuna davet ediyor!
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleAcceptInvite}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "white",
                  color: "#fa709a",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ✓ Kabul
              </button>
              <button
                onClick={handleRejectInvite}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "rgba(255,255,255,0.3)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ✕ Reddet
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      </body>
    </html>
  );
}