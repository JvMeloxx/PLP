'use client';

import { useState } from 'react';
import { Trash2, Pencil, Plus, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { ClassForm } from './ClassForm';
import type { Class } from '@/lib/types';

interface ClassListProps {
  classes: Class[];
  onCreateClass: (data: { day_of_week: string; time: string; capacity: number }) => Promise<void>;
  onUpdateClass: (id: string, data: { day_of_week: string; time: string; capacity: number }) => Promise<void>;
  onDeleteClass: (id: string) => Promise<void>;
}

export function ClassList({ classes, onCreateClass, onUpdateClass, onDeleteClass }: ClassListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreate = async (data: { day_of_week: string; time: string; capacity: number }) => {
    await onCreateClass(data);
    setShowForm(false);
  };

  const handleEdit = async (data: { day_of_week: string; time: string; capacity: number }) => {
    if (editingClass) {
      await onUpdateClass(editingClass.id, data);
      setEditingClass(null);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      setDeleteLoading(true);
      try {
        await onDeleteClass(deleteTarget.id);
      } finally {
        setDeleteLoading(false);
        setDeleteTarget(null);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Turmas</h2>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={16} />}
          onClick={() => { setShowForm(true); setEditingClass(null); }}
        >
          Nova Turma
        </Button>
      </div>

      {showForm && !editingClass && (
        <ClassForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />
      )}

      {editingClass && (
        <ClassForm
          onSubmit={handleEdit}
          onClose={() => setEditingClass(null)}
          editingClass={editingClass}
        />
      )}

      {classes.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhuma turma cadastrada"
          description="Crie sua primeira turma para começar a organizar as aulas."
          action={{ label: 'Criar Turma', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid gap-3">
          {classes.map((c) => (
            <Card key={c.id} hoverable>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">{c.day_of_week} — {c.time}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{c.capacity} vagas</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingClass(c); setShowForm(false); }}
                    className="text-gray-500 hover:text-blue-400 p-2 rounded-lg hover:bg-gray-800 transition-all"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-gray-800 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deletar Turma"
        message={`Tem certeza que deseja deletar a turma "${deleteTarget?.day_of_week} — ${deleteTarget?.time}"? Todas as sessões e presenças desta turma serão apagadas.`}
        confirmText="Deletar"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
