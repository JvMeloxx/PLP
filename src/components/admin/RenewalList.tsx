'use client';

import { useState, useMemo } from 'react';
import { Search, UserX } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import type { Renewal, Profile, Enrollment } from '@/lib/types';

interface RenewalListProps {
  renewals: Renewal[];
  students: Profile[];
  enrollments: Enrollment[];
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

export function RenewalList({ renewals, students, enrollments, onUpdateStatus }: RenewalListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const getMonthOptions = () => {
    const options = [];
    const current = new Date();
    // Exibe o mês atual, 1 futuro e 4 passados
    for (let i = -4; i <= 1; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options.reverse();
  };

  const activeStudents = useMemo(() => {
    // Aluno é ativo se tem pelo menos uma matrícula
    const enrolledStudentIds = new Set(enrollments.map(e => e.student_id));
    return students.filter(s => enrolledStudentIds.has(s.id));
  }, [students, enrollments]);

  const studentRenewals = useMemo(() => {
    const result = activeStudents.map(student => {
      // Busca a mensalidade desse aluno no mês selecionado
      const renewal = renewals.find(r => r.student_id === student.id && r.month === selectedMonth);
      return {
        student,
        renewal,
        status: renewal ? renewal.status : 'missing',
      };
    });

    // Filtro por nome
    const filtered = result.filter(item => 
      item.student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ordem: Pendente -> Não Enviado -> Rejeitado -> Aprovado
    const statusOrder: Record<string, number> = {
      'pending': 0,
      'missing': 1,
      'rejected': 2,
      'approved': 3,
    };

    return filtered.sort((a, b) => {
      const orderDiff = statusOrder[a.status] - statusOrder[b.status];
      if (orderDiff !== 0) return orderDiff;
      return a.student.name.localeCompare(b.student.name);
    });

  }, [activeStudents, renewals, selectedMonth, searchTerm]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Controle de Inadimplência</h2>
        
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-arena-red focus:border-arena-red block p-2.5"
        >
          {getMonthOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Buscar aluno por nome..." 
          className="w-full bg-arena-black border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-arena-red focus:outline-none transition-colors" 
        />
      </div>

      {activeStudents.length === 0 ? (
        <EmptyState 
          icon={UserX} 
          title="Nenhum aluno ativo" 
          description="Apenas alunos matriculados em turmas aparecerão na cobrança." 
        />
      ) : studentRenewals.length === 0 ? (
        <EmptyState 
          icon={Search} 
          title="Nenhum aluno encontrado" 
          description="Tente buscar por outro nome." 
        />
      ) : (
        <div className="grid gap-3">
          {studentRenewals.map(({ student, renewal, status }) => (
            <Card key={student.id} hoverable>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {student.name}
                    {status === 'missing' && <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">Não Enviado</span>}
                    {status === 'pending' && <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/30">Em Análise</span>}
                    {status === 'approved' && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded border border-green-500/30">Aprovado</span>}
                    {status === 'rejected' && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded border border-red-500/30">Rejeitado</span>}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {student.phone || 'Sem telefone'}
                  </p>
                  
                  {renewal?.receipt_url && (
                    <a href={renewal.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline inline-block mt-2 font-medium">
                      Ver comprovante anexado
                    </a>
                  )}
                </div>

                {status === 'pending' && renewal && (
                  <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                    <Button variant="success" size="sm" onClick={() => onUpdateStatus(renewal.id, 'approved')} className="flex-1 sm:flex-none">
                      Aprovar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => onUpdateStatus(renewal.id, 'rejected')} className="flex-1 sm:flex-none">
                      Rejeitar
                    </Button>
                  </div>
                )}
                
                {status === 'missing' && (
                  <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                    Aguardando envio
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
