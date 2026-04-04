import { useState, useEffect } from "react";

const STEPS_RU = [
  {
    text: "Привет! Я Орин 🐉\nДракон-изобретатель и твой наставник на Архипелаге.",
    btn: "Привет, Орин!",
  },
  {
    text: "Здесь мы решаем задачи, которые кажутся невозможными.\nНе «зазубриваем», а именно думаем — и находим выходы там, где другие пасуют.",
    btn: "Звучит интересно!",
  },
  {
    text: "Я буду задавать вопросы, а не давать готовые ответы.\nПотому что важно не то, что ты знаешь — а то, как ты думаешь.",
    btn: "Понятно",
  },
  {
    text: "Попробуем прямо сейчас?\nЯ загадал первую задачу — она несложная, но хитрая 😏",
    btn: "Попробую!",
    isFinal: true,
  },
];

const STEPS_EN = [
  {
    text: "Hi! I'm Orin 🐉\nA dragon-inventor and your guide on the Archipelago.",
    btn: "Hi, Orin!",
  },
  {
    text: "Here we solve problems that seem impossible.\nNot memorizing — actually thinking, finding ways where others give up.",
    btn: "Sounds interesting!",
  },
  {
    text: "I'll ask questions instead of giving ready answers.\nBecause what matters isn't what you know — it's how you think.",
    btn: "Got it",
  },
  {
    text: "Want to try right now?\nI've prepared the first puzzle — easy, but tricky 😏",
    btn: "Let's try!",
    isFinal: true,
  },
];

export default function DragonBubbleScreen({ onStart, t, theme, lang = "ru" }) {
  const [step, setStep] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [typing, setTyping] = useState(true);

  const steps = lang === "en" ? STEPS_EN : STEPS_RU;
  const current = steps[step];
  const dragonImg = "/assets/webp/avatar.webp";
  const glowColor =
    theme === "scifi"
      ? "rgba(34, 211, 238, 0.4)"
      : "rgba(245, 158, 11, 0.4)";

  // Typewriter resets on each step
  useEffect(() => {
    if (!imageLoaded) return;
    setDisplayedText("");
    setTyping(true);
    let index = 0;
    const fullText = current.text;
    const delay = setTimeout(() => {
      const timer = setInterval(() => {
        if (index < fullText.length) {
          setDisplayedText(fullText.substring(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
          setTyping(false);
        }
      }, 18);
      return () => clearInterval(timer);
    }, 300);
    return () => clearTimeout(delay);
  }, [step, imageLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSkip() {
    setDisplayedText(current.text);
    setTyping(false);
  }

  function handleNext() {
    if (current.isFinal) {
      onStart({ tutorial: true });
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 z-[9999]">
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.35s ease-out forwards; }
      `}</style>

      {/* Dragon */}
      <div className={`mb-5 relative transition-opacity duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"}`}>
        <div className="relative w-40 h-40 dragon-float">
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: "-24px",
              backgroundColor: glowColor,
              filter: "blur(28px)",
              animation: "3.5s ease-in-out 0s infinite normal none running glowPulse",
            }}
          />
          <img
            src={dragonImg}
            alt="Орин"
            onLoad={() => setImageLoaded(true)}
            className="relative w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Step dots */}
      <div className="flex gap-2 mb-5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === step
                ? "w-4 h-2 bg-amber-400"
                : i < step
                ? "w-2 h-2 bg-amber-400/60"
                : "w-2 h-2 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Bubble */}
      <div className={`w-full max-w-xs transition-all duration-500 ${imageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div
          key={step}
          className="fade-in-up bg-white rounded-[28px] px-7 py-6 shadow-2xl shadow-orange-900/20 border border-gray-100 min-h-[110px] cursor-pointer"
          onClick={typing ? handleSkip : undefined}
        >
          <p className="text-slate-800 text-[16px] leading-relaxed font-medium whitespace-pre-line">
            {displayedText}
            {typing && <span className="animate-pulse text-amber-500">▌</span>}
          </p>
        </div>

        {typing && (
          <p className="text-center text-white/30 text-xs mt-2">
            {lang === "en" ? "Tap to skip" : "Нажми, чтобы пропустить"}
          </p>
        )}

        {!typing && (
          <button onClick={handleNext} className="btn-premium w-full mt-4 fade-in-up">
            {current.btn}
          </button>
        )}
      </div>
    </div>
  );
}
