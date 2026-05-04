'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Upload, FileImage, CreditCard, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Renewal, Profile, FeedbackMessage } from '@/lib/types';

export default function RenewalsPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    // Default to current month, format YYYY-MM-01
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const router = useRouter();

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
    loadRenewals(session.user.id);
  };

  const loadRenewals = async (userId: string) => {
    const { data } = await supabase
      .from('renewals')
      .select('*')
      .eq('student_id', userId)
      .order('month', { ascending: false });
    
    setRenewals((data as Renewal[]) || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setFeedback({ type: 'error', message: 'Apenas imagens ou PDFs são permitidos.' });
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'O arquivo não pode ter mais de 5MB.' });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Check if there is already a pending or rejected renewal for this month
      const existing = renewals.find(r => r.month === selectedMonth);

      if (existing) {
        if (existing.status === 'approved') {
          setFeedback({ type: 'error', message: 'A mensalidade deste mês já foi aprovada.' });
          return;
        }
        
        // Update existing record
        const { error: updateError } = await supabase
          .from('renewals')
          .update({ receipt_url: publicUrl, status: 'pending' })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('renewals')
          .insert([
            {
              student_id: user.id,
              month: selectedMonth,
              receipt_url: publicUrl,
              status: 'pending'
            }
          ]);

        if (insertError) throw insertError;
      }

      setFeedback({ type: 'success', message: 'Comprovante enviado com sucesso!' });
      await loadRenewals(user.id);
      
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Erro ao enviar o arquivo.' });
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const getMonthOptions = () => {
    const options = [];
    const current = new Date();
    // Show current month + 3 future months
    for (let i = 0; i < 4; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-arena-black text-white pb-12">
      <Toast feedback={feedback} onDismiss={() => setFeedback(null)} />
      
      <Header onLogout={handleLogout} subtitle="Mensalidades" />

      <main className="max-w-3xl mx-auto p-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-2 rounded-lg hover:bg-gray-800">
            <ChevronLeft size={20} />
          </Link>
          <h2 className="text-2xl font-bold">Mensalidades</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulário de Envio */}
          <Card className="h-fit">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Upload size={18} className="text-arena-red" />
              Enviar Comprovante
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mês Referência</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-arena-black border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-arena-red focus:outline-none transition-colors"
                >
                  {getMonthOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Comprovante (PIX)</label>
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-gray-500 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <FileImage size={32} className="mx-auto text-gray-500 mb-3" />
                  <p className="text-sm font-medium text-white mb-1">
                    {uploading ? 'Enviando...' : 'Clique ou arraste a imagem'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Formatos suportados: PNG, JPG ou PDF. Max: 5MB
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Histórico */}
          <div>
            <h3 className="font-bold text-lg mb-4">Seus Pagamentos</h3>
            {renewals.length === 0 ? (
              <EmptyState 
                icon={CreditCard} 
                title="Nenhum pagamento" 
                description="Envie seu primeiro comprovante de mensalidade para que seja analisado pelo administrador." 
              />
            ) : (
              <div className="grid gap-3">
                {renewals.map(r => (
                  <Card key={r.id} hoverable className="!p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white text-sm capitalize">
                          {new Date(r.month + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Enviado em {new Date(r.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge 
                        variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}
                      >
                        {r.status === 'approved' ? 'Aprovado' : r.status === 'rejected' ? 'Rejeitado' : 'Em Análise'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
