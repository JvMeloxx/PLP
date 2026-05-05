'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, User, Phone, Lock } from 'lucide-react';
import type { Profile, FeedbackMessage } from '@/lib/types';

export default function ProfilePage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'admin') {
      router.replace('/admin');
      return;
    }

    setUser(profile);
    setName(profile?.name || '');
    setPhone(profile?.phone || '');
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setFeedback(null);

    try {
      // 1. Update Profile (Name, Phone)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name, phone })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Update Password if provided
      if (password) {
        if (password.length < 6) {
          throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
        }
        
        const { error: authError } = await supabase.auth.updateUser({
          password: password
        });

        if (authError) throw authError;
      }

      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
      setPassword(''); // Clear password field after save
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao atualizar perfil.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-arena-black text-white pb-12">
      <Toast feedback={feedback} onDismiss={() => setFeedback(null)} />
      
      <Header 
        onLogout={handleLogout} 
        subtitle="Meu Perfil"
      />

      <main className="max-w-2xl mx-auto p-4 py-8 animate-fadeIn">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar para o Dashboard
        </button>

        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="text-arena-red" />
              Editar Informações
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Mantenha seu telefone atualizado para não perder os avisos do WhatsApp.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="w-full bg-arena-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-arena-red transition-colors"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp (com DDD)</label>
                <input
                  type="tel"
                  required
                  className="w-full bg-arena-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-arena-red transition-colors"
                  placeholder="(00) 90000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Phone className="absolute right-3 top-9 text-gray-500" size={18} />
                <p className="text-xs text-gray-500 mt-1 ml-1">Usado para receber alertas de aulas e vagas.</p>
              </div>

              <div className="relative pt-4 border-t border-gray-800">
                <h3 className="text-sm font-bold text-gray-300 mb-3">Segurança</h3>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nova Senha (opcional)</label>
                <input
                  type="password"
                  className="w-full bg-arena-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-arena-red transition-colors"
                  placeholder="Deixe em branco para não alterar"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute right-3 top-[3.25rem] text-gray-500" size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-arena-red hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-4 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </form>
        </Card>
      </main>
    </div>
  );
}
