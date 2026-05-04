'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DAYS_OF_WEEK } from '@/lib/types';
import type { Class } from '@/lib/types';

interface ClassFormProps {
  onSubmit: (data: { day_of_week: string; time: string; capacity: number }) => Promise<void>;
  onClose: () => void;
  editingClass?: Class | null;
}

export function ClassForm({ onSubmit, onClose, editingClass }: ClassFormProps) {
  const [dayOfWeek, setDayOfWeek] = useState(editingClass?.day_of_week || 'Segunda-feira');
  const [time, setTime] = useState(editingClass?.time || '18:30');
  const [capacity, setCapacity] = useState(editingClass?.capacity || 24);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({ day_of_week: dayOfWeek, time, capacity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white">
          {editingClass ? 'Editar Turma' : 'Criar Turma'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-arena-red focus:outline-none transition-colors"
        >
          {DAYS_OF_WEEK.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-arena-red focus:outline-none transition-colors"
        />
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
          placeholder="Vagas"
          min={1}
          className="bg-arena-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-arena-red focus:outline-none transition-colors"
        />
      </div>
      <Button
        variant="success"
        size="md"
        onClick={handleSubmit}
        loading={loading}
        className="mt-4"
      >
        {editingClass ? 'Salvar Alterações' : 'Criar Turma'}
      </Button>
    </Card>
  );
}
