import React from 'react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClear: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#dce9ff] flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-[#e5eeff] flex items-center justify-between bg-[#f8f9ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5] text-[22px]">notifications</span>
            <div>
              <h3 className="font-semibold text-base text-[#0b1c30]">Campus Alerts</h3>
              <p className="text-[11px] text-[#45464d]">Custodial & Inspection Updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#45464d] hover:text-[#0b1c30] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-3 bg-[#eff4ff] border-b border-[#e5eeff] flex items-center justify-between text-xs">
          <span className="text-[#45464d] font-medium">
            {notifications.filter((n) => !n.read).length} unread updates
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[#0051d5] hover:underline font-semibold"
            >
              Mark all read
            </button>
            <span className="text-[#c6c6cd]">|</span>
            <button
              onClick={onClear}
              className="text-[#ba1a1a] hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2.5 overflow-y-auto divide-y divide-[#e5eeff]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7c839b]">
              <span className="material-symbols-outlined text-[32px] text-[#bec6e0] block mb-1">
                notifications_off
              </span>
              No notifications at this time
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`pt-2.5 first:pt-0 flex items-start gap-3 ${
                  !notif.read ? 'bg-[#eff4ff]/60 -mx-2 px-2 py-2 rounded-xl' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                    notif.type === 'success'
                      ? 'bg-[#009668]'
                      : notif.type === 'warning'
                      ? 'bg-[#ba1a1a]'
                      : 'bg-[#0051d5]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {notif.type === 'success'
                      ? 'task_alt'
                      : notif.type === 'warning'
                      ? 'priority_high'
                      : 'info'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#0b1c30] truncate">{notif.title}</p>
                    <span className="text-[10px] text-[#7c839b]">{notif.time}</span>
                  </div>
                  <p className="text-[11px] text-[#45464d] mt-0.5 leading-tight">{notif.detail}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[#e5eeff] bg-[#f8f9ff] text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold text-[#0051d5] hover:bg-[#eff4ff] transition-colors"
          >
            Close Alerts
          </button>
        </div>
      </div>
    </div>
  );
};
