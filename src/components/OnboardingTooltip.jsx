import React, { useState, useEffect, useRef } from "react";

const ONBOARDING_KEY = "nula-onboarding-done";

// Steps: each step highlights a CSS selector or a named anchor (data-onboard="name")
export const WORLD_MAP_STEPS = [
  {
    anchor: "world-map",        // data-onboard attribute on the element
    title: "Это твой остров! 🏝️",
    text: "Здесь живут задачи. Нажми на любой остров, чтобы начать.",
    position: "bottom",         // tooltip position relative to anchor: top | bottom | left | right
  },
  {
    anchor: "profile-btn",
    title: "Твой профиль 👤",
    text: "Здесь сохраняется прогресс. Войди через Google, чтобы не потерять звёзды.",
    position: "bottom",
  },
  {
    anchor: "daily-challenge",
    title: "Задача дня 🌟",
    text: "Каждый день — новая задача. Решай и собирай звёзды!",
    position: "top",
    optional: true,             // skip step if anchor not found
  },
];

function getAnchorRect(anchorName) {
  const el = document.querySelector(`[data-onboard="${anchorName}"]`);
  if (!el) return null;
  return el.getBoundingClientRect();
}

const PAD = 8; // padding around highlighted element

export function useOnboarding() {
  const [active, setActive] = useState(false);

  function startOnboarding() {
    setActive(true);
  }

  function checkAndStart() {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setActive(true);
  }

  return { active, startOnboarding, checkAndStart, setActive };
}

export default function OnboardingTooltip({ active, onDone, steps = WORLD_MAP_STEPS, storageKey = ONBOARDING_KEY }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);

  const currentStep = steps[step];

  // Measure anchor element
  useEffect(() => {
    if (!active) return;
    setVisible(false);

    function measure() {
      const r = getAnchorRect(currentStep.anchor);
      if (!r && currentStep.optional) {
        // Skip optional step
        advanceOrDone();
        return;
      }
      if (!r) {
        // Wait a tick if element not yet rendered
        setTimeout(measure, 200);
        return;
      }
      setRect(r);
      setTimeout(() => setVisible(true), 50);
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step, active]);

  function advanceOrDone() {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  }

  function finish() {
    localStorage.setItem(storageKey, "1");
    onDone();
  }

  if (!active || !rect) return null;

  // Spotlight cutout coords
  const spotlight = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  // Tooltip position
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let tooltipStyle = {};
  const TOOLTIP_W = Math.min(300, vw - 32);
  const tooltipCenterX = spotlight.left + spotlight.width / 2;

  if (currentStep.position === "bottom") {
    tooltipStyle = {
      top: spotlight.top + spotlight.height + 16,
      left: Math.max(16, Math.min(tooltipCenterX - TOOLTIP_W / 2, vw - TOOLTIP_W - 16)),
      width: TOOLTIP_W,
    };
  } else {
    tooltipStyle = {
      top: Math.max(16, spotlight.top - 140),
      left: Math.max(16, Math.min(tooltipCenterX - TOOLTIP_W / 2, vw - TOOLTIP_W - 16)),
      width: TOOLTIP_W,
    };
  }

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      {/* Dark overlay with SVG spotlight */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ transition: "opacity 0.3s", opacity: visible ? 1 : 0 }}
      >
        <defs>
          <mask id="onb-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spotlight.left}
              y={spotlight.top}
              width={spotlight.width}
              height={spotlight.height}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#onb-mask)"
        />
        {/* Glowing border around spotlight */}
        <rect
          x={spotlight.left}
          y={spotlight.top}
          width={spotlight.width}
          height={spotlight.height}
          rx="12"
          fill="none"
          stroke="#f97316"
          strokeWidth="2.5"
          strokeDasharray="6 3"
          style={{ animation: "dash 1s linear infinite" }}
        />
      </svg>

      {/* Tooltip card */}
      <div
        className="absolute bg-white rounded-[20px] shadow-2xl p-4"
        style={{
          ...tooltipStyle,
          transition: "opacity 0.3s, transform 0.3s",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        {/* Arrow */}
        {currentStep.position === "bottom" && (
          <div
            className="absolute -top-2 w-4 h-2 overflow-hidden"
            style={{ left: Math.max(12, tooltipCenterX - tooltipStyle.left - 8) }}
          >
            <div className="w-4 h-4 bg-white rotate-45 translate-y-1 shadow-sm" />
          </div>
        )}
        {currentStep.position === "top" && (
          <div
            className="absolute -bottom-2 w-4 h-2 overflow-hidden"
            style={{ left: Math.max(12, tooltipCenterX - tooltipStyle.left - 8) }}
          >
            <div className="w-4 h-4 bg-white rotate-45 -translate-y-1 shadow-sm" />
          </div>
        )}

        <p className="font-black text-[16px] text-slate-800 mb-1">{currentStep.title}</p>
        <p className="text-[13px] text-slate-600 leading-relaxed mb-3">{currentStep.text}</p>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 flex-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-4 bg-orange-500" : "w-1.5 bg-slate-200"}`}
              />
            ))}
          </div>
          <button
            onClick={finish}
            className="text-[12px] text-slate-400 font-medium px-2 py-1"
          >
            Пропустить
          </button>
          <button
            onClick={advanceOrDone}
            className="bg-orange-500 text-white text-[13px] font-black px-4 py-1.5 rounded-full active:scale-95 transition-all"
          >
            {step < steps.length - 1 ? "Дальше →" : "Готово!"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dash { to { stroke-dashoffset: -18; } }
      `}</style>
    </div>
  );
}
