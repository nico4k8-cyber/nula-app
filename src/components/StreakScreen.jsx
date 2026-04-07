import React from 'react';

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const getMessage = (streak) => {
  if (streak >= 30) return "Настоящий изобретатель! 🏆";
  if (streak >= 14) return "Две недели — это сила! 💪";
  if (streak >= 7)  return "Неделя без перерыва! Легенда! ⭐";
  if (streak >= 3)  return "Три дня подряд — хорошее начало!";
  return "Продолжай решать задачи каждый день!";
};

export default function StreakScreen({ streak, onClose }) {
  const isMilestone = streak === 7 || streak === 14 || streak === 30;
  // getDay() returns 0=Sun, 1=Mon... convert to 0=Mon...6=Sun
  const todayDow = (new Date().getDay() + 6) % 7;
  const filledCount = Math.min(streak, todayDow + 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] bg-white rounded-t-[32px] p-6 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-center mb-5">
          <div
            className="text-5xl mb-2 inline-block"
            style={isMilestone ? { animation: "bounce 0.5s ease 3" } : {}}
          >
            🔥
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {streak} {streak === 1 ? "день" : streak < 5 ? "дня" : "дней"} подряд!
          </h2>
          <p className="text-slate-500 text-sm mt-1">{getMessage(streak)}</p>
        </div>

        {/* Week circles */}
        <div className="flex justify-center gap-2 mb-8">
          {DAYS.map((day, i) => {
            const filled = i < filledCount;
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <div
                  className={
                    filled
                      ? "w-8 h-8 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center"
                      : "w-8 h-8 rounded-full bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center"
                  }
                >
                  {filled ? "✓" : ""}
                </div>
                <span className="text-[9px] text-slate-400 font-medium">{day}</span>
              </div>
            );
          })}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-orange-500 text-white font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-lg shadow-orange-200"
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}
