import React from "react";

function Skeleton({ className = "" }) {
  return <div className={`bg-slate-200 rounded-xl animate-pulse ${className}`} />;
}

export default function DebriefView({
  task,
  sessionStars,
  totalStars,
  completedCount,
  debriefAI,      // null = loading, { feedback, insight } = ready
  onNext,
  onWantsMore,
  onRetry,        // retry same task for 3 stars (shown when stars < 3)
  t,
  lang
}) {
  const stars = Math.min(Math.max(1, sessionStars), 3);
  const isLoading = debriefAI === null;

  const qualityLabel = stars === 3
    ? (lang === 'en' ? "Inventor's solution!" : "Изобретательское решение!")
    : stars === 2
    ? (lang === 'en' ? "Great thinking!" : "Хорошее решение!")
    : (lang === 'en' ? "Task solved!" : "Задача решена!");

  // Fallback text if AI fails or takes too long
  const fallbackFeedback = stars === 3
    ? (lang === 'en' ? "You found an unexpected way that actually works — that's exactly how inventors think! 🔥" : "Ты нашёл неожиданный способ, который работает — именно так думают изобретатели! 🔥")
    : stars === 2
    ? (lang === 'en' ? "Your solution works! Inventors always look for more — maybe there's an even simpler way?" : "Твоё решение работает! Изобретатели всегда ищут ещё — вдруг есть способ ещё проще?")
    : (lang === 'en' ? "You solved it! Every solution is a step toward thinking like an inventor." : "Ты справился! Каждое решение — шаг к тому, чтобы думать как изобретатель.");

  const feedback = debriefAI?.feedback || (!isLoading ? fallbackFeedback : null);
  const insight = debriefAI?.insight;
  const retryHint = debriefAI?.retryHint;

  // Show TRIZ principle name only after task 5
  const showPrinciple = task?.trick?.name && (completedCount ?? 0) >= 5;

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
            <span className="text-amber-700 text-sm font-black">
              {lang === 'en' ? `Total: ⭐ ${totalStars}` : `Итого: ⭐ ${totalStars}`}
            </span>
          </div>
        )}
      </div>

      {/* Орин says — personalized feedback */}
      <div className="mx-5 mb-3 bg-amber-50 border-2 border-amber-100 rounded-[24px] p-4 flex gap-3 items-start">
        <img
          src="/img/webp/ugolok.webp"
          alt="Орин"
          className="w-10 h-10 flex-shrink-0 rounded-full object-cover shadow-md border-2 border-white"
        />
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : (
            <p className="text-[14px] text-amber-900 leading-relaxed font-medium">{feedback}</p>
          )}
        </div>
      </div>

      {/* AI insight — what thinking pattern worked */}
      {(isLoading || (insight && insight.trim())) && (
        <div className="mx-5 mb-3 bg-blue-50 border-2 border-blue-100 rounded-[20px] p-4">
          <div className="text-[13px] text-blue-500 font-bold uppercase tracking-wide mb-1">
            {lang === 'en' ? "How inventors think" : "Как думают изобретатели"}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ) : (
            <p className="text-[14px] text-blue-900 leading-relaxed font-medium">{insight}</p>
          )}
        </div>
      )}


      {/* TRIZ principle — shown only after task 5 */}
      {showPrinciple && (
        <div className="mx-5 mb-3 bg-violet-50 border-2 border-violet-100 rounded-[20px] p-4">
          <div className="text-[13px] text-violet-500 font-bold uppercase tracking-wide mb-1">
            {lang === 'en' ? "TRIZ principle" : "Приём изобретателя"}
          </div>
          <p className="text-[15px] text-violet-900 font-black">{task.trick.name}</p>
        </div>
      )}

      {/* Online lesson invite — show after task 3+ */}
      {(completedCount ?? 0) >= 2 && (
        <div className="mx-5 mb-3 bg-emerald-50 border-2 border-emerald-100 rounded-[20px] p-4 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">👩‍🏫</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-emerald-900 font-medium leading-snug">
              Хочешь разбирать задачи с живым преподавателем?{' '}
              <a
                href="https://trizintellect.tilda.ws/triz_lesson?utm_source=app&utm_medium=debrief&utm_campaign=teacher_invite#booking"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-emerald-700 underline decoration-emerald-300 underline-offset-2"
              >
                Попробуй пробный урок →
              </a>
            </p>
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* CTA buttons */}
      <div className="px-5 pb-10 pt-3 flex flex-col gap-3">
        {stars < 3 && onRetry ? (
          <>
            {/* Hook text — separate from button, specific to flaw in current answer */}
            <p className="text-[14px] text-slate-500 text-center px-2 leading-snug">
              {retryHint || (lang === 'en' ? 'There might be another approach without that limitation.' : 'Есть способ, где этого недостатка не будет.')}
            </p>
            <button
              onClick={onRetry}
              className="w-full bg-violet-500 text-white text-[16px] font-black py-4 px-5 rounded-[22px] active:scale-[0.97] transition-all shadow-lg shadow-violet-200"
            >
              {lang === 'en' ? 'Look for a better way →' : 'Поискать лучше →'}
            </button>
            <button
              onClick={onWantsMore || onNext}
              className="w-full bg-orange-500 text-white text-[16px] font-black py-4 rounded-[22px] active:scale-[0.97] transition-all shadow-lg shadow-orange-200"
            >
              {lang === 'en' ? 'No, give me another task' : 'Нет, хочу другую задачу'}
            </button>
          </>
        ) : (
          <>
            {onWantsMore && (
              <button
                onClick={onWantsMore}
                className="w-full bg-orange-500 text-white text-[17px] font-black py-4 rounded-[22px] active:scale-[0.97] transition-all shadow-lg shadow-orange-200"
              >
                {lang === 'en' ? 'Another task! →' : 'Ещё задачу! →'}
              </button>
            )}
            <button
              onClick={onNext}
              className={`w-full text-[16px] font-bold py-4 rounded-[22px] active:scale-[0.97] transition-all ${onWantsMore ? 'bg-slate-100 text-slate-600' : 'bg-orange-500 text-white shadow-lg shadow-orange-200 text-[17px] font-black'}`}
            >
              {onWantsMore
                ? (lang === 'en' ? 'Back to island' : 'На остров')
                : (lang === 'en' ? 'Continue →' : 'Продолжить →')
              }
            </button>
          </>
        )}
      </div>
    </div>
  );
}
