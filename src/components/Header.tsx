import React, { useState } from 'react';
import { ASSETS } from '../data/mockData';
import { UserRole, NotificationItem } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenNotifications: () => void;
  notifications: NotificationItem[];
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  onOpenNotifications,
  notifications,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<UserRole, { title: string; badge: string; name: string }> = {
    admin: { title: 'Admin', badge: 'Custodial', name: 'Arthur Briggs' },
    teacher: { title: 'Faculty', badge: 'Inspector', name: 'Ms. Alvarez' },
    student: { title: 'Student', badge: 'Cadet', name: 'Marcus Lin' },
    auth: { title: 'Settings', badge: 'System', name: 'Supervisor' },
  };

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-[#ffffff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#e5eeff]">
      <div className="max-w-2xl mx-auto h-16 px-4 flex items-center justify-between gap-2">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            alt="CleanSchool Logo"
            className="h-8 w-auto object-contain flex-shrink-0"
            src={ASSETS.logo}
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base text-[#0b1c30] tracking-tight truncate">
                CleanSchool
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#dbe1ff] text-[#00174b] text-[10px] font-semibold uppercase tracking-wider">
                {roleLabels[currentRole].badge}
              </span>
            </div>
            <span className="text-xs text-[#45464d] truncate">
              {roleLabels[currentRole].title} • Lincoln Middle
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notifications Button */}
          <button
            aria-label="Notifications"
            onClick={onOpenNotifications}
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-[#45464d] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#ba1a1a] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Profile Avatar & Quick Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center justify-center p-0.5 rounded-full ring-2 ring-[#d3e4fe] hover:ring-[#0051d5] transition-all cursor-pointer"
              title="Switch user / profile"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                src={ASSETS.profile}
              />
            </button>

            {/* Role dropdown popup */}
            {showRoleDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoleDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#e5eeff] py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-[#e5eeff] mb-1">
                    <p className="text-[11px] font-semibold text-[#7c839b] uppercase tracking-wider">
                      Switch Active Persona
                    </p>
                    <p className="text-xs font-semibold text-[#0b1c30] truncate">
                      {roleLabels[currentRole].name} ({roleLabels[currentRole].title})
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onRoleChange('admin');
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#eff4ff] ${
                      currentRole === 'admin' ? 'font-semibold text-[#0051d5] bg-[#eff4ff]' : 'text-[#0b1c30]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">dashboard_customize</span>
                      <div>
                        <div className="font-medium">Administrator</div>
                        <div className="text-[10px] text-[#7c839b]">Head Custodian Briggs</div>
                      </div>
                    </div>
                    {currentRole === 'admin' && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>

                  <button
                    onClick={() => {
                      onRoleChange('teacher');
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#eff4ff] ${
                      currentRole === 'teacher' ? 'font-semibold text-[#0051d5] bg-[#eff4ff]' : 'text-[#0b1c30]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">fact_check</span>
                      <div>
                        <div className="font-medium">Faculty / Teacher</div>
                        <div className="text-[10px] text-[#7c839b]">Ms. Alvarez (Room 204)</div>
                      </div>
                    </div>
                    {currentRole === 'teacher' && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>

                  <button
                    onClick={() => {
                      onRoleChange('student');
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#eff4ff] ${
                      currentRole === 'student' ? 'font-semibold text-[#0051d5] bg-[#eff4ff]' : 'text-[#0b1c30]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">checklist</span>
                      <div>
                        <div className="font-medium">Student Duty</div>
                        <div className="text-[10px] text-[#7c839b]">Marcus Lin (Grade 8-B)</div>
                      </div>
                    </div>
                    {currentRole === 'student' && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>

                  <button
                    onClick={() => {
                      onRoleChange('auth');
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#eff4ff] ${
                      currentRole === 'auth' ? 'font-semibold text-[#0051d5] bg-[#eff4ff]' : 'text-[#0b1c30]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                      <div>
                        <div className="font-medium">School Config & Logs</div>
                        <div className="text-[10px] text-[#7c839b]">Campus Operations</div>
                      </div>
                    </div>
                    {currentRole === 'auth' && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
