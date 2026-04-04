import React from 'react';

export default function TaskPreview({ task, onStart, onBack, t, lang }) {
  const title = lang === 'en' ? (task.title_en || task.title) : task.title;
  const question = lang === 'en' ? (task.question_en || task.question_ru) : task.question_ru;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white animate-fade-in relative overflow-hidden">
      {/* Top Image Header */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <img 
          src={task.image_url || task.imgUrl || "/assets/webp/main_island.webp"}
          className="w-full h-full object-cover"
          alt={title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
        
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/90 rounded-2xl text-slate-800 text-xl shadow-xl active:scale-95 transition-all z-20"
        >
          ←
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-8 pt-2 pb-32 -mt-12 relative z-10 bg-white rounded-t-[40px] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] flex flex-col">
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 mb-8" />
        
        <div className="flex items-center gap-3 mb-4">
           <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
             {t?.('picker.missions') || 'МИССИЯ'}
           </span>
           <div className="flex gap-1 text-yellow-400">
             {[...Array(task.difficulty || 1)].map((_, i) => <span key={i}>⭐</span>)}
           </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 leading-tight mb-6 uppercase tracking-tight font-display">
          {title}
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-[17px] text-slate-600 leading-relaxed font-medium italic mb-6">
            {question}
          </p>
        </div>

        <div className="mt-auto pt-8">
           <div className="p-6 bg-indigo-50 rounded-[32px] border-2 border-indigo-100/50 mb-8 flex items-start gap-4">
              <span className="text-2xl mt-1">🔭</span>
              <p className="text-[14px] text-indigo-900 font-bold leading-snug">
                {t?.('preview_tip') || 'Используй метод ПРИЗ, чтобы найти самое сильное решение этой задачи!'}
              </p>
           </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 inset-x-0 flex justify-center pointer-events-none">
        <div className="w-full max-w-md px-8 pb-8 pt-16 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={onStart}
            className="btn-premium w-full pointer-events-auto flex items-center justify-center gap-2"
          >
            {t?.('start_solving') || 'К РЕШЕНИЮ'}
            <span className="text-xl">🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
}
