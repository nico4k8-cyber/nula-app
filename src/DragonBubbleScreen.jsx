import { useState, useEffect } from "react";

export default function DragonBubbleScreen({ onStart }) {
  const [textVisible, setTextVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

  useEffect(() => {
    // Текст появляется через 300ms
    const textTimer = setTimeout(() => setTextVisible(true), 300);
    // Кнопка появляется через 2000ms (после текста)
    const buttonTimer = setTimeout(() => setButtonVisible(true), 2000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 gap-6">
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
      <div className="mb-4 relative">
        <div className="relative w-40 h-40 dragon-float">
          <div className="absolute rounded-full blur-3xl pointer-events-none bg-amber-500/25" style={{ inset: '-28px', animation: '3.5s ease-in-out 0s infinite normal none running glowPulse' }}></div>
          <div className="absolute rounded-full blur-xl pointer-events-none bg-orange-600/15" style={{ inset: '-14px' }}></div>
          <img src="./img/webp/ugolok.webp" alt="Дракон Орин" className="relative w-full h-full rounded-full object-cover shadow-2xl border-4 border-amber-500/50" style={{ boxShadow: '0 25px 50px -12px rgba(146, 64, 14, 0.4)' }} />
        </div>
      </div>

      {/* Баббл с текстом */}
      <div
        className={`max-w-md bg-white rounded-3xl px-8 py-6 shadow-2xl border-4 border-gray-200 transition-all duration-500 ${
          textVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        {/* Текст */}
        <p className="text-center text-gray-800 text-base leading-relaxed font-medium">
          Я вижу, что в мире полный хаос.
          <br />
          <br />
          Есть способ всё это пофиксить, и я научу тебя!
          <br />
          <br />
          Буду тебя сопровождать в каждой загадке.
          <br />
          <br />
          <span className="text-lg font-bold">Начнём?</span>
        </p>
      </div>

      {/* Кнопка */}
      {buttonVisible && (
        <button
          onClick={onStart}
          className="mt-4 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-bold rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 animate-pulse"
        >
          ✨ НАЧАТЬ ✨
        </button>
      )}
    </div>
  );
}
