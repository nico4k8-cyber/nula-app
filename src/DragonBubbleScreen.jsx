import { useState, useEffect } from "react";

export default function DragonBubbleScreen({ onStart, t, theme }) {
  const [displayedText, setDisplayedText] = useState("");
  const fullText = t('welcome');
  const dragonImg = '/assets/webp/avatar.webp';
  const glowColor = theme === 'scifi' ? 'rgba(34, 211, 238, 0.4)' : 'rgba(245, 158, 11, 0.4)';

  useEffect(() => {
    let index = 0;
    // Задержка перед печатанием текста, чтобы картинка успела появиться
    const startDelay = setTimeout(() => {
      const timer = setInterval(() => {
        if (index < fullText.length) {
          setDisplayedText(fullText.substring(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
        }
      }, 20);
      return () => clearInterval(timer);
    }, 800);

    return () => clearTimeout(startDelay);
  }, [fullText]);

  return (
    <div className="fixed inset-0 bg-app flex flex-col items-center justify-center p-6 transition-colors duration-500">
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

      {/* Dragon Character with Adaptive Glow */}
      <div className="mb-8 relative">
        <div className="relative w-48 h-48 dragon-float">
          <div className="absolute rounded-full blur-3xl pointer-events-none" style={{ inset: '-28px', backgroundColor: glowColor, animation: '3.5s ease-in-out 0s infinite normal none running glowPulse' }}></div>
          <img src={dragonImg} alt="Dragon Orin" className="relative w-full h-full object-contain drop-shadow-2xl" />
        </div>
      </div>

      {/* Баббл с текстом */}
      <div className="w-80 pointer-events-auto flex flex-col items-center gap-8">
        <div className="bg-white rounded-[24px] px-6 py-6 shadow-2xl border border-gray-100 relative min-h-48 flex flex-col w-full">
          {/* Текст с типографией */}
          <p className="text-gray-800 text-[16px] leading-relaxed whitespace-pre-line font-medium">
            {displayedText}<span className={displayedText.length < fullText.length ? "animate-pulse" : ""}>▌</span>
          </p>
        </div>

        {/* Кнопка снаружи баббла - Hay Day Style */}
        {displayedText.length === fullText.length && (
          <button
            onClick={onStart}
            className="btn-tactile"
          >
            {t('start')}
          </button>
        )}
      </div>
    </div>
  );
}
