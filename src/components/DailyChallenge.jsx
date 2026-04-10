import { useState, useEffect, useMemo } from "react";
import { loadAppConfig } from "../lib/supabase";

// Детерминированный выбор задачи по дате (fallback)
function getDailyTaskByHash(tasks, dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return tasks[hash % tasks.length];
}

export default function DailyChallenge({ TASKS, completedTasks, onStartTask, onStart, t }) {
  const today = useMemo(() => new Date().toLocaleDateString('sv'), []);
  const [task, setTask] = useState(() => getDailyTaskByHash(TASKS || [], today));

  useEffect(() => {
    if (!TASKS?.length) return;
    loadAppConfig('daily_schedule').then(val => {
      try {
        const schedule = val ? JSON.parse(val) : {};
        const scheduled = schedule[today];
        if (scheduled) {
          const found = TASKS.find(t => t.id === scheduled || t.id === Number(scheduled));
          if (found) { setTask(found); return; }
        }
      } catch {}
      setTask(getDailyTaskByHash(TASKS, today));
    }).catch(() => {
      setTask(getDailyTaskByHash(TASKS, today));
    });
  }, [TASKS, today]);

  const [minimized, setMinimized] = useState(() => {
    // If user explicitly opened it this session, keep it open
    if (sessionStorage.getItem("shariel_daily_expanded") === "1") return false;
    const stored = localStorage.getItem("shariel_daily_dismissed");
    return stored === new Date().toLocaleDateString('sv');
  });

  if (!TASKS?.length || !task) return null;

  const isDone = completedTasks?.some(t => (typeof t === 'object' ? t.taskId : t) == task.id);

  function handleStart() {
    // Mark as expanded so it stays open when user returns from task
    sessionStorage.setItem("shariel_daily_expanded", "1");
    if (onStart) {
      onStart(task);
    } else if (onStartTask) {
      const idx = TASKS.findIndex(t => t.id === task.id);
      if (idx >= 0) onStartTask(idx);
    }
  }

  function handleMinimize() {
    sessionStorage.removeItem("shariel_daily_expanded");
    localStorage.setItem("shariel_daily_dismissed", new Date().toLocaleDateString('sv'));
    setMinimized(true);
  }

  if (minimized) {
    return (
      <div
        onClick={() => {
          sessionStorage.setItem("shariel_daily_expanded", "1");
          setMinimized(false);
        }}
        className="w-full flex items-center justify-between px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer active:scale-95 transition-all"
      >
        <span className="text-sm font-semibold text-amber-700">🌅 Задача дня — нажми, чтобы открыть</span>
        <span className="text-amber-400 text-xs">▼</span>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 rounded-[28px] overflow-hidden shadow-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 animate-fade-in-up">
      <div className="px-5 pt-4 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌅</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Задача дня</span>
        </div>
        {!isDone && (
          <button onClick={handleMinimize} className="text-amber-300 text-xs hover:text-amber-500 transition-colors font-black">✕</button>
        )}
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl flex-shrink-0 mt-0.5">{task.icon || '❓'}</span>
          <div className="min-w-0">
            <p className="font-black text-slate-800 text-[15px] leading-tight">{task.title}</p>
            <div className="flex gap-0.5 mt-0.5 mb-1">
              {[...Array(task.difficulty || 1)].map((_, i) => <span key={i} className="text-[10px]">💎</span>)}
            </div>
            {(task.teaser || task.puzzle?.question) && (
              <p className="text-[13px] text-slate-600 leading-snug italic">
                {task.teaser || task.puzzle?.question}
              </p>
            )}
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
