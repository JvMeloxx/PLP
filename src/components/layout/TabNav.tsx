'use client';

import { LucideIcon } from 'lucide-react';

interface Tab {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="bg-arena-gray/30 border-b border-gray-800/50 sticky top-[65px] z-30 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-arena-red text-arena-red'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
