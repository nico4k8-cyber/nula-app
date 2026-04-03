import React from "react";

export default function TaskPicker({ 
  activeCategory, 
  onBack, 
  TASKS, 
  completedTasks, 
  onStartTask,
  t,
  lang = 'ru'
}) {
  const filtered = TASKS.filter(taskItem => taskItem.category === activeCategory);

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
        </div>

        {/* Decorative Curve */}
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gray-50 rounded-t-[40px]" />
      </div>

      {/* Mentor Bubble (Coal) */}
      <div className="px-6 mb-2 -mt-4 relative z-10 animate-fade-in-up">
         <div className="bg-white rounded-[32px] p-6 shadow-xl border border-orange-100 flex gap-4 items-center max-w-[500px] mx-auto transition-transform hover:scale-[1.02]">
            <img src="/img/webp/ugolok.webp" alt="Уголёк" className="w-16 h-16 rounded-full object-cover border-2 border-orange-200 flex-shrink-0" />
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
           {filtered.length === 0 ? (
             <div className="col-span-2 py-20 text-center opacity-40">
                <div className="text-5xl mb-4">📜</div>
                <p className="font-bold uppercase tracking-widest text-xs">Задач пока нет</p>
             </div>
           ) : (
             filtered.map((taskItem) => {
               const originalIdx = TASKS.findIndex(task => task.id === taskItem.id);
               const isDone = completedTasks.includes(taskItem.id);
               return (
                 <button key={taskItem.id}
                   onClick={() => onStartTask(originalIdx)}
                   className={`relative overflow-hidden aspect-square h-[170px] rounded-[36px] p-4 flex flex-col items-center justify-center text-center transition-all active:scale-95 border-4 group shadow-lg
                     ${isDone 
                       ? "bg-emerald-50 border-emerald-200" 
                       : "bg-white border-white hover:border-orange-200 hover:shadow-orange-100 hover:shadow-2xl"}`}
                 >
                   <div className="text-5xl mb-3 flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                     {taskItem.icon || taskItem.puzzle?.emoji || "❓"}
                   </div>
                   <div className="flex flex-col gap-1 min-w-0">
                     <span className={`text-[12px] font-black uppercase tracking-tight leading-tight line-clamp-2
                       ${isDone ? "text-emerald-700" : "text-slate-800"}`}>
                       {getTitle(taskItem)}
                     </span>
                     <div className="flex items-center justify-center gap-0.5 mt-1">
                        {[...Array(taskItem.difficulty || 1)].map((_, i) => (
                          <span key={i} className="text-[10px]">⭐</span>
                        ))}
                     </div>
                   </div>
                   
                   {isDone && (
                     <div className="absolute top-4 right-4 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                        ✓
                     </div>
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
