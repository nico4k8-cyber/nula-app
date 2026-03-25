import { useState, useEffect } from "react";

export default function DragonBubbleScreen({ onStart }) {
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "Я вижу, что в мире полный хаос.\n\nЕсть способ всё это пофиксить, и я научу тебя!\n\nБуду тебя сопровождать в каждой загадке.\n\nНачнём?";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 20);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6">
      <style>{`
        @keyframes floatChar {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes glowPulse {
          0%, 100% { filter: blur(28px) opacity(0.6); }
          50% { filter: blur(28px) opacity(0.9); }
        }
        .dragon-float { animation: floatChar 3.5s ease-in-out infinite; }
      `}</style>

      {/* Дракончик Оринс амбер свечением */}
      <div className="mb-8 relative">
        <div className="relative w-40 h-40 dragon-float">
          <div className="absolute rounded-full blur-3xl pointer-events-none bg-amber-500/25" style={{ inset: '-28px', animation: '3.5s ease-in-out 0s infinite normal none running glowPulse' }}></div>
          <div className="absolute rounded-full blur-xl pointer-events-none bg-orange-600/15" style={{ inset: '-14px' }}></div>
          <img src="./img/webp/ugolok.webp" alt="Дракон Орин" className="relative w-full h-full rounded-full object-cover shadow-2xl border-4 border-amber-500/50" style={{ boxShadow: '0 25px 50px -12px rgba(146, 64, 14, 0.4)' }} />
        </div>
      </div>

      {/* Баббл с текстом */}
      <div className="w-80 pointer-events-auto flex flex-col items-center gap-4">
        <div className="bg-amber-50 rounded-2xl px-6 py-5 shadow-lg border-2 border-amber-200 relative min-h-48 flex flex-col w-full">
          {/* Стрелка баббла, указывающая на дракона */}
          <div className="absolute -top-2 left-1/2 w-3 h-3 bg-amber-50 border-t-2 border-l-2 border-amber-200" style={{ transform: 'translateX(-50%) rotate(45deg)' }}></div>

          {/* Текст с типографией */}
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
            {displayedText}<span className={displayedText.length < fullText.length ? "animate-pulse" : ""}>▌</span>
          </p>
        </div>

        {/* Кнопка снаружи баббла */}
        {displayedText.length === fullText.length && (
          <button
            onClick={onStart}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
          >
            ✨ Начать ✨
          </button>
        )}
      </div>
    </div>
  );
}
