'use client';

import { CheckCircle, XCircle, Clock, Users, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { SessionWithClass, Attendance } from '@/lib/types';

interface SessionCardProps {
  session: SessionWithClass;
  attendance?: Attendance;
  confirmedCount: number;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function getDateLabel(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionDate = new Date(dateStr + 'T12:00:00');
  sessionDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return { text: 'HOJE', variant: 'danger' as const };
  if (diffDays === 1) return { text: 'AMANHÃ', variant: 'warning' as const };
  if (diffDays <= 7) return { text: 'ESTA SEMANA', variant: 'info' as const };
  return { text: 'EM BREVE', variant: 'neutral' as const };
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export function SessionCard({
  session,
  attendance,
  confirmedCount,
  isLoading,
  onConfirm,
  onCancel,
}: SessionCardProps) {
  const dateLabel = getDateLabel(session.date);
  const capacity = session.classes.capacity;
  const spotsLeft = Math.max(0, capacity - confirmedCount);

  const isActive = !attendance || attendance.status === 'cancelled';
  const isConfirmed = attendance?.status === 'confirmed';
  const isWaitlisted = attendance?.status === 'waitlist';

  const borderColor = isConfirmed
    ? 'border-green-500/30'
    : isWaitlisted
    ? 'border-yellow-500/30'
    : 'border-gray-800';

  return (
    <Card borderColor={borderColor} className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          {/* Badge de data */}
          <Badge variant={dateLabel.variant} size="sm">
            {dateLabel.text}
          </Badge>

          <h4 className="font-bold text-lg mt-2">
            {session.classes.day_of_week} — {session.classes.time}
          </h4>

          <p className="text-sm text-gray-500 mt-0.5">{formatDate(session.date)}</p>

          {/* Contagem de vagas */}
          <div className="flex items-center gap-2 mt-2.5">
            <Users size={14} className="text-gray-500 flex-shrink-0" />
            <span
              className={`text-sm font-medium ${
                spotsLeft === 0
                  ? 'text-red-400'
                  : spotsLeft <= 3
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }`}
            >
              {spotsLeft > 0
                ? `${spotsLeft} vaga${spotsLeft !== 1 ? 's' : ''} restante${spotsLeft !== 1 ? 's' : ''}`
                : 'Lotado — lista de espera'}
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
            <Button
              variant="success"
              size="lg"
              loading={isLoading}
              icon={<CheckCircle size={16} />}
              onClick={onConfirm}
              className="flex-1 sm:flex-none"
            >
              {spotsLeft > 0 ? 'Confirmar' : 'Entrar na Espera'}
            </Button>
          )}

          {(isConfirmed || isWaitlisted) && (
            <Button
              variant="danger"
              size="lg"
              loading={isLoading}
              icon={<XCircle size={16} />}
              onClick={onCancel}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
