import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-arena-gray rounded-xl p-10 border border-gray-800 text-center animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl bg-gray-800/60 flex items-center justify-center mx-auto mb-4">
        <Icon size={28} className="text-gray-500" />
      </div>
      <h4 className="text-white font-bold text-lg mb-1">{title}</h4>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">{description}</p>
      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
          className="mt-5"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
