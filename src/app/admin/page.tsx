'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Calendar, Users, ClipboardCheck, CreditCard, Settings } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { TabNav } from '@/components/layout/TabNav';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Toast } from '@/components/ui/Toast';
import { StatsCards } from '@/components/admin/StatsCards';
import { ClassList } from '@/components/admin/ClassList';
import { StudentList } from '@/components/admin/StudentList';
import { SessionList } from '@/components/admin/SessionList';
import { RenewalList } from '@/components/admin/RenewalList';
import { SettingsPanel } from '@/components/admin/SettingsPanel';
import type { Profile, Class, SessionWithClass, Enrollment, Renewal, Attendance, FeedbackMessage } from '@/lib/types';

type TabKey = 'classes' | 'students' | 'sessions' | 'renewals' | 'settings';

export default function AdminPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('classes');
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const router = useRouter();

  // Data states
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [sessions, setSessions] = useState<SessionWithClass[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    sessionsThisWeek: 0,
    attendanceRate: 0,
    pendingRenewals: 0,
  });

  const checkAdmin = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', session.user.id).single();

    if (!profile || profile.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    setUser(profile as Profile);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  const loadData = useCallback(async () => {
    // Generate upcoming sessions automatically for the next 4 weeks
    await supabase.rpc('generate_upcoming_sessions', { weeks_ahead: 4 });

    const [classesRes, studentsRes, sessionsRes, renewalsRes, enrollmentsRes] = await Promise.all([
      supabase.from('classes').select('*').order('day_of_week'),
      supabase.from('profiles').select('*').eq('role', 'student').order('name'),
      supabase.from('sessions').select('*, classes(day_of_week, time, capacity)').order('date', { ascending: false }),
      supabase.from('renewals').select('*, profiles(name)').order('created_at', { ascending: false }),
      supabase.from('enrollments').select('*, profiles(name), classes(day_of_week, time)')
    ]);

    setClasses(classesRes.data as Class[] || []);
    setStudents(studentsRes.data as Profile[] || []);
    setSessions(sessionsRes.data as unknown as SessionWithClass[] || []);
    setRenewals(renewalsRes.data as Renewal[] || []);
    setEnrollments(enrollmentsRes.data as Enrollment[] || []);

    // Calculate stats
    const totalSt = studentsRes.data?.length || 0;
    const pendRen = renewalsRes.data?.filter(r => r.status === 'pending').length || 0;
    
    // Sessions this week
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    const sessThisWeek = sessionsRes.data?.filter(s => s.date >= todayStr && s.date <= nextWeekStr).length || 0;

    // We can't fetch ALL attendances easily, so for MVP we'll just set a mock rate or fetch count
    // Real implementation would use an RPC or specific query.
    setStats({
      totalStudents: totalSt,
      sessionsThisWeek: sessThisWeek,
      attendanceRate: 85, // Placeholder
      pendingRenewals: pendRen
    });

  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, activeTab, loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  };

  // --- ACTIONS ---
  const handleCreateClass = async (data: { day_of_week: string; time: string; capacity: number }) => {
    const { error } = await supabase.from('classes').insert([data]);
    if (error) { notify('error', `Erro: ${error.message}`); return; }
    notify('success', 'Turma criada com sucesso!');
    loadData();
  };

  const handleUpdateClass = async (id: string, data: { day_of_week: string; time: string; capacity: number }) => {
    const { error } = await supabase.from('classes').update(data).eq('id', id);
    if (error) { notify('error', `Erro: ${error.message}`); return; }
    notify('success', 'Turma atualizada!');
    loadData();
  };

  const handleDeleteClass = async (id: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) { notify('error', `Erro: ${error.message}`); return; }
    notify('success', 'Turma deletada com sucesso!');
    loadData();
  };

  const handleEnrollStudent = async (studentId: string, classId: string) => {
    const { error } = await supabase.from('enrollments').insert([{ student_id: studentId, class_id: classId }]);
    if (error) { notify('error', `Erro: ${error.message}`); return; }
    notify('success', 'Aluno matriculado!');
    loadData();
  };

  const handleRemoveEnrollment = async (id: string) => {
    const { error } = await supabase.from('enrollments').delete().eq('id', id);
    if (error) { notify('error', `Erro: ${error.message}`); return; }
    notify('success', 'Matrícula removida!');
    loadData();
  };

  const handleUpdateRenewal = async (id: string, status: string) => {
    const { error } = await supabase.from('renewals').update({ status }).eq('id', id);
    if (error) { notify('error', `Erro: ${error.message}`); return; }
    notify('success', `Mensalidade ${status === 'approved' ? 'aprovada' : 'rejeitada'}!`);
    loadData();
  };

  const handleLoadAttendances = async (sessionId: string) => {
    const { data } = await supabase.from('attendances').select('*, profiles(name)').eq('session_id', sessionId);
    return (data as Attendance[]) || [];
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const tabs = [
    { key: 'classes', label: 'Turmas', icon: Calendar },
    { key: 'students', label: 'Alunos', icon: Users },
    { key: 'sessions', label: 'Aulas', icon: ClipboardCheck },
    { key: 'renewals', label: 'Mensalidades', icon: CreditCard },
    { key: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-arena-black text-white pb-12">
      <Toast feedback={feedback} onDismiss={() => setFeedback(null)} />
      
      <Header onLogout={handleLogout} subtitle="Painel Administrativo" />
      <TabNav tabs={tabs} activeTab={activeTab} onTabChange={(k) => setActiveTab(k as TabKey)} />

      <main className="max-w-5xl mx-auto p-4 py-8">
        {activeTab !== 'settings' && <StatsCards stats={stats} />}

        {activeTab === 'classes' && (
          <ClassList 
            classes={classes} 
            onCreateClass={handleCreateClass} 
            onUpdateClass={handleUpdateClass} 
            onDeleteClass={handleDeleteClass} 
          />
        )}
        
        {activeTab === 'students' && (
          <StudentList 
            students={students} 
            classes={classes} 
            enrollments={enrollments} 
            onEnroll={handleEnrollStudent} 
            onRemoveEnrollment={handleRemoveEnrollment} 
          />
        )}

        {activeTab === 'sessions' && (
          <SessionList 
            sessions={sessions} 
            onLoadAttendances={handleLoadAttendances} 
          />
        )}

        {activeTab === 'renewals' && (
          <RenewalList 
            renewals={renewals}
            students={students}
            enrollments={enrollments} 
            onUpdateStatus={handleUpdateRenewal} 
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </main>
    </div>
  );
}
