
import React from 'react';
import { Calculator, History, Settings } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: Tab.CALCULATOR, label: '计算', icon: Calculator },
    { id: Tab.HISTORY, label: '历史', icon: History },
    { id: Tab.SETTINGS, label: '设置', icon: Settings },
  ];

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 px-6 h-[65px] flex justify-around items-center z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center transition-colors duration-200 ${
              isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
