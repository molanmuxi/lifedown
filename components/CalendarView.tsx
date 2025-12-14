import React, { useState } from 'react';
import { TodoItem, Course, SpecialDay, ScheduleSettings } from '../types';
import { getDaysInMonth, formatDate, daysOfWeek, getSectionTimeRange } from '../utils';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Heart } from 'lucide-react';

interface CalendarViewProps {
  todos: TodoItem[];
  courses: Course[];
  specialDays: SpecialDay[];
  scheduleSettings: ScheduleSettings;
}

const CalendarView: React.FC<CalendarViewProps> = ({ todos, courses, specialDays, scheduleSettings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const startDay = daysInMonth[0].getDay(); // 0 Sun - 6 Sat
  // Adjust so Monday is 0, Sunday is 6
  const startDayAdjusted = startDay === 0 ? 6 : startDay - 1;

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  // Filter items for selected date
  const selectedDateStr = formatDate(selectedDate);
  const dayTodos = todos.filter(t => t.date === selectedDateStr);
  
  // Day of week for courses (1-7)
  const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
  
  // Sort courses by start section
  const dayCourses = courses
    .filter(c => c.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startSection - b.startSection);
  
  const daySpecials = specialDays.filter(s => s.date === selectedDateStr);

  return (
    <div className="flex flex-col h-full bg-[#FFF9FB]">
      <div className="p-6 bg-white shadow-sm z-10 rounded-b-[2rem] border-b border-gray-50">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => changeMonth(-1)} className="p-2.5 hover:bg-orange-50 hover:text-orange-500 rounded-full transition-colors text-gray-400"><ChevronLeft className="w-6 h-6"/></button>
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
          </h2>
          <button onClick={() => changeMonth(1)} className="p-2.5 hover:bg-orange-50 hover:text-orange-500 rounded-full transition-colors text-gray-400"><ChevronRight className="w-6 h-6"/></button>
        </div>
        
        <div className="grid grid-cols-7 mb-3">
          {daysOfWeek.map(d => <div key={d} className="text-center text-xs text-gray-400 font-bold uppercase tracking-wide">{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {Array.from({ length: startDayAdjusted }).map((_, i) => <div key={`empty-${i}`} />)}
          {daysInMonth.map(date => {
            const dateStr = formatDate(date);
            const hasTodo = todos.some(t => t.date === dateStr && !t.completed);
            const hasSpecial = specialDays.some(s => s.date === dateStr);
            // Check course (based on day of week)
            const dOw = date.getDay() === 0 ? 7 : date.getDay();
            const hasCourse = courses.some(c => c.dayOfWeek === dOw);
            
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300
                  ${isSelected ? 'bg-orange-400 text-white shadow-lg shadow-orange-200 scale-105' : 'hover:bg-gray-50 text-gray-600'}
                  ${isToday && !isSelected ? 'border-2 border-orange-400 font-bold text-orange-500' : ''}
                `}
              >
                <span className="text-sm font-bold">{date.getDate()}</span>
                <div className="flex gap-0.5 mt-1">
                  {hasSpecial && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-pink-400'}`} />}
                  {hasCourse && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`} />}
                  {hasTodo && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-400'}`} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider pl-2 border-l-4 border-orange-300">
          {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 星期{daysOfWeek[dayOfWeek - 1]}
        </h3>

        {/* Special Days */}
        {daySpecials.map(s => (
          <div key={s.id} className="bg-pink-50 p-4 rounded-2xl flex items-center shadow-sm border border-pink-100">
            <div className="bg-white p-2 rounded-full mr-3 shadow-sm">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            </div>
            <span className="font-bold text-pink-700 text-sm">{s.title}</span>
          </div>
        ))}

        {/* Courses */}
        {dayCourses.map(c => {
           const timeRange = getSectionTimeRange(c.startSection, c.sectionCount, scheduleSettings);
           return (
            <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-white flex items-center relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.color.split(' ')[0]}`}></div>
              <div className="flex-1 pl-3">
                <div className="font-bold text-gray-800 text-sm">{c.name}</div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">
                  {timeRange.start} - {timeRange.end} | 第{c.startSection}-{c.startSection + c.sectionCount - 1}节 | {c.room}
                </div>
              </div>
            </div>
          );
        })}

        {/* Todos */}
        {dayTodos.map(t => (
          <div key={t.id} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-white">
             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${t.completed ? 'bg-green-400 border-green-400' : 'border-gray-200'}`}>
                {t.completed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
             </div>
             <span className={`text-sm font-medium ${t.completed ? 'line-through text-gray-300' : 'text-gray-600'}`}>{t.text}</span>
          </div>
        ))}

        {daySpecials.length === 0 && dayCourses.length === 0 && dayTodos.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                 <div className="text-2xl">😴</div>
            </div>
            <span className="text-gray-400 text-sm font-medium">今日无安排，好好休息吧</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;