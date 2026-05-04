'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-arena-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
            Arena<span className="text-arena-red">PLP</span>
          </h1>
          <p className="text-gray-400 mt-2">Recuperação de Senha</p>
        </div>

        <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-gray-800 shadow-xl">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">E-mail enviado!</h2>
              <p className="text-gray-400 mb-6 text-sm">
                Enviamos um link de recuperação para o seu e-mail. Verifique sua caixa de entrada (e a de spam).
              </p>
              <Link href="/login" className="text-arena-red hover:text-red-400 font-medium text-sm transition-colors block">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-6 text-center">
                Digite o e-mail associado à sua conta e enviaremos instruções para redefinir sua senha.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Seu E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-arena-black border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-arena-red focus:ring-1 focus:ring-arena-red outline-none transition-all"
                      placeholder="joao@exemplo.com"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  loading={loading}
                >
                  Enviar Link
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-gray-400 hover:text-white text-sm font-medium transition-colors inline-flex items-center gap-2">
                  <ArrowLeft size={16} /> Voltar para o Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
