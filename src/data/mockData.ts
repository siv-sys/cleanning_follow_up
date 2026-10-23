import { AuditItem, SanitationSpot, StudentTask, NotificationItem } from '../types';

export const ASSETS = {
  logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXt6MC5OMY-M3atl4AC4WeQr4zBqhCVioYamuqcjzdeCjqYUobc-p0VWZNQBfIoTJaR7JuAaW4U6avCa3kkHws_nxIwPOl4ocjEENW48LLuIiWymjP8odxYPM2pM0TlVekaqwFFS5XDArRp5QFkDGCsXPK2e2Fz6HNqhGtusg46bD2Lns0wqlD3nCsqj3DrkWBQylDCD-1ebjWuj-mvuLE94C3YIPQKKaJGsnFocjrNfHKUhnA5R3g',
  profile: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApO-p-lNbv2yzxyZ3zZW2WVwOJx3J4Mq1oFTq_K2D8bIQC5K22KfCMtukdRJ_f8iQ5UU72mGvhpoRxAUsP0HAwokdGaYucDj3NqWMDpYa3e-ST5oF1vz-fCKE-18o4A8Q380Uz7jqJkOb6o8BfWTEGPuM9v6LW61gFsQLMr9i2vAtpOqVMZ57XSrHrIjQbom0c3tw3plXy0L2uu4muSIkOS8Th2JhTfb76LkS73IoL5QmqHn4RX8hI',
  room204: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIpTQbOAvqBV0WJgmHwV8gnPZ7BvS_kkQecpe8vIxF545QAeZEz9OJchIv7vxQDo7Po1CC62UArByo4YFg2ZdA6oby23hGLsNl93BHK4GpGlZhRL765NYA7ryvcReEFeRwSsJzZynl8WJlTpLl32sf7sE9RtfhXDhz-tcw4WSzaoOLatN0MbUvzpBWD9xATiw8DCQJ1s5Za3ViMrW89Py61TXHDhqq5bTtW1ZpRzUdj0f99NA_uKQR',
  lab305: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWu4zRmg-wWCSaUhfNMQo_HSDzC2i6XjY-SzttTqAPCrSBdZxAFJI_UvCn5gRWCJLU4DrFkr3AoAAWBQM6YhI2a6sRzfQlxrccSmknOdPefuZlVwWyy3Cylj2PM_YRIvKQyDPXNu-czvBzCgoyJi1tV6-HONejXLXzMQvKXb7ImOwypNe2XkwPGtxU_uxY0wgwce97uq5HzO6gRmmTBHXX3n2jHEQA7cctcSUPuh6eslZXKmgvwtv4',
  gym: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
  art: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
};

export const INITIAL_AUDIT_ITEMS: AuditItem[] = [
  {
    id: 'audit-1',
    studentName: 'Marcus Lin',
    initials: 'ML',
    room: 'Room 204',
    assignedTeacher: 'Ms. Alvarez (Homeroom)',
    zone: 'Zone: Desks & Board',
    status: 'Approved',
    timestamp: '4 mins ago (15:42)',
    photoUrl: ASSETS.room204,
    sanitizerUsed: 'Eco-Shield 4',
    notes: 'Desks aligned, surface sanitized with zero streak residue.',
    checklistItems: [
      { id: 'c1', text: 'Wiped 28 desk surfaces with Eco-Shield 4', done: true },
      { id: 'c2', text: 'Swept floor perimeter and under desk rows', done: true },
      { id: 'c3', text: 'Emptied recycling and trash containers', done: true },
      { id: 'c4', text: 'Whiteboard wiped clean with microfiber cloth', done: true }
    ]
  },
  {
    id: 'audit-2',
    studentName: 'Sora Kuroda',
    initials: 'SK',
    room: 'Room 101',
    assignedTeacher: 'Mr. Henderson (Physics)',
    zone: 'Zone: Lab Tables',
    status: 'Verifying',
    timestamp: '11 mins ago (15:35)',
    photoUrl: ASSETS.lab305,
    sanitizerUsed: 'BioClean Sol 2',
    notes: 'Awaiting faculty visual inspection of sink traps.',
    checklistItems: [
      { id: 'c1', text: 'Wipe black granite lab workstations', done: true },
      { id: 'c2', text: 'Flush eye wash basin and clear sinks', done: true },
      { id: 'c3', text: 'Store safety goggles in UV sanitizing cabinet', done: true }
    ]
  },
  {
    id: 'audit-3',
    studentName: 'Ethan Davies',
    initials: 'ED',
    room: 'Gym A',
    assignedTeacher: 'Coach Miller (Athletics)',
    zone: 'Bleacher floor unswept',
    status: 'Redo Needed',
    timestamp: '28 mins ago (15:18)',
    photoUrl: ASSETS.room204,
    sanitizerUsed: 'Floor Neutral Cleanser',
    notes: 'Bleacher floor lower section unswept; beverage container found.',
    checklistItems: [
      { id: 'c1', text: 'Mop basketball court perimeter', done: true },
      { id: 'c2', text: 'Sweep beneath bleacher tiers 1-4', done: false },
      { id: 'c3', text: 'Rack volleyball poles and secure equipment', done: true }
    ]
  }
];

