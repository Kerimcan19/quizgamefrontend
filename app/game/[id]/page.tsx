"use client";
import { useEffect, useState } from "react";
import { socket, socketConnected } from "../../../services/socket";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import axios from "axios";

type Question = {
  id: string;
  question: string;
  options: string[];
  startTime?: number;
  endTime?: number;
  duration?: number;
};

type Player = {
  id: string;
  userId: string;
  gameId: string;
  score: number;
  user: {
    id: string;
    username: string;
    email: string;
    credits: number;
  };
};

type GameResult = {
  standings: Player[];
};

export default function GamePage() {
  const { id } = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [standings, setStandings] = useState<Player[] | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const userId = useUserStore((s) => s.user?.id);

  // Timer interval
  useEffect(() => {
    if (!question?.endTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((question.endTime! - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [question?.endTime]);

  useEffect(() => {
    if (!id || !userId) return;

    const handleNewQuestion = (data: Question) => {
      console.log("QUESTION RECEIVED:", data);
      // Options'ın array olduğundan emin ol
      let options = data.options;
      if (typeof options === "string") {
        try {
          options = JSON.parse(options);
        } catch (e) {
          options = [];
        }
      }
      setQuestion({ ...data, options: Array.isArray(options) ? options : [] });
      setAnswered(false);
      setTimeLeft(null);
    };

    const handleGameFinished = (data: GameResult) => {
      console.log("Game finished", data);
      setStandings(data.standings);
      setGameFinished(true);
      // 5 saniye sonra lobiye yönlendir
      setTimeout(() => {
        router.push("/lobby");
      }, 5000);
    };

    const handleCountdown = (count: number) => {
      setCountdown(count);
      if (count === 0) {
        setCountdown(null);
      }
    };

    const handleConnectError = (error: any) => {
      console.error("Socket connection error:", error);
    };

    socket.on("newQuestion", handleNewQuestion);
    socket.on("gameFinished", handleGameFinished);
    socket.on("gameCountdown", handleCountdown);
    socket.on("connect_error", handleConnectError);

    const setupGame = async () => {
      await socketConnected();
      console.log("Socket connected:", socket.connected, "ID:", socket.id, "GameID:", id);
      socket.emit("joinGameRoom", { gameId: id });
      console.log("JOINED ROOM:", id);
    };

    setupGame();

    return () => {
      socket.off("newQuestion", handleNewQuestion);
      socket.off("gameFinished", handleGameFinished);
      socket.off("gameCountdown", handleCountdown);
      socket.off("connect_error", handleConnectError);
    };
  }, [id, userId]);

  const answer = (option: string) => {
    if (!question || answered) return;

    setAnswered(true);
    const timeUsed = question.endTime ? Math.max(1, Math.ceil((question.endTime - Date.now()) / 1000)) : 5;

    socket.emit("submitAnswer", {
      gameId: id,
      userId,
      questionId: question.id,
      answer: option,
      time: timeUsed,
    });
  };

  if (countdown !== null) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        flexDirection: "column",
        gap: "20px",
      }}>
        <h1 style={{ color: "white", fontSize: "48px", margin: 0 }}>Oyun Başlıyor!</h1>
        <div style={{
          fontSize: "120px",
          fontWeight: "bold",
          color: "white",
          textShadow: "0 0 30px rgba(0,0,0,0.3)",
        }}>
          {countdown}
        </div>
      </div>
    );
  }

  if (gameFinished && standings) {
    const creditRewards = [30, 20, 10];
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxWidth: "600px",
          width: "100%",
        }}>
          <h1 style={{ fontSize: "48px", margin: "0 0 30px 0", color: "#333" }}>🎉 Oyun Bitti! 🎉</h1>

          <div style={{ marginBottom: "30px" }}>
            {standings.slice(0, 3).map((player, idx) => (
              <div key={player.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: idx === 0 ? "#ffd700" : idx === 1 ? "#c0c0c0" : "#cd7f32",
                padding: "15px 20px",
                marginBottom: "10px",
                borderRadius: "10px",
                color: idx === 0 ? "#333" : "white",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <span style={{ fontSize: "28px" }}>
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                      {player.user.username}
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.8 }}>
                      Skor: {player.score}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: "bold", fontSize: "20px" }}>
                  +{creditRewards[idx]} 💰
                </div>
              </div>
            ))}
          </div>

          <p style={{ color: "#666", marginBottom: "30px" }}>
            Lobiye yönlendiriliyorsun...
          </p>
        </div>
      </div>
    );
  }

  if (!question) return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    }}>
      <div style={{ color: "white", fontSize: "24px" }}>Yükleniyor...</div>
    </div>
  );

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
        maxWidth: "600px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <h2 style={{
          fontSize: "24px",
          marginBottom: "30px",
          color: "#333",
          textAlign: "center",
        }}>
          {question.question}
        </h2>

        <div style={{
          fontSize: "48px",
          fontWeight: "bold",
          color: timeLeft && timeLeft <= 5 ? "#ff4444" : "#667eea",
          textAlign: "center",
          marginBottom: "40px",
        }}>
          ⏱️ {timeLeft ?? "..."}s
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => answer(opt)}
              disabled={answered}
              style={{
                padding: "18px",
                fontSize: "16px",
                fontWeight: "500",
                cursor: answered ? "not-allowed" : "pointer",
                opacity: answered ? 0.6 : 1,
                border: "2px solid #667eea",
                background: answered ? "#f0f0f0" : "#fff",
                color: "#333",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                transform: answered ? "scale(0.98)" : "scale(1)",
                pointerEvents: answered ? "none" : "auto",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}