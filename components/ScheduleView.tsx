import React, { useMemo, useState } from 'react';
import { Course, ScheduleSettings } from '../types';
import { daysOfWeek, colors, generateId, getSectionTimeRange } from '../utils';
import { X, Save, Trash2, MapPin, Clock, BookOpen, Settings, Sliders, PlusCircle, MinusCircle } from 'lucide-react';

interface ScheduleViewProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  settings: ScheduleSettings;
  setSettings: React.Dispatch<React.SetStateAction<ScheduleSettings>>;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ courses, setCourses, settings, setSettings }) => {
  // Modal States
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Edit State
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  
  // Course Form State
  const [formName, setFormName] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formDay, setFormDay] = useState(1);
  const [formStartSection, setFormStartSection] = useState(1);
  const [formSectionCount, setFormSectionCount] = useState(1);
  const [formColor, setFormColor] = useState(colors[0]);

  // Settings Form State
  const [tempSettings, setTempSettings] = useState<ScheduleSettings>(settings);
  // Temporary state for adding a new special break
  const [newBreakSection, setNewBreakSection] = useState(1);
  const [newBreakDuration, setNewBreakDuration] = useState(20);

  // Computed Dates
  const weekDates = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay() || 7; 
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDay + 1);

    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        dayName: daysOfWeek[i],
        dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
        isToday: date.toDateString() === now.toDateString()
      };
    });
  }, []);

  // --- Handlers ---

  const handleGridClick = (dayIndex: number, sectionIndex: number) => {
    setEditingCourseId(null);
    setFormName('');
    setFormRoom('');
    setFormDay(dayIndex + 1);
    setFormStartSection(sectionIndex);
    setFormSectionCount(1); // Default to 1 period
    setFormColor(colors[Math.floor(Math.random() * colors.length)]);
    setIsCourseModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourseId(course.id);
    setFormName(course.name);
    setFormRoom(course.room || '');
    setFormDay(course.dayOfWeek);
    setFormStartSection(course.startSection);
    setFormSectionCount(course.sectionCount);
    setFormColor(course.color);
    setIsCourseModalOpen(true);
  };

  const saveCourse = () => {
    if (!formName.trim()) return;

    if (editingCourseId) {
      setCourses(prev => prev.map(c => 
        c.id === editingCourseId 
          ? { 
              ...c, 
              name: formName, 
              room: formRoom, 
              dayOfWeek: formDay, 
              startSection: formStartSection, 
              sectionCount: formSectionCount, 
              color: formColor 
            } 
          : c
      ));
    } else {
      const newCourse: Course = {
        id: generateId(),
        name: formName,
        room: formRoom,
        dayOfWeek: formDay,
        startSection: formStartSection,
        sectionCount: formSectionCount,
        color: formColor
      };
      setCourses(prev => [...prev, newCourse]);
    }
    setIsCourseModalOpen(false);
  };

  const deleteCourse = () => {
    if (editingCourseId) {
      setCourses(prev => prev.filter(c => c.id !== editingCourseId));
      setIsCourseModalOpen(false);
    }
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    setIsSettingsModalOpen(false);
  };

  const addSpecificBreak = () => {
      setTempSettings(prev => ({
          ...prev,
          specificBreaks: {
              ...prev.specificBreaks,
              [newBreakSection]: newBreakDuration
          }
      }));
  };

  const removeSpecificBreak = (section: number) => {
      const newBreaks = { ...tempSettings.specificBreaks };
      delete newBreaks[section];
      setTempSettings(prev => ({
          ...prev,
          specificBreaks: newBreaks
      }));
  };

  return (
    <div className="flex flex-col h-full bg-[#FFF9FB] relative">
      {/* Top Bar */}
      <div className="px-5 py-4 bg-[#FFF9FB] flex items-center justify-between shrink-0 z-10">
        <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">我的课程</h1>
        <div className="flex gap-2">
            <button 
                onClick={() => { setTempSettings(settings); setIsSettingsModalOpen(true); }}
                className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-100 px-3 py-2 rounded-xl hover:bg-gray-50 font-bold shadow-sm"
            >
                <Settings className="w-3.5 h-3.5" /> 设置
            </button>
            <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl font-bold">本周</span>
        </div>
      </div>
      
      {/* 
        Single Scrollable Grid Container
      */}
      <div className="flex-1 overflow-auto bg-[#FFF9FB] relative px-2 pb-safe">
          <div 
              className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] w-full min-w-[340px] bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden"
              style={{ 
                  // Row 1 is header (3.5rem), subsequent rows are sections (min 4.5rem)
                  gridTemplateRows: `3.5rem repeat(${settings.totalSections}, minmax(4.5rem, 1fr))` 
              }}
          >
              {/* --- 1. Header Row (Sticky Top) --- */}
              
              {/* Top-Left Corner */}
              <div 
                  className="sticky top-0 left-0 z-30 bg-gray-50/80 backdrop-blur-sm border-r border-b border-gray-100" 
                  style={{ gridColumn: 1, gridRow: 1 }}
              ></div>

              {/* Day Headers */}
              {weekDates.map((dayObj, i) => (
                  <div 
                      key={`header-${dayObj.dayName}`} 
                      className={`sticky top-0 z-20 border-r border-b border-gray-100 py-1 text-center flex flex-col justify-center items-center backdrop-blur-sm ${dayObj.isToday ? 'bg-indigo-50/90' : 'bg-gray-50/80'}`}
                      style={{ gridColumn: i + 2, gridRow: 1 }}
                  >
                      <span className={`text-xs font-bold ${dayObj.isToday ? 'text-indigo-600' : 'text-gray-600'}`}>
                          {dayObj.dayName}
                      </span>
                      <span className={`text-[10px] font-medium mt-0.5 ${dayObj.isToday ? 'text-indigo-500' : 'text-gray-400'}`}>
                          {dayObj.dateStr}
                      </span>
                  </div>
              ))}

              {/* --- 2. Grid Body (Sections & Cells) --- */}
              {Array.from({ length: settings.totalSections }).map((_, idx) => {
                  const sectionNum = idx + 1;
                  const { start, end } = getSectionTimeRange(sectionNum, 1, settings);
                  const gridRowIndex = sectionNum + 1; // +1 because row 1 is header

                  return (
                      <React.Fragment key={`row-${sectionNum}`}>
                          {/* Time Axis (Sticky Left) */}
                          <div 
                              className="sticky left-0 z-10 border-r border-b border-gray-50 flex flex-col items-center justify-center p-1 bg-white"
                              style={{ gridRow: gridRowIndex, gridColumn: 1 }}
                          >
                              <span className="font-extrabold text-gray-700 text-sm">{sectionNum}</span>
                              <div className="text-[9px] text-gray-300 leading-tight text-center mt-1 font-medium">
                                  {start}<br/>{end}
                              </div>
                          </div>

                          {/* Empty Cells */}
                          {Array.from({ length: 7 }).map((_, dayIdx) => (
                              <div 
                                  key={`cell-${sectionNum}-${dayIdx}`}
                                  onClick={() => handleGridClick(dayIdx, sectionNum)}
                                  className="border-r border-b border-gray-50 hover:bg-gray-50 active:bg-blue-50 transition-colors relative"
                                  style={{ gridRow: gridRowIndex, gridColumn: dayIdx + 2 }}
                              />
                          ))}
                      </React.Fragment>
                  );
              })}

              {/* --- 3. Courses Overlay --- */}
              {courses.map(course => {
                  const colStart = course.dayOfWeek + 1; 
                  const rowStart = course.startSection + 1; // +1 offset for header row
                  const rowSpan = course.sectionCount;

                  return (
                      <div
                          key={course.id}
                          onClick={(e) => { e.stopPropagation(); openEditModal(course); }}
                          className={`mx-0.5 my-0.5 p-1.5 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center ${course.color} hover:brightness-95 hover:shadow-md transition-all cursor-pointer z-10 overflow-hidden active:scale-95`}
                          style={{
                              gridColumn: colStart,
                              gridRow: `${rowStart} / span ${rowSpan}`,
                          }}
                      >
                          <div className="font-bold text-xs leading-tight mb-1.5 line-clamp-2 break-all">{course.name}</div>
                          {course.room && (
                              <div className="text-[9px] font-bold bg-white/40 px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5 max-w-full backdrop-blur-sm">
                                  <MapPin className="w-2.5 h-2.5 shrink-0"/> 
                                  <span className="truncate">{course.room}</span>
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Add/Edit Course Modal */}
      {isCourseModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/20 backdrop-blur-sm">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xs animate-in zoom-in-95 duration-200 border-4 border-white">
                  <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="font-extrabold text-gray-800 text-lg">
                          {editingCourseId ? '修改课程' : '添加课程'}
                      </h3>
                      <button onClick={() => setIsCourseModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="p-5 space-y-5">
                      {/* Name */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5 mb-2">
                              <BookOpen className="w-3.5 h-3.5"/> 课程名称
                          </label>
                          <input 
                              autoFocus
                              type="text" 
                              value={formName}
                              onChange={e => setFormName(e.target.value)}
                              placeholder="例如：高等数学"
                              className="w-full border-b-2 border-gray-100 focus:border-indigo-400 outline-none py-1.5 text-sm font-bold bg-transparent text-gray-700"
                          />
                      </div>

                      {/* Room */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5 mb-2">
                              <MapPin className="w-3.5 h-3.5"/> 教室
                          </label>
                          <input 
                              type="text" 
                              value={formRoom}
                              onChange={e => setFormRoom(e.target.value)}
                              placeholder="例如：302教室"
                              className="w-full border-b-2 border-gray-100 focus:border-indigo-400 outline-none py-1.5 text-sm font-bold bg-transparent text-gray-700"
                          />
                      </div>

                      {/* Section Selection */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5 mb-2">
                               <Clock className="w-3.5 h-3.5"/> 上课时间
                          </label>
                          <div className="flex gap-2">
                              <div className="flex-1">
                                  <label className="text-[10px] text-gray-400 block mb-1 font-bold">星期</label>
                                  <select 
                                      value={formDay} 
                                      onChange={e => setFormDay(Number(e.target.value))}
                                      className="w-full bg-gray-50 text-xs font-bold rounded-xl p-2.5 border border-gray-100 outline-none focus:border-indigo-200"
                                  >
                                      {daysOfWeek.map((d, i) => <option key={i} value={i+1}>{d}</option>)}
                                  </select>
                              </div>
                          </div>
                          <div className="flex gap-2 mt-3 items-center">
                              <div className="flex-1">
                                  <label className="text-[10px] text-gray-400 block mb-1 font-bold">开始节次</label>
                                  <select 
                                      value={formStartSection} 
                                      onChange={e => {
                                          const val = Number(e.target.value);
                                          setFormStartSection(val);
                                          // Ensure end isn't before start (implicitly handled by count)
                                      }}
                                      className="w-full bg-gray-50 text-xs font-bold rounded-xl p-2.5 border border-gray-100 outline-none focus:border-indigo-200"
                                  >
                                      {Array.from({ length: settings.totalSections }).map((_, i) => (
                                          <option key={i} value={i+1}>第 {i+1} 节</option>
                                      ))}
                                  </select>
                              </div>
                              <span className="text-gray-300 mt-5 font-bold">至</span>
                              <div className="flex-1">
                                  <label className="text-[10px] text-gray-400 block mb-1 font-bold">结束节次</label>
                                  <select 
                                      value={formStartSection + formSectionCount - 1} 
                                      onChange={e => {
                                          const endSec = Number(e.target.value);
                                          setFormSectionCount(Math.max(1, endSec - formStartSection + 1));
                                      }}
                                      className="w-full bg-gray-50 text-xs font-bold rounded-xl p-2.5 border border-gray-100 outline-none focus:border-indigo-200"
                                  >
                                      {Array.from({ length: settings.totalSections - formStartSection + 1 }).map((_, i) => {
                                          const sec = formStartSection + i;
                                          return <option key={sec} value={sec}>第 {sec} 节</option>;
                                      })}
                                  </select>
                              </div>
                          </div>
                          
                          {/* Preview Time */}
                          <div className="mt-3 text-center">
                              <span className="text-xs text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full font-bold">
                                  {getSectionTimeRange(formStartSection, formSectionCount, settings).start} - {getSectionTimeRange(formStartSection, formSectionCount, settings).end}
                              </span>
                          </div>
                      </div>

                      {/* Colors */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">
                              颜色标记
                          </label>
                          <div className="flex gap-2 justify-between flex-wrap">
                              {colors.map((c, i) => (
                                  <button 
                                      key={i}
                                      onClick={() => setFormColor(c)}
                                      className={`w-8 h-8 rounded-full shadow-sm transition-transform ${c.split(' ')[0]} ${formColor === c ? 'scale-110 ring-2 ring-gray-400 ring-offset-2' : 'hover:scale-105'}`}
                                  />
                              ))}
                          </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                          {editingCourseId && (
                              <button 
                                  onClick={deleteCourse}
                                  className="flex-1 py-3 rounded-2xl bg-red-50 text-red-500 text-sm font-bold flex items-center justify-center gap-1 hover:bg-red-100 transition-colors"
                              >
                                  <Trash2 className="w-4 h-4" /> 删除
                              </button>
                          )}
                          <button 
                              onClick={saveCourse}
                              className={`flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all ${editingCourseId ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-500 w-full hover:bg-indigo-600'}`}
                          >
                              <Save className="w-4 h-4" /> {editingCourseId ? '保存' : '添加'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/20 backdrop-blur-sm">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xs animate-in slide-in-from-bottom-5 max-h-[90vh] overflow-y-auto border-4 border-white">
                   <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                      <h3 className="font-extrabold text-gray-800 flex items-center gap-2 text-lg">
                          <Sliders className="w-5 h-5"/> 课程表设置
                      </h3>
                      <button onClick={() => setIsSettingsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6 space-y-6">
                      {/* Start Time */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase block mb-2">第一节课开始时间</label>
                          <div className="flex gap-2 items-center">
                              <input 
                                  type="number" 
                                  min="0" max="23"
                                  value={tempSettings.startHour}
                                  onChange={e => setTempSettings({...tempSettings, startHour: Number(e.target.value)})}
                                  className="w-20 p-3 bg-gray-50 rounded-xl text-center font-bold text-gray-700 outline-none focus:ring-2 ring-indigo-100"
                              />
                              <span className="font-bold text-gray-300">:</span>
                              <input 
                                  type="number" 
                                  min="0" max="59" step="5"
                                  value={tempSettings.startMinute}
                                  onChange={e => setTempSettings({...tempSettings, startMinute: Number(e.target.value)})}
                                  className="w-20 p-3 bg-gray-50 rounded-xl text-center font-bold text-gray-700 outline-none focus:ring-2 ring-indigo-100"
                              />
                          </div>
                      </div>

                      {/* Duration */}
                      <div className="flex gap-4">
                          <div className="flex-1">
                              <label className="text-xs font-bold text-gray-400 uppercase block mb-2">单节(分)</label>
                              <input 
                                  type="number" 
                                  value={tempSettings.classDuration}
                                  onChange={e => setTempSettings({...tempSettings, classDuration: Number(e.target.value)})}
                                  className="w-full p-3 bg-gray-50 rounded-xl text-center font-bold text-gray-700 outline-none focus:ring-2 ring-indigo-100"
                              />
                          </div>
                          <div className="flex-1">
                              <label className="text-xs font-bold text-gray-400 uppercase block mb-2">课间(分)</label>
                              <input 
                                  type="number" 
                                  value={tempSettings.breakDuration}
                                  onChange={e => setTempSettings({...tempSettings, breakDuration: Number(e.target.value)})}
                                  className="w-full p-3 bg-gray-50 rounded-xl text-center font-bold text-gray-700 outline-none focus:ring-2 ring-indigo-100"
                              />
                          </div>
                      </div>

                      {/* Total Sections */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase block mb-2">每日总节数</label>
                          <input 
                              type="range" 
                              min="6" max="16"
                              value={tempSettings.totalSections}
                              onChange={e => setTempSettings({...tempSettings, totalSections: Number(e.target.value)})}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <div className="text-center text-sm font-bold text-indigo-600 mt-2">{tempSettings.totalSections} 节</div>
                      </div>

                      {/* Specific Breaks Section */}
                      <div className="border-t border-gray-100 pt-5">
                           <label className="text-xs font-bold text-gray-400 uppercase block mb-3">特殊休息时间 (如午休)</label>
                           
                           {/* List Existing Breaks */}
                           <div className="space-y-2 mb-4">
                               {tempSettings.specificBreaks && Object.entries(tempSettings.specificBreaks).map(([section, duration]) => (
                                   <div key={section} className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl text-sm border border-indigo-100">
                                       <span className="text-indigo-800 font-medium">第 <span className="font-bold">{section}</span> 节后</span>
                                       <div className="flex items-center gap-3">
                                           <span className="font-bold text-indigo-600">{duration} 分钟</span>
                                           <button 
                                               onClick={() => removeSpecificBreak(Number(section))}
                                               className="text-indigo-400 hover:text-red-500 bg-white rounded-full p-0.5"
                                           >
                                               <MinusCircle className="w-5 h-5" />
                                           </button>
                                       </div>
                                   </div>
                               ))}
                               {(!tempSettings.specificBreaks || Object.keys(tempSettings.specificBreaks).length === 0) && (
                                   <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">暂无特殊休息时间</div>
                               )}
                           </div>

                           {/* Add New Break */}
                           <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-2xl border border-gray-100">
                               <div className="flex-1">
                                   <label className="text-[10px] text-gray-400 block mb-1 font-bold">节次</label>
                                   <select 
                                       value={newBreakSection}
                                       onChange={(e) => setNewBreakSection(Number(e.target.value))}
                                       className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none font-bold text-gray-600"
                                   >
                                       {Array.from({length: tempSettings.totalSections - 1}).map((_, i) => (
                                           <option key={i+1} value={i+1}>第 {i+1} 节</option>
                                       ))}
                                   </select>
                               </div>
                               <div className="flex-1">
                                   <label className="text-[10px] text-gray-400 block mb-1 font-bold">时长</label>
                                   <input 
                                       type="number"
                                       value={newBreakDuration}
                                       onChange={(e) => setNewBreakDuration(Number(e.target.value))}
                                       className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none font-bold text-gray-600"
                                   />
                               </div>
                               <button 
                                   onClick={addSpecificBreak}
                                   className="bg-indigo-500 text-white p-2.5 rounded-xl hover:bg-indigo-600 shadow-sm"
                               >
                                   <PlusCircle className="w-5 h-5" />
                               </button>
                           </div>
                      </div>

                      <button 
                          onClick={saveSettings}
                          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-200 active:scale-95 transition-transform"
                      >
                          保存设置
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ScheduleView;