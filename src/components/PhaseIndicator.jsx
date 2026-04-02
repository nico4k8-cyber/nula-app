/**
 * PhaseIndicator — Стимпанк-индикатор стадий ПРИЗ (П Р И З ✨)
 * Выглядит как ряд медных иллюминаторов/лампочек, которые загораются теплым светом.
 */

export default function PhaseIndicator({ trizPhase, prizStep, cycleCount }) {
  const stages = ["П", "Р", "И", "З", "✨"];
  const stageLabels = {
    "П": "Подготовка",
    "Р": "Разведка",
    "И": "Идеи",
    "З": "Зачёт",
    "✨": "Инсайт"
  };

  // ПРИЗ-лампочки (Стимпанк стиль)
  return (
    <div className="flex flex-col items-center gap-2 py-4 bg-gradient-to-b from-slate-900/5 to-transparent border-b border-slate-100/50 relative overflow-hidden backdrop-blur-sm">
      {/* Мягкое свечение фона */}
      <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full scale-150" />
      
      <div className="flex gap-3 sm:gap-5 relative z-10">
        {stages.map((stage, idx) => {
          const isActive = idx === prizStep;
          const isDone = idx < prizStep;
          
          return (
            <div
              key={stage}
              className={`flex flex-col items-center gap-1.5 transition-all duration-700 ${
                idx <= prizStep ? "opacity-100 scale-100" : "opacity-40 scale-95"
              }`}
            >
              {/* Корпус лампочки (Медь/Бронза) */}
              <div className="relative group">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-[15px] font-black transition-all duration-700 shadow-xl border-[3px] 
                    ${isActive 
                      ? "bg-gradient-to-br from-amber-400 to-orange-600 text-white border-white/50 shadow-orange-300/50 scale-110 shadow-[0_0_20px_rgba(251,146,60,0.6)]" 
                      : isDone 
                      ? "bg-gradient-to-br from-emerald-400 to-teal-600 text-white border-white/20 shadow-emerald-200/20" 
                      : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 border-slate-400/20 shadow-inner"}
                  `}
                >
                  {/* Эффект свечения для активной лампочки */}
                  {isActive && (
                    <>
                      <div className="absolute inset-[-4px] rounded-full border border-orange-400/30 animate-pulse-slow scale-110" />
                      <div className="absolute inset-0 rounded-full bg-orange-400 blur-md opacity-40 animate-pulse pulse-fast" />
                    </>
                  )}
                  
                  {/* Стеклянный блик сверху */}
                  <div className="absolute inset-1 rounded-full bg-white/20 blur-[1px] h-1/2 w-1/2 -top-1 -left-1 rotate-45" />
                  
                  <span className="relative z-10 drop-shadow-md">{stage}</span>
                </div>
              </div>

              {/* Текстовая метка */}
              <div className={`text-[9px] font-black uppercase tracking-tighter text-center transition-colors duration-500
                ${isActive ? "text-orange-700" : isDone ? "text-emerald-700" : "text-slate-400"}
              `}>
                {stageLabels[stage]}
              </div>
            </div>
          );
        })}
      </div>
      
      {cycleCount > 0 && (
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] animate-fade-in mt-1">
          {/* Стилизованный разделитель */}
          <span className="opacity-30">───</span> Цикл {cycleCount + 1} <span className="opacity-30">───</span>
        </div>
      )}
    </div>
  );
}
