import { ScheduleSettings, PeriodData } from './types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const daysOfWeek = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const colors = [
  'bg-blue-100 text-blue-600',
  'bg-pink-100 text-pink-600',
  'bg-purple-100 text-purple-600',
  'bg-yellow-100 text-yellow-700',
  'bg-green-100 text-green-600',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-600',
  'bg-rose-100 text-rose-600',
  'bg-cyan-100 text-cyan-700'
];

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getDayDiff = (d1: string, d2: string): number => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- Time Helpers ---

export const formatTime = (hour: number, minute: number): string => {
  const h = Math.floor(hour) % 24;
  const m = Math.floor(minute) % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Calculate start and end time string for a specific section
export const getSectionTimeRange = (section: number, count: number, settings: ScheduleSettings): { start: string, end: string } => {
  let currentMinutes = (settings.startHour * 60) + settings.startMinute;
  
  // Calculate start time of the requested section block
  // We iterate from section 1 up to the target section
  for (let i = 1; i < section; i++) {
    // Add duration of section i
    currentMinutes += settings.classDuration;
    
    // Add break after section i
    const specificBreak = settings.specificBreaks?.[i];
    const breakTime = specificBreak !== undefined ? specificBreak : settings.breakDuration;
    currentMinutes += breakTime;
  }

  const startMinutes = currentMinutes;
  
  // Calculate duration of the block (which might span multiple sections)
  // The block ends after 'count' sections.
  let durationMinutes = 0;
  for (let i = 0; i < count; i++) {
    durationMinutes += settings.classDuration;
    
    // Add break if it's not the last section in this block
    if (i < count - 1) {
       const currentSectionIndex = section + i;
       const specificBreak = settings.specificBreaks?.[currentSectionIndex];
       const breakTime = specificBreak !== undefined ? specificBreak : settings.breakDuration;
       durationMinutes += breakTime;
    }
  }

  const endMinutes = startMinutes + durationMinutes;

  const startH = Math.floor(startMinutes / 60);
  const startM = startMinutes % 60;
  
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;

  return {
    start: formatTime(startH, startM),
    end: formatTime(endH, endM)
  };
};

// --- Period Helpers ---

export type PeriodPhase = 'MENSTRUAL' | 'OVULATION' | 'OVULATION_DAY' | 'SAFE';

export const getCyclePhase = (date: Date, data: PeriodData): { 
  phase: PeriodPhase; 
  dayOfCycle: number; 
  label: string; 
  color: string;
  bg: string;
} => {
  const start = new Date(data.lastPeriodStart);
  
  // Calculate days difference
  const diffTime = date.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate current cycle number and day within cycle
  // diffDays can be negative if date is before lastPeriodStart
  let cycleIndex = Math.floor(diffDays / data.cycleLength);
  
  // Current cycle start date
  const currentCycleStart = new Date(start);
  currentCycleStart.setDate(start.getDate() + cycleIndex * data.cycleLength);
  
  // Day of cycle (1-based)
  const dayOfCycle = Math.floor((date.getTime() - currentCycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Ovulation logic
  // Ovulation day is usually 14 days before the NEXT period
  const ovulationDay = data.cycleLength - 14; 
  const ovulationStart = ovulationDay - 5;
  const ovulationEnd = ovulationDay + 4;

  if (dayOfCycle >= 1 && dayOfCycle <= data.periodLength) {
    return { phase: 'MENSTRUAL', dayOfCycle, label: '经期', color: 'text-pink-500', bg: 'bg-pink-400' };
  } else if (dayOfCycle === ovulationDay) {
    return { phase: 'OVULATION_DAY', dayOfCycle, label: '排卵日', color: 'text-purple-500', bg: 'bg-purple-400' };
  } else if (dayOfCycle >= ovulationStart && dayOfCycle <= ovulationEnd) {
    return { phase: 'OVULATION', dayOfCycle, label: '排卵期', color: 'text-purple-400', bg: 'bg-purple-300' };
  } else {
    return { phase: 'SAFE', dayOfCycle, label: '安全期', color: 'text-green-500', bg: 'bg-green-400' };
  }
};