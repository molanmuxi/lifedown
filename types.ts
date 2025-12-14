export enum Tab {
  TODO = 'TODO',
  SCHEDULE = 'SCHEDULE',
  CALENDAR = 'CALENDAR',
  SPECIAL = 'SPECIAL'
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  date: string; // ISO Date string YYYY-MM-DD
  time?: string; // HH:mm
  reward?: string; // The reward text, e.g., "看一集动漫"
  rewardClaimed?: boolean; // Whether the reward has been consumed from the vault
  points?: number; // Optional points value
  isStarred?: boolean; // New: Priority flag
}

export interface NoteItem {
  id: string;
  content: string;
  date: string;
  color: string;
}

export interface Course {
  id: string;
  name: string;
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  startSection: number; // 1-based section index (e.g., 1 for 1st period)
  sectionCount: number; // How many periods (e.g., 2)
  room?: string;
  color: string;
}

export interface ScheduleSettings {
  startHour: number; // e.g., 8 for 08:00
  startMinute: number; // e.g., 0 or 30
  classDuration: number; // minutes per class, e.g., 45
  breakDuration: number; // minutes between classes, e.g., 10
  totalSections: number; // Total sections per day, e.g., 12
  specificBreaks?: { [afterSection: number]: number }; // Custom break duration after specific section
}

export interface SpecialDay {
  id: string;
  title: string;
  date: string; // ISO Date string
  type: 'COUNTDOWN' | 'ANNIVERSARY';
}

export interface PeriodLog {
  date: string; // YYYY-MM-DD
  flow?: number; // 1: Light, 2: Medium, 3: Heavy
  symptoms?: string[];
  mood?: string;
}

export interface PeriodData {
  lastPeriodStart: string; // ISO Date string
  previousPeriodStart?: string; // For undoing accidental updates
  cycleLength: number; // days
  periodLength: number; // days
  logs: PeriodLog[];
}