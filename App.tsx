import React, { useState } from 'react';
import { Tab, TodoItem, Course, SpecialDay, PeriodData, NoteItem, ScheduleSettings } from './types';
import { ClipboardList, CalendarDays, Grid3X3, HeartHandshake } from 'lucide-react';
import TodoView from './components/TodoView';
import ScheduleView from './components/ScheduleView';
import CalendarView from './components/CalendarView';
import SpecialDaysView from './components/SpecialDaysView';
import NotificationManager from './components/NotificationManager';
import { colors, generateId } from './utils';

// Mock Data Initialization in Chinese
const initialTodos: TodoItem[] = [
  { id: '1', text: '完成生物作业', completed: false, date: new Date().toISOString().split('T')[0], time: '14:00', reward: '奖励10积分', isStarred: true },
  { id: '2', text: '去超市买东西', completed: true, date: new Date().toISOString().split('T')[0], reward: '奖励一根雪糕' },
  { id: '3', text: '背单词', completed: false, date: new Date().toISOString().split('T')[0], time: '20:00', reward: '奖励看视频' },
  // Future task
  { id: '4', text: '准备下周演讲', completed: false, date: new Date(Date.now() + 86400000).toISOString().split('T')[0], reward: '奖励大餐', isStarred: true },
];

const initialNotes: NoteItem[] = [
  { id: '1001', content: '今天要记得带雨伞，天气预报说有雨。☔️', date: new Date().toISOString(), color: 'bg-yellow-100' },
  { id: '1002', content: '书单：\n1. 三体\n2. 活着', date: new Date().toISOString(), color: 'bg-blue-100' },
];

const initialCourses: Course[] = [
  { id: '101', name: '高等数学', dayOfWeek: 1, startSection: 1, sectionCount: 2, room: '302教室', color: colors[0] },
  { id: '102', name: '大学物理', dayOfWeek: 1, startSection: 5, sectionCount: 2, room: '实验楼2', color: colors[1] },
  { id: '103', name: '近代史', dayOfWeek: 2, startSection: 3, sectionCount: 2, room: 'B座大厅', color: colors[2] },
  { id: '104', name: '计算机科学', dayOfWeek: 3, startSection: 1, sectionCount: 3, room: '机房1', color: colors[3] },
];

const initialSpecialDays: SpecialDay[] = [
  { id: '201', title: '期末考试', date: '2023-12-10', type: 'COUNTDOWN' },
  { id: '202', title: '恋爱纪念日', date: '2023-05-15', type: 'ANNIVERSARY' },
];

const initialPeriodData: PeriodData = {
  lastPeriodStart: '2023-10-01',
  cycleLength: 28,
  periodLength: 5,
  logs: []
};

const initialScheduleSettings: ScheduleSettings = {
  startHour: 8,
  startMinute: 0,
  classDuration: 45,
  breakDuration: 10,
  totalSections: 12,
  specificBreaks: {
    2: 20, // Example: 20 min break after 2nd period
    4: 120 // Example: Lunch break after 4th period
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TODO);
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>(initialSpecialDays);
  const [periodData, setPeriodData] = useState<PeriodData>(initialPeriodData);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>(initialScheduleSettings);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.TODO:
        return <TodoView todos={todos} setTodos={setTodos} notes={notes} setNotes={setNotes} />;
      case Tab.SCHEDULE:
        return (
          <ScheduleView 
            courses={courses} 
            setCourses={setCourses} 
            settings={scheduleSettings}
            setSettings={setScheduleSettings}
          />
        );
      case Tab.CALENDAR:
        return (
          <CalendarView 
            todos={todos} 
            courses={courses} 
            specialDays={specialDays}
            scheduleSettings={scheduleSettings} 
          />
        );
      case Tab.SPECIAL:
        return (
          <SpecialDaysView 
            specialDays={specialDays} 
            setSpecialDays={setSpecialDays}
            periodData={periodData}
            setPeriodData={setPeriodData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#FFF9FB] max-w-md mx-auto shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden relative sm:rounded-3xl sm:my-4 sm:h-[calc(100%-2rem)] sm:border sm:border-white/50">
      
      {/* Logic Component for Notifications */}
      <NotificationManager 
        courses={courses} 
        settings={scheduleSettings} 
        periodData={periodData} 
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white/90 backdrop-blur-md border-t border-pink-50 flex justify-around items-center shrink-0 z-50 pb-safe pt-2 pb-2 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] rounded-t-3xl">
        <button 
          onClick={() => setActiveTab(Tab.TODO)}
          className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-90 ${activeTab === Tab.TODO ? 'text-blue-500' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <div className={`p-1.5 rounded-2xl mb-1 ${activeTab === Tab.TODO ? 'bg-blue-50' : 'bg-transparent'}`}>
            <ClipboardList className={`w-6 h-6 ${activeTab === Tab.TODO ? 'fill-blue-500 text-blue-500' : ''}`} strokeWidth={activeTab === Tab.TODO ? 2 : 2.5} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">记事</span>
        </button>

        <button 
          onClick={() => setActiveTab(Tab.SCHEDULE)}
          className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-90 ${activeTab === Tab.SCHEDULE ? 'text-indigo-500' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <div className={`p-1.5 rounded-2xl mb-1 ${activeTab === Tab.SCHEDULE ? 'bg-indigo-50' : 'bg-transparent'}`}>
            <Grid3X3 className={`w-6 h-6 ${activeTab === Tab.SCHEDULE ? 'fill-indigo-500 text-indigo-500' : ''}`} strokeWidth={activeTab === Tab.SCHEDULE ? 2 : 2.5} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">课程</span>
        </button>

        <button 
          onClick={() => setActiveTab(Tab.CALENDAR)}
          className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-90 ${activeTab === Tab.CALENDAR ? 'text-orange-500' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <div className={`p-1.5 rounded-2xl mb-1 ${activeTab === Tab.CALENDAR ? 'bg-orange-50' : 'bg-transparent'}`}>
            <CalendarDays className={`w-6 h-6 ${activeTab === Tab.CALENDAR ? 'fill-orange-500 text-orange-500' : ''}`} strokeWidth={activeTab === Tab.CALENDAR ? 2 : 2.5} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">日历</span>
        </button>

        <button 
          onClick={() => setActiveTab(Tab.SPECIAL)}
          className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-90 ${activeTab === Tab.SPECIAL ? 'text-pink-500' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <div className={`p-1.5 rounded-2xl mb-1 ${activeTab === Tab.SPECIAL ? 'bg-pink-50' : 'bg-transparent'}`}>
            <HeartHandshake className={`w-6 h-6 ${activeTab === Tab.SPECIAL ? 'fill-pink-500 text-pink-500' : ''}`} strokeWidth={activeTab === Tab.SPECIAL ? 2 : 2.5} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">纪念日</span>
        </button>
      </div>
    </div>
  );
};

export default App;