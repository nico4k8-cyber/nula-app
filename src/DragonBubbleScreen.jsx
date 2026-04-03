import { useState, useEffect } from "react";

export default function DragonBubbleScreen({ onStart, t, theme }) {
  const [displayedText, setDisplayedText] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const fullText = t('welcome');
  const dragonImg = '/assets/webp/avatar.webp';
  const glowColor = theme === 'scifi' ? 'rgba(34, 211, 238, 0.4)' : 'rgba(245, 158, 11, 0.4)';

  useEffect(() => {
    if (!imageLoaded) return;

    let index = 0;
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
    }, 400);

    return () => clearTimeout(startDelay);
  }, [fullText, imageLoaded]);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-500 z-[9999]">
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
        .fade-in-dragon { animation: fadeIn 1s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Dragon Character with Adaptive Glow */}
      <div className={`mb-8 relative transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative w-48 h-48 dragon-float">
          <div className="absolute rounded-full blur-3xl pointer-events-none" style={{ inset: '-28px', backgroundColor: glowColor, animation: '3.5s ease-in-out 0s infinite normal none running glowPulse' }}></div>
          <img 
            src={dragonImg} 
            alt="Dragon Orin" 
            onLoad={() => setImageLoaded(true)}
            className="relative w-full h-full object-contain drop-shadow-2xl" 
          />
        </div>
      </div>

      {/* Баббл с текстом */}
      <div className={`w-80 pointer-events-auto flex flex-col items-center gap-8 transition-all duration-700 ${imageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="bg-white rounded-[32px] px-8 py-8 shadow-2xl border border-gray-100 relative min-h-48 flex flex-col w-full shadow-orange-900/20">
          <p className="text-slate-800 text-[17px] leading-relaxed whitespace-pre-line font-medium">
            {displayedText}<span className={displayedText.length < fullText.length ? "animate-pulse" : ""}>▌</span>
          </p>
        </div>

        {/* Кнопка теперь в едином стиле */}
        {displayedText.length === fullText.length && (
          <button
            onClick={onStart}
            className="btn-premium transform animate-slideUp"
          >
            {t('start')}
          </button>
        )}
      </div>
    </div>
  );
}
