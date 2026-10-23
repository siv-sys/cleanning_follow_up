import React, { useState } from 'react';
import { AuditItem, StudentTask } from '../types';

interface TeacherScreenProps {
  auditItems: AuditItem[];
  studentTask: StudentTask;
  onApproveAudit: (id: string) => void;
  onRequestRedo: (id: string, reason: string) => void;
  onShowToast: (title: string, subtitle: string) => void;
  onSelectAuditItem: (item: AuditItem) => void;
}

export const TeacherScreen: React.FC<TeacherScreenProps> = ({
  auditItems,
  onApproveAudit,
  onRequestRedo,
  onShowToast,
  onSelectAuditItem,
}) => {
  const [activeTeacher, setActiveTeacher] = useState<'Ms. Alvarez' | 'Mr. Henderson' | 'Coach Miller'>('Ms. Alvarez');
  const [redoNote, setRedoNote] = useState('');
  const [activeRedoId, setActiveRedoId] = useState<string | null>(null);

  const teacherRooms: Record<string, string> = {
    'Ms. Alvarez': 'Room 204 (Grade 8-B Homeroom)',
    'Mr. Henderson': 'Room 101 (Physics Lab)',
    'Coach Miller': 'Gym A (Athletic Wing)',
  };

  const handleBroadcastReminder = () => {
    onShowToast('Custodial Bell Broadcasted', `Chime sounded for ${teacherRooms[activeTeacher]}. Students notified: 15 mins to deadline.`);
  };

  const handleApprove = (id: string, studentName: string) => {
    onApproveAudit(id);
    onShowToast('Sanitation Approved!', `${studentName}'s room cleaning passed faculty audit. +15 merit points granted.`);
  };

  const handleRedoSubmit = (id: string) => {
    if (!redoNote.trim()) {
      onShowToast('Note Required', 'Please specify what needs remediation.');
      return;
    }
    onRequestRedo(id, redoNote.trim());
    setActiveRedoId(null);
    setRedoNote('');
    onShowToast('Redo Dispatched', 'Student notified to re-clean flagged zone.');
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Teacher Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#009668] animate-pulse"></span>
            <span className="text-[11px] text-[#0051d5] uppercase tracking-wider font-semibold">
              Faculty Signoff Portal
            </span>
          </div>
          <span className="text-xs text-[#45464d] font-medium">Afternoon Inspection Cycle</span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#0b1c30] tracking-tight">
              Classroom Inspection Desk
            </h2>
            <p className="text-xs text-[#45464d]">
              Review student clean duty & certify sanitation readiness
            </p>
          </div>

          <button
            onClick={handleBroadcastReminder}
            className="px-3 py-1.5 rounded-xl bg-[#0051d5] text-white text-xs font-semibold shadow-sm flex items-center gap-1 hover:bg-[#003ea8] transition-all cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">notifications_active</span>
            <span>Chime Bell</span>
          </button>
        </div>
      </div>

      {/* Teacher Switcher Tabs */}
      <div className="px-4 py-2">
        <div className="bg-[#dce9ff] p-1 rounded-xl flex items-center gap-1">
          {(['Ms. Alvarez', 'Mr. Henderson', 'Coach Miller'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTeacher(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTeacher === t
                  ? 'bg-white text-[#0051d5] shadow-sm'
                  : 'text-[#45464d] hover:text-[#0b1c30]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Classroom Status Overview */}
      <div className="px-4 my-2">
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#7c839b] uppercase tracking-wider">
              Supervised Location
            </span>
            <h3 className="text-base font-bold text-[#0b1c30]">
              {teacherRooms[activeTeacher]}
            </h3>
            <p className="text-xs text-[#45464d] mt-0.5">
              Eco-Shield 4 Disinfectant Station Equipped
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#e5eeff] text-[#0051d5] flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">fact_check</span>
          </div>
        </div>
      </div>

      {/* Pending Audits Queue */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
              pending_actions
            </span>
            Duty Submissions Awaiting Signoff
          </h3>
          <span className="text-xs font-semibold text-[#0051d5]">
            {auditItems.length} Records
          </span>
        </div>

        <div className="space-y-3">
          {auditItems.map((item) => {
            const isRedo = item.status === 'Redo Needed';
            const isApproved = item.status === 'Approved';

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#eff4ff] text-[#0051d5] flex items-center justify-center font-bold text-xs">
                      {item.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-[#0b1c30]">
                          {item.studentName}
                        </span>
                        <span className="text-[11px] text-[#45464d]">• {item.room}</span>
                      </div>
                      <p className="text-[11px] text-[#45464d]">{item.zone}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isApproved
                        ? 'bg-[#e5eeff] text-[#009668]'
                        : isRedo
                        ? 'bg-[#ffdad6] text-[#93000a]'
                        : 'bg-[#d3e4fe] text-[#00174b]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Photo Proof Thumbnail with preview click */}
                {item.photoUrl && (
                  <div
                    onClick={() => onSelectAuditItem(item)}
                    className="relative h-28 rounded-xl overflow-hidden border border-[#e5eeff] bg-black cursor-pointer group"
                  >
                    <img
                      src={item.photoUrl}
                      alt="Student Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] backdrop-blur-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">zoom_in</span>
                      Tap to inspect high-res photo
                    </span>
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#213145]/80 text-[#eaf1ff] text-[10px] backdrop-blur-sm">
                      {item.timestamp}
                    </span>
                  </div>
                )}

                {/* Rubric Points */}
                <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
                  <div className="p-2 rounded-lg bg-[#eff4ff] border border-[#dce9ff]">
                    <span className="text-[#45464d] block">Surfaces</span>
                    <span className="font-bold text-[#009668]">5 / 5 ⭐</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#eff4ff] border border-[#dce9ff]">
                    <span className="text-[#45464d] block">Floor Sweep</span>
                    <span className={`font-bold ${isRedo ? 'text-[#ba1a1a]' : 'text-[#009668]'}`}>
                      {isRedo ? '2 / 5 ⚠️' : '5 / 5 ⭐'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#eff4ff] border border-[#dce9ff]">
                    <span className="text-[#45464d] block">Bins Lined</span>
                    <span className="font-bold text-[#009668]">5 / 5 ⭐</span>
                  </div>
                </div>

                {/* Redo Note Drawer if active */}
                {activeRedoId === item.id ? (
                  <div className="p-3 rounded-xl bg-[#ffdad6]/40 border border-[#ba1a1a]/40 space-y-2">
                    <label className="text-[11px] font-semibold text-[#93000a] block">
                      Remediation Instructions for {item.studentName}:
                    </label>
                    <input
                      type="text"
                      value={redoNote}
                      onChange={(e) => setRedoNote(e.target.value)}
                      placeholder="e.g. Underneath bleachers tier 3 unswept, please re-sweep."
                      className="w-full h-9 px-3 bg-white rounded-lg text-xs text-[#0b1c30] border border-[#ba1a1a]/30 focus:outline-none focus:ring-1 focus:ring-[#ba1a1a]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveRedoId(null)}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-[#45464d] hover:bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRedoSubmit(item.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#ba1a1a] text-white hover:bg-[#93000a]"
                      >
                        Send Redo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1 border-t border-[#f8f9ff]">
                    <button
                      onClick={() => {
                        setActiveRedoId(item.id);
                        setRedoNote('');
                      }}
                      className="flex-1 h-9 rounded-xl border border-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6]/40 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                      <span>Request Redo</span>
                    </button>
                    <button
                      onClick={() => handleApprove(item.id, item.studentName)}
                      disabled={isApproved}
                      className="flex-1 h-9 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] disabled:bg-[#009668] text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isApproved ? 'verified' : 'check_circle'}
                      </span>
                      <span>{isApproved ? 'Approved' : 'Signoff Pass'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lincoln Classroom Sanitation Leaderboard */}
      <div className="px-4 py-2">
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5] text-[20px]">leaderboard</span>
              Campus Cleanliness Standings
            </h3>
            <span className="text-[11px] text-[#45464d]">Term 2 Week 8</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#eff4ff]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0051d5]">1.</span>
                <span className="font-semibold text-[#0b1c30]">Room 204 (Grade 8-B)</span>
              </div>
              <span className="font-bold text-[#009668]">99.4% Compliance</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e5eeff]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#7c839b]">2.</span>
                <span className="font-medium text-[#0b1c30]">Lab 305 (Biology)</span>
              </div>
              <span className="font-semibold text-[#0051d5]">97.8% Compliance</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e5eeff]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#7c839b]">3.</span>
                <span className="font-medium text-[#0b1c30]">Room 101 (Physics)</span>
              </div>
              <span className="font-semibold text-[#0051d5]">96.2% Compliance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
