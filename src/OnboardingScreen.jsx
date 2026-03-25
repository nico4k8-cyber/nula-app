import { useState, useEffect } from "react";

export default function OnboardingScreen({ onStart }) {
  const [stage, setStage] = useState(0); // 0=background, 1=orin, 2=problems, 3=text, 4=button

  useEffect(() => {
    const timings = [2000, 2000, 2000, 2000, 500];
    const timer = setTimeout(() => {
      if (stage < 4) setStage(stage + 1);
    }, timings[stage]);
    return () => clearTimeout(timer);
  }, [stage]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
      {/* Epic landscape background */}
      <div className="relative flex-1 flex items-center justify-center">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-blue-800 to-orange-200" />

        {/* Animated mountain */}
        <div
          className={`absolute bottom-0 left-0 right-0 transition-all duration-1000
            ${stage >= 0 ? "opacity-100" : "opacity-0"}`}
          style={{
            backgroundImage: "linear-gradient(to top, #1a3a3a 0%, #2d5a4f 50%, transparent 100%)",
            height: "60%",
            clipPath: "polygon(0 100%, 15% 45%, 35% 20%, 50% 5%, 65% 25%, 85% 40%, 100% 100%)",
          }}
        />

        {/* Animated sun */}
        <div
          className={`absolute transition-all duration-2000
            ${stage >= 0 ? "opacity-100" : "opacity-0"}`}
          style={{
            width: "140px",
            height: "140px",
            background: "radial-gradient(circle, #ffd700 0%, #ffaa00 100%)",
            borderRadius: "50%",
            boxShadow: "0 0 80px rgba(255, 200, 0, 0.6)",
            bottom: stage >= 0 ? "35%" : "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />

        {/* Animated dragon (Orin) - silhouette */}
        <div
          className={`absolute transition-all duration-1500
            ${stage >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
          style={{
            width: "120px",
            height: "100px",
            bottom: "25%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "90px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
            filter: "drop-shadow(0 0 30px rgba(255,215,0,0.3))",
          }}
        >
          🐉
        </div>

      </div>

      {/* Text and button section */}
      <div
        className={`relative z-20 px-6 py-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent
          transition-all duration-1000 ${stage >= 3 ? "opacity-100" : "opacity-0"}`}
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Orin's message */}
          <p className="text-white text-lg font-medium leading-relaxed mb-6">
            <span className="text-2xl mr-2">🐉</span>
            <span className="inline">
              Я вижу, что в мире полный хаос.
              <br />
              <br />
              Есть способ всё это пофиксить.
              <br />
              <br />
              Я научу тебя этому способу.
              <br />
              Потом ты сможешь применить его везде.
              <br />
              <br />
              <span className="text-xl">Начнём?</span>
            </span>
          </p>


          {/* Start button */}
          {stage >= 4 && (
            <button
              onClick={onStart}
              className="w-full md:w-64 py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600
                text-white text-lg font-bold rounded-full
                hover:shadow-lg hover:scale-105 active:scale-95
                transition-all duration-300
                animate-pulse"
            >
              ✨ НАЧАТЬ ✨
            </button>
          )}
        </div>
      </div>

      {/* Skip button (subtle) */}
      <button
        onClick={onStart}
        className="absolute top-4 right-4 text-gray-400 text-xs hover:text-gray-200 transition z-30
          px-3 py-1 rounded-full hover:bg-white/10"
      >
        Пропустить →
      </button>
    </div>
  );
}
