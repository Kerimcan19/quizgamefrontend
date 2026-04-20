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

type QuestionResult = {
  correctAnswer: string;
  playerAnswers: {
    userId: string;
    username: string;
    answer: string;
    isCorrect: boolean;
  }[];
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
  const [gameStatus, setGameStatus] = useState<"WAITING" | "READY" | "STARTED">("WAITING");
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null);
  const [liveStandings, setLiveStandings] = useState<Player[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [resultCountdown, setResultCountdown] = useState<number | null>(null);

  const userId = useUserStore((s) => s.user?.id);
  const setUser = useUserStore((s) => s.setUser);

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

  // Result countdown timer
  useEffect(() => {
    if (resultCountdown === null || resultCountdown <= 0) return;

    console.log("⏱️ Result countdown started:", resultCountdown);
    const interval = setInterval(() => {
      setResultCountdown((prev) => {
        if (prev === null || prev <= 1) {
          console.log("⏱️ Result countdown finished, clearing questionResult");
          setQuestionResult(null);
          setSelectedAnswer(null);
          return null;
        }
        console.log("⏱️ Result countdown:", prev - 1);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resultCountdown]);

  useEffect(() => {
    if (!id || !userId) return;

    let gameFinishedHandled = false;

    const handleNewQuestion = (data: Question) => {
      console.log("📝 NEW QUESTION RECEIVED:", data.question);
      console.log("Current questionResult state:", questionResult);
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

    const handleGameFinished = async (data: GameResult) => {
      if (gameFinishedHandled) return;
      gameFinishedHandled = true;

      console.log("Game finished", data);
      setStandings(data.standings);
      setGameFinished(true);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/auth/me`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to update user data:", error);
      }

      setTimeout(() => {
        router.push("/");
      }, 5000);
    };

    const handleCountdown = (count: number) => {
      console.log("Countdown:", count);
      setGameStatus("READY");
      setCountdown(count);
      if (count === 0) {
        setCountdown(null);
        setGameStatus("STARTED");
      }
    };

    const handleGameStatus = (data: any) => {
      console.log("Game Status:", data);
      setGameStatus(data.status);
    };

    const handleConnectError = (error: any) => {
      console.error("Socket connection error:", error);
    };

    const handleQuestionResult = (data: QuestionResult) => {
      console.log("✅ Question Result Event Received:", data);
      console.log("Correct Answer:", data.correctAnswer);
      console.log("Player Answers:", data.playerAnswers);
      setQuestionResult(data);
      setLiveStandings(data.standings);
      setResultCountdown(3);
    };

    const handleLeaderboardUpdate = (data: { standings: Player[] }) => {
      console.log("Leaderboard Update:", data);
      setLiveStandings(data.standings);
    };

    socket.off("newQuestion").off("gameFinished").off("gameCountdown").off("gameStatus")
      .off("connect_error").off("questionResult").off("leaderboardUpdate");

    socket.on("newQuestion", handleNewQuestion);
    socket.on("gameFinished", handleGameFinished);
    socket.on("gameCountdown", handleCountdown);
    socket.on("gameStatus", handleGameStatus);
    socket.on("connect_error", handleConnectError);
    socket.on("questionResult", handleQuestionResult);
    socket.on("leaderboardUpdate", handleLeaderboardUpdate);

    const setupGame = async () => {
      await socketConnected();
      setGameStatus("WAITING");
      socket.emit("joinGameRoom", { gameId: id });
    };

    setupGame();

    return () => {
      socket.off("newQuestion").off("gameFinished").off("gameCountdown").off("gameStatus")
        .off("connect_error").off("questionResult").off("leaderboardUpdate");
    };
  }, [id, userId]);

  const answer = (option: string) => {
    if (!question || answered) return;

    setAnswered(true);
    setSelectedAnswer(option);
    const timeUsed = question.endTime ? Math.max(1, Math.ceil((question.endTime - Date.now()) / 1000)) : 5;

    socket.emit("submitAnswer", {
      gameId: id,
      userId,
      questionId: question.id,
      answer: option,
      time: timeUsed,
    });
  };

  if (gameStatus === "WAITING") {
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
        <div style={{
          fontSize: "48px",
          animation: "pulse 1s ease-in-out infinite",
        }}>
          🎮
        </div>
        <h1 style={{ color: "white", fontSize: "32px", margin: 0 }}>Rakibin Bekleniyor...</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", margin: 0 }}>
          Arkadaşın oyuna katılmak için bekleniyor
        </p>
        <button
          onClick={() => socket.emit("joinGameRoom", { gameId: id })}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            background: "rgba(255,255,255,0.3)",
            color: "white",
            border: "2px solid white",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          🔄 Tekrar Kontrol Et
        </button>
      </div>
    );
  }

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

  if (questionResult) {
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
          maxWidth: "700px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}>
          <h2 style={{
            fontSize: "28px",
            marginBottom: "30px",
            color: "#333",
            textAlign: "center",
          }}>
            ✅ Soru Bitti!
          </h2>

          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "18px", color: "#666", marginBottom: "15px" }}>
              Doğru Cevap:
            </h3>
            <div style={{
              padding: "15px 20px",
              background: "#4caf50",
              color: "white",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              textAlign: "center",
            }}>
              ✓ {questionResult.correctAnswer}
            </div>
          </div>

          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "18px", color: "#666", marginBottom: "15px" }}>
              Oyuncu Cevapları:
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {questionResult.playerAnswers.map((answer) => (
                <div
                  key={answer.userId}
                  style={{
                    padding: "12px 15px",
                    background: answer.isCorrect ? "#e8f5e9" : "#ffebee",
                    border: `2px solid ${answer.isCorrect ? "#4caf50" : "#f44336"}`,
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "bold", color: "#333" }}>
                      {answer.username}:
                    </span>
                    <span style={{ color: "#666", marginLeft: "10px" }}>
                      {answer.answer}
                    </span>
                  </div>
                  <span style={{ fontSize: "20px" }}>
                    {answer.isCorrect ? "✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "18px", color: "#666", marginBottom: "15px" }}>
              Güncel Sıralama:
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {questionResult.standings.slice(0, 3).map((player, idx) => (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: idx === 0 ? "#ffd700" : idx === 1 ? "#c0c0c0" : "#cd7f32",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    color: idx === 0 ? "#333" : "white",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </span>
                    <span style={{ fontWeight: "bold" }}>
                      {player.user.username}
                    </span>
                  </div>
                  <span style={{ fontWeight: "bold" }}>{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{
            textAlign: "center",
            color: "#999",
            marginTop: "20px",
            fontSize: "14px",
          }}>
            Sıradaki soru {resultCountdown} saniyede yükleniyor...
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
      flexDirection: "row",
      gap: "20px",
    }}>
      {/* Ana soru paneli */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          width: "100%",
          maxWidth: "600px",
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
                  background: selectedAnswer === opt && answered ? (questionResult?.correctAnswer === opt ? "#4caf50" : "#f44336") : answered ? "#f0f0f0" : "#fff",
                  color: selectedAnswer === opt && answered ? "white" : "#333",
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

      {/* Canlı sıralama paneli */}
      <div style={{
        width: "280px",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "20px",
        padding: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh",
      }}>
        <h3 style={{
          fontSize: "18px",
          fontWeight: "bold",
          color: "#333",
          marginBottom: "15px",
          textAlign: "center",
        }}>
          📊 Canlı Sıralama
        </h3>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          overflowY: "auto",
          flex: 1,
        }}>
          {liveStandings.length > 0 ? (
            liveStandings.map((player, idx) => (
              <div
                key={player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: idx === 0 ? "#fff3cd" : idx === 1 ? "#f8f9fa" : "#f5f5f5",
                  borderLeft: idx === 0 ? "4px solid #ffd700" : idx === 1 ? "4px solid #c0c0c0" : "4px solid #cd7f32",
                  borderRadius: "8px",
                  animation: "slideIn 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                  <span style={{ fontSize: "16px", fontWeight: "bold", minWidth: "20px" }}>
                    {idx + 1}
                  </span>
                  <span style={{
                    fontSize: "12px",
                    color: "#333",
                    fontWeight: idx < 3 ? "600" : "normal",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {player.user.username}
                  </span>
                </div>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#667eea",
                  minWidth: "40px",
                  textAlign: "right",
                }}>
                  {player.score}
                </span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", color: "#999", fontSize: "14px" }}>
              Yükleniyor...
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}