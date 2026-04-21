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

        {/* Game Invite Notification */}
        {invite && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.95)",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              zIndex: 9999,
              maxWidth: "320px",
              animation: "slideIn 0.3s ease-out",
              backdropFilter: "blur(10px)",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "15px", fontWeight: "700" }}>
              Game Invitation
            </h3>
            <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "14px" }}>
              <strong style={{ color: "#0f172a" }}>{invite.creatorName}</strong> invited you to play!
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleAcceptInvite}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Accept
              </button>
              <button
                onClick={handleRejectInvite}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#f3f4f6",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              >
                Decline
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