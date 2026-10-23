import React, { useState } from 'react';
import { SanitationSpot } from '../types';

interface PhotoInspectionModalProps {
  spot: SanitationSpot | null;
  onClose: () => void;
  onVerifySpot?: (id: string) => void;
}

export const PhotoInspectionModal: React.FC<PhotoInspectionModalProps> = ({
  spot,
  onClose,
  onVerifySpot,
}) => {
  const [zoom, setZoom] = useState(false);
  const [verified, setVerified] = useState(false);

  if (!spot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#dce9ff] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#e5eeff] flex items-center justify-between bg-[#f8f9ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[22px]">verified</span>
            <div>
              <h3 className="font-semibold text-base text-[#0b1c30]">
                {spot.room} • {spot.wing}
              </h3>
              <p className="text-xs text-[#45464d]">Sanitation Audit Proof Log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#45464d] hover:text-[#0b1c30] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Image Viewport */}
        <div className="relative bg-slate-950 flex items-center justify-center overflow-hidden min-h-[260px] max-h-[380px]">
          <img
            src={spot.photoUrl}
            alt={spot.altText}
            className={`w-full h-full object-cover transition-transform duration-300 cursor-pointer ${
              zoom ? 'scale-150' : 'scale-100'
            }`}
            onClick={() => setZoom(!zoom)}
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#213145]/80 text-[#eaf1ff] text-xs font-semibold backdrop-blur-sm">
            {spot.room}
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 text-white text-xs backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Recorded at {spot.time}</span>
          </div>
          <button
            onClick={() => setZoom(!zoom)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/80 transition-colors"
            title={zoom ? 'Zoom out' : 'Zoom in'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {zoom ? 'zoom_out' : 'zoom_in'}
            </span>
          </button>
        </div>

        {/* Inspection Details & Metadata */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
              <span className="text-[#45464d] block font-medium">Applied Agent</span>
              <span className="text-[#0b1c30] font-semibold">{spot.sanitizer}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
              <span className="text-[#45464d] block font-medium">Faculty Signoff</span>
              <span className="text-[#0b1c30] font-semibold">{spot.inspector}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#e5eeff]/60 border border-[#dce9ff] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#009668] text-[22px]">auto_awesome</span>
              <div>
                <p className="text-xs font-semibold text-[#0b1c30]">Optical Cleanliness Index</p>
                <p className="text-[11px] text-[#45464d]">No streaks, zero dust accumulation detected</p>
              </div>
            </div>
            <span className="text-base font-bold text-[#009668]">{spot.hygieneScore}%</span>
          </div>

          <p className="text-xs text-[#45464d] leading-relaxed italic bg-white p-2 border border-[#e5eeff] rounded-lg">
            "{spot.altText}"
          </p>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#e5eeff] bg-[#f8f9ff] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#45464d] hover:bg-[#eff4ff] transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              setVerified(true);
              if (onVerifySpot) onVerifySpot(spot.id);
              setTimeout(onClose, 600);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0051d5] hover:bg-[#003ea8] shadow-sm transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">
              {verified ? 'check' : 'verified'}
            </span>
            <span>{verified ? 'Audit Certified!' : 'Certify Compliance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
