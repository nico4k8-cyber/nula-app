import React from "react";

function getDailyTask(tasks) {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  }
  return tasks[hash % tasks.length];
}

export default function TaskPicker({
  activeCategory,
  onBack,
  onOpenMenu,
  TASKS,
  completedTasks,
  onStartTask,
  t,
  lang = 'ru'
}) {
  const filtered = TASKS
    .filter(taskItem => taskItem.category === activeCategory)
    .sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));

  // Difficulty locking: difficulty:3 locked until all difficulty:1-2 in category are done
  const easyTasks = filtered.filter(t => (t.difficulty || 1) < 3);
  const allEasyDone = easyTasks.length > 0 && easyTasks.every(t => completedTasks.includes(t.id));
  const isDifficultyLocked = (taskItem) => (taskItem.difficulty || 1) >= 3 && !allEasyDone;

  const dailyTask = getDailyTask(TASKS);
  const isDailyInThisCategory = dailyTask?.category === activeCategory;

  const doneCount = filtered.filter(t => completedTasks.includes(t.id)).length;

  const getTitle = (taskItem) => {
    if (lang === 'en' && taskItem.title_en) return taskItem.title_en;
    return taskItem.title;
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50/30 overflow-hidden animate-fade-in">
      {/* Header / Navigation */}
      <div className={`p-6 pb-12 pt-32 text-white relative shadow-2xl transition-all duration-700
        ${activeCategory === 'library' ? 'bg-gradient-to-br from-amber-600 to-orange-800 border-b-4 border-amber-800' : 
          activeCategory === 'farm' ? 'bg-gradient-to-br from-emerald-600 to-green-900 border-b-4 border-emerald-900' :
          activeCategory === 'nature-reserve' ? 'bg-gradient-to-br from-teal-500 to-emerald-800 border-b-4 border-teal-900' :
          activeCategory === 'city-hall' ? 'bg-gradient-to-br from-blue-600 to-indigo-900 border-b-4 border-blue-900' :
          'bg-gradient-to-br from-slate-600 to-slate-900 border-b-4 border-slate-900'}
      `}>
        <button
          onClick={onBack}
          className="absolute top-28 left-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-[13px] font-black uppercase tracking-widest transition-all active:scale-95"
        >
          ← НА ОСТРОВ
        </button>
        {onOpenMenu && (
          <button
            onClick={onOpenMenu}
            className="absolute top-28 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl transition-all active:scale-90"
          >
            👤
          </button>
        )}
        
        <div className="mt-8 text-center" style={{ viewTransitionName: 'building-header' }}>
           <div className="text-6xl mb-4 filter drop-shadow-lg scale-110">
              {activeCategory === 'library' ? '📚' : 
               activeCategory === 'farm' ? '🚜' :
               activeCategory === 'nature-reserve' ? '🏞️' :
               activeCategory === 'city-hall' ? '🏛️' :
               activeCategory === 'workshop' ? '🔧' : '⚙️'}
           </div>
           <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">
              {t(`buildings.${activeCategory}`)}
           </h2>
           <p className="text-white/70 font-bold text-xs uppercase tracking-[0.2em]">
              {t('picker.choose')}
           </p>
           {filtered.length > 0 && (
             <div className="mt-4 mx-auto max-w-[200px]">
               <div className="flex justify-between text-white/60 text-[10px] font-black uppercase mb-1.5">
                 <span>Решено</span>
                 <span>{doneCount} / {filtered.length}</span>
               </div>
               <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                 <div
                   className="h-full bg-white rounded-full transition-all duration-700"
                   style={{ width: `${filtered.length > 0 ? (doneCount / filtered.length) * 100 : 0}%` }}
                 />
               </div>
             </div>
           )}
        </div>

        {/* Decorative Curve */}
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gray-50 rounded-t-[40px]" />
      </div>

      {/* Mentor Bubble (Coal) */}
      <div className="px-6 mb-2 -mt-4 relative z-10 animate-fade-in-up">
         <div className="bg-white rounded-[32px] p-6 shadow-xl border border-orange-100 flex gap-4 items-center max-w-[500px] mx-auto transition-transform hover:scale-[1.02]">
            <img src="/img/webp/ugolok.webp" alt="Орин" className="w-16 h-16 rounded-full object-cover border-2 border-orange-200 flex-shrink-0" />
            <div className="flex-1">
               <p className="text-[14px] text-slate-800 font-bold leading-tight italic">
                  {t(`picker.mentor.${activeCategory === 'library' || activeCategory === 'farm' || activeCategory === 'city-hall' ? activeCategory : 'default'}`)}
               </p>
            </div>
         </div>
      </div>

      {/* Tasks Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4 custom-scrollbar">
         <div className="grid grid-cols-2 gap-4 max-w-[600px] mx-auto">
           {/* Daily task card — full width, only if it belongs to this category */}
           {isDailyInThisCategory && (() => {
             const isDone = completedTasks.includes(dailyTask.id);
             const idx = TASKS.findIndex(t => t.id === dailyTask.id);
             return (
               <button key={`daily-${dailyTask.id}`}
                 onClick={() => onStartTask(idx)}
                 className={`col-span-2 rounded-[28px] p-5 flex items-center gap-4 text-left transition-all active:scale-[0.98] border-2 shadow-lg
                   ${isDone
                     ? "bg-emerald-50 border-emerald-200"
                     : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:shadow-amber-100 hover:shadow-xl"}`}
               >
                 <div className="text-5xl flex-shrink-0">{dailyTask.icon || dailyTask.puzzle?.emoji || "❓"}</div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">🔥 Задача дня</span>
                   </div>
                   <p className={`text-[15px] font-black leading-tight ${isDone ? "text-emerald-700" : "text-slate-800"}`}>
                     {getTitle(dailyTask)}
                   </p>
                   <div className="flex gap-0.5 mt-1">
                     {[...Array(dailyTask.difficulty || 1)].map((_, i) => (
                       <span key={i} className="text-[11px]">💎</span>
                     ))}
                   </div>
                 </div>
                 {isDone
                   ? <div className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0">✓</div>
                   : <div className="text-amber-400 text-xl flex-shrink-0">→</div>
                 }
               </button>
             );
           })()}

           {filtered.length === 0 ? (
             <div className="col-span-2 py-20 text-center opacity-40">
               <div className="text-5xl mb-4">📜</div>
               <p className="font-bold uppercase tracking-widest text-xs">Задач пока нет</p>
             </div>
           ) : (
             filtered.map((taskItem) => {
               const originalIdx = TASKS.findIndex(task => task.id === taskItem.id);
               const isDone = completedTasks.includes(taskItem.id);
               const isDaily = isDailyInThisCategory && taskItem.id === dailyTask.id;
               const isLocked = isDifficultyLocked(taskItem);
               return (
                 <button key={taskItem.id}
                   onClick={() => !isLocked && onStartTask(originalIdx)}
                   className={`relative overflow-hidden aspect-square h-[170px] rounded-[36px] p-4 flex flex-col items-center justify-center text-center transition-all border-4 group shadow-lg
                     ${isLocked
                       ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
                       : isDone
                       ? "bg-emerald-50 border-emerald-200 active:scale-95"
                       : isDaily
                       ? "bg-amber-50 border-amber-300 active:scale-95"
                       : "bg-white border-white hover:border-orange-200 hover:shadow-orange-100 hover:shadow-2xl active:scale-95"}`}
                 >
                   <div className={`text-5xl mb-3 flex-shrink-0 transition-transform duration-300 ${!isLocked && "group-hover:scale-110"}`}>
                     {isLocked ? "🔒" : (taskItem.icon || taskItem.puzzle?.emoji || "❓")}
                   </div>
                   <div className="flex flex-col gap-1 min-w-0">
                     <span className={`text-[12px] font-black uppercase tracking-tight leading-tight line-clamp-2
                       ${isLocked ? "text-slate-400" : isDone ? "text-emerald-700" : "text-slate-800"}`}>
                       {isLocked ? "Реши все задачи 💎💎" : getTitle(taskItem)}
                     </span>
                     <div className="flex items-center justify-center gap-0.5 mt-1">
                       {[...Array(taskItem.difficulty || 1)].map((_, i) => (
                         <span key={i} className="text-[10px]">💎</span>
                       ))}
                     </div>
                   </div>
                   {!isLocked && isDone && (
                     <div className="absolute top-4 right-4 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg">✓</div>
                   )}
                   {!isLocked && isDaily && !isDone && (
                     <div className="absolute top-3 left-3 text-[9px] font-black bg-amber-400 text-white px-2 py-0.5 rounded-full">🔥</div>
                   )}
                 </button>
               );
             })
           )}
         </div>
      </div>

      {/* Decorative Bottom Glow */}
      <div className="fixed bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
}
