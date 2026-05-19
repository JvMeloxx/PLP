'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cancelAttendanceAction } from '@/app/actions/attendance';
import { RefreshCw, Calendar, CreditCard } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { AttendanceHistory } from '@/components/dashboard/AttendanceHistory';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Profile, SessionWithClass, Attendance, FeedbackMessage } from '@/lib/types';

export default function DashboardPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionWithClass[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [historyAttendances, setHistoryAttendances] = useState<(Attendance & { sessions?: SessionWithClass })[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'admin') {
      router.replace('/admin');
      return;
    }

    setUser(profile);
    setLoading(false);
  };

  const loadHistory = useCallback(async (userId: string) => {
    setHistoryLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('attendances')
      .select('*, sessions(*, classes(day_of_week, time, capacity))')
      .eq('student_id', userId)
      .lt('sessions.date', today)
      .order('created_at', { ascending: false })
      .limit(20);

    // Filter out rows where sessions is null (due to inner join behavior or invalid data)
    const validHistory = (data || []).filter(a => a.sessions) as any;
    
    // Sort by session date descending
    validHistory.sort((a: any, b: any) => new Date(b.sessions.date).getTime() - new Date(a.sessions.date).getTime());
    
    setHistoryAttendances(validHistory);
    setHistoryLoading(false);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;

    // 0. Gerar sessões automaticamente para as próximas 4 semanas
    await supabase.rpc('generate_upcoming_sessions', { weeks_ahead: 4 });

    // Load history asynchronously
    loadHistory(user.id);

    // 1. Buscar matrículas do aluno
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('student_id', user.id);

    if (!enrollments || enrollments.length === 0) {
      setSessions([]);
      return;
    }

    const classIds = enrollments.map((e) => e.class_id);

    // 2. Buscar sessões (aulas) das turmas do aluno - apenas da semana atual (até domingo)
    const todayObj = new Date();
    const day = todayObj.getDay(); // 0 é Domingo, 1 é Segunda
    const diff = day === 0 ? 0 : 7 - day; // Dias até o próximo domingo
    
    const endOfWeekObj = new Date(todayObj);
    endOfWeekObj.setDate(todayObj.getDate() + diff);
    
    const today = todayObj.toISOString().split('T')[0];
    const endOfWeek = endOfWeekObj.toISOString().split('T')[0];

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*, classes(day_of_week, time, capacity)')
      .in('class_id', classIds)
      .gte('date', today)
      .lte('date', endOfWeek) // Filtra até o final da semana atual
      .order('date', { ascending: true })
      .limit(20);

    setSessions((sessionsData as unknown as SessionWithClass[]) || []);

    // 3. Buscar presenças do aluno nessas sessões
    if (sessionsData && sessionsData.length > 0) {
      const sessionIds = sessionsData.map((s) => s.id);

      const { data: myAttendances } = await supabase
        .from('attendances')
        .select('*')
        .eq('student_id', user.id)
        .in('session_id', sessionIds);

      setAttendances((myAttendances as Attendance[]) || []);

      // 4. Buscar contagem de confirmados por sessão
      const counts: Record<string, number> = {};
      for (const sid of sessionIds) {
        const { count } = await supabase
          .from('attendances')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sid)
          .eq('status', 'confirmed');
        counts[sid] = count || 0;
      }
      setSessionCounts(counts);
    }
  }, [user, loadHistory]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const confirmAttendance = async (session: SessionWithClass) => {
    if (!user) return;
    setActionLoading(session.id);
    
    try {
      const { data, error } = await supabase.rpc('confirm_attendance', {
        p_session_id: session.id,
        p_student_id: user.id,
      });

      if (error) {
        setFeedback({ type: 'error', message: `Erro: ${error.message}` });
        return;
      }

      if (data && !data.success) {
        setFeedback({ type: 'error', message: data.error || 'Erro desconhecido.' });
        return;
      }

      const statusMsg = data?.status === 'confirmed'
        ? '✅ Presença confirmada!'
        : '⏳ Você entrou na lista de espera.';
      setFeedback({ type: 'success', message: statusMsg });

      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro de conexão. Tente novamente.' });
    } finally {
      setActionLoading(null);
    }
  };

  const cancelAttendance = async (session: SessionWithClass) => {
    if (!user) return;
    setActionLoading(session.id);
    
    try {
      const result = await cancelAttendanceAction(
        session.id, 
        user.id, 
        session.classes?.day_of_week || '', 
        session.classes?.time || ''
      );

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error || 'Erro ao cancelar.' });
        return;
      }

      let msg = 'Presença cancelada.';
      if (result.promoted) {
        msg += ` ${result.promoted} foi promovido(a) da lista de espera.`;
      }
      setFeedback({ type: 'success', message: msg });

      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro de conexão. Tente novamente.' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-arena-black text-white pb-12">
      <Toast feedback={feedback} onDismiss={() => setFeedback(null)} />
      
      <Header 
        onLogout={handleLogout} 
        subtitle="Área do Aluno"
      />

      <main className="max-w-4xl mx-auto p-4 py-8">
        <div className="mb-8 animate-fadeIn flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Olá, {user?.name?.split(' ')[0] || 'Aluno'}! 👋
            </h2>
            <p className="text-gray-400 mt-1">
              Gerencie sua agenda e confirme sua presença nas próximas aulas.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-arena-red"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Meu Perfil
            </button>
            <button
              onClick={() => router.push('/dashboard/renewals')}
              className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
            >
              <CreditCard size={16} className="text-arena-red" />
              Minhas Mensalidades
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Próximas Aulas */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Próximas Aulas</h3>
              <button
                onClick={loadData}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors p-2 rounded-lg hover:bg-gray-800"
              >
                <RefreshCw size={14} />
                Atualizar
              </button>
            </div>

            {sessions.length === 0 ? (
              <EmptyState 
                icon={Calendar} 
                title="Nenhuma aula disponível" 
                description="Você ainda não está matriculado em nenhuma turma ou não há aulas agendadas para os próximos dias." 
              />
            ) : (
              <div className="grid gap-4">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    attendance={attendances.find((a) => a.session_id === session.id)}
                    confirmedCount={sessionCounts[session.id] || 0}
                    isLoading={actionLoading === session.id}
                    onConfirm={() => confirmAttendance(session)}
                    onCancel={() => cancelAttendance(session)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Histórico */}
          <div className="lg:w-80 w-full mt-8 lg:mt-0">
            <h3 className="font-bold text-lg mb-4">Seu Histórico</h3>
            <AttendanceHistory 
              attendances={historyAttendances} 
              loading={historyLoading} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
