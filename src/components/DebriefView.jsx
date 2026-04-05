import React from "react";

export default function DebriefView({
  task,
  sessionStars,
  totalStars,
  onNext,
  t,
  lang
}) {
  const stars = Math.min(Math.max(1, sessionStars), 3);

  return (
    <div className="flex flex-col h-[100dvh] bg-white animate-fade-in-up overflow-hidden">

      {/* Top celebration zone */}
      <div className="flex flex-col items-center justify-center pt-12 pb-6 px-6">
        <div className="text-7xl mb-4 animate-bounce-slow">🎉</div>
        <h2 className="text-[28px] font-black text-slate-800 text-center leading-tight mb-2">
          Ты решил задачу!
        </h2>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: stars }).map((_, i) => (
            <span key={i} className="text-3xl" style={{ animation: `bounceIn 0.4s ease ${i * 0.2}s both` }}>⭐</span>
          ))}
        </div>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          {stars === 3 ? 'Отлично! Сразу нашёл решение' : stars === 2 ? 'Хорошо! Думал правильно' : 'Справился — практика поможет'}
        </p>
        {totalStars > 0 && (
          <div className="mt-3 px-4 py-2 bg-amber-50 rounded-full border border-amber-200">
            <span className="text-amber-700 text-sm font-black">Всего звёзд: ⭐ {totalStars + stars}</span>
          </div>
        )}
      </div>

      {/* Орин says */}
      <div className="mx-5 bg-amber-50 border-2 border-amber-100 rounded-[24px] p-5 flex gap-4 items-start">
        <img
          src="/img/webp/ugolok.webp"
          alt="Орин"
          className="w-12 h-12 flex-shrink-0 rounded-full object-cover shadow-md border-2 border-white"
        />
        <p className="text-[15px] text-amber-900 leading-relaxed font-medium">
          {lang === 'en'
            ? `Great job! You found a creative solution — that's exactly what inventors do.`
            : `Молодец! Ты нашёл творческое решение — именно так и думают настоящие изобретатели.`
          }
        </p>
      </div>

      <div className="flex-1" />

      {/* CTA */}
      <div className="px-5 pb-10 pt-4">
        <button
          onClick={onNext}
          className="w-full bg-orange-500 text-white text-[18px] font-black py-5 rounded-[24px] active:scale-[0.97] transition-all shadow-lg shadow-orange-200"
        >
          Продолжить →
        </button>
      </div>
    </div>
  );
}
