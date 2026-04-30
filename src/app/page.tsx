export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-arena-black">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl font-bold text-arena-red tracking-tight">Arena PLP</h1>
        <p className="text-gray-400 text-center max-w-sm mb-4">
          Sistema de gestão de presenças e turmas.
        </p>
        
        <div className="flex flex-col w-full max-w-xs gap-3">
          <a 
            href="/login" 
            className="w-full bg-arena-red hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg text-center transition-colors"
          >
            Entrar
          </a>
          <a 
            href="/register" 
            className="w-full bg-transparent border border-gray-600 hover:border-gray-400 text-white font-bold py-3 px-4 rounded-lg text-center transition-colors"
          >
            Criar Conta
          </a>
        </div>
      </div>
    </main>
  );
}
