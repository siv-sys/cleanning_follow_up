import React from 'react';
import { UserRole } from '../types';
import { ASSETS } from '../data/mockData';

interface AuthScreenProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onExportCSV: () => void;
  onResetData: () => void;
  onShowToast: (title: string, subtitle: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  currentRole,
  onRoleChange,
  onExportCSV,
  onResetData,
  onShowToast,
}) => {
  return (
    <div className="flex flex-col w-full pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0051d5]"></span>
          <span className="text-[11px] text-[#0051d5] uppercase tracking-wider font-semibold">
            System Administration
          </span>
        </div>
        <h2 className="text-xl font-bold text-[#0b1c30] tracking-tight">
          Campus Custodial Config & Auth
        </h2>
        <p className="text-xs text-[#45464d]">
          Manage user permissions, facility sanitation guidelines & database
        </p>
      </div>

      {/* Role Switcher Matrix */}
      <div className="px-4 py-2">
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
                badge
              </span>
              Active Role Switcher
            </h3>
            <span className="text-[10px] font-semibold text-[#0051d5] bg-[#eff4ff] px-2 py-0.5 rounded-full">
              Live Preview
            </span>
          </div>
          <p className="text-xs text-[#45464d]">
            Switch instant context to evaluate each screen persona's interactions:
          </p>

          <div className="grid grid-cols-1 gap-2">
            {/* Admin */}
            <button
              onClick={() => {
                onRoleChange('admin');
                onShowToast('Switched to Admin Role', 'Logged in as Head Custodian Arthur Briggs.');
              }}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                currentRole === 'admin'
                  ? 'border-[#0051d5] bg-[#eff4ff]'
                  : 'border-[#e5eeff] hover:bg-[#f8f9ff]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#131b2e] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">dashboard_customize</span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[#0b1c30]">Administrator</p>
                  <p className="text-[11px] text-[#45464d]">Arthur Briggs • Head Custodial Director</p>
                </div>
              </div>
              {currentRole === 'admin' && (
                <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
                  check_circle
                </span>
              )}
            </button>

            {/* Teacher */}
            <button
              onClick={() => {
                onRoleChange('teacher');
                onShowToast('Switched to Teacher Role', 'Logged in as Ms. Alvarez (Room 204).');
              }}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                currentRole === 'teacher'
                  ? 'border-[#0051d5] bg-[#eff4ff]'
                  : 'border-[#e5eeff] hover:bg-[#f8f9ff]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0051d5] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[#0b1c30]">Faculty / Inspector</p>
                  <p className="text-[11px] text-[#45464d]">Ms. Alvarez • Homeroom Wing B Lead</p>
                </div>
              </div>
              {currentRole === 'teacher' && (
                <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
                  check_circle
                </span>
              )}
            </button>

            {/* Student */}
            <button
              onClick={() => {
                onRoleChange('student');
                onShowToast('Switched to Student Role', 'Logged in as Marcus Lin (Grade 8-B).');
              }}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                currentRole === 'student'
                  ? 'border-[#0051d5] bg-[#eff4ff]'
                  : 'border-[#e5eeff] hover:bg-[#f8f9ff]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e5eeff] text-[#0051d5] flex items-center justify-center font-bold text-xs">
                  ML
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[#0b1c30]">Student Sanitation Cadet</p>
                  <p className="text-[11px] text-[#45464d]">Marcus Lin • Grade 8-B Room 204</p>
                </div>
              </div>
              {currentRole === 'student' && (
                <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
                  check_circle
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Campus Facility Parameters */}
      <div className="px-4 py-2">
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] space-y-3">
          <h3 className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
              school
            </span>
            Lincoln Middle School Profile
          </h3>

          <div className="divide-y divide-[#e5eeff] text-xs">
            <div className="py-2 flex justify-between">
              <span className="text-[#45464d]">Institution</span>
              <span className="font-semibold text-[#0b1c30]">Lincoln Middle School (MS-204)</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-[#45464d]">District Jurisdiction</span>
              <span className="font-semibold text-[#0b1c30]">Metro School District 14</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-[#45464d]">EPA Disinfection Standard</span>
              <span className="font-semibold text-[#009668]">Level 2 Healthcare Hospital Grade</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-[#45464d]">Registered Custodial Chemical</span>
              <span className="font-semibold text-[#0b1c30]">Eco-Shield 4 (Quaternary Dilution)</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-[#45464d]">Active Inspection Windows</span>
              <span className="font-semibold text-[#0b1c30]">08:00 AM • 12:45 PM • 16:30 EST</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database & Sync Controls */}
      <div className="px-4 py-2">
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] space-y-3">
          <h3 className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
              cloud_sync
            </span>
            Data Storage & Export
          </h3>

          <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#009668] text-[22px]">database</span>
              <div>
                <p className="text-xs font-bold text-[#0b1c30]">Supabase Cloud Sync</p>
                <p className="text-[11px] text-[#45464d]">Active connection • All 142 records mirrored</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#009668]/15 text-[#009668] text-[10px] font-bold">
              Synced
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onExportCSV}
              className="h-10 rounded-xl bg-[#0051d5] text-white hover:bg-[#003ea8] text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export CSV Audit</span>
            </button>

            <button
              onClick={onResetData}
              className="h-10 rounded-xl border border-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6]/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      </div>

      {/* Applet Version & License */}
      <div className="px-4 pt-2 text-center text-[11px] text-[#7c839b] space-y-1">
        <p>CleanSchool v2.4 • Lincoln Middle School Custodial Division</p>
        <p>Compliance certified with OSHA 1910.1030 & CDC Clean Classrooms Standards</p>
      </div>
    </div>
  );
};
