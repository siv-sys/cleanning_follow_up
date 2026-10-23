import React, { useState } from 'react';
import { AuditItem, SanitationSpot } from '../types';
import { ROOM_OPTIONS, ZONE_OPTIONS } from '../data/mockData';

interface AdminScreenProps {
  auditItems: AuditItem[];
  sanitationSpots: SanitationSpot[];
  onDispatchTask: (taskData: {
    title: string;
    room: string;
    zone: string;
    allowResubmission: boolean;
  }) => void;
  onOpenAssignModal: () => void;
  onInspectSpot: (spot: SanitationSpot) => void;
  onShowToast: (title: string, subtitle: string) => void;
  onExportCSV: () => void;
  onSelectAuditItem: (item: AuditItem) => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  auditItems,
  sanitationSpots,
  onDispatchTask,
  onOpenAssignModal,
  onInspectSpot,
  onShowToast,
  onExportCSV,
  onSelectAuditItem,
}) => {
  const [shiftView, setShiftView] = useState<'live' | 'audit'>('live');
  const [taskTitle, setTaskTitle] = useState('End of Day Deep Clean & Sanitization');
  const [selectedRoom, setSelectedRoom] = useState(ROOM_OPTIONS[0].value);
  const [selectedZone, setSelectedZone] = useState(ZONE_OPTIONS[0].value);
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [streamFilter, setStreamFilter] = useState<'All' | 'Approved' | 'Verifying' | 'Redo Needed'>('All');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);

    const roomObj = ROOM_OPTIONS.find((r) => r.value === selectedRoom);
    const zoneObj = ZONE_OPTIONS.find((z) => z.value === selectedZone);

    setTimeout(() => {
      setIsDispatching(false);
      onDispatchTask({
        title: taskTitle,
        room: roomObj ? roomObj.label.split('•')[0].trim() : selectedRoom,
        zone: zoneObj ? zoneObj.label : selectedZone,
        allowResubmission,
      });
      onShowToast('Task successfully dispatched!', `${roomObj?.label.split('•')[0].trim()} students notified via app.`);
    }, 700);
  };

  const scrollToDispatcher = () => {
    const el = document.getElementById('dispatcherSection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const input = document.getElementById('taskTitleInput');
      if (input) (input as HTMLElement).focus();
    }
  };

  const handleSyncFeed = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onShowToast('Feed Refreshed', 'Retrieved latest custodian verifications from Lincoln campus.');
    }, 600);
  };

  const handleVerifySync = () => {
    onShowToast('Database Sync Verified', 'Supabase cluster ping 24ms • 142 records backed up safely.');
  };

  const filteredAuditItems = auditItems.filter((item) => {
    if (streamFilter === 'All') return true;
    return item.status === streamFilter;
  });

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Operational Context Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-flex w-2.5 h-2.5 rounded-full bg-[#009668] animate-pulse"></span>
            <span className="text-[11px] text-[#0051d5] uppercase tracking-wider font-semibold">
              Campus Operations
            </span>
          </div>
          <span className="text-xs text-[#45464d] font-medium">Term 2 • Week 8</span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0b1c30] tracking-tight">
              Lincoln Middle School
            </h2>
            <p className="text-xs text-[#45464d]">
              Executive custodial readiness & sanitation log
            </p>
          </div>

          {/* Campus Shift Selector Switch */}
          <div className="bg-[#dce9ff] p-1 rounded-xl flex items-center shadow-sm">
            <button
              onClick={() => {
                setShiftView('live');
                onShowToast('Live View Mode Active', 'Real-time telemetry and task dispatch updated.');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                shiftView === 'live'
                  ? 'bg-white text-[#0051d5] shadow-sm'
                  : 'text-[#45464d] hover:text-[#0b1c30]'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => {
                setShiftView('audit');
                onShowToast('Audit Log View Active', 'Displaying compliance history and faculty archives.');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                shiftView === 'audit'
                  ? 'bg-white text-[#0051d5] shadow-sm'
                  : 'text-[#45464d] hover:text-[#0b1c30]'
              }`}
            >
              Audit
            </button>
          </div>
        </div>
      </div>

      {/* Campus Mascot & High-level Status Banner */}
      <div className="px-4 my-2">
        <div className="relative overflow-hidden rounded-2xl bg-[#131b2e] text-white p-4 shadow-md">
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#dbe1ff] text-[20px]">
                  verified
                </span>
                <span className="text-[11px] text-[#dbe1ff] uppercase tracking-wider font-semibold">
                  Health Audit Compliant
                </span>
              </div>
              <p className="text-base text-white font-semibold">
                Afternoon Clean Cycle Active
              </p>
              <p className="text-xs text-[#7c839b]">
                Next campus-wide inspection at 16:30 EST
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-[#0051d5] flex items-center justify-center flex-shrink-0 shadow-inner">
              <span
                className="material-symbols-outlined text-white text-[30px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                cleaning_services
              </span>
            </div>
          </div>
          {/* Decorative radial shimmer */}
          <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-[#0051d5]/30 blur-2xl pointer-events-none"></div>
        </div>
      </div>

      {/* Quick Action Command Row */}
      <div className="px-4 py-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={scrollToDispatcher}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            <span>+ New Task</span>
          </button>
          <button
            onClick={onOpenAssignModal}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold shadow-sm active:scale-95 transition-all hover:bg-[#d3e4fe] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">meeting_room</span>
            <span>Assign Classes</span>
          </button>
          <button
            onClick={onExportCSV}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold shadow-sm active:scale-95 transition-all hover:bg-[#d3e4fe] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">cloud_download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Real-Time Metrics & KPI Grid (2x2) */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-2 gap-2.5">
          {/* KPI 1: Submissions */}
          <div className="p-4 rounded-xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#45464d] uppercase">Submissions</span>
              <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#0051d5]">
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#0b1c30] tabular-nums">
                  {140 + auditItems.length}
                </span>
                <span className="text-[11px] text-[#009668] font-semibold">95%</span>
              </div>
              <div className="w-full bg-[#dce9ff] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#0051d5] h-full rounded-full transition-all duration-500"
                  style={{ width: '95%' }}
                ></div>
              </div>
              <span className="text-[11px] text-[#45464d] block mt-1">Target 150 daily</span>
            </div>
          </div>

          {/* KPI 2: Pending Verifications */}
          <div className="p-4 rounded-xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#45464d] uppercase">Pending Audit</span>
              <div className="w-8 h-8 rounded-lg bg-[#dce9ff] flex items-center justify-center text-[#316bf3]">
                <span className="material-symbols-outlined text-[18px]">pending_actions</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#0b1c30] tabular-nums">
                  {auditItems.filter((i) => i.status === 'Verifying').length + 8}
                </span>
                <span className="text-[11px] text-[#ba1a1a] font-semibold">Action req.</span>
              </div>
              <p className="text-[11px] text-[#45464d] mt-2 leading-tight">
                3 rooms awaiting faculty signoff
              </p>
            </div>
          </div>

          {/* KPI 3: Active Zones */}
          <div className="p-4 rounded-xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#45464d] uppercase">Active Zones</span>
              <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#0b1c30]">
                <span className="material-symbols-outlined text-[18px]">domain</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#0b1c30]">8</span>
                <span className="text-[11px] text-[#45464d]">/ 10 Wings</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="w-2 h-2 rounded-full bg-[#009668]"></span>
                <span className="text-[11px] text-[#45464d] truncate">East & West Quad</span>
              </div>
            </div>
          </div>

          {/* KPI 4: Compliance Score + Sparkline */}
          <div className="p-4 rounded-xl bg-white shadow-sm border border-[#e5eeff] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#45464d] uppercase">Hygiene Index</span>
              <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#009668]">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-[#009668]">98%</span>
                <span className="text-[11px] text-[#009668] font-semibold">+1.4%</span>
              </div>
              {/* Micro SVG Sparkline */}
              <div className="w-full h-6 mt-1 flex items-end">
                <svg
                  className="w-full h-full text-[#009668] overflow-visible"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 24"
                >
                  <path
                    d="M0,20 L15,18 L30,22 L45,14 L60,16 L75,8 L90,10 L100,2"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create & Dispatch Task Card (Quick Dispatcher) */}
      <div className="px-4 py-2" id="dispatcherSection">
        <div className="p-4 rounded-2xl bg-white shadow-md border border-[#e5eeff]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0051d5] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">send_time_extension</span>
              </div>
              <h3 className="font-semibold text-sm text-[#0b1c30]">Quick Task Dispatcher</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#dbe1ff] text-[#00174b] text-[10px] font-semibold">
              Standard Protocol
            </span>
          </div>

          <form onSubmit={handleDispatch} className="space-y-3.5">
            {/* Task Title Input */}
            <div className="space-y-1">
              <label
                className="text-[11px] text-[#45464d] font-semibold flex items-center justify-between"
                htmlFor="taskTitleInput"
              >
                <span>Task Protocol Title</span>
                <span className="text-[#0051d5] font-semibold">Required</span>
              </label>
              <div className="relative">
                <input
                  id="taskTitleInput"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full h-11 px-3 bg-[#eff4ff] rounded-xl text-xs text-[#0b1c30] font-medium border border-transparent focus:border-[#0051d5] focus:bg-white focus:outline-none transition-all"
                  placeholder="e.g. Science Lab Chemical Wipe-down"
                  required
                  type="text"
                />
              </div>
            </div>

            {/* Room & Zone Selectors */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Room Selector */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#45464d] font-semibold" htmlFor="roomSelect">
                  Assigned Class / Room
                </label>
                <div className="relative flex items-center">
                  <select
                    id="roomSelect"
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full h-11 px-3 pr-10 bg-[#eff4ff] rounded-xl text-xs text-[#0b1c30] font-medium appearance-none border border-transparent focus:border-[#0051d5] focus:bg-white focus:outline-none"
                  >
                    {ROOM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 pointer-events-none text-[#45464d] text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Zone Selector */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#45464d] font-semibold" htmlFor="zoneSelect">
                  Designated Sanitation Zone
                </label>
                <div className="relative flex items-center">
                  <select
                    id="zoneSelect"
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full h-11 px-3 pr-10 bg-[#eff4ff] rounded-xl text-xs text-[#0b1c30] font-medium appearance-none border border-transparent focus:border-[#0051d5] focus:bg-white focus:outline-none"
                  >
                    {ZONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 pointer-events-none text-[#45464d] text-[20px]">
                    layers
                  </span>
                </div>
              </div>
            </div>

            {/* Deadline & Resubmission Settings */}
            <div className="p-3 rounded-xl bg-[#eff4ff] space-y-2 border border-[#dce9ff]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#0051d5] text-[18px]">timer</span>
                  <span className="text-xs font-semibold text-[#0b1c30]">Inspection Deadline</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#e5eeff] text-[#0051d5] text-xs font-semibold">
                  Today, 4:30 PM
                </span>
              </div>

              {/* Toggle: Allow Resubmission if Rejected */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#0b1c30]">Allow Resubmission</span>
                  <span className="text-[10px] text-[#45464d]">
                    Allows student re-clean if unapproved
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    checked={allowResubmission}
                    onChange={(e) => setAllowResubmission(e.target.checked)}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-[#d3e4fe] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0051d5]"></div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={isDispatching}
              className="w-full h-11 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] disabled:opacity-75 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer"
              type="submit"
            >
              {isDispatching ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span>Dispatching to Students...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Dispatch Task to Students</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Live Operations Feed & Activity Log */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-[#0b1c30]">Live Audit Stream</h3>
            <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-ping"></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncFeed}
              disabled={isSyncing}
              className="text-xs font-semibold text-[#0051d5] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
          {(['All', 'Approved', 'Verifying', 'Redo Needed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStreamFilter(filter)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer flex-shrink-0 ${
                streamFilter === filter
                  ? 'bg-[#0051d5] text-white shadow-xs'
                  : 'bg-white text-[#45464d] border border-[#e5eeff] hover:bg-[#eff4ff]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Feed Items Container */}
        <div className="space-y-2.5" id="activityFeedList">
          {filteredAuditItems.map((item) => {
            const isApproved = item.status === 'Approved';
            const isVerifying = item.status === 'Verifying';
            const isRedo = item.status === 'Redo Needed';
            const isIssued = item.status === 'Issued';

            return (
              <div
                key={item.id}
                onClick={() => onSelectAuditItem(item)}
                className={`p-3.5 rounded-xl bg-white shadow-sm border border-[#e5eeff] flex flex-col gap-1.5 transition-all hover:bg-[#eff4ff]/50 cursor-pointer ${
                  isIssued ? 'border-l-4 border-l-[#0051d5]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isRedo
                          ? 'bg-[#ffdad6] text-[#93000a]'
                          : isApproved
                          ? 'bg-[#e5eeff] text-[#0051d5]'
                          : isVerifying
                          ? 'bg-[#dce9ff] text-[#0b1c30]'
                          : 'bg-[#dbe1ff] text-[#00174b]'
                      }`}
                    >
                      {item.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#0b1c30] truncate">
                          {item.studentName}
                        </span>
                        <span className="text-[11px] text-[#45464d] truncate">
                          • {item.room}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#45464d] truncate">
                        Assigned: {item.assignedTeacher}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                      isApproved
                        ? 'bg-[#e5eeff] text-[#009668]'
                        : isVerifying
                        ? 'bg-[#d3e4fe] text-[#00174b]'
                        : isRedo
                        ? 'bg-[#ffdad6] text-[#93000a]'
                        : 'bg-[#d3e4fe] text-[#0051d5]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {isApproved
                        ? 'check_circle'
                        : isVerifying
                        ? 'hourglass_top'
                        : isRedo
                        ? 'priority_high'
                        : 'send'}
                    </span>
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#f8f9ff]">
                  <span className="text-[11px] text-[#45464d] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {item.timestamp}
                  </span>
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-0.5 ${
                      isRedo ? 'text-[#ba1a1a]' : 'text-[#0051d5]'
                    }`}
                  >
                    {item.zone}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campus Facility Zone Gallery */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-[#0b1c30]">Active Sanitation Spots</h3>
          <span className="text-[11px] text-[#45464d]">Live Photo Log</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {sanitationSpots.map((spot) => (
            <div
              key={spot.id}
              onClick={() => onInspectSpot(spot)}
              className="space-y-1.5 cursor-pointer group"
            >
              <div className="h-28 rounded-xl overflow-hidden shadow-sm relative border border-[#e5eeff]">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={spot.photoUrl}
                  alt={spot.altText}
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#213145]/85 text-[#eaf1ff] text-[10px] font-semibold backdrop-blur-sm">
                  {spot.room}
                </span>
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] backdrop-blur-sm">
                  {spot.time}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0b1c30] group-hover:text-[#0051d5] transition-colors">
                  {spot.wing}
                </p>
                <p className="text-[11px] text-[#45464d]">{spot.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* End of Day Inspection Protocol Footer Widget */}
      <div className="px-4 py-3">
        <div className="p-3.5 rounded-xl bg-[#e5eeff] flex items-center justify-between shadow-sm border border-[#dce9ff]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-[#0051d5] text-[24px]">security</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0b1c30] truncate">
                Supabase DB Sync: Online
              </p>
              <p className="text-[11px] text-[#45464d] truncate">
                All 142 records backed up safely
              </p>
            </div>
          </div>
          <button
            onClick={handleVerifySync}
            className="px-3 py-1.5 rounded-lg bg-white text-[#0b1c30] text-[11px] font-semibold shadow-sm active:scale-95 hover:bg-[#eff4ff] transition-all flex-shrink-0 cursor-pointer"
          >
            Verify Sync
          </button>
        </div>
      </div>
    </div>
  );
};
