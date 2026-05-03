"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogOut, CheckCircle, XCircle, Clock, Users, RefreshCw } from "lucide-react";

interface SessionWithClass {
  id: string;
  date: string;
  class_id: string;
  classes: {
    day_of_week: string;
    time: string;
    capacity: number;
  };
}

interface AttendanceInfo {
  id: string;
  status: "confirmed" | "waitlist" | "cancelled";
  session_id: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionWithClass[]>([]);
  const [attendances, setAttendances] = useState<AttendanceInfo[]>([]);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile?.role === "admin") {
      router.replace("/admin");
      return;
    }

    setUser(profile);
    setLoading(false);
  };

  const loadData = useCallback(async () => {
    if (!user) return;

    // 1. Buscar matrículas do aluno
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("class_id")
      .eq("student_id", user.id);

    if (!enrollments || enrollments.length === 0) {
      setSessions([]);
      return;
    }

    const classIds = enrollments.map((e) => e.class_id);

    // 2. Buscar sessões (aulas) das turmas do aluno - apenas de hoje em diante
    const today = new Date().toISOString().split("T")[0];
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("*, classes(day_of_week, time, capacity)")
      .in("class_id", classIds)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(10);

    setSessions(sessionsData || []);

    // 3. Buscar presenças do aluno nessas sessões
    if (sessionsData && sessionsData.length > 0) {
      const sessionIds = sessionsData.map((s) => s.id);

      const { data: myAttendances } = await supabase
        .from("attendances")
        .select("id, status, session_id")
        .eq("student_id", user.id)
        .in("session_id", sessionIds);

      setAttendances(myAttendances || []);

      // 4. Buscar contagem de confirmados por sessão
      const counts: Record<string, number> = {};
      for (const sid of sessionIds) {
        const { count } = await supabase
          .from("attendances")
          .select("*", { count: "exact", head: true })
          .eq("session_id", sid)
          .eq("status", "confirmed");
        counts[sid] = count || 0;
      }
      setSessionCounts(counts);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // --- CONFIRMAR PRESENÇA (via função do banco) ---
  const confirmAttendance = async (session: SessionWithClass) => {
    if (!user) return;
    setActionLoading(session.id);
    setFeedback(null);

    try {
      const { data, error } = await supabase.rpc("confirm_attendance", {
        p_session_id: session.id,
        p_student_id: user.id,
      });

      if (error) {
        setFeedback({ type: "error", message: `Erro: ${error.message}` });
        return;
      }

      if (data && !data.success) {
        setFeedback({ type: "error", message: data.error || "Erro desconhecido." });
        return;
      }

      const statusMsg = data?.status === "confirmed"
        ? "✅ Presença confirmada!"
        : "⏳ Você entrou na lista de espera.";
      setFeedback({ type: "success", message: statusMsg });

      await loadData();
    } catch (err) {
      setFeedback({ type: "error", message: "Erro de conexão. Tente novamente." });
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // --- CANCELAR PRESENÇA (via função do banco) ---
  const cancelAttendance = async (session: SessionWithClass) => {
    if (!user) return;
    setActionLoading(session.id);
    setFeedback(null);

    try {
      const { data, error } = await supabase.rpc("cancel_attendance", {
        p_session_id: session.id,
        p_student_id: user.id,
      });

      if (error) {
        setFeedback({ type: "error", message: `Erro: ${error.message}` });
        return;
      }

      if (data && !data.success) {
        setFeedback({ type: "error", message: data.error || "Erro desconhecido." });
        return;
      }

      let msg = "Presença cancelada.";
      if (data?.promoted) {
        msg += ` ${data.promoted} foi promovido(a) da lista de espera.`;
      }
      setFeedback({ type: "success", message: msg });

      await loadData();
    } catch (err) {
      setFeedback({ type: "error", message: "Erro de conexão. Tente novamente." });
    } finally {
      setActionLoading(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // --- HELPERS ---
  const getAttendance = (sessionId: string) => {
    return attendances.find((a) => a.session_id === sessionId);
  };

  const getDateLabel = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDate = new Date(dateStr + "T12:00:00");
    sessionDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return { text: "HOJE", color: "bg-red-500/20 text-red-400" };
    if (diffDays === 1) return { text: "AMANHÃ", color: "bg-orange-500/20 text-orange-400" };
    if (diffDays <= 7) return { text: "ESTA SEMANA", color: "bg-blue-500/20 text-blue-400" };
    return { text: "EM BREVE", color: "bg-gray-700 text-gray-300" };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-arena-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="text-arena-red animate-spin" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arena-black text-white">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-pulse ${
          feedback.type === "success"
            ? "bg-green-600/90 text-white"
            : "bg-red-600/90 text-white"
        }`}>
          {feedback.message}
        </div>
      )}
      {/* Header */}
      <header className="bg-arena-gray border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-arena-red">Arena PLP</h1>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">
            Olá, {user?.name?.split(" ")[0] || "Aluno"}! 👋
          </h2>
          <p className="text-gray-400">
            Confirme sua presença nas próximas aulas.
          </p>
        </div>

        {/* Próximas Aulas */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Próximas Aulas</h3>
            <button
              onClick={loadData}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-arena-gray rounded-xl p-8 border border-gray-800 text-center">
              <Users size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">
                Nenhuma aula disponível
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Você ainda não está matriculado em nenhuma turma, ou não há aulas agendadas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => {
                const attendance = getAttendance(session.id);
                const dateLabel = getDateLabel(session.date);
                const confirmedCount = sessionCounts[session.id] || 0;
                const capacity = session.classes.capacity;
                const spotsLeft = Math.max(0, capacity - confirmedCount);
                const isLoading = actionLoading === session.id;
                const isActive =
                  !attendance ||
                  attendance.status === "cancelled";
                const isConfirmed = attendance?.status === "confirmed";
                const isWaitlisted = attendance?.status === "waitlist";

                return (
                  <div
                    key={session.id}
                    className={`bg-arena-gray rounded-xl p-5 border transition-all ${
                      isConfirmed
                        ? "border-green-500/30"
                        : isWaitlisted
                        ? "border-yellow-500/30"
                        : "border-gray-800"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        {/* Badge de data */}
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block ${dateLabel.color}`}
                        >
                          {dateLabel.text}
                        </span>

                        <h4 className="font-bold text-lg">
                          {session.classes.day_of_week} - {session.classes.time}
                        </h4>

                        <p className="text-sm text-gray-400">
                          {formatDate(session.date)}
                        </p>

                        {/* Contagem de vagas */}
                        <div className="flex items-center gap-2 mt-2">
                          <Users size={14} className="text-gray-500" />
                          <span
                            className={`text-sm font-medium ${
                              spotsLeft === 0
                                ? "text-red-400"
                                : spotsLeft <= 3
                                ? "text-yellow-400"
                                : "text-green-400"
                            }`}
                          >
                            {spotsLeft > 0
                              ? `${spotsLeft} vaga${spotsLeft !== 1 ? "s" : ""} restante${spotsLeft !== 1 ? "s" : ""}`
                              : "Lotado — lista de espera"}
                          </span>
                          <span className="text-gray-600 text-xs">
                            ({confirmedCount}/{capacity})
                          </span>
                        </div>

                        {/* Status badge */}
                        {isConfirmed && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <CheckCircle size={14} className="text-green-400" />
                            <span className="text-sm font-bold text-green-400">
                              Presença confirmada
                            </span>
                          </div>
                        )}
                        {isWaitlisted && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Clock size={14} className="text-yellow-400" />
                            <span className="text-sm font-bold text-yellow-400">
                              Na lista de espera
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botões de ação */}
                      <div className="flex gap-2 w-full sm:w-auto">
                        {isActive && (
                          <button
                            onClick={() => confirmAttendance(session)}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <RefreshCw
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            {spotsLeft > 0 ? "Confirmar" : "Entrar na Espera"}
                          </button>
                        )}

                        {(isConfirmed || isWaitlisted) && (
                          <button
                            onClick={() => cancelAttendance(session)}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none bg-gray-700 hover:bg-red-600/80 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <RefreshCw
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <XCircle size={16} />
                            )}
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
