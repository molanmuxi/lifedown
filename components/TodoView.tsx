import React, { useState, useRef } from 'react';
import { TodoItem, NoteItem } from '../types';
import { generateId, formatDate } from '../utils';
import { Plus, Trash2, Check, Gift, History, StickyNote, ListTodo, X, Save, Clock, Calendar as CalendarIcon, Star, CalendarClock, Gem, PenLine } from 'lucide-react';

interface TodoViewProps {
  todos: TodoItem[];
  setTodos: React.Dispatch<React.SetStateAction<TodoItem[]>>;
  notes: NoteItem[];
  setNotes: React.Dispatch<React.SetStateAction<NoteItem[]>>;
}

const TodoView: React.FC<TodoViewProps> = ({ todos, setTodos, notes, setNotes }) => {
  const [viewMode, setViewMode] = useState<'TASKS' | 'NOTES'>('TASKS');
  // Sub-view for TASKS: 'TODAY' or 'FUTURE' or 'HISTORY'
  const [taskSubView, setTaskSubView] = useState<'TODAY' | 'FUTURE' | 'HISTORY'>('TODAY');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null); // Track which task is being edited
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskTime, setNewTaskTime] = useState('');
  
  // Note State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Long Press Refs
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  // Derived State
  const todayStr = new Date().toISOString().split('T')[0];

  // --- Filter & Sort Logic ---

  // 1. Today's Tasks
  const todaysTodosRaw = todos.filter(t => t.date === todayStr);
  
  // Stats Calculation
  const stats = {
      total: todaysTodosRaw.length,
      completed: todaysTodosRaw.filter(t => t.completed).length,
      uncompleted: todaysTodosRaw.filter(t => !t.completed).length,
      starred: todaysTodosRaw.filter(t => t.isStarred).length
  };

  // Sort Today's Tasks: Uncompleted > Starred > Time > Created Order
  const todaysTodos = [...todaysTodosRaw].sort((a, b) => {
      // 1. Completion status (Uncompleted first, Completed last)
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      // 2. Starred priority (Starred first)
      if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1;
      
      // 3. Time priority (Earliest first; Time set comes before Time not set)
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time && !b.time) return -1; // a has time, b does not. a comes first.
      if (!a.time && b.time) return 1; // a does not have time, b does. b comes first.
      
      return 0;
  });

  // 2. Future Tasks
  const futureTodos = todos
    .filter(t => t.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 3. Completed (History/Vault)
  const completedTodos = todos.filter(t => t.completed);
  // Only include items with a reward in the vault
  const vaultItems = completedTodos.filter(t => t.reward && !t.rewardClaimed);

  // --- Handlers ---

  const handleSaveTask = () => {
    if (!newTaskText.trim()) return;

    // Use trimmed reward or undefined if empty
    const rewardValue = newTaskReward.trim() || undefined;

    if (editingTodoId) {
        // Update Existing Task
        setTodos(prev => prev.map(t => t.id === editingTodoId ? {
            ...t,
            text: newTaskText,
            date: newTaskDate,
            time: newTaskTime || undefined,
            reward: rewardValue
        } : t));
    } else {
        // Create New Task
        const item: TodoItem = {
          id: generateId(),
          text: newTaskText,
          completed: false,
          date: newTaskDate,
          time: newTaskTime || undefined,
          reward: rewardValue,
          rewardClaimed: false,
          isStarred: false
        };
        setTodos(prev => [item, ...prev]); 
    }
    
    closeTaskModal();
  };

  const openAddTaskModal = () => {
      setEditingTodoId(null);
      setNewTaskText('');
      setNewTaskReward('');
      setNewTaskTime('');
      setNewTaskDate(new Date().toISOString().split('T')[0]);
      setIsModalOpen(true);
  };

  const openEditTaskModal = (todo: TodoItem) => {
      setEditingTodoId(todo.id);
      setNewTaskText(todo.text);
      setNewTaskReward(todo.reward || '');
      setNewTaskDate(todo.date);
      setNewTaskTime(todo.time || '');
      setIsModalOpen(true);
  };

  const closeTaskModal = () => {
      setIsModalOpen(false);
      setEditingTodoId(null);
      setNewTaskText('');
      setNewTaskReward('');
      setNewTaskTime('');
      setNewTaskDate(new Date().toISOString().split('T')[0]);
  };

  const toggleComplete = (id: string) => {
    setTodos(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const toggleStar = (id: string) => {
      // Vibrate
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
      }
      setTodos(prev => prev.map(t => t.id === id ? { ...t, isStarred: !t.isStarred } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (editingTodoId === id) closeTaskModal();
  };

  const handleClaimReward = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
    }
    setTodos(prev => prev.map(t => t.id === id ? { ...t, rewardClaimed: true } : t));
  };

  // --- Interaction Handlers (Click vs Long Press) ---

  const handlePressStart = (longPressAction: () => void) => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        longPressAction();
    }, 400); // 400ms threshold
  };

  const handlePressEnd = (clickAction: () => void) => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
    // If it wasn't a long press, it's a click
    if (!isLongPressRef.current) {
        clickAction();
    }
    isLongPressRef.current = false;
  };

  const handlePressCancel = () => {
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
      }
      isLongPressRef.current = false;
  };

  const handleSaveNote = () => {
    if (!newNoteContent.trim()) return;

    if (editingNoteId) {
        setNotes(prev => prev.map(n => 
            n.id === editingNoteId 
            ? { ...n, content: newNoteContent, date: new Date().toISOString() } 
            : n
        ));
    } else {
        const colors = ['bg-yellow-100', 'bg-blue-100', 'bg-pink-100', 'bg-green-100', 'bg-purple-100'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        setNotes(prev => [{
          id: generateId(),
          content: newNoteContent,
          date: new Date().toISOString(),
          color: randomColor
        }, ...prev]);
    }
    closeNoteModal();
  };

  const openEditNote = (note: NoteItem) => {
      setEditingNoteId(note.id);
      setNewNoteContent(note.content);
      setIsNoteModalOpen(true);
  };

  const closeNoteModal = () => {
      setNewNoteContent('');
      setEditingNoteId(null);
      setIsNoteModalOpen(false);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editingNoteId === id) {
        closeNoteModal();
    }
  };

  const getHistoryGroups = () => {
      const groups: {[key: string]: TodoItem[]} = {};
      completedTodos.forEach(t => {
          const today = new Date().toISOString().split('T')[0];
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterday = yesterdayDate.toISOString().split('T')[0];

          let key = t.date;
          if (t.date === today) key = '今天';
          else if (t.date === yesterday) key = '昨天';

          if (!groups[key]) groups[key] = [];
          groups[key].push(t);
      });
      return Object.entries(groups).sort((a, b) => {
          const dateA = a[0] === '今天' ? '9999-99-99' : (a[0] === '昨天' ? '9999-99-98' : a[0]);
          const dateB = b[0] === '今天' ? '9999-99-99' : (b[0] === '昨天' ? '9999-99-98' : b[0]);
          return dateB.localeCompare(dateA);
      });
  };

  // Group Future Tasks by Date
  const getFutureGroups = () => {
      const groups: {[key: string]: TodoItem[]} = {};
      futureTodos.forEach(t => {
          if (!groups[t.date]) groups[t.date] = [];
          groups[t.date].push(t);
      });
      return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  };

  // --- Render Sections ---

  const renderTasks = () => (
    <>
      {/* 1. Stats Dashboard */}
      <div className="px-5 pt-4 pb-2 bg-[#FFF9FB] sticky top-0 z-40">
        <div className="grid grid-cols-4 gap-3 mb-4">
             <div className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-sm border border-gray-50">
                 <span className="text-xl font-extrabold text-gray-700">{stats.total}</span>
                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">今日总计</span>
             </div>
             <div className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-sm border border-gray-50">
                 <span className="text-xl font-extrabold text-green-500">{stats.completed}</span>
                 <span className="text-[10px] text-green-400 font-bold uppercase tracking-wide">已完成</span>
             </div>
             <div className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-sm border border-gray-50">
                 <span className="text-xl font-extrabold text-blue-500">{stats.uncompleted}</span>
                 <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">未完成</span>
             </div>
             <div className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-sm border border-gray-50">
                 <span className="text-xl font-extrabold text-amber-500">{stats.starred}</span>
                 <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wide">星标</span>
             </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-2">
            <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-50">
                <button 
                    onClick={() => setTaskSubView('TODAY')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${taskSubView === 'TODAY' ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    今日
                </button>
                <button 
                    onClick={() => setTaskSubView('FUTURE')}
                    className={`flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${taskSubView === 'FUTURE' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    <CalendarClock className="w-3 h-3" /> 未来
                </button>
            </div>

            <button 
                onClick={() => setTaskSubView(taskSubView === 'HISTORY' ? 'TODAY' : 'HISTORY')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${taskSubView === 'HISTORY' ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-500 border border-gray-50 hover:bg-gray-50 shadow-sm'}`}
            >
                {taskSubView === 'HISTORY' ? <History className="w-3.5 h-3.5" /> : <Gift className="w-3.5 h-3.5"/>}
                <span>{taskSubView === 'HISTORY' ? '返回清单' : '藏宝库'}</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-36">
        {/* VIEW: HISTORY (Vault) */}
        {taskSubView === 'HISTORY' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
               <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
                   <div className="flex justify-between items-center mb-3">
                        <h3 className="text-gray-600 text-xs font-bold uppercase flex items-center gap-2">
                            <Gem className="w-4 h-4 text-amber-500" />
                            <span>我的藏宝库</span>
                        </h3>
                        <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">{vaultItems.length} 个待领取</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2.5">
                       {vaultItems.length === 0 && <p className="text-gray-400 text-xs col-span-2 py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-100">空空如也，快去完成任务吧~</p>}
                       {vaultItems.map(t => (
                           <button 
                                key={t.id} 
                                className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform relative overflow-hidden group select-none hover:bg-amber-50"
                                onMouseDown={() => handlePressStart(() => handleClaimReward(t.id))}
                                onMouseUp={() => handlePressEnd(() => {})} 
                                onMouseLeave={handlePressCancel}
                                onTouchStart={() => handlePressStart(() => handleClaimReward(t.id))}
                                onTouchEnd={() => handlePressEnd(() => {})}
                                onContextMenu={(e) => e.preventDefault()}
                           >
                               <Gift className="w-6 h-6 text-amber-400 shrink-0" />
                               <span className="text-xs text-amber-800 font-bold truncate w-full text-center">{t.reward}</span>
                               <div className="absolute top-1 right-2 text-[8px] text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">长按领取</div>
                               <div className="absolute inset-0 bg-amber-200 opacity-0 group-active:opacity-20 transition-opacity" />
                           </button>
                       ))}
                   </div>
               </div>

               <div>
                    {getHistoryGroups().map(([dateLabel, items]) => (
                        <div key={dateLabel} className="mb-5">
                            <h3 className="text-gray-400 text-xs font-bold uppercase px-2 mb-2 sticky top-0 bg-[#FFF9FB]/90 backdrop-blur py-2">{dateLabel}</h3>
                            <div className="space-y-2">
                                {items.map(todo => (
                                    <div key={todo.id} className="flex items-center p-3 rounded-2xl bg-white/60 border border-white shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 shrink-0">
                                            <Check className="w-3.5 h-3.5 text-green-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate font-medium ${todo.rewardClaimed ? 'text-gray-300 line-through' : 'text-gray-600'}`}>
                                                {todo.text}
                                            </p>
                                            {todo.reward && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] flex items-center gap-1 font-bold ${todo.rewardClaimed ? 'text-gray-300 line-through' : 'text-amber-500'}`}>
                                                        <Gift className="w-3 h-3" /> {todo.reward} {todo.rewardClaimed && '(已领)'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => deleteTodo(todo.id)} className="text-gray-300 hover:text-red-400 p-2 bg-gray-50 rounded-xl">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
               </div>
           </div>
        )}

        {/* VIEW: TODAY */}
        {taskSubView === 'TODAY' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                {todaysTodos.length === 0 && (
                <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-50">
                        <Gift className="w-8 h-8 text-pink-200" />
                    </div>
                    <p className="font-medium text-sm">今天还没有任务<br/>快去添加赢取奖励吧！✨</p>
                </div>
                )}
                {todaysTodos.map(todo => (
                <div 
                    key={todo.id} 
                    className={`group flex flex-col p-4 rounded-3xl border transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] select-none relative overflow-hidden active:scale-[0.99] cursor-pointer ${todo.completed ? 'bg-gray-50/50 border-transparent opacity-60' : 'bg-white border-white shadow-sm'} ${todo.isStarred && !todo.completed ? 'ring-2 ring-amber-100 bg-amber-50/20' : ''}`}
                    onMouseDown={() => handlePressStart(() => toggleStar(todo.id))}
                    onMouseUp={() => handlePressEnd(() => openEditTaskModal(todo))}
                    onMouseLeave={handlePressCancel}
                    onTouchStart={() => handlePressStart(() => toggleStar(todo.id))}
                    onTouchEnd={() => handlePressEnd(() => openEditTaskModal(todo))}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {/* Star Indicator */}
                    {todo.isStarred && !todo.completed && (
                        <div className="absolute top-0 right-0 p-2">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-sm" />
                        </div>
                    )}

                    <div className="flex items-center">
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleComplete(todo.id); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                            className={`w-7 h-7 rounded-full border-[3px] flex items-center justify-center mr-3.5 transition-all shrink-0 ${todo.completed ? 'bg-green-400 border-green-400' : 'border-gray-200 hover:border-blue-300 bg-gray-50'}`}
                        >
                             {todo.completed && <Check className="w-4 h-4 text-white stroke-[3px]" />}
                        </button>
                        <div className="flex-1 min-w-0 py-1">
                            <span className={`text-[15px] font-bold break-all block leading-snug ${todo.completed ? 'text-gray-400 line-through decoration-2 decoration-gray-200' : 'text-slate-700'}`}>
                                {todo.text}
                            </span>
                            {todo.time && (
                                <div className={`inline-flex items-center gap-1 mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold ${todo.completed ? 'text-gray-400 bg-gray-100' : 'text-blue-500 bg-blue-50'}`}>
                                    <Clock className="w-3 h-3" />
                                    {todo.time}
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl z-10 transition-colors"
                        >
                             <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Reward Badge */}
                    {todo.reward && (
                        <div className={`ml-[2.75rem] mt-1.5 inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold self-start border max-w-full ${todo.completed ? 'bg-gray-100 text-gray-400 border-transparent' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            <Gift className="w-3 h-3 mr-1.5 shrink-0" />
                            <span className="truncate">{todo.reward}</span>
                        </div>
                    )}
                </div>
                ))}
            </div>
        )}

        {/* VIEW: FUTURE */}
        {taskSubView === 'FUTURE' && (
             <div className="animate-in fade-in slide-in-from-right-4">
                 {futureTodos.length === 0 ? (
                     <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-50">
                            <CalendarClock className="w-8 h-8 text-blue-200" />
                        </div>
                        <p className="font-medium text-sm">没有未来的任务安排</p>
                    </div>
                 ) : (
                    getFutureGroups().map(([date, items]) => (
                        <div key={date} className="mb-5">
                            <h3 className="text-indigo-400 text-xs font-bold uppercase px-2 mb-2 sticky top-0 bg-[#FFF9FB]/90 backdrop-blur py-2 flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                {date}
                            </h3>
                            <div className="space-y-2">
                                {items.map(todo => (
                                    <div 
                                        key={todo.id} 
                                        className="flex flex-col p-4 rounded-3xl bg-white border border-white shadow-sm relative overflow-hidden active:scale-[0.99] transition-transform"
                                        onClick={() => openEditTaskModal(todo)}
                                    >
                                        {todo.isStarred && <div className="absolute top-0 right-0 p-2"><Star className="w-3 h-3 text-amber-400 fill-amber-400"/></div>}
                                        <div className="flex justify-between items-start">
                                            <span className="text-sm font-bold text-gray-700">{todo.text}</span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }} 
                                                className="text-gray-300 hover:text-red-400 p-1"
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3">
                                             {todo.reward && <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">{todo.reward}</span>}
                                             {todo.time && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{todo.time}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                 )}
             </div>
        )}
      </div>

      {/* FAB for Tasks */}
      {taskSubView !== 'HISTORY' && (
          <div className="absolute bottom-6 right-6 z-50">
            <button 
                onClick={openAddTaskModal}
                className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-[20px] text-white shadow-lg shadow-blue-300/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
                <Plus className="w-7 h-7" strokeWidth={3} />
            </button>
          </div>
      )}

      {/* Modal for Adding/Editing Task */}
      {isModalOpen && (
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
              <div className="bg-white w-full sm:w-10/12 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-20 duration-300">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-extrabold text-gray-800 flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${editingTodoId ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                            {editingTodoId ? <PenLine className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                          </div>
                          {editingTodoId ? '修改小目标' : '新的挑战'}
                      </h3>
                      <button onClick={closeTaskModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">任务内容</label>
                          <input 
                              autoFocus
                              type="text" 
                              value={newTaskText}
                              onChange={e => setNewTaskText(e.target.value)}
                              placeholder="例如：背20个单词"
                              className="w-full text-lg font-bold border-b-2 border-gray-100 focus:border-blue-400 outline-none py-2 bg-transparent placeholder-gray-300 transition-colors"
                          />
                      </div>

                      <div className="flex gap-4">
                          <div className="flex-1">
                             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5" /> 日期
                             </label>
                             <input 
                                type="date"
                                value={newTaskDate}
                                onChange={e => setNewTaskDate(e.target.value)}
                                className="w-full text-sm font-semibold border-b-2 border-gray-100 focus:border-blue-400 outline-none py-2 bg-transparent text-gray-700"
                             />
                          </div>
                          <div className="flex-1">
                             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> 时间 (可选)
                             </label>
                             <input 
                                type="time"
                                value={newTaskTime}
                                onChange={e => setNewTaskTime(e.target.value)}
                                className="w-full text-sm font-semibold border-b-2 border-gray-100 focus:border-blue-400 outline-none py-2 bg-transparent text-gray-700"
                             />
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Gift className="w-3.5 h-3.5" /> 完成奖励
                          </label>
                          <div className="flex gap-2.5 overflow-x-auto py-2 no-scrollbar mb-2">
                              {['奖励10积分', '看一集动漫', '喝杯奶茶', '打一局游戏'].map(r => (
                                  <button 
                                    key={r}
                                    onClick={() => setNewTaskReward(r)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all ${newTaskReward === r ? 'bg-amber-50 border-amber-300 text-amber-600 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-amber-200'}`}
                                  >
                                      {r}
                                  </button>
                              ))}
                          </div>
                          <input 
                              type="text" 
                              value={newTaskReward}
                              onChange={e => setNewTaskReward(e.target.value)}
                              placeholder="自定义奖励..."
                              className="w-full text-sm font-semibold border-b-2 border-gray-100 focus:border-amber-400 outline-none py-2 bg-transparent placeholder-gray-300"
                          />
                      </div>

                      <button 
                        onClick={handleSaveTask}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-gray-200 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 text-sm"
                      >
                          {editingTodoId ? <Save className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                          {editingTodoId ? '保存修改' : '确认添加'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </>
  );

  const renderNotes = () => (
    <>
        <div className="flex-1 overflow-y-auto p-5 pb-24">
            <div className="columns-2 gap-3 space-y-3">
                {/* Add Note Card */}
                <button 
                    onClick={() => setIsNoteModalOpen(true)}
                    className="w-full border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center aspect-square text-gray-400 hover:bg-white hover:border-yellow-300 hover:text-yellow-400 transition-all active:scale-95 bg-gray-50/50"
                >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                         <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold">记笔记</span>
                </button>

                {notes.map(note => (
                    <div 
                        key={note.id} 
                        onClick={() => openEditNote(note)}
                        className={`break-inside-avoid-column ${note.color} p-4 rounded-3xl shadow-sm flex flex-col min-h-[120px] relative group cursor-pointer active:scale-[0.98] transition-all hover:-translate-y-1 hover:shadow-md`}
                    >
                         <div className="flex-1 whitespace-pre-wrap text-[13px] text-gray-800 font-semibold leading-relaxed pointer-events-none font-sans">
                             {note.content}
                         </div>
                         <div className="text-[9px] text-gray-500 mt-3 text-right opacity-60 font-bold pointer-events-none">
                            {new Date(note.date).toLocaleDateString()}
                         </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                            className="absolute top-2 right-2 p-1.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5 rounded-full"
                         >
                            <Trash2 className="w-3.5 h-3.5" />
                         </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Modal for Adding/Editing Note */}
        {isNoteModalOpen && (
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-yellow-50 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative border-4 border-white animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center mb-4">
                       <h3 className="text-sm font-extrabold text-yellow-800/70 uppercase tracking-widest">{editingNoteId ? '编辑便利贴' : '新便利贴'}</h3>
                       <button onClick={closeNoteModal} className="p-1 hover:bg-yellow-100 rounded-full"><X className="w-5 h-5 text-yellow-700"/></button>
                  </div>
                  <textarea 
                    autoFocus
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="写下你的想法..."
                    className="w-full h-48 bg-transparent resize-none outline-none text-gray-800 placeholder-yellow-800/30 text-base font-medium leading-relaxed"
                  />
                  <div className="flex justify-end mt-2">
                      <button 
                        onClick={handleSaveNote}
                        className="bg-yellow-400 text-yellow-900 px-6 py-2.5 rounded-xl font-bold shadow-md shadow-yellow-200/50 flex items-center gap-2 hover:bg-yellow-300 active:scale-95 transition-all"
                      >
                          <Save className="w-4 h-4" /> 保存
                      </button>
                  </div>
              </div>
          </div>
        )}
    </>
  );

  return (
    <div className="flex flex-col h-full bg-[#FFF9FB] relative">
      {/* Header */}
      <div className="px-6 py-4 bg-[#FFF9FB] shrink-0 z-20">
        <div className="flex bg-white rounded-full p-1.5 relative shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-gray-50">
            {/* Animated Background for Tab */}
            <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-md shadow-blue-200 transition-all duration-300 ease-spring ${viewMode === 'TASKS' ? 'left-1.5' : 'translate-x-[calc(100%+6px)]'}`}
            ></div>

            <button 
                onClick={() => setViewMode('TASKS')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold z-10 transition-colors ${viewMode === 'TASKS' ? 'text-white' : 'text-gray-400'}`}
            >
                <ListTodo className="w-4 h-4" /> 待办事项
            </button>
            <button 
                onClick={() => setViewMode('NOTES')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold z-10 transition-colors ${viewMode === 'NOTES' ? 'text-white' : 'text-gray-400'}`}
            >
                <StickyNote className="w-4 h-4" /> 记事本
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 relative">
         {viewMode === 'TASKS' ? renderTasks() : renderNotes()}
      </div>
    </div>
  );
};

export default TodoView;