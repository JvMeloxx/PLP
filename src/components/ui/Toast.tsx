'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import type { FeedbackMessage } from '@/lib/types';

interface ToastProps {
  feedback: FeedbackMessage | null;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ feedback, onDismiss, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (feedback) {
      setVisible(true);
      setExiting(false);
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          onDismiss();
        }, 300);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [feedback, duration, onDismiss]);

  if (!visible || !feedback) return null;

  const icon =
    feedback.type === 'success' ? (
      <CheckCircle size={18} />
    ) : (
      <XCircle size={18} />
    );

  const bgColor =
    feedback.type === 'success'
      ? 'bg-green-600/95 border-green-500/30'
      : 'bg-red-600/95 border-red-500/30';

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium border backdrop-blur-sm flex items-center gap-2.5 max-w-sm ${bgColor} text-white ${
        exiting ? 'animate-toastOut' : 'animate-toastIn'
      }`}
    >
      {icon}
      <span>{feedback.message}</span>
    </div>
  );
}
