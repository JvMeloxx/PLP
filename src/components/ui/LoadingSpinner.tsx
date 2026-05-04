import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ text = 'Carregando...', fullScreen = true }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 border-2 border-gray-700 rounded-full" />
        <div className="absolute inset-0 w-10 h-10 border-2 border-arena-red border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-arena-black flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}
