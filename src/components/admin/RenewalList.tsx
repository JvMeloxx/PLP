'use client';

import { CreditCard } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import type { Renewal } from '@/lib/types';

interface RenewalListProps {
  renewals: Renewal[];
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

export function RenewalList({ renewals, onUpdateStatus }: RenewalListProps) {
  if (renewals.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">Mensalidades</h2>
        <EmptyState icon={CreditCard} title="Nenhuma mensalidade" description="Os comprovantes enviados pelos alunos aparecerão aqui." />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Mensalidades</h2>
      <div className="grid gap-3">
        {renewals.map((r) => (
          <Card key={r.id} hoverable>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-white">{r.profiles?.name}</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  Mês: {new Date(r.month + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
                <Badge
                  variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}
                  size="sm"
                >
                  {r.status === 'approved' ? 'Aprovado' : r.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                </Badge>
                {r.receipt_url && (
                  <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline block mt-1">
                    Ver comprovante
                  </a>
                )}
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <Button variant="success" size="sm" onClick={() => onUpdateStatus(r.id, 'approved')}>Aprovar</Button>
                  <Button variant="danger" size="sm" onClick={() => onUpdateStatus(r.id, 'rejected')}>Rejeitar</Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
