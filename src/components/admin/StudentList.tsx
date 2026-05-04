'use client';

import { useState } from 'react';
import { UserPlus, Trash2, Users, Search, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import type { Profile, Class, Enrollment } from '@/lib/types';

interface StudentListProps {
  students: Profile[];
  classes: Class[];
  enrollments: Enrollment[];
  onEnroll: (studentId: string, classId: string) => Promise<void>;
  onRemoveEnrollment: (id: string) => Promise<void>;
}

export function StudentList({ students, classes, enrollments, onEnroll, onRemoveEnrollment }: StudentListProps) {
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollClassId, setEnrollClassId] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnroll = async () => {
    if (!enrollClassId || !enrollStudentId) return;
    setEnrollLoading(true);
    try {
      await onEnroll(enrollStudentId, enrollClassId);
      setShowEnrollForm(false);
      setEnrollStudentId('');
      setEnrollClassId('');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleRemoveEnrollment = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await onRemoveEnrollment(deleteTarget.id);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Alunos ({students.length})</h2>
        <Button variant="primary" size="md" icon={<UserPlus size={16} />} onClick={() => setShowEnrollForm(true)}>
          Matricular
        </Button>
      </div>

      {showEnrollForm && (
        <Card className="mb-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white">Matricular Aluno em Turma</h3>
            <button onClick={() => setShowEnrollForm(false)} className="text-gray-500 hover:text-white transition-colors p-1"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select value={enrollStudentId} onChange={(e) => setEnrollStudentId(e.target.value)} className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-arena-red focus:outline-none transition-colors">
              <option value="">Selecione o aluno</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={enrollClassId} onChange={(e) => setEnrollClassId(e.target.value)} className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-arena-red focus:outline-none transition-colors">
              <option value="">Selecione a turma</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.day_of_week} — {c.time}</option>)}
            </select>
          </div>
          <Button variant="success" size="md" onClick={handleEnroll} loading={enrollLoading} className="mt-4">Matricular</Button>
        </Card>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar aluno por nome..." className="w-full bg-arena-black border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-arena-red focus:outline-none transition-colors" />
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState icon={Users} title={searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'} description={searchTerm ? `Nenhum aluno com "${searchTerm}".` : 'Os alunos aparecerão após se registrarem.'} />
      ) : (
        <div className="grid gap-2 mb-8">
          {filteredStudents.map((s) => (
            <Card key={s.id} hoverable className="!p-4">
              <h4 className="font-bold text-white text-sm">{s.name}</h4>
              <p className="text-xs text-gray-500">{s.phone || 'Sem telefone'}</p>
            </Card>
          ))}
        </div>
      )}

      <h3 className="text-lg font-bold mb-4">Matrículas Ativas</h3>
      {enrollments.length === 0 ? (
        <EmptyState icon={Users} title="Nenhuma matrícula" description="Matricule alunos nas turmas." action={{ label: 'Matricular', onClick: () => setShowEnrollForm(true) }} />
      ) : (
        <div className="grid gap-2">
          {enrollments.map((e) => (
            <Card key={e.id} hoverable className="!p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-sm">{e.profiles?.name}</h4>
                  <p className="text-xs text-gray-500">{e.classes?.day_of_week} — {e.classes?.time}</p>
                </div>
                <button onClick={() => setDeleteTarget(e)} className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-gray-800 transition-all"><Trash2 size={16} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleRemoveEnrollment} title="Remover Matrícula" message={`Remover matrícula de "${deleteTarget?.profiles?.name}"?`} confirmText="Remover" variant="danger" loading={deleteLoading} />
    </div>
  );
}
