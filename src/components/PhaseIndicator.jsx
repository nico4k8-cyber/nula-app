/**
 * PhaseIndicator — Shows explicit 5 steps of ПРИЗ methodology
 * 1: Подготовка (📝)
 * 2: Анализ (🔍)
 * 3: Гипотезы (💡)
 * 4: Отбор (✅)
 * 5: Проверка (🚀)
 */

export default function PhaseIndicator({ trizPhase, prizStep, cycleCount }) {
  const stages = [
    { id: 0, label: "Старт", icon: "📝", color: "from-amber-400 to-orange-600" },
    { id: 1, label: "Анализ", icon: "🔍", color: "from-blue-400 to-indigo-600" },
    { id: 2, label: "Гипотезы", icon: "💡", color: "from-yellow-300 to-amber-500" },
    { id: 3, label: "Отбор", icon: "✅", color: "from-emerald-400 to-green-600" },
    { id: 4, label: "Проверка", icon: "🚀", color: "from-rose-400 to-red-600" }
  ];

  // Map internal trizPhase (0-7) to UI steps (0-4) if needed, 
  // but we prefer using explicit 'prizStep' from engine
  const currentStep = prizStep || 0;

  return (
    <div className="w-full bg-slate-50/80 border-y border-slate-100 py-6 px-4 relative overflow-hidden backdrop-blur-sm">
      {/* Connector Line */}
      <div className="absolute top-[46px] left-[15%] right-[15%] h-1 bg-slate-200 rounded-full" />
      <div 
        className="absolute top-[46px] left-[15%] h-1 bg-gradient-to-r from-orange-400 to-green-500 rounded-full transition-all duration-1000" 
        style={{ width: `${Math.min(currentStep * 17.5, 70)}%` }}
      />

      <div className="flex justify-between items-start max-w-[500px] mx-auto relative z-10">
        {stages.map((stage, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          const isFuture = idx > currentStep;

          return (
            <div key={stage.id} className="flex flex-col items-center gap-2 flex-1 min-w-0">
              {/* Icon Circle */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-700 shadow-lg border-4
                  ${isActive 
                    ? `bg-gradient-to-br ${stage.color} border-white scale-125 ring-4 ring-orange-100 animate-bounce-slow` 
                    : isDone 
                    ? "bg-green-500 border-green-100 text-white" 
                    : "bg-white border-slate-50 text-slate-300"}
                `}
              >
                {isDone ? "✓" : stage.icon}
                
                {/* Active Glow */}
                {isActive && (
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${stage.color} blur-lg opacity-40 animate-pulse`} />
                )}
              </div>

              {/* Label */}
              <div className="flex flex-col items-center">
                <span className={`text-[9px] font-black uppercase tracking-tighter transition-all duration-500
                  ${isActive ? "text-slate-900 scale-110" : "text-slate-400 font-bold"}
                `}>
                  {stage.label}
                </span>
                
                {/* Active Indicator dot */}
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-orange-500 mt-0.5 animate-ping" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cycle Indicator */}
      {cycleCount > 0 && (
        <div className="absolute top-1 right-3">
          <div className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-orange-200">
            Поход №{cycleCount + 1}
          </div>
        </div>
      )}
    </div>
  );
}
