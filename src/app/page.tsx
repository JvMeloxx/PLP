import Link from 'next/link';
import { ArrowRight, Calendar, Users, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-arena-black text-white selection:bg-arena-red selection:text-white overflow-hidden">
      {/* Background gradients for a premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-arena-red/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-arena-red/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">
          Arena<span className="text-arena-red">PLP</span>
        </h1>
        <div className="flex gap-4">
          <Link 
            href="/login" 
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 px-4"
          >
            Entrar
          </Link>
          <Link 
            href="/register" 
            className="text-sm font-medium bg-white text-arena-black hover:bg-gray-200 transition-colors py-2 px-5 rounded-full"
          >
            Matricule-se
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 text-center lg:text-left animate-slideUp">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50 text-xs font-medium text-gray-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-arena-red animate-pulse" />
            Nova plataforma online
          </div>
          <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] mb-6">
            Jogue futevôlei. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena-red to-red-400">
              Sem burocracia.
            </span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Acompanhe sua agenda, confirme presença nas aulas e gerencie suas mensalidades em um só lugar. A Arena PLP agora é 100% digital.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link 
              href="/register" 
              className="w-full sm:w-auto bg-arena-red hover:bg-red-600 text-white font-bold py-4 px-8 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(230,0,0,0.3)]"
            >
              Começar Agora
              <ArrowRight size={18} />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto bg-transparent border border-gray-700 hover:border-gray-500 text-white font-bold py-4 px-8 rounded-full transition-colors flex items-center justify-center"
            >
              Já sou aluno
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid (Hero visual) */}
        <div className="flex-1 w-full max-w-lg relative animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-6 rounded-2xl transform translate-y-8">
              <Calendar className="text-arena-red mb-4" size={32} />
              <h3 className="font-bold text-white mb-2">Presença Fácil</h3>
              <p className="text-sm text-gray-400">Confirme ou cancele sua aula em um toque.</p>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-6 rounded-2xl">
              <Users className="text-arena-red mb-4" size={32} />
              <h3 className="font-bold text-white mb-2">Fila de Espera</h3>
              <p className="text-sm text-gray-400">Avanço automático quando alguém desiste.</p>
            </div>
            <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-6 rounded-2xl col-span-2 text-center transform -translate-y-4">
              <ShieldCheck className="text-arena-red mb-4 mx-auto" size={32} />
              <h3 className="font-bold text-white mb-2">Mensalidades Seguras</h3>
              <p className="text-sm text-gray-400">Envie o PIX e acompanhe a aprovação diretamente no seu painel.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
