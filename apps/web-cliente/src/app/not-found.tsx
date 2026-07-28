import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md text-center">
        <h1 className="text-4xl font-bold text-blue-500 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white mb-2">Página não encontrada</h2>
        <p className="text-slate-400 mb-6">A página que você está tentando acessar não existe ou foi movida.</p>
        <Link href="/dashboard" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Voltar para o Dashboard
        </Link>
      </div>
    </div>
  );
}
