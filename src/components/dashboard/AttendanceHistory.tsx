'use client';

import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import type { Attendance, SessionWithClass } from '@/lib/types';

interface AttendanceHistoryProps {
  attendances: (Attendance & { sessions?: SessionWithClass })[];
  loading: boolean;
}

export function AttendanceHistory({ attendances, loading }: AttendanceHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-arena-gray rounded-xl p-4 border border-gray-800 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (attendances.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sem histórico"
        description="Seu histórico de presenças aparecerá aqui conforme você participar das aulas."
      />
    );
  }

  // Calculate frequency
  const totalClasses = attendances.length;
  const attended = attendances.filter((a) => a.status === 'confirmed').length;
  const frequencyPercent = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

  const statusConfig = {
    confirmed: { icon: CheckCircle, label: 'Presente', variant: 'success' as const, color: 'text-green-400' },
    waitlist: { icon: Clock, label: 'Espera', variant: 'warning' as const, color: 'text-yellow-400' },
    cancelled: { icon: XCircle, label: 'Cancelou', variant: 'danger' as const, color: 'text-red-400' },
  };

  return (
    <div>
      {/* Frequency counter */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Frequência este mês</p>
            <p className="text-2xl font-bold text-white">{frequencyPercent}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Presenças</p>
            <p className="text-lg font-bold text-green-400">{attended}/{totalClasses}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-arena-red to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${frequencyPercent}%` }}
          />
        </div>
      </Card>

      {/* History list */}
      <div className="space-y-2">
        {attendances.map((att) => {
          const config = statusConfig[att.status];
          const Icon = config.icon;

          return (
            <div
              key={att.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg bg-arena-gray/50 border border-gray-800/50 hover:bg-arena-gray transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className={config.color} />
                <div>
                  <p className="text-sm font-medium text-white">
                    {att.sessions?.classes?.day_of_week} — {att.sessions?.classes?.time}
                  </p>
                  <p className="text-xs text-gray-500">
                    {att.sessions?.date
                      ? new Date(att.sessions.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : ''}
                  </p>
                </div>
              </div>
              <Badge variant={config.variant} size="sm">
                {config.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
