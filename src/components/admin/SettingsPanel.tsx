'use client';

import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Card } from '../ui/Card';
import { supabase } from '@/lib/supabase';

export function SettingsPanel() {
  const [deadline, setDeadline] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('cancellation_deadline_hours')
        .eq('id', 1)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setDeadline(data.cancellation_deadline_hours);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ cancellation_deadline_hours: deadline })
        .eq('id', 1);

      if (error) throw error;
      
      setFeedback({ type: 'success', message: 'Configurações salvas com sucesso!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setFeedback({ type: 'error', message: 'Erro ao salvar. Verifique se o SQL das configurações foi rodado.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando configurações...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-arena-red" size={24} />
        <h2 className="text-xl font-bold">Configurações Globais</h2>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2">Regras de Agendamento</h3>
            <p className="text-sm text-gray-400 mb-4">
              Defina as regras gerais para confirmação e cancelamento de presença no aplicativo.
            </p>
            
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tempo Limite para Cancelamento (em horas)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="72"
                  value={deadline}
                  onChange={(e) => setDeadline(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-arena-red focus:border-arena-red block w-32 p-2.5"
                />
                <span className="text-sm text-gray-400">horas antes do início da aula</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ex: Se a aula for às 18:00 e o limite for 2 horas, o aluno não poderá cancelar ou confirmar depois das 16:00.
              </p>
            </div>
          </div>

          {feedback && (
            <div className={`p-3 rounded-lg text-sm ${feedback.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
              {feedback.message}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-arena-red hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : (
                <>
                  <Save size={18} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
