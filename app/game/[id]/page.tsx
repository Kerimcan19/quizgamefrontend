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
    const timeUsed = question.startTime && question.duration
      ? Math.max(1, question.duration - Math.max(0, question.endTime - Date.now()))
      : question.duration || 10000;

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
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        flexDirection: "column",
        gap: "20px",
      }}>
        <div style={{
          width: "100px",
          height: "100px",
          border: "4px solid rgba(59, 130, 246, 0.2)",
          borderTop: "4px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}/>
        <h1 style={{ color: "white", fontSize: "32px", margin: 0, fontWeight: "700" }}>🔍 Oyuncular Aranıyor</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: 0 }}>
          Lütfen bekleyin, rakip oyuncu aranıyor...
        </p>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#3b82f6",
            animation: "bounce 1.4s infinite",
          }}/>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#3b82f6",
            animation: "bounce 1.4s infinite 0.2s",
          }}/>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#3b82f6",
            animation: "bounce 1.4s infinite 0.4s",
          }}/>
        </div>
        <button
          onClick={() => socket.emit("joinGameRoom", { gameId: id })}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          }}
        >
          Yenile
        </button>
        <style>{`
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
              opacity: 1;
            }
            50% {
              transform: translateY(-15px);
              opacity: 0.5;
            }
          }
        `}</style>
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
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        flexDirection: "column",
        gap: "20px",
      }}>
        <h1 style={{ color: "white", fontSize: "32px", margin: 0, fontWeight: "700" }}>Game Starting</h1>
        <div style={{
          fontSize: "140px",
          fontWeight: "900",
          color: "white",
          textShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
          animation: "pulse 1s ease-in-out infinite",
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
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "20px",
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
          maxWidth: "600px",
          width: "100%",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <h1 style={{ fontSize: "42px", margin: "0 0 28px 0", color: "#0f172a", fontWeight: "700" }}>Game Finished!</h1>

          <div style={{ marginBottom: "32px" }}>
            {standings.slice(0, 3).map((player, idx) => (
              <div key={player.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: idx === 0 ? "#fef3c7" : idx === 1 ? "#f3f4f6" : "#fed7aa",
                padding: "16px 20px",
                marginBottom: "12px",
                borderRadius: "12px",
                color: "#0f172a",
                border: idx === 0 ? "2px solid #fcd34d" : idx === 1 ? "2px solid #d1d5db" : "2px solid #fdbf24",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <span style={{ fontSize: "28px" }}>
                    {idx + 1}
                  </span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: "700", fontSize: "16px" }}>
                      {player.user.username}
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>
                      Score: {player.score}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: "700", fontSize: "18px", color: "#0f172a" }}>
                  +{creditRewards[idx]}
                </div>
              </div>
            ))}
          </div>

          <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
            Redirecting to home...
          </p>
        </div>
      </div>
    );
  }

  if (questionResult) {
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
          maxWidth: "700px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <h2 style={{
            fontSize: "28px",
            marginBottom: "28px",
            color: "#0f172a",
            textAlign: "center",
            fontWeight: "700",
          }}>
            Question Result
          </h2>

          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "14px", color: "#64748b", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
              Correct Answer
            </h3>
            <div style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              color: "white",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              textAlign: "center",
            }}>
              {questionResult.correctAnswer}
            </div>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "14px", color: "#64748b", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
              Player Answers
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {questionResult.playerAnswers.map((answer) => (
                <div
                  key={answer.userId}
                  style={{
                    padding: "12px 16px",
                    background: answer.isCorrect ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: `2px solid ${answer.isCorrect ? "#22c55e" : "#ef4444"}`,
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>
                      {answer.username}
                    </span>
                    <span style={{ color: "#64748b", marginLeft: "10px" }}>
                      {answer.answer}
                    </span>
                  </div>
                  <span style={{ fontSize: "20px", color: answer.isCorrect ? "#22c55e" : "#ef4444" }}>
                    {answer.isCorrect ? "✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "14px", color: "#64748b", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
              Current Standings
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {questionResult.standings.slice(0, 3).map((player, idx) => (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: idx === 0 ? "#fef3c7" : idx === 1 ? "#f3f4f6" : "#fed7aa",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    color: "#0f172a",
                    border: idx === 0 ? "2px solid #fcd34d" : idx === 1 ? "2px solid #d1d5db" : "2px solid #fdbf24",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "18px", fontWeight: "700" }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: "600" }}>
                      {player.user.username}
                    </span>
                  </div>
                  <span style={{ fontWeight: "700" }}>{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{
            textAlign: "center",
            color: "#64748b",
            marginTop: "24px",
            fontSize: "14px",
          }}>
            Next question in {resultCountdown}s...
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
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    }}>
      <div style={{
        width: "100px",
        height: "100px",
        border: "4px solid rgba(59, 130, 246, 0.2)",
        borderTop: "4px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}/>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      padding: "20px",
      display: "flex",
      flexDirection: "row",
      gap: "20px",
    }}>
      {/* Main Question Panel */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "40px",
          width: "100%",
          maxWidth: "600px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <h2 style={{
            fontSize: "24px",
            marginBottom: "32px",
            color: "#0f172a",
            textAlign: "center",
            fontWeight: "700",
          }}>
            {question.question}
          </h2>

          <div style={{
            fontSize: "56px",
            fontWeight: "900",
            color: timeLeft && timeLeft <= 5 ? "#ef4444" : "#3b82f6",
            textAlign: "center",
            marginBottom: "40px",
            animation: timeLeft && timeLeft <= 5 ? "pulse 1s ease-in-out infinite" : "none",
          }}>
            {timeLeft ?? "..."}s
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
                  fontWeight: "600",
                  cursor: answered ? "not-allowed" : "pointer",
                  opacity: answered ? 0.7 : 1,
                  border: "2px solid",
                  borderColor: selectedAnswer === opt && answered ? (questionResult?.correctAnswer === opt ? "#22c55e" : "#ef4444") : "#e2e8f0",
                  background: selectedAnswer === opt && answered ? (questionResult?.correctAnswer === opt ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)") : answered ? "#f3f4f6" : "white",
                  color: selectedAnswer === opt && answered ? "white" : "#0f172a",
                  borderRadius: "12px",
                  transition: "all 0.2s ease",
                  transform: answered ? "scale(0.98)" : "scale(1)",
                  pointerEvents: answered ? "none" : "auto",
                  boxShadow: !answered ? "0 2px 8px rgba(59, 130, 246, 0.1)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!answered) {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.background = "#f9fafb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!answered) {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "white";
                  }
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Standings Panel */}
      <div style={{
        width: "280px",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <h3 style={{
          fontSize: "15px",
          fontWeight: "700",
          color: "#0f172a",
          marginBottom: "16px",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Live Standings
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
                  background: idx === 0 ? "#fef3c7" : idx === 1 ? "#f3f4f6" : "#f9fafb",
                  border: idx === 0 ? "2px solid #fcd34d" : idx === 1 ? "2px solid #d1d5db" : "1px solid #e2e8f0",
                  borderRadius: "10px",
                  animation: "slideIn 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", minWidth: "20px", color: "#0f172a" }}>
                    {idx + 1}
                  </span>
                  <span style={{
                    fontSize: "13px",
                    color: "#0f172a",
                    fontWeight: idx < 3 ? "700" : "600",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {player.user.username}
                  </span>
                </div>
                <span style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#3b82f6",
                  minWidth: "40px",
                  textAlign: "right",
                }}>
                  {player.score}
                </span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: "14px" }}>
              Loading...
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
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}