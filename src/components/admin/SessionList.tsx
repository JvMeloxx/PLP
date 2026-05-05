'use client';

import { useState, useMemo } from 'react';
import { ClipboardCheck, Copy } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import type { SessionWithClass, Attendance } from '@/lib/types';

interface SessionListProps {
  sessions: SessionWithClass[];
  onLoadAttendances: (sessionId: string) => Promise<Attendance[]>;
}

type DateFilter = 'all' | 'today' | 'upcoming' | 'past';

export function SessionList({ sessions, onLoadAttendances }: SessionListProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleToggle = async (sessionId: string) => {
    if (selectedSession === sessionId) {
      setSelectedSession(null);
      setAttendances([]);
      return;
    }
    setLoadingId(sessionId);
    try {
      const data = await onLoadAttendances(sessionId);
      setAttendances(data);
      setSelectedSession(sessionId);
    } finally {
      setLoadingId(null);
    }
  };

  const copyToClipboard = async (session: SessionWithClass, confirmed: Attendance[], waitlisted: Attendance[]) => {
    const title = `🏐 *Turma de ${session.classes?.day_of_week} - ${session.classes?.time}*\nData: ${new Date(session.date + 'T12:00:00').toLocaleDateString('pt-BR')}\n`;
    
    let text = title + `\n✅ *Confirmados (${confirmed.length}/${session.classes?.capacity || '?'}):*\n`;
    if (confirmed.length === 0) text += 'Nenhum confirmado.\n';
    confirmed.forEach((a, i) => {
      text += `${i + 1}. ${a.profiles?.name}\n`;
    });

    if (waitlisted.length > 0) {
      text += `\n⏳ *Lista de Espera (${waitlisted.length}):*\n`;
      waitlisted.forEach((a, i) => {
        text += `${i + 1}. ${a.profiles?.name}\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(session.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const filteredSessions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    return sessions.filter(s => {
      if (dateFilter === 'all') return true;
      if (dateFilter === 'today') return s.date === todayStr;
      if (dateFilter === 'upcoming') return s.date > todayStr;
      if (dateFilter === 'past') return s.date < todayStr;
      return true;
    });
  }, [sessions, dateFilter]);

  if (sessions.length === 0) {
    return <EmptyState icon={ClipboardCheck} title="Nenhuma aula criada" description="As aulas são geradas automaticamente com base nas turmas cadastradas." />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Aulas</h2>
        
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-arena-red focus:border-arena-red block p-2.5"
        >
          <option value="all">Todas as Aulas</option>
          <option value="today">Aulas de Hoje</option>
          <option value="upcoming">Próximos Dias</option>
          <option value="past">Aulas Passadas</option>
        </select>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-800/20 rounded-xl border border-gray-800">
          Nenhuma aula encontrada para o filtro selecionado.
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredSessions.map((s) => {
            const isSelected = selectedSession === s.id;
            const confirmed = isSelected ? attendances.filter((a) => a.status === 'confirmed') : [];
            const waitlisted = isSelected ? attendances.filter((a) => a.status === 'waitlist') : [];
            const cancelled = isSelected ? attendances.filter((a) => a.status === 'cancelled') : [];

            return (
              <Card key={s.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white">{s.classes?.day_of_week} — {s.classes?.time}</h4>
                    <p className="text-sm text-gray-500">{new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(s.id)}
                    disabled={loadingId === s.id}
                    className={`text-white text-sm py-2 px-4 rounded-lg transition-all ${isSelected ? 'bg-arena-red hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} disabled:opacity-50`}
                  >
                    {loadingId === s.id ? 'Carregando...' : isSelected ? 'Ocultar' : 'Ver Presenças'}
                  </button>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-4 animate-fadeIn">
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => copyToClipboard(s, confirmed, waitlisted)}
                        className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5 transition-colors bg-gray-800 hover:bg-gray-700 py-1.5 px-3 rounded-md"
                      >
                        <Copy size={14} />
                        {copiedId === s.id ? 'Copiado!' : 'Copiar Lista'}
                      </button>
                    </div>

                    <div>
                      <h5 className="text-sm font-bold text-green-400 mb-2">✅ Confirmados ({confirmed.length}/{s.classes?.capacity || '?'})</h5>
                      {confirmed.length === 0 && <p className="text-gray-600 text-xs ml-5">Nenhum confirmado.</p>}
                      {confirmed.map((a, i) => (
                        <div key={a.id} className="flex justify-between items-center py-2 px-3 ml-3 rounded-lg hover:bg-gray-800/30">
                          <span className="text-sm">{i + 1}. {a.profiles?.name}</span>
                          <Badge variant="success" size="sm">Confirmado</Badge>
                        </div>
                      ))}
                    </div>

                    {waitlisted.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-yellow-400 mb-2">⏳ Lista de Espera ({waitlisted.length})</h5>
                        {waitlisted.map((a, i) => (
                          <div key={a.id} className="flex justify-between items-center py-2 px-3 ml-3 rounded-lg hover:bg-gray-800/30">
                            <span className="text-sm">{i + 1}. {a.profiles?.name}</span>
                            <Badge variant="warning" size="sm">Espera</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {cancelled.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-red-400 mb-2">❌ Cancelaram ({cancelled.length})</h5>
                        {cancelled.map((a) => (
                          <div key={a.id} className="flex justify-between items-center py-2 px-3 ml-3 rounded-lg hover:bg-gray-800/30">
                            <span className="text-sm text-gray-500">{a.profiles?.name}</span>
                            <Badge variant="danger" size="sm">Cancelou</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {attendances.length === 0 && <p className="text-gray-500 text-sm text-center py-2">Nenhuma presença registrada.</p>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
