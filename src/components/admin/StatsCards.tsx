'use client';

import { Users, Calendar, ClipboardCheck, CreditCard } from 'lucide-react';
import { Card } from '../ui/Card';

interface StatsData {
  totalStudents: number;
  sessionsThisWeek: number;
  attendanceRate: number;
  pendingRenewals: number;
}

interface StatsCardsProps {
  stats: StatsData;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total de Alunos',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Aulas esta semana',
      value: stats.sessionsThisWeek,
      icon: Calendar,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Taxa de Presença',
      value: `${stats.attendanceRate}%`,
      icon: ClipboardCheck,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Mensalidades Pendentes',
      value: stats.pendingRenewals,
      icon: CreditCard,
      color: stats.pendingRenewals > 0 ? 'text-yellow-400' : 'text-green-400',
      bg: stats.pendingRenewals > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {cards.map((card) => (
        <Card key={card.label} hoverable className="!p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
            </div>
            <div className={`${card.bg} p-2 rounded-lg`}>
              <card.icon size={18} className={card.color} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
