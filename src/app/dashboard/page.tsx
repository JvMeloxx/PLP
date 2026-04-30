"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        if (profile?.role === "admin") {
          router.replace("/admin");
          return;
        }
        setUser(profile);
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-arena-black flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arena-black text-white">
      {/* Header */}
      <header className="bg-arena-gray border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-arena-red">Arena PLP</h1>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Olá, {user?.name?.split(" ")[0] || "Aluno"}!</h2>
          <p className="text-gray-400">Acompanhe suas aulas e presenças.</p>
        </div>

        {/* Card de Mensalidade */}
        <div className="bg-arena-gray rounded-xl p-6 border border-gray-800 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">Mensalidade Mês Atual</h3>
            <p className="text-sm text-gray-400">Renovação pendente</p>
          </div>
          <button className="bg-white text-black hover:bg-gray-200 font-bold py-2 px-4 rounded-lg transition-colors text-sm">
            Enviar Comprovante
          </button>
        </div>

        {/* Minhas Turmas */}
        <div>
          <h3 className="font-bold text-lg mb-4">Próximas Aulas (Sua Grade)</h3>
          
          <div className="grid gap-4">
            {/* Componente Fake de Aula para demonstração */}
            <div className="bg-arena-gray rounded-xl p-5 border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="bg-red-500/20 text-red-500 text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block">
                  HOJE
                </span>
                <h4 className="font-bold text-lg">Segunda-feira - 18h30</h4>
                <p className="text-sm text-gray-400">Professor(a) pendente • 24 vagas</p>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  Confirmar (👍)
                </button>
                <button className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  Faltar
                </button>
              </div>
            </div>

             {/* Componente Fake de Aula para demonstração */}
             <div className="bg-arena-gray rounded-xl p-5 border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-75">
              <div>
                <span className="bg-gray-700 text-gray-300 text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block">
                  Nesta Semana
                </span>
                <h4 className="font-bold text-lg">Quarta-feira - 18h30</h4>
                <p className="text-sm text-gray-400">Professor(a) pendente • 24 vagas</p>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none bg-green-600/50 cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  Confirmado
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
