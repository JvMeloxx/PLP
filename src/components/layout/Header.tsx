'use client';

import { LogOut, Bell } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  onLogout: () => void;
  subtitle?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export function Header({ onLogout, subtitle, notificationCount = 0, onNotificationClick }: HeaderProps) {
  return (
    <header className="bg-arena-gray/80 backdrop-blur-md border-b border-gray-800/50 p-4 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div>
          <Link href="/" className="text-xl font-bold text-arena-red tracking-tight hover:opacity-90 transition-opacity">
            Arena PLP
          </Link>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onNotificationClick && (
            <button
              onClick={onNotificationClick}
              className="relative text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-all"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-arena-red text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={onLogout}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors p-2 rounded-lg hover:bg-gray-800"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
