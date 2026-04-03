import { useState } from "react";

const MESSAGES = [
  {
    trigger: 3,
    text: "Ты уже решил 3 задачи — это настоящий учёный! Знаешь, я веду живые онлайн-занятия по ТРИЗ. Там мы решаем задачи вместе, в команде. Хочешь попробовать?",
    emoji: "🔥",
  },
  {
    trigger: 6,
    text: "6 задач! Ты растёшь быстрее, чем я ожидал. На живых занятиях мы разбираем ещё более крутые изобретения — и у тебя будет личный наставник. Интересно?",
    emoji: "⭐",
  },
  {
    trigger: 10,
    text: "Десять задач! Ты уже думаешь как изобретатель. Хочешь пойти дальше? На живых занятиях я покажу тебе приёмы, которых нет в этой игре.",
    emoji: "🏆",
  },
  {
    trigger: 15,
    text: "Пятнадцать задач — это серьёзно! Ты готов к настоящим ТРИЗ-проектам. Приходи на живое занятие — там решают задачи, которые меняют мир.",
    emoji: "🚀",
  },
];

// Какое сообщение показывать при данном количестве выполненных задач
export function getUpsellMessage(completedCount, shownAt) {
  for (let i = MESSAGES.length - 1; i >= 0; i--) {
    const m = MESSAGES[i];
    if (completedCount >= m.trigger && !shownAt.includes(m.trigger)) {
      return m;
    }
  }
  return null;
}

export default function UpsellView({ message, onDismiss, onSignup }) {
  const [leaving, setLeaving] = useState(false);

  function handleDismiss() {
    setLeaving(true);
    setTimeout(onDismiss, 300);
  }

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-end justify-center transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={handleDismiss}
    >
      <div
        className="w-full max-w-md mb-0 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white rounded-t-[40px] px-8 pt-8 pb-10 shadow-2xl">
          {/* Дескриптор */}
          <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />

          {/* Аватар + реплика */}
          <div className="flex gap-4 items-start mb-6">
            <img
              src="/img/webp/ugolok.webp"
              alt="Уголёк"
              className="w-16 h-16 rounded-full object-cover border-2 border-orange-200 flex-shrink-0 shadow-md"
            />
            <div className="flex-1 bg-orange-50 rounded-[24px] px-5 py-4 border border-orange-100">
              <p className="text-[15px] text-slate-800 font-bold leading-snug">
                {message.emoji} {message.text}
              </p>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onSignup}
              className="w-full py-4 rounded-[20px] bg-orange-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-200 active:scale-95 transition-all"
            >
              Хочу на живые занятия! 🎓
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-[20px] bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              Продолжу пока сам
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
