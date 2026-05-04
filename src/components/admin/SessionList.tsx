'use client';

import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import type { SessionWithClass, Attendance } from '@/lib/types';

interface SessionListProps {
  sessions: SessionWithClass[];
  onLoadAttendances: (sessionId: string) => Promise<Attendance[]>;
}

export function SessionList({ sessions, onLoadAttendances }: SessionListProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  if (sessions.length === 0) {
    return <EmptyState icon={ClipboardCheck} title="Nenhuma aula criada" description="As aulas são geradas automaticamente com base nas turmas cadastradas." />;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Aulas</h2>
      <div className="grid gap-3">
        {sessions.map((s) => {
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
    </div>
  );
}
