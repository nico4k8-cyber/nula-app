import React from "react";

export default function DebriefView({
  task,
  sessionStars,
  totalStars,
  onNext,
  onWantsMore,
  t,
  lang
}) {
  const stars = Math.min(Math.max(1, sessionStars), 3);

  // Criterion explanation based on stars (from Gin's book: elegance = using resources already in task)
  const criterionText = stars === 3
    ? "Ты использовал то, что уже было в задаче — это главный секрет изобретателей! 🔥"
    : stars === 2
    ? "Твоё решение работает! Но изобретатели идут дальше: они ищут ресурсы прямо в условии — то, что уже есть рядом."
    : "Ты справился! Секрет ТРИЗ: не приноси новое, а используй то, что уже есть в задаче.";

  const qualityLabel = stars === 3
    ? "Изобретательское решение!"
    : stars === 2
    ? "Хорошее решение!"
    : "Задача решена!";

  // Extract key resource from task
  const keyResource = Array.isArray(task?.resources) && task.resources.length > 0
    ? (task.resources[0].id || task.resources[0])
    : null;

  return (
    <div className="flex flex-col h-[100dvh] bg-white animate-fade-in-up overflow-hidden">

      {/* Top celebration zone */}
      <div className="flex flex-col items-center justify-center pt-10 pb-4 px-6">
        <div className="text-6xl mb-3 animate-bounce-slow">🎉</div>
        <h2 className="text-[26px] font-black text-slate-800 text-center leading-tight mb-1">
          {qualityLabel}
        </h2>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: stars }).map((_, i) => (
            <span key={i} className="text-3xl" style={{ animation: `bounceIn 0.4s ease ${i * 0.2}s both` }}>⭐</span>
          ))}
          {Array.from({ length: 3 - stars }).map((_, i) => (
            <span key={`empty-${i}`} className="text-3xl opacity-20">⭐</span>
          ))}
        </div>
        {totalStars > 0 && (
          <div className="mt-2 px-4 py-1.5 bg-amber-50 rounded-full border border-amber-200">
            <span className="text-amber-700 text-sm font-black">Итого: ⭐ {totalStars + stars}</span>
          </div>
        )}
      </div>

      {/* Criterion card — WHY this rating */}
      <div className="mx-5 mb-3 bg-blue-50 border-2 border-blue-100 rounded-[20px] p-4">
        <div className="text-[13px] text-blue-500 font-bold uppercase tracking-wide mb-1">Почему такая оценка</div>
        <p className="text-[14px] text-blue-900 leading-relaxed font-medium">{criterionText}</p>
      </div>

      {/* IKR reveal — Ideal Final Result */}
      {task?.ikr && (
        <div className="mx-5 mb-3 bg-emerald-50 border-2 border-emerald-100 rounded-[20px] p-4">
          <div className="text-[13px] text-emerald-500 font-bold uppercase tracking-wide mb-1">
            {keyResource ? `Ключ к задаче: ${keyResource}` : "Как думает изобретатель"}
          </div>
          <p className="text-[14px] text-emerald-900 leading-relaxed font-medium">{task.ikr}</p>
        </div>
      )}

      {/* Орин says */}
      <div className="mx-5 bg-amber-50 border-2 border-amber-100 rounded-[24px] p-4 flex gap-3 items-start">
        <img
          src="/img/webp/ugolok.webp"
          alt="Орин"
          className="w-10 h-10 flex-shrink-0 rounded-full object-cover shadow-md border-2 border-white"
        />
        <p className="text-[14px] text-amber-900 leading-relaxed font-medium">
          {lang === 'en'
            ? `Great job! You found a creative solution — that's exactly what inventors do.`
            : `Молодец! Именно так думают настоящие изобретатели. Пробуй ещё!`
          }
        </p>
      </div>

      <div className="flex-1" />

      {/* CTA buttons */}
      <div className="px-5 pb-10 pt-3 flex flex-col gap-3">
        {onWantsMore && (
          <button
            onClick={onWantsMore}
            className="w-full bg-orange-500 text-white text-[17px] font-black py-4 rounded-[22px] active:scale-[0.97] transition-all shadow-lg shadow-orange-200"
          >
            Ещё задачу! →
          </button>
        )}
        <button
          onClick={onNext}
          className={`w-full text-[16px] font-bold py-4 rounded-[22px] active:scale-[0.97] transition-all ${onWantsMore ? 'bg-slate-100 text-slate-600' : 'bg-orange-500 text-white shadow-lg shadow-orange-200 text-[17px] font-black'}`}
        >
          {onWantsMore ? 'На остров' : 'Продолжить →'}
        </button>
      </div>
    </div>
  );
}
