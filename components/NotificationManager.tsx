import React, { useEffect, useRef } from 'react';
import { Course, ScheduleSettings, PeriodData } from '../types';
import { getSectionTimeRange, getCyclePhase, formatDate } from '../utils';

interface NotificationManagerProps {
  courses: Course[];
  settings: ScheduleSettings;
  periodData: PeriodData;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ courses, settings, periodData }) => {
  const lastCheckMinute = useRef<number>(-1);
  const notifiedClasses = useRef<Set<string>>(new Set()); // Format: "YYYY-MM-DD-CourseID"
  const notifiedPeriodDate = useRef<string>(''); // Format: "YYYY-MM-DD"

  // 1. Request Permission on Mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 2. Helper to send notification
  const sendNotification = (title: string, body: string, options?: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
       // On Android (via Capacitor/Chrome), this shows a system notification
       try {
         new Notification(title, {
           body,
           icon: '/vite.svg', // Fallback icon, ideally use app icon
           badge: '/vite.svg',
           vibrate: [200, 100, 200],
           ...options
         } as any);
       } catch (e) {
         console.error("Notification Error:", e);
       }
    }
  };

  // 3. Main Check Loop (Runs every few seconds, but logic executes once per minute)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      const currentDayStr = formatDate(now);

      // Only run heavy logic once per minute roughly
      if (lastCheckMinute.current === currentMinute) return;
      lastCheckMinute.current = currentMinute;

      // --- A. Period "Persistent" Reminder ---
      // Logic: Send once per day if in Menstrual phase
      const cycleInfo = getCyclePhase(now, periodData);
      
      if (cycleInfo.phase === 'MENSTRUAL' && notifiedPeriodDate.current !== currentDayStr) {
        sendNotification(
          "🌸 温暖提醒", 
          `今天是经期第 ${cycleInfo.dayOfCycle} 天。记得多喝热水，注意保暖，不要太劳累哦~`,
          {
             tag: 'period-reminder', // Keeps it unique (updates existing instead of stacking)
             requireInteraction: true, // Tries to keep it on screen until user interacts
             renotify: false // Don't vibrate every time if it updates
          }
        );
        notifiedPeriodDate.current = currentDayStr;
      }

      // --- B. Class 30-Min Reminder ---
      
      // 1. Filter today's courses
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1(Mon) - 7(Sun)
      const todaysCourses = courses.filter(c => c.dayOfWeek === dayOfWeek);

      todaysCourses.forEach(course => {
        // Unique ID for this specific class instance today
        const notificationId = `${currentDayStr}-${course.id}`;

        if (notifiedClasses.current.has(notificationId)) return;

        // 2. Calculate Start Time
        const { start } = getSectionTimeRange(course.startSection, course.sectionCount, settings);
        const [startHour, startMinute] = start.split(':').map(Number);
        
        const classTime = new Date(now);
        classTime.setHours(startHour, startMinute, 0, 0);

        // 3. Calculate Difference
        const diffMs = classTime.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // 4. Check if within window (e.g., 29 to 31 minutes before)
        // We use a range because setInterval might not hit exactly 30.000
        if (diffMinutes >= 29 && diffMinutes <= 31) {
            sendNotification(
              "📚 上课提醒",
              `还有30分钟就要上【${course.name}】了 (教室: ${course.room || '未知'})，快去准备一下吧！`,
              {
                tag: `class-${course.id}`,
                icon: '/vite.svg'
              }
            );
            notifiedClasses.current.add(notificationId);
        }
      });

    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [courses, settings, periodData]);

  return null; // Logic only, no UI
};

export default NotificationManager;