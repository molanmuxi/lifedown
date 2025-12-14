import React, { useState, useMemo } from 'react';
import { SpecialDay, PeriodData, PeriodLog } from '../types';
import { getDayDiff, generateId, formatDate, getCyclePhase, PeriodPhase } from '../utils';
import { Heart, Calendar, Plus, Settings, Droplets, Activity, X, RotateCcw, History, Trash2, PenLine, Save } from 'lucide-react';

interface SpecialDaysViewProps {
  specialDays: SpecialDay[];
  setSpecialDays: React.Dispatch<React.SetStateAction<SpecialDay[]>>;
  periodData: PeriodData;
  setPeriodData: React.Dispatch<React.SetStateAction<PeriodData>>;
}

const SpecialDaysView: React.FC<SpecialDaysViewProps> = ({ specialDays, setSpecialDays, periodData, setPeriodData }) => {
  // View Mode: 'PERIOD' (Tracker + Stats) or 'SPECIAL' (Countdown/Anniversary)
  const [viewMode, setViewMode] = useState<'PERIOD' | 'SPECIAL'>('PERIOD');
  
  // Event Form State (Add New)
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventType, setNewEventType] = useState<'COUNTDOWN' | 'ANNIVERSARY'>('COUNTDOWN');

  // Event Edit State
  const [editingEvent, setEditingEvent] = useState<SpecialDay | null>(null);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventType, setEditEventType] = useState<'COUNTDOWN' | 'ANNIVERSARY'>('COUNTDOWN');

  // Period Modals State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Log Form State
  const [logFlow, setLogFlow] = useState<number | undefined>(undefined);
  const [logMood, setLogMood] = useState<string | undefined>(undefined);
  const [logSymptoms, setLogSymptoms] = useState<string[]>([]);

  // Settings Form State
  const [tempPeriodData, setTempPeriodData] = useState<PeriodData>(periodData);

  // --- Logic ---
  const today = new Date();
  const currentPhase = useMemo(() => getCyclePhase(today, periodData), [periodData, today]);

  // Generate next 7 days for strip
  const nextDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() + i);
      return {
        date: d,
        info: getCyclePhase(d, periodData)
      };
    });
  }, [periodData]);

  const handleAddEvent = () => {
    if (!newEventTitle || !newEventDate) return;
    setSpecialDays(prev => [...prev, {
      id: generateId(),
      title: newEventTitle,
      date: newEventDate,
      type: newEventType
    }]);
    setNewEventTitle('');
    setNewEventDate('');
  };

  const openEditModal = (day: SpecialDay) => {
      setEditingEvent(day);
      setEditEventTitle(day.title);
      setEditEventDate(day.date);
      setEditEventType(day.type);
      setIsEditEventModalOpen(true);
  };

  const handleUpdateEvent = () => {
      if (!editingEvent || !editEventTitle || !editEventDate) return;
      setSpecialDays(prev => prev.map(d => d.id === editingEvent.id ? {
          ...d,
          title: editEventTitle,
          date: editEventDate,
          type: editEventType
      } : d));
      setIsEditEventModalOpen(false);
      setEditingEvent(null);
  };

  const handleDeleteEvent = () => {
      if (!editingEvent) return;
      setSpecialDays(prev => prev.filter(d => d.id !== editingEvent.id));
      setIsEditEventModalOpen(false);
      setEditingEvent(null);
  };

  const saveSettings = () => {
    setPeriodData(tempPeriodData);
    setIsSettingsModalOpen(false);
  };

  const saveLog = () => {
    const todayStr = formatDate(today);
    const newLog: PeriodLog = {
        date: todayStr,
        flow: logFlow,
        mood: logMood,
        symptoms: logSymptoms
    };

    setPeriodData(prev => {
        // Remove existing log for today if any
        const filtered = prev.logs.filter(l => l.date !== todayStr);
        return { ...prev, logs: [...filtered, newLog] };
    });
    
    setIsLogModalOpen(false);
    // Reset form
    setLogFlow(undefined);
    setLogMood(undefined);
    setLogSymptoms([]);
  };

  const handlePeriodStart = () => {
      const todayStr = formatDate(today);
      if (periodData.lastPeriodStart === todayStr) return;
      
      setPeriodData(prev => ({ 
          ...prev, 
          previousPeriodStart: prev.lastPeriodStart,
          lastPeriodStart: todayStr 
      }));
  };

  const handleUndoPeriodStart = () => {
      if (periodData.previousPeriodStart) {
          setPeriodData(prev => ({
              ...prev,
              lastPeriodStart: prev.previousPeriodStart!,
              previousPeriodStart: undefined
          }));
      }
  };

  const isPeriodStartToday = periodData.lastPeriodStart === formatDate(today);

  // UI Helpers
  const getGradient = (phase: PeriodPhase) => {
      switch(phase) {
          case 'MENSTRUAL': return 'from-pink-200 to-rose-100';
          case 'OVULATION': 
          case 'OVULATION_DAY': return 'from-purple-200 to-fuchsia-100';
          case 'SAFE': return 'from-emerald-200 to-green-100';
          default: return 'from-gray-100 to-gray-50';
      }
  };

  const getTextColor = (phase: PeriodPhase) => {
      switch(phase) {
          case 'MENSTRUAL': return 'text-pink-600';
          case 'OVULATION': 
          case 'OVULATION_DAY': return 'text-purple-600';
          case 'SAFE': return 'text-emerald-600';
          default: return 'text-gray-600';
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFF9FB]">
      {/* Top Toggle Switch */}
      <div className="bg-[#FFF9FB] p-6 shadow-sm z-10 sticky top-0 pb-2">
          <div className="flex bg-white p-1.5 rounded-2xl relative shadow-sm border border-gray-50">
              <div 
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-pink-500 rounded-xl shadow-md shadow-pink-200 transition-all duration-300 ease-spring ${viewMode === 'PERIOD' ? 'left-1.5' : 'translate-x-[calc(100%+6px)]'}`}
              ></div>
              <button 
                  onClick={() => setViewMode('PERIOD')}
                  className={`flex-1 relative z-10 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${viewMode === 'PERIOD' ? 'text-white' : 'text-gray-400'}`}
              >
                  <Droplets className="w-3.5 h-3.5" /> 经期助手
              </button>
              <button 
                  onClick={() => setViewMode('SPECIAL')}
                  className={`flex-1 relative z-10 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${viewMode === 'SPECIAL' ? 'text-white' : 'text-gray-400'}`}
              >
                  <Calendar className="w-3.5 h-3.5" /> 纪念日/倒数
              </button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        
        {viewMode === 'PERIOD' ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                {/* 1. Period Tracker Card */}
                <div className={`p-6 bg-gradient-to-br ${getGradient(currentPhase.phase)} rounded-[2.5rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] relative transition-colors duration-500`}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-2 px-1">
                        <h2 className={`font-bold text-sm ${getTextColor(currentPhase.phase)} flex items-center gap-1.5 opacity-80`}>
                            当前状态
                        </h2>
                        <button onClick={() => { setTempPeriodData(periodData); setIsSettingsModalOpen(true); }} className="bg-white/40 p-2 rounded-full hover:bg-white/60 transition-colors">
                            <Settings className={`w-4 h-4 ${getTextColor(currentPhase.phase)}`} />
                        </button>
                    </div>

                    {/* Main Circle Visual - w-40 h-40 */}
                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-6 mt-2">
                        <div className="absolute inset-0 rounded-full border-[8px] border-white/30"></div>
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                        <circle 
                            cx="64" cy="64" r="56" 
                            fill="none" stroke="currentColor" strokeWidth="8" 
                            className={`${getTextColor(currentPhase.phase)}`}
                            strokeDasharray="352" 
                            strokeDashoffset={352 - (352 * currentPhase.dayOfCycle / periodData.cycleLength)}
                            strokeLinecap="round"
                        />
                        </svg>
                        
                        <div className="text-center z-10 flex flex-col items-center">
                            <div className={`text-2xl font-extrabold mb-0.5 ${getTextColor(currentPhase.phase)} drop-shadow-sm`}>
                                {currentPhase.label}
                            </div>
                            <div className="text-gray-500/80 text-[10px] font-bold leading-tight">
                                周期第 <span className="text-lg text-gray-700">{currentPhase.dayOfCycle}</span> 天
                            </div>
                            {currentPhase.phase === 'SAFE' && (
                                <div className="text-[9px] text-emerald-600 mt-2 bg-white/50 px-2 py-0.5 rounded-full font-bold">
                                    怀孕几率低 🍀
                                </div>
                            )}
                            {['OVULATION', 'OVULATION_DAY'].includes(currentPhase.phase) && (
                                <div className="text-[9px] text-purple-600 mt-2 bg-white/50 px-2 py-0.5 rounded-full font-bold">
                                    易孕期 ✨
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 mb-6">
                        {!isPeriodStartToday ? (
                            <button 
                                onClick={handlePeriodStart}
                                className="bg-white text-gray-700 px-5 py-2.5 rounded-2xl shadow-sm font-bold text-xs active:scale-95 transition-all flex items-center gap-2 hover:bg-gray-50"
                            >
                                <Activity className="w-4 h-4 text-pink-500" />
                                大姨妈来了
                            </button>
                        ) : (
                            <button 
                                onClick={handleUndoPeriodStart}
                                className="bg-red-50 text-red-500 border border-red-100 px-5 py-2.5 rounded-2xl shadow-sm font-bold text-xs active:scale-95 transition-all flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                误触撤销
                            </button>
                        )}

                        <button 
                            onClick={() => setIsLogModalOpen(true)}
                            className={`text-white px-5 py-2.5 rounded-2xl shadow-lg font-bold text-xs active:scale-95 transition-all flex items-center gap-2 ${currentPhase.bg}`}
                        >
                            <Plus className="w-4 h-4" />
                            记一笔
                        </button>
                    </div>

                    {/* Prediction Strip */}
                    <div className="bg-white/40 rounded-2xl p-3 flex justify-between items-center backdrop-blur-sm overflow-x-auto no-scrollbar gap-2">
                        {nextDays.map((day, i) => (
                            <div key={i} className="flex flex-col items-center min-w-[2.5rem] gap-1">
                                <span className="text-[9px] text-gray-500 font-bold opacity-70">{i === 0 ? '今天' : ['周日','周一','周二','周三','周四','周五','周六'][day.date.getDay()]}</span>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${i === 0 ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'}`}>
                                    {day.date.getDate()}
                                </div>
                                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${day.info.bg}`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Logs Section */}
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50">
                     <h3 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-gray-400"/> 历史记录
                     </h3>
                     {periodData.logs.length === 0 ? (
                         <div className="text-center text-gray-400 text-xs py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                             暂无记录，点击上方"记一笔"开始
                         </div>
                     ) : (
                         <div className="space-y-4">
                             {periodData.logs.slice().reverse().slice(0, 5).map((log, idx) => (
                                 <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                     <div className="flex items-center gap-3">
                                         <div className="bg-gray-50 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500">
                                             {log.date.slice(5)}
                                         </div>
                                         <div className="flex gap-2 items-center">
                                             {log.mood && <span className="text-xl bg-yellow-50 rounded-full w-8 h-8 flex items-center justify-center">{log.mood}</span>}
                                             {log.flow && (
                                                <div className="flex gap-0.5 items-center bg-pink-50 px-2 py-1 rounded-lg h-8">
                                                    {Array.from({length: log.flow}).map((_, i) => <div key={i} className="w-1.5 h-3 bg-pink-400 rounded-full"/>)}
                                                </div>
                                             )}
                                         </div>
                                     </div>
                                     <div className="flex gap-1 flex-wrap justify-end max-w-[40%]">
                                         {log.symptoms?.map(s => (
                                             <span key={s} className="text-[9px] bg-purple-50 text-purple-600 px-2 py-1 rounded-lg font-bold">{s}</span>
                                         ))}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                </div>
            </div>
        ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* 1. Special Days List */}
                <div className="space-y-3">
                    {specialDays.map(day => {
                        const daysDiff = Math.abs(getDayDiff(formatDate(today), day.date));
                        const isPast = new Date(day.date) < today;
                        let labelValue = daysDiff;
                        let labelText = isPast ? '天已过' : (day.type === 'ANNIVERSARY' ? '天纪念' : '天剩余');
                        const isAnniversary = day.type === 'ANNIVERSARY';

                        return (
                            <div 
                                key={day.id} 
                                onClick={() => openEditModal(day)}
                                className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex items-center justify-between group active:scale-[0.99] transition-transform cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon Box */}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isAnniversary ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                                        {isAnniversary ? <Heart className="w-6 h-6 fill-current" /> : <Calendar className="w-6 h-6" />}
                                    </div>
                                    
                                    {/* Text Info */}
                                    <div className="flex flex-col">
                                        <span className="font-extrabold text-gray-700 text-base leading-tight mb-1">{day.title}</span>
                                        <span className="text-xs text-gray-400 font-bold">{day.date}</span>
                                    </div>
                                </div>

                                {/* Countdown Box */}
                                <div className={`px-4 py-2 rounded-2xl text-center min-w-[80px] ${isAnniversary ? 'bg-pink-50' : 'bg-blue-50'}`}>
                                    <span className={`block text-2xl font-black ${isAnniversary ? 'text-pink-500' : 'text-blue-500'}`}>{labelValue}</span>
                                    <span className={`text-[9px] uppercase font-bold tracking-wide ${isAnniversary ? 'text-pink-300' : 'text-blue-300'}`}>{labelText}</span>
                                </div>
                            </div>
                        );
                    })}
                    {specialDays.length === 0 && (
                        <div className="text-center text-gray-400 text-xs py-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                            暂无纪念日/倒数日
                        </div>
                    )}
                </div>

                {/* 2. Add Event Form */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
                    <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">添加新日子</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1.5 block">标题</label>
                            <input 
                                type="text" 
                                placeholder="例如：恋爱一周年" 
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 ring-pink-100 outline-none transition-all text-sm font-bold text-gray-700"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1.5 block">日期</label>
                                <input 
                                    type="date" 
                                    value={newEventDate}
                                    onChange={(e) => setNewEventDate(e.target.value)}
                                    className="w-full p-3 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 ring-pink-100 outline-none transition-all text-sm font-bold text-gray-600"
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1.5 block">类型</label>
                                <select 
                                    value={newEventType}
                                    onChange={(e) => setNewEventType(e.target.value as any)}
                                    className="w-full p-3 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 ring-pink-100 outline-none transition-all text-sm font-bold text-gray-600"
                                >
                                    <option value="COUNTDOWN">倒数</option>
                                    <option value="ANNIVERSARY">纪念</option>
                                </select>
                            </div>
                        </div>
                        <button 
                            onClick={handleAddEvent}
                            className="w-full bg-gray-900 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-black mt-2"
                        >
                            <Plus className="w-5 h-5" /> 确认添加
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* --- Log Modal --- */}
      {isLogModalOpen && (
          <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/20 backdrop-blur-sm">
              <div className="bg-white w-full sm:w-10/12 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 border-4 border-white">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-extrabold text-lg text-gray-800">今日记录</h3>
                      <button onClick={() => setIsLogModalOpen(false)} className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-400"/></button>
                  </div>
                  
                  <div className="space-y-6">
                      {/* Flow */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase block mb-3">经量</label>
                          <div className="flex justify-between gap-3">
                              {[1, 2, 3].map(level => (
                                  <button 
                                      key={level}
                                      onClick={() => setLogFlow(logFlow === level ? undefined : level)}
                                      className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${logFlow === level ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-100 text-gray-300'}`}
                                  >
                                      <div className="flex gap-1">
                                          {Array.from({length: level}).map((_, i) => <div key={i} className={`w-2 h-3.5 rounded-full ${logFlow === level ? 'bg-pink-400' : 'bg-gray-300'}`}/>)}
                                      </div>
                                      <span className="text-xs font-bold">{['少', '中', '多'][level-1]}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Mood */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase block mb-3">心情</label>
                          <div className="flex justify-between gap-2">
                              {['😊', '😐', '😞', '😡', '😴'].map(mood => (
                                  <button 
                                      key={mood}
                                      onClick={() => setLogMood(logMood === mood ? undefined : mood)}
                                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${logMood === mood ? 'border-yellow-400 bg-yellow-50 scale-110 shadow-sm' : 'border-transparent bg-gray-50 grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}`}
                                  >
                                      {mood}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Symptoms */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase block mb-3">身体感受</label>
                          <div className="flex flex-wrap gap-2.5">
                              {['痛经', '头痛', '腰酸', '痘痘', '腹胀', '失眠'].map(sym => (
                                  <button 
                                      key={sym}
                                      onClick={() => {
                                          if (logSymptoms.includes(sym)) setLogSymptoms(prev => prev.filter(s => s !== sym));
                                          else setLogSymptoms(prev => [...prev, sym]);
                                      }}
                                      className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${logSymptoms.includes(sym) ? 'bg-purple-50 border-purple-300 text-purple-600' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                  >
                                      {sym}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <button 
                          onClick={saveLog}
                          className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-pink-200 active:scale-95 transition-transform"
                      >
                          保存记录
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- Settings Modal --- */}
      {isSettingsModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm p-6">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 border-4 border-white">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-extrabold text-lg text-gray-800 flex items-center gap-2">
                          <Settings className="w-5 h-5"/> 经期设置
                      </h3>
                      <button onClick={() => setIsSettingsModalOpen(false)} className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-400"/></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="flex gap-4">
                          <div className="flex-1">
                              <label className="text-xs font-bold text-gray-400 uppercase block mb-2">周期长度(天)</label>
                              <input 
                                  type="number" 
                                  value={tempPeriodData.cycleLength}
                                  onChange={e => setTempPeriodData({...tempPeriodData, cycleLength: Number(e.target.value)})}
                                  className="w-full p-3 bg-gray-50 rounded-xl text-center font-bold text-gray-700 outline-none focus:ring-2 ring-pink-100"
                              />
                          </div>
                          <div className="flex-1">
                              <label className="text-xs font-bold text-gray-400 uppercase block mb-2">经期长度(天)</label>
                              <input 
                                  type="number" 
                                  value={tempPeriodData.periodLength}
                                  onChange={e => setTempPeriodData({...tempPeriodData, periodLength: Number(e.target.value)})}
                                  className="w-full p-3 bg-gray-50 rounded-xl text-center font-bold text-gray-700 outline-none focus:ring-2 ring-pink-100"
                              />
                          </div>
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase block mb-2">上次经期开始</label>
                          <input 
                                type="date"
                                value={tempPeriodData.lastPeriodStart}
                                onChange={e => setTempPeriodData({...tempPeriodData, lastPeriodStart: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl text-center font-bold text-gray-700 outline-none focus:ring-2 ring-pink-100"
                           />
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

      {/* --- Edit Event Modal --- */}
      {isEditEventModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm p-6">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 border-4 border-white">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-extrabold text-lg text-gray-800 flex items-center gap-2">
                          <PenLine className="w-5 h-5"/> 编辑日子
                      </h3>
                      <button onClick={() => setIsEditEventModalOpen(false)} className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-400"/></button>
                  </div>
                  
                  <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-400 font-bold uppercase mb-1.5 block">标题</label>
                            <input 
                                type="text" 
                                value={editEventTitle}
                                onChange={(e) => setEditEventTitle(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 ring-blue-100 outline-none transition-all text-sm font-bold text-gray-700"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1.5 block">日期</label>
                                <input 
                                    type="date" 
                                    value={editEventDate}
                                    onChange={(e) => setEditEventDate(e.target.value)}
                                    className="w-full p-3 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 ring-blue-100 outline-none transition-all text-sm font-bold text-gray-600"
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1.5 block">类型</label>
                                <select 
                                    value={editEventType}
                                    onChange={(e) => setEditEventType(e.target.value as any)}
                                    className="w-full p-3 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 ring-blue-100 outline-none transition-all text-sm font-bold text-gray-600"
                                >
                                    <option value="COUNTDOWN">倒数</option>
                                    <option value="ANNIVERSARY">纪念</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                             <button 
                                onClick={handleDeleteEvent}
                                className="flex-1 py-3 bg-red-50 text-red-500 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                             >
                                <Trash2 className="w-4 h-4" /> 删除
                             </button>
                             <button 
                                onClick={handleUpdateEvent}
                                className="flex-1 py-3 bg-blue-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                             >
                                <Save className="w-4 h-4" /> 保存
                             </button>
                        </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SpecialDaysView;