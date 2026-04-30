"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Após registrar com sucesso (como no Supabase, por padrão a sessão loga na hora)
    // O trigger no DB cria automaticamente o profile, mas não o telefone. Vamos atualizar o telefone.
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase
        .from("profiles")
        .update({ phone })
        .eq("id", userData.user.id);
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-arena-black p-4 py-8">
      <div className="w-full max-w-md bg-arena-gray p-8 rounded-xl shadow-lg border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-arena-red tracking-tight">Criar Conta</h1>
          <p className="text-gray-400 mt-2">Cadastre-se na Arena PLP</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              className="w-full bg-arena-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-arena-red transition-colors"
              placeholder="Ex: João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
            <input
              type="tel"
              required
              className="w-full bg-arena-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-arena-red transition-colors"
              placeholder="(61) 90000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">E-mail</label>
            <input
              type="email"
              required
              className="w-full bg-arena-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-arena-red transition-colors"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
            <input
              type="password"
              required
              className="w-full bg-arena-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-arena-red transition-colors"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-arena-red hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Conta"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Já tem conta?{" "}
          <Link href="/login" className="text-arena-red hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
