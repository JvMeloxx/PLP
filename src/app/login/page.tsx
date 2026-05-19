"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === "Email not confirmed") {
        setError("Você precisa confirmar seu e-mail antes de entrar.");
      } else if (error.message === "Invalid login credentials") {
        setError("Email ou senha incorretos.");
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      // Pequeno delay para garantir que o cookie foi salvo antes de navegar
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-arena-black p-4">
      <div className="w-full max-w-md bg-arena-gray p-8 rounded-xl shadow-lg border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-arena-red tracking-tight">Arena PLP</h1>
          <p className="text-gray-400 mt-2">Bem-vindo(a) à areia!</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-400">
                Senha
              </label>
              <Link href="/forgot-password" className="text-xs text-arena-red hover:text-red-400 transition-colors">
                Esqueceu a senha?
              </Link>
            </div>
            <input
              type="password"
              required
              className="w-full bg-arena-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-arena-red transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-arena-red hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-arena-red hover:underline">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
