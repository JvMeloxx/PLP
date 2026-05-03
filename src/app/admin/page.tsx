"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogOut, Users, Calendar, ClipboardCheck, CreditCard, Plus, Trash2, UserPlus, X } from "lucide-react";

type Tab = "classes" | "students" | "sessions" | "renewals";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("classes");
  const router = useRouter();

  // Data states
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);

  // Form states
  const [showClassForm, setShowClassForm] = useState(false);
  const [newClass, setNewClass] = useState({ day_of_week: "Segunda-feira", time: "18:30", capacity: 24 });
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionClassId, setSessionClassId] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollClassId, setEnrollClassId] = useState("");
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, activeTab]);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", session.user.id).single();

    if (!profile || profile.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    setUser(profile);
    setLoading(false);
  };

  const loadData = async () => {
    // Gerar sessões automaticamente para as próximas 4 semanas
    await supabase.rpc("generate_upcoming_sessions", { weeks_ahead: 4 });

    const { data: c } = await supabase.from("classes").select("*").order("day_of_week");
    setClasses(c || []);

    const { data: s } = await supabase.from("profiles").select("*").eq("role", "student").order("name");
    setStudents(s || []);

    const { data: sess } = await supabase.from("sessions").select("*, classes(day_of_week, time, capacity)").order("date", { ascending: false });
    setSessions(sess || []);

    const { data: r } = await supabase.from("renewals").select("*, profiles(name)").order("created_at", { ascending: false });
    setRenewals(r || []);

    const { data: e } = await supabase.from("enrollments").select("*, profiles(name), classes(day_of_week, time)");
    setEnrollments(e || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // --- ACTIONS ---
  const createClass = async () => {
    await supabase.from("classes").insert([newClass]);
    setShowClassForm(false);
    setNewClass({ day_of_week: "Segunda-feira", time: "18:30", capacity: 24 });
    loadData();
  };

  const deleteClass = async (id: string) => {
    if (!confirm("Deletar esta turma?")) return;
    await supabase.from("classes").delete().eq("id", id);
    loadData();
  };

  const createSession = async () => {
    if (!sessionClassId || !sessionDate) return;
    await supabase.from("sessions").insert([{ class_id: sessionClassId, date: sessionDate }]);
    setShowSessionForm(false);
    setSessionClassId("");
    setSessionDate("");
    loadData();
  };

  const enrollStudent = async () => {
    if (!enrollClassId || !enrollStudentId) return;
    await supabase.from("enrollments").insert([{ student_id: enrollStudentId, class_id: enrollClassId }]);
    setShowEnrollForm(false);
    setEnrollClassId("");
    setEnrollStudentId("");
    loadData();
  };

  const removeEnrollment = async (id: string) => {
    if (!confirm("Remover matrícula?")) return;
    await supabase.from("enrollments").delete().eq("id", id);
    loadData();
  };

  const updateRenewal = async (id: string, status: string) => {
    await supabase.from("renewals").update({ status }).eq("id", id);
    loadData();
  };

  const loadAttendances = async (sessionId: string) => {
    setSelectedSession(sessionId);
    const { data } = await supabase.from("attendances").select("*, profiles(name)").eq("session_id", sessionId);
    setAttendances(data || []);
  };

  const days = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

  if (loading) {
    return <div className="min-h-screen bg-arena-black flex items-center justify-center"><p className="text-gray-400">Carregando...</p></div>;
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "classes", label: "Turmas", icon: Calendar },
    { key: "students", label: "Alunos", icon: Users },
    { key: "sessions", label: "Aulas", icon: ClipboardCheck },
    { key: "renewals", label: "Mensalidades", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-arena-black text-white">
      {/* Header */}
      <header className="bg-arena-gray border-b border-gray-800 p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-arena-red">Arena PLP</h1>
            <p className="text-xs text-gray-400">Painel Administrativo</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-arena-gray/50 border-b border-gray-800">
        <div className="max-w-5xl mx-auto flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-arena-red text-arena-red"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-4 py-8">

        {/* ==================== TURMAS ==================== */}
        {activeTab === "classes" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Turmas</h2>
              <button onClick={() => setShowClassForm(true)} className="bg-arena-red hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                <Plus size={16} /> Nova Turma
              </button>
            </div>

            {showClassForm && (
              <div className="bg-arena-gray rounded-xl p-5 border border-gray-800 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Criar Turma</h3>
                  <button onClick={() => setShowClassForm(false)}><X size={18} className="text-gray-400" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <select value={newClass.day_of_week} onChange={(e) => setNewClass({ ...newClass, day_of_week: e.target.value })} className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                    {days.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="time" value={newClass.time} onChange={(e) => setNewClass({ ...newClass, time: e.target.value })} className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                  <input type="number" value={newClass.capacity} onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) })} placeholder="Vagas" className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <button onClick={createClass} className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-6 rounded-lg">Salvar</button>
              </div>
            )}

            <div className="grid gap-3">
              {classes.length === 0 && <p className="text-gray-500 text-sm">Nenhuma turma cadastrada.</p>}
              {classes.map((c) => (
                <div key={c.id} className="bg-arena-gray rounded-xl p-4 border border-gray-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{c.day_of_week} - {c.time}</h4>
                    <p className="text-sm text-gray-400">{c.capacity} vagas</p>
                  </div>
                  <button onClick={() => deleteClass(c.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== ALUNOS ==================== */}
        {activeTab === "students" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Alunos ({students.length})</h2>
              <button onClick={() => setShowEnrollForm(true)} className="bg-arena-red hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                <UserPlus size={16} /> Matricular
              </button>
            </div>

            {showEnrollForm && (
              <div className="bg-arena-gray rounded-xl p-5 border border-gray-800 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Matricular Aluno em Turma</h3>
                  <button onClick={() => setShowEnrollForm(false)}><X size={18} className="text-gray-400" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select value={enrollStudentId} onChange={(e) => setEnrollStudentId(e.target.value)} className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">Selecione o aluno</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={enrollClassId} onChange={(e) => setEnrollClassId(e.target.value)} className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">Selecione a turma</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.day_of_week} - {c.time}</option>)}
                  </select>
                </div>
                <button onClick={enrollStudent} className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-6 rounded-lg">Matricular</button>
              </div>
            )}

            {/* Student list */}
            <div className="grid gap-3 mb-8">
              {students.map((s) => (
                <div key={s.id} className="bg-arena-gray rounded-xl p-4 border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{s.name}</h4>
                      <p className="text-sm text-gray-400">{s.phone || "Sem telefone"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enrollments */}
            <h3 className="text-lg font-bold mb-4">Matrículas Ativas</h3>
            <div className="grid gap-3">
              {enrollments.length === 0 && <p className="text-gray-500 text-sm">Nenhuma matrícula.</p>}
              {enrollments.map((e) => (
                <div key={e.id} className="bg-arena-gray rounded-xl p-4 border border-gray-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{e.profiles?.name}</h4>
                    <p className="text-sm text-gray-400">{e.classes?.day_of_week} - {e.classes?.time}</p>
                  </div>
                  <button onClick={() => removeEnrollment(e.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== AULAS/SESSÕES ==================== */}
        {activeTab === "sessions" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Aulas</h2>
              <button onClick={() => setShowSessionForm(true)} className="bg-arena-red hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                <Plus size={16} /> Nova Aula
              </button>
            </div>

            {showSessionForm && (
              <div className="bg-arena-gray rounded-xl p-5 border border-gray-800 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Criar Aula</h3>
                  <button onClick={() => setShowSessionForm(false)}><X size={18} className="text-gray-400" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select value={sessionClassId} onChange={(e) => setSessionClassId(e.target.value)} className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">Selecione a turma</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.day_of_week} - {c.time}</option>)}
                  </select>
                  <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <button onClick={createSession} className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-6 rounded-lg">Criar Aula</button>
              </div>
            )}

            <div className="grid gap-3">
              {sessions.length === 0 && <p className="text-gray-500 text-sm">Nenhuma aula criada.</p>}
              {sessions.map((s) => {
                const confirmed = selectedSession === s.id ? attendances.filter((a) => a.status === "confirmed") : [];
                const waitlisted = selectedSession === s.id ? attendances.filter((a) => a.status === "waitlist") : [];
                const cancelled = selectedSession === s.id ? attendances.filter((a) => a.status === "cancelled") : [];

                return (
                <div key={s.id} className="bg-arena-gray rounded-xl p-4 border border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{s.classes?.day_of_week} - {s.classes?.time}</h4>
                      <p className="text-sm text-gray-400">{new Date(s.date + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                    </div>
                    <button onClick={() => loadAttendances(s.id)} className={`text-white text-sm py-2 px-4 rounded-lg ${selectedSession === s.id ? "bg-arena-red hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}>
                      {selectedSession === s.id ? "Ocultar" : "Ver Presenças"}
                    </button>
                  </div>

                  {selectedSession === s.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                      {/* Confirmados */}
                      <div>
                        <h5 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                          ✅ Confirmados ({confirmed.length}/{s.classes?.capacity || "?"})
                        </h5>
                        {confirmed.length === 0 && <p className="text-gray-500 text-xs ml-5">Nenhum confirmado.</p>}
                        {confirmed.map((a, i) => (
                          <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0 ml-5">
                            <span className="text-sm">{i + 1}. {a.profiles?.name}</span>
                            <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-400">Confirmado</span>
                          </div>
                        ))}
                      </div>

                      {/* Lista de Espera */}
                      {waitlisted.length > 0 && (
                        <div>
                          <h5 className="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
                            ⏳ Lista de Espera ({waitlisted.length})
                          </h5>
                          {waitlisted.map((a, i) => (
                            <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0 ml-5">
                              <span className="text-sm">{i + 1}. {a.profiles?.name}</span>
                              <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">Espera</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cancelados */}
                      {cancelled.length > 0 && (
                        <div>
                          <h5 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                            ❌ Cancelaram ({cancelled.length})
                          </h5>
                          {cancelled.map((a) => (
                            <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0 ml-5">
                              <span className="text-sm text-gray-500">{a.profiles?.name}</span>
                              <span className="text-xs font-bold px-2 py-1 rounded bg-red-500/20 text-red-400">Cancelou</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {attendances.length === 0 && <p className="text-gray-500 text-sm text-center py-2">Nenhuma presença registrada nesta aula.</p>}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== MENSALIDADES ==================== */}
        {activeTab === "renewals" && (
          <div>
            <h2 className="text-xl font-bold mb-6">Mensalidades</h2>
            <div className="grid gap-3">
              {renewals.length === 0 && <p className="text-gray-500 text-sm">Nenhuma mensalidade enviada.</p>}
              {renewals.map((r) => (
                <div key={r.id} className="bg-arena-gray rounded-xl p-4 border border-gray-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="font-bold">{r.profiles?.name}</h4>
                      <p className="text-sm text-gray-400">
                        Mês: {new Date(r.month + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                      </p>
                      <span className={`text-xs font-bold px-2 py-1 rounded inline-block mt-1 ${
                        r.status === "approved" ? "bg-green-500/20 text-green-400" :
                        r.status === "rejected" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {r.status === "approved" ? "Aprovado" : r.status === "rejected" ? "Rejeitado" : "Pendente"}
                      </span>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => updateRenewal(r.id, "approved")} className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg">Aprovar</button>
                        <button onClick={() => updateRenewal(r.id, "rejected")} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-lg">Rejeitar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
