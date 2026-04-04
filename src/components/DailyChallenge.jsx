import { useState } from "react";

// Детерминированный выбор задачи по дате (одна задача на весь день для всех игроков)
function getDailyTask(tasks) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  }
  return tasks[hash % tasks.length];
}

export default function DailyChallenge({ TASKS, completedTasks, onStartTask, t }) {
  const [dismissed, setDismissed] = useState(() => {
    const stored = localStorage.getItem("shariel_daily_dismissed");
    return stored === new Date().toISOString().slice(0, 10);
  });

  if (dismissed || !TASKS?.length) return null;

  const task = getDailyTask(TASKS);
  const isDone = completedTasks.includes(task.id);

  function handleStart() {
    const idx = TASKS.findIndex(t => t.id === task.id);
    if (idx >= 0) onStartTask(idx);
  }

  function handleDismiss() {
    localStorage.setItem("shariel_daily_dismissed", new Date().toISOString().slice(0, 10));
    setDismissed(true);
  }

  return (
    <div className="mx-4 mb-4 rounded-[28px] overflow-hidden shadow-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 animate-fade-in-up">
      <div className="px-5 pt-4 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌅</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Задача дня</span>
        </div>
        <button onClick={handleDismiss} className="text-amber-300 text-xs hover:text-amber-500 transition-colors font-black">✕</button>
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{task.icon || '❓'}</span>
          <div>
            <p className="font-black text-slate-800 text-[15px] leading-tight">{task.title}</p>
            <div className="flex gap-0.5 mt-0.5">
              {[...Array(task.difficulty || 1)].map((_, i) => <span key={i} className="text-[10px]">⭐</span>)}
            </div>
          </div>
        </div>

        {isDone ? (
          <div className="flex items-center gap-2 py-2 px-4 bg-emerald-100 rounded-[16px]">
            <span className="text-emerald-600 font-black text-sm">✓ Уже решено сегодня!</span>
          </div>
        ) : (
          <button
            onClick={handleStart}
            className="w-full py-3 rounded-[18px] bg-amber-500 text-white font-black text-sm uppercase tracking-wide shadow-md shadow-amber-200 active:scale-95 transition-all"
          >
            Решить сейчас →
          </button>
        )}
      </div>
    </div>
  );
}
