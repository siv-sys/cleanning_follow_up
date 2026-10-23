import React, { useState } from 'react';
import { StudentTask } from '../types';
import { ASSETS } from '../data/mockData';

interface StudentScreenProps {
  task: StudentTask;
  onUpdateChecklist: (itemId: string, done: boolean) => void;
  onSubmitTask: () => void;
  onShowToast: (title: string, subtitle: string) => void;
}

export const StudentScreen: React.FC<StudentScreenProps> = ({
  task,
  onUpdateChecklist,
  onSubmitTask,
  onShowToast,
}) => {
  const [analyzingProof, setAnalyzingProof] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(task.photoProofUrl || ASSETS.room204);

  const completedCount = task.checklist.filter((c) => c.done).length;
  const totalCount = task.checklist.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleSimulatePhotoChange = () => {
    const photos = [ASSETS.room204, ASSETS.lab305];
    const nextPhoto = photoPreview === photos[0] ? photos[1] : photos[0];
    setPhotoPreview(nextPhoto);
    setAnalysisResult(null);
    onShowToast('New Photo Attached', 'Classroom desk zone snapshot captured from mobile camera.');
  };

  const handleRunAiCheck = () => {
    setAnalyzingProof(true);
    setTimeout(() => {
      setAnalyzingProof(false);
      setAnalysisResult('98.4% Cleanliness Confidence • Surface reflections uniform, zero pencil graphite or paper debris detected.');
      onShowToast('Optical Inspection Passed', 'Desk surfaces verified clean. Ready for faculty signoff.');
    }, 800);
  };

  const handleSubmit = () => {
    if (completedCount < totalCount) {
      onShowToast('Incomplete Checklist', `Please complete all ${totalCount} items before submitting.`);
      return;
    }
    onSubmitTask();
    onShowToast('Duty Submitted!', 'Ms. Alvarez has received your room sanitization proof for signoff.');
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Student Banner */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0051d5] animate-ping"></span>
            <span className="text-[11px] text-[#0051d5] uppercase tracking-wider font-semibold">
              Student Duty Portal
            </span>
          </div>
          <span className="text-xs text-[#45464d] font-medium">Marcus Lin • Grade 8-B</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0b1c30] tracking-tight">
              My Cleaning Protocol
            </h2>
            <p className="text-xs text-[#45464d]">
              Homeroom West Hall • Station 2 Caddy
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-[#e5eeff] text-[#0051d5] text-xs font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Due 16:30</span>
          </div>
        </div>
      </div>

      {/* Duty Status Card */}
      <div className="px-4 my-2">
        <div className={`p-4 rounded-2xl shadow-sm border ${
          task.status === 'Approved'
            ? 'bg-[#eff4ff] border-[#6ffbbe]/80'
            : task.status === 'Verifying'
            ? 'bg-[#e5eeff] border-[#d3e4fe]'
            : task.status === 'Redo Needed'
            ? 'bg-[#ffdad6]/60 border-[#ba1a1a]/40'
            : 'bg-[#131b2e] text-white border-transparent'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[22px] ${
                task.status === 'Approved'
                  ? 'text-[#009668]'
                  : task.status === 'Redo Needed'
                  ? 'text-[#ba1a1a]'
                  : 'text-[#dbe1ff]'
              }`}>
                {task.status === 'Approved'
                  ? 'verified'
                  : task.status === 'Verifying'
                  ? 'hourglass_top'
                  : task.status === 'Redo Needed'
                  ? 'warning'
                  : 'cleaning_services'}
              </span>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${
                  task.status === 'In Progress' || task.status === 'Issued' ? 'text-[#dbe1ff]' : 'text-[#0b1c30]'
                }`}>
                  {task.status === 'In Progress' ? 'Shift In Progress' : `Status: ${task.status}`}
                </p>
                <p className={`text-sm font-semibold ${
                  task.status === 'In Progress' || task.status === 'Issued' ? 'text-white' : 'text-[#0b1c30]'
                }`}>
                  {task.title}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
              {completedCount}/{totalCount} Done
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/30 h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                task.status === 'Approved'
                  ? 'bg-[#009668]'
                  : task.status === 'Redo Needed'
                  ? 'bg-[#ba1a1a]'
                  : 'bg-[#0051d5]'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[11px] mt-1.5 opacity-90">
            <span>{task.room}</span>
            <span>Supervisor: {task.assignedTeacher}</span>
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Checklist */}
      <div className="px-4 py-2">
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
                checklist_rtl
              </span>
              Sanitation Checklist
            </h3>
            <span className="text-xs text-[#0051d5] font-semibold">{progressPercent}% Completed</span>
          </div>

          <div className="space-y-2">
            {task.checklist.map((item, idx) => (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  item.done
                    ? 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
                    : 'bg-white border-[#e5eeff] hover:bg-[#f8f9ff]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(e) => onUpdateChecklist(item.id, e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded-md text-[#0051d5] border-2 border-[#76777d] focus:ring-[#0051d5] cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${item.done ? 'line-through text-[#7c839b]' : 'text-[#0b1c30]'}`}>
                      Step {idx + 1}
                    </span>
                    {item.done && (
                      <span className="text-[10px] text-[#009668] font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">check</span>
                        Done
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${item.done ? 'text-[#7c839b]' : 'text-[#45464d]'}`}>
                    {item.text}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Photo Proof & Optical Check */}
      <div className="px-4 py-2">
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#e5eeff] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
                photo_camera
              </span>
              Visual Proof Upload
            </h3>
            <button
              onClick={handleSimulatePhotoChange}
              className="text-xs font-semibold text-[#0051d5] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">autorenew</span>
              Retake / Swap
            </button>
          </div>

          <div className="relative h-44 rounded-xl overflow-hidden border border-[#dce9ff] bg-black">
            <img
              src={photoPreview}
              alt="Classroom Inspection Proof"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/70 text-white text-[10px] font-semibold backdrop-blur-sm">
              Attached Proof: Room 204
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-[#009668]/90 text-white text-[10px] font-bold backdrop-blur-sm">
              Eco-Shield 4 Verified
            </div>
          </div>

          {analysisResult && (
            <div className="p-3 rounded-xl bg-[#e5eeff] border border-[#6ffbbe] text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[#009668] font-bold">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Optical Cleanliness Pass</span>
              </div>
              <p className="text-[#0b1c30] leading-snug">{analysisResult}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRunAiCheck}
              disabled={analyzingProof}
              className="flex-1 h-11 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0051d5] text-xs font-semibold border border-[#dce9ff] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {analyzingProof ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  <span>Scanning Surface...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  <span>Pre-Check Quality</span>
                </>
              )}
            </button>

            <button
              onClick={handleSubmit}
              disabled={task.status === 'Verifying' || task.status === 'Approved'}
              className="flex-1 h-11 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] disabled:bg-[#7c839b] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {task.status === 'Approved' ? 'verified' : 'send'}
              </span>
              <span>
                {task.status === 'Approved'
                  ? 'Duty Approved!'
                  : task.status === 'Verifying'
                  ? 'In Review'
                  : 'Submit for Signoff'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Hygiene Merit Tracker */}
      <div className="px-4 py-2">
        <div className="p-4 rounded-2xl bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0051d5] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0b1c30]">Lincoln Custodial Merit</p>
              <p className="text-[11px] text-[#45464d]">Level 3 Eco-Steward • 142 Pts</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-[#009668] block">🔥 8 Day Streak</span>
            <span className="text-[10px] text-[#7c839b]">Rank #2 in Homeroom</span>
          </div>
        </div>
      </div>
    </div>
  );
};