export const INITIAL_SANITATION_SPOTS: SanitationSpot[] = [
  {
    id: 'spot-1',
    room: 'Room 204',
    wing: 'Homeroom Wing B',
    detail: 'Wiped with Eco-Shield 4',
    time: '15:42',
    photoUrl: ASSETS.room204,
    altText: 'Pristine high school classroom interior with neat blue desks, gleaming polished linoleum floor.',
    sanitizer: 'Eco-Shield 4 (Quat-4 Dilution)',
    inspector: 'Ms. Alvarez',
    hygieneScore: 99
  },
  {
    id: 'spot-2',
    room: 'Lab 305',
    wing: 'Science Corridor',
    detail: 'Sanitized 14:45',
    time: '14:45',
    photoUrl: ASSETS.lab305,
    altText: 'Modern junior high chemistry laboratory with clean black granite counters, spotless glass test tubes.',
    sanitizer: 'BioClean Laboratory Disinfectant',
    inspector: 'Mr. Henderson',
    hygieneScore: 97
  }
];

export const INITIAL_STUDENT_TASK: StudentTask = {
  id: 'task-today',
  title: 'End of Day Deep Clean & Sanitization',
  room: 'Grade 8-B (Room 204)',
  hall: 'West Hall',
  zone: 'Desk Sanitization & Sweeping',
  deadline: 'Today, 4:30 PM',
  allowResubmission: true,
  status: 'In Progress',
  studentName: 'Marcus Lin',
  assignedTeacher: 'Ms. Alvarez (Homeroom)',
  photoProofUrl: ASSETS.room204,
  checklist: [
    { id: 'c1', text: 'Disinfect all 28 desk tops and seat backs with Eco-Shield 4', done: true },
    { id: 'c2', text: 'Dry sweep aisles and under desk rows with microfiber push mop', done: true },
    { id: 'c3', text: 'Empty blue recycling bin and reline gray trash receptacle', done: false },
    { id: 'c4', text: 'Clean chalkboard/whiteboard tray and restock dry erase markers', done: false },
    { id: 'c5', text: 'Return cleaning caddy and spray bottles to Custodial Station 2', done: false }
  ]
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Room 204 Completed',
    detail: 'Marcus Lin submitted desk sanitization photo for review.',
    time: '4 mins ago',
    type: 'success',
    read: false
  },
  {
    id: 'n2',
    title: 'Redo Request Triggered',
    detail: 'Coach Miller requested bleacher floor resweep for Gym A.',
    time: '28 mins ago',
    type: 'warning',
    read: false
  },
  {
    id: 'n3',
    title: 'Campus Shift 16:30 Approaching',
    detail: 'All custodial checklists must be submitted within 38 minutes.',
    time: '1 hour ago',
    type: 'info',
    read: true
  }
];

export const ROOM_OPTIONS = [
  { value: 'room-204', label: 'Grade 8-B (Room 204) • West Hall', teacher: 'Ms. Alvarez' },
  { value: 'room-101', label: 'Grade 7-A (Room 101) • East Wing', teacher: 'Mr. Henderson' },
  { value: 'room-305', label: 'Biology Lab 3 (Room 305) • Sci Wing', teacher: 'Dr. Santos' },
  { value: 'room-gym', label: 'Junior Gymnasium • Athletic Wing', teacher: 'Coach Miller' },
  { value: 'room-art', label: 'Art Studio (Room 114) • North Annex', teacher: 'Ms. Vance' }
];

export const ZONE_OPTIONS = [
  { value: 'zone-desks', label: 'Desk Sanitization & Sweeping' },
  { value: 'zone-whiteboard', label: 'Whiteboard & Tech Surface Care' },
  { value: 'zone-waste', label: 'Waste Segregation & Bin Lining' },
  { value: 'zone-windows', label: 'Ventilation Grates & Window Sills' }
];
