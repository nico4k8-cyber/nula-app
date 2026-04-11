import { useEffect, useState } from "react";

export default function IslandUnlockScreen({ islandName = "Главный остров", onComplete }) {
  const [stage, setStage] = useState("glow"); // glow → text → done
  const timersRef = useState(() => [])[0];

  useEffect(() => {
    const t1 = setTimeout(() => setStage("text"), 600);
    const t2 = setTimeout(() => setStage("done"), 3200);
    const t3 = setTimeout(() => onComplete?.(), 3600);
    timersRef.push(t1, t2, t3);
    return () => timersRef.forEach(clearTimeout);
  }, []);

  function handleSkip() {
    timersRef.forEach(clearTimeout);
    onComplete?.();
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950 overflow-hidden" onClick={handleSkip}>
      <style>{`
        @keyframes islandFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-18px) scale(1.04); }
        }
        @keyframes glowExpand {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes raysRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .island-float { animation: islandFloat 3s ease-in-out infinite; }
        .glow-expand { animation: glowExpand 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .rays-rotate { animation: raysRotate 8s linear infinite; }
        .fade-slide-up { animation: fadeSlideUp 0.5s ease-out forwards; }
      `}</style>

      {/* Rays background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="rays-rotate"
          style={{
            width: 600,
            height: 600,
            background: "conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.07) 10deg, transparent 20deg, transparent 30deg, rgba(251,191,36,0.05) 40deg, transparent 50deg)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Glow pulse */}
      <div
        className={`absolute rounded-full pointer-events-none transition-all duration-700 ${stage !== "glow" ? "opacity-60" : "opacity-0"}`}
        style={{
          width: 320,
          height: 320,
          background: "radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      {/* Island image */}
      <div className={`relative z-10 mb-6 ${stage !== "glow" ? "island-float" : ""}`}>
        <div
          className={`${stage === "glow" ? "glow-expand" : ""}`}
          style={{ width: 200, height: 200 }}
        >
          <img
            src="/assets/webp/main_island.webp"
            alt={islandName}
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>

        {/* Sparkles */}
        {stage === "text" && (
          <>
            {["✨", "⭐", "✨", "🌟", "✨"].map((s, i) => (
              <div
                key={i}
                className="absolute text-xl pointer-events-none fade-slide-up"
                style={{
                  top: `${[-20, 10, 80, 60, -10][i]}%`,
                  left: `${[80, -15, 90, -20, 50][i]}%`,
                  animationDelay: `${i * 0.12}s`,
                  animationFillMode: "both",
                }}
              >
                {s}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Text */}
      {stage !== "glow" && (
        <div className="relative z-10 text-center px-8 fade-slide-up">
          <p className="text-amber-400 text-[13px] font-black uppercase tracking-[0.25em] mb-3">
            Открыт новый остров
          </p>
          <h2 className="text-white text-3xl font-black leading-tight mb-2">
            {islandName}
          </h2>
          <p className="text-white/50 text-[15px] font-medium">
            Твоё первое открытие на Архипелаге
          </p>
        </div>
      )}

      {/* Tap to continue */}
      {stage !== "glow" && (
        <div className="absolute bottom-12 flex flex-col items-center gap-3">
          <p className="text-white/40 text-[12px] font-medium">нажми чтобы продолжить</p>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className={`rounded-full transition-all duration-500 ${i === 0 ? "w-6 h-2 bg-amber-400" : "w-2 h-2 bg-white/20"}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
