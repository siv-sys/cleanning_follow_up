import React, { useState } from 'react';
import { ROOM_OPTIONS, ZONE_OPTIONS } from '../data/mockData';

interface AssignClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: { room: string; zone: string; frequency: string; protocol: string }) => void;
}

export const AssignClassesModal: React.FC<AssignClassesModalProps> = ({
  isOpen,
  onClose,
  onAssign,
}) => {
  const [selectedRoom, setSelectedRoom] = useState(ROOM_OPTIONS[0].value);
  const [selectedZone, setSelectedZone] = useState(ZONE_OPTIONS[0].value);
  const [frequency, setFrequency] = useState('Daily Afternoon');
  const [protocol, setProtocol] = useState('Full Sanitization & Sweep');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roomObj = ROOM_OPTIONS.find((r) => r.value === selectedRoom);
    const zoneObj = ZONE_OPTIONS.find((z) => z.value === selectedZone);
    onAssign({
      room: roomObj ? roomObj.label : selectedRoom,
      zone: zoneObj ? zoneObj.label : selectedZone,
      frequency,
      protocol,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#dce9ff]">
        <div className="p-4 border-b border-[#e5eeff] flex items-center justify-between bg-[#f8f9ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[22px]">meeting_room</span>
            <h3 className="font-semibold text-base text-[#0b1c30]">Assign Class Protocol</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#45464d] hover:text-[#0b1c30] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#45464d] mb-1">
              Select Class / Room
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full h-11 px-3 bg-[#eff4ff] rounded-xl text-xs font-medium text-[#0b1c30] border border-[#dce9ff] focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
            >
              {ROOM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#45464d] mb-1">
              Sanitation Zone Focus
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full h-11 px-3 bg-[#eff4ff] rounded-xl text-xs font-medium text-[#0b1c30] border border-[#dce9ff] focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
            >
              {ZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#45464d] mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full h-11 px-3 bg-[#eff4ff] rounded-xl text-xs font-medium text-[#0b1c30] border border-[#dce9ff] focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
              >
                <option value="Daily Afternoon">Daily Afternoon</option>
                <option value="Twice Daily">Twice Daily</option>
                <option value="Weekly Deep Clean">Weekly Deep Clean</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#45464d] mb-1">Protocol Tier</label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full h-11 px-3 bg-[#eff4ff] rounded-xl text-xs font-medium text-[#0b1c30] border border-[#dce9ff] focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
              >
                <option value="Full Sanitization & Sweep">Level 2 Sanitation</option>
                <option value="Surface Wipe Only">Level 1 Quick Wipe</option>
                <option value="Biohazard / Lab Protocol">Level 3 Lab Protocol</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#e5eeff]/50 border border-[#dce9ff] text-xs space-y-1">
            <span className="font-semibold text-[#0051d5] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">info</span>
              Automatic Student Rotation
            </span>
            <p className="text-[#45464d]">
              This assignment will automatically roster registered homeroom students to custodial duty for today's afternoon cycle.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#45464d] hover:bg-[#eff4ff] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0051d5] hover:bg-[#003ea8] shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Confirm & Dispatch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
