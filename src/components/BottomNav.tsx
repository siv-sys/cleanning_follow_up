import React from 'react';
import { UserRole } from '../types';

interface BottomNavProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRole, onRoleChange }) => {
  const navItems: { role: UserRole; label: string; icon: string }[] = [
    { role: 'student', label: 'Student', icon: 'checklist' },
    { role: 'teacher', label: 'Teacher', icon: 'fact_check' },
    { role: 'admin', label: 'Admin', icon: 'dashboard_customize' },
    { role: 'auth', label: 'Auth', icon: 'manage_accounts' },
  ];

  return (
    <nav
      className="fixed bottom-0 w-full z-50 pb-safe bg-[#ffffff]/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-[#e5eeff]"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentRole === item.role;
          return (
            <button
              key={item.role}
              onClick={() => onRoleChange(item.role)}
              className={`flex flex-col items-center justify-center min-w-[64px] h-12 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#0051d5] font-semibold scale-105'
                  : 'text-[#45464d] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${isActive ? 'fill' : ''}`}
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
                }}
              >
                {item.icon}
              </span>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
