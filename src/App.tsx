import { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast, ToastData } from './components/Toast';
import { AdminScreen } from './components/AdminScreen';
import { StudentScreen } from './components/StudentScreen';
import { TeacherScreen } from './components/TeacherScreen';
import { AuthScreen } from './components/AuthScreen';
import { AssignClassesModal } from './components/AssignClassesModal';
import { PhotoInspectionModal } from './components/PhotoInspectionModal';
import { NotificationsModal } from './components/NotificationsModal';
import {
  INITIAL_AUDIT_ITEMS,
  INITIAL_SANITATION_SPOTS,
  INITIAL_STUDENT_TASK,
  INITIAL_NOTIFICATIONS,
  ASSETS,
} from './data/mockData';
import { UserRole, AuditItem, SanitationSpot, StudentTask, NotificationItem } from './types';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [toast, setToast] = useState<ToastData | null>(null);

  // Core application state
  const [auditItems, setAuditItems] = useState<AuditItem[]>(INITIAL_AUDIT_ITEMS);
  const [sanitationSpots, setSanitationSpots] = useState<SanitationSpot[]>(INITIAL_SANITATION_SPOTS);
  const [studentTask, setStudentTask] = useState<StudentTask>(INITIAL_STUDENT_TASK);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<SanitationSpot | null>(null);
  const [selectedAuditItem, setSelectedAuditItem] = useState<AuditItem | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Desktop layout width toggle: 'compact' (mobile 430px) or 'expanded' (tablet/desktop 640px)
  const [viewWidth, setViewWidth] = useState<'compact' | 'expanded'>('compact');

  const showToast = (title: string, subtitle: string) => {
    setToast({ title, subtitle });
    setTimeout(() => {
      setToast(null);
    }, 3400);
  };

  // Dispatch a new task
  const handleDispatchTask = (data: {
    title: string;
    room: string;
    zone: string;
    allowResubmission: boolean;
  }) => {
    const newItem: AuditItem = {
      id: `audit-${Date.now()}`,
      studentName: 'Marcus Lin (Duty Cadet)',
      initials: 'ML',
      room: data.room,
      assignedTeacher: 'Ms. Alvarez (Homeroom)',
      zone: `Zone: ${data.zone}`,
      status: 'Issued',
      timestamp: 'Just now',
      notes: 'New protocol issued by custodial dispatch.',
      photoUrl: ASSETS.room204,
      checklistItems: [
        { id: 'c1', text: `Sanitize surfaces in ${data.zone}`, done: false },
        { id: 'c2', text: 'Floor sweep & debris collection', done: false },
        { id: 'c3', text: 'Waste segregation & bin lining', done: false },
      ],
      sanitizerUsed: 'Eco-Shield 4',
    };

    setAuditItems((prev) => [newItem, ...prev]);

    // Update student task
    setStudentTask((prev) => ({
      ...prev,
      title: data.title,
      room: data.room,
      zone: data.zone,
      status: 'Issued',
      checklist: prev.checklist.map((c) => ({ ...c, done: false })),
    }));

    // Add notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Task Dispatched: ${data.room}`,
      detail: `${data.title} protocol assigned to students.`,
      time: 'Just now',
      type: 'info',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Bulk class assign handler
  const handleAssignClasses = (data: {
    room: string;
    zone: string;
    frequency: string;
    protocol: string;
  }) => {
    handleDispatchTask({
      title: data.protocol,
      room: data.room.split('•')[0].trim(),
      zone: data.zone,
      allowResubmission: true,
    });
    showToast('Classes Assigned!', `Classroom roster updated with ${data.frequency} frequency.`);
  };

  // Update student checklist
  const handleUpdateChecklist = (itemId: string, done: boolean) => {
    setStudentTask((prev) => {
      const updatedChecklist = prev.checklist.map((item) =>
        item.id === itemId ? { ...item, done } : item
      );
      const allDone = updatedChecklist.every((c) => c.done);
      return {
        ...prev,
        checklist: updatedChecklist,
        status: allDone ? 'In Progress' : 'In Progress',
      };
    });
  };

  // Submit student duty
  const handleSubmitStudentTask = () => {
    setStudentTask((prev) => ({
      ...prev,
      status: 'Verifying',
      submittedAt: 'Just now',
    }));

    // Update audit item in stream
    setAuditItems((prev) => {
      const existing = prev.find((item) => item.studentName.includes('Marcus'));
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id
            ? { ...item, status: 'Verifying', timestamp: 'Just now' }
            : item
        );
      }
      return [
        {
          id: `audit-${Date.now()}`,
          studentName: 'Marcus Lin',
          initials: 'ML',
          room: 'Room 204',
          assignedTeacher: 'Ms. Alvarez (Homeroom)',
          zone: 'Zone: Desks & Board',
          status: 'Verifying',
          timestamp: 'Just now',
          photoUrl: ASSETS.room204,
          sanitizerUsed: 'Eco-Shield 4',
        },
        ...prev,
      ];
    });

    // Add alert
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Room 204 Ready for Signoff',
        detail: 'Marcus Lin uploaded verification photo and completed all tasks.',
        time: 'Just now',
        type: 'info',
        read: false,
      },
      ...prev,
    ]);
  };

  // Teacher approves audit
  const handleApproveAudit = (id: string) => {
    setAuditItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Approved' } : item))
    );

    if (id === 'audit-1' || id.includes('Marcus')) {
      setStudentTask((prev) => ({
        ...prev,
        status: 'Approved',
      }));
    }

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Duty Pass Certified',
        detail: 'Faculty signoff completed. Room added to compliant sanitation log.',
        time: 'Just now',
        type: 'success',
        read: false,
      },
      ...prev,
    ]);
  };

  // Teacher flags redo
  const handleRequestRedo = (id: string, reason: string) => {
    setAuditItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'Redo Needed',
              notes: reason,
              zone: reason,
            }
          : item
      )
    );

    if (id === 'audit-1' || id.includes('Marcus')) {
      setStudentTask((prev) => ({
        ...prev,
        status: 'Redo Needed',
        teacherNote: reason,
      }));
    }

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Action Required: Redo Flagged',
        detail: reason,
        time: 'Just now',
        type: 'warning',
        read: false,
      },
      ...prev,
    ]);
  };

  // Export CSV download
  const handleExportCSV = () => {
    const csvHeader = 'ID,Student,Room,Supervisor,Zone,Status,Timestamp,Sanitizer\n';
    const csvRows = auditItems
      .map(
        (i) =>
          `"${i.id}","${i.studentName}","${i.room}","${i.assignedTeacher}","${i.zone}","${i.status}","${i.timestamp}","${i.sanitizerUsed || 'Eco-Shield 4'}"`
      )
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CleanSchool_Audit_LincolnMiddle_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Report Downloaded', 'Exported Lincoln Middle School sanitation audit log CSV.');
  };

  // Reset to default demo state
  const handleResetData = () => {
    setAuditItems(INITIAL_AUDIT_ITEMS);
    setSanitationSpots(INITIAL_SANITATION_SPOTS);
    setStudentTask(INITIAL_STUDENT_TASK);
    setNotifications(INITIAL_NOTIFICATIONS);
    showToast('State Reset', 'Application demo state restored to default initial values.');
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-start text-[#0b1c30]">
      {/* Top Floating Viewport Sizer Bar for desktop previews */}
      <aside aria-label="Desktop controls" className="hidden md:flex w-full max-w-2xl px-4 py-2 items-center justify-between text-xs text-[#7c839b] border-b border-[#e2e8f0] bg-white/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#009668]"></span>
          <span className="font-semibold text-[#0b1c30]">CleanSchool Mobile Architecture</span>
          <span>• Lincoln Middle School</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">View Mode:</span>
          <button
            onClick={() => setViewWidth('compact')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              viewWidth === 'compact'
                ? 'bg-[#0051d5] text-white'
                : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#dce9ff]'
            }`}
          >
            Mobile (430px)
          </button>
          <button
            onClick={() => setViewWidth('expanded')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              viewWidth === 'expanded'
                ? 'bg-[#0051d5] text-white'
                : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#dce9ff]'
            }`}
          >
            Expanded (600px)
          </button>
        </div>
      </aside>

      {/* Main Responsive App Frame Container */}
      <div
        className={`w-full min-h-screen bg-[#f8f9ff] flex flex-col relative shadow-2xl transition-all duration-300 md:my-4 md:rounded-3xl md:border md:border-[#dce9ff] md:overflow-hidden ${
          viewWidth === 'compact' ? 'max-w-[430px]' : 'max-w-[620px]'
        }`}
      >
        {/* Fixed Header */}
        <Header
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          notifications={notifications}
        />

        {/* Global Toast */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Main Content Area */}
        <main className="flex-1 w-full pt-16 pb-20 bg-[#f8f9ff]">
          {currentRole === 'admin' && (
            <AdminScreen
              auditItems={auditItems}
              sanitationSpots={sanitationSpots}
              onDispatchTask={handleDispatchTask}
              onOpenAssignModal={() => setIsAssignModalOpen(true)}
              onInspectSpot={(spot) => setSelectedSpot(spot)}
              onShowToast={showToast}
              onExportCSV={handleExportCSV}
              onSelectAuditItem={(item) => setSelectedAuditItem(item)}
            />
          )}

          {currentRole === 'student' && (
            <StudentScreen
              task={studentTask}
              onUpdateChecklist={handleUpdateChecklist}
              onSubmitTask={handleSubmitStudentTask}
              onShowToast={showToast}
            />
          )}

          {currentRole === 'teacher' && (
            <TeacherScreen
              auditItems={auditItems}
              studentTask={studentTask}
              onApproveAudit={handleApproveAudit}
              onRequestRedo={handleRequestRedo}
              onShowToast={showToast}
              onSelectAuditItem={(item) => setSelectedAuditItem(item)}
            />
          )}

          {currentRole === 'auth' && (
            <AuthScreen
              currentRole={currentRole}
              onRoleChange={setCurrentRole}
              onExportCSV={handleExportCSV}
              onResetData={handleResetData}
              onShowToast={showToast}
            />
          )}
        </main>

        {/* Fixed Bottom Navigation */}
        <BottomNav currentRole={currentRole} onRoleChange={setCurrentRole} />

        {/* Modals & Drawers */}
        <AssignClassesModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={handleAssignClasses}
        />

        <PhotoInspectionModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onVerifySpot={(id) => {
            showToast('Inspection Spot Verified', `Spot #${id} certified compliant.`);
          }}
        />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllRead={() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            showToast('Alerts Cleared', 'All notifications marked as read.');
          }}
          onClear={() => {
            setNotifications([]);
            showToast('Inbox Empty', 'Cleared all notification items.');
          }}
        />

        {/* Inspection Details Dialog for Live Audit Items */}
        {selectedAuditItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-[#dce9ff] flex flex-col">
              <div className="p-4 border-b border-[#e5eeff] flex items-center justify-between bg-[#f8f9ff]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#eff4ff] text-[#0051d5] flex items-center justify-center font-bold text-xs">
                    {selectedAuditItem.initials}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0b1c30]">
                      {selectedAuditItem.studentName}
                    </h3>
                    <p className="text-[11px] text-[#45464d]">{selectedAuditItem.room}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAuditItem(null)}
                  className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#45464d] hover:text-[#0b1c30]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {selectedAuditItem.photoUrl && (
                <div className="relative h-40 bg-black">
                  <img
                    src={selectedAuditItem.photoUrl}
                    alt="Proof"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] backdrop-blur-sm">
                    {selectedAuditItem.zone}
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] backdrop-blur-sm">
                    {selectedAuditItem.timestamp}
                  </div>
                </div>
              )}

              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#e5eeff]">
                  <span className="text-[#45464d]">Assigned Supervisor</span>
                  <span className="font-semibold text-[#0b1c30]">
                    {selectedAuditItem.assignedTeacher}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#e5eeff]">
                  <span className="text-[#45464d]">Sanitizer Chemical</span>
                  <span className="font-semibold text-[#0b1c30]">
                    {selectedAuditItem.sanitizerUsed || 'Eco-Shield 4'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#45464d]">Audit Status</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      selectedAuditItem.status === 'Approved'
                        ? 'bg-[#e5eeff] text-[#009668]'
                        : selectedAuditItem.status === 'Redo Needed'
                        ? 'bg-[#ffdad6] text-[#93000a]'
                        : 'bg-[#d3e4fe] text-[#00174b]'
                    }`}
                  >
                    {selectedAuditItem.status}
                  </span>
                </div>

                {selectedAuditItem.notes && (
                  <div className="p-2.5 rounded-xl bg-[#eff4ff] text-[11px] text-[#45464d]">
                    <span className="font-semibold block text-[#0b1c30]">Inspector Note:</span>
                    {selectedAuditItem.notes}
                  </div>
                )}
              </div>

              <div className="p-3 bg-[#f8f9ff] border-t border-[#e5eeff] flex gap-2">
                <button
                  onClick={() => {
                    handleRequestRedo(selectedAuditItem.id, 'Resweep required under furniture');
                    setSelectedAuditItem(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-[#ffdad6] text-[#ba1a1a] font-semibold text-xs hover:bg-[#ffdad6]/30 transition-colors"
                >
                  Request Redo
                </button>
                <button
                  onClick={() => {
                    handleApproveAudit(selectedAuditItem.id);
                    setSelectedAuditItem(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#0051d5] text-white font-semibold text-xs hover:bg-[#003ea8] shadow-sm transition-all"
                >
                  Approve Signoff
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
