/**
 * PhaseIndicator — Shows progress through game phases
 * TRIZ mode: 7 phases (0-6) + end state
 * Mystery mode: 5 ПРИЗ stages (П Р И З ✨)
 */

export default function PhaseIndicator({ isTriz, trizPhase, prizStep, cycleCount }) {
  if (isTriz) {
    // TRIZ mode: 7 dots for phases 0-6, cycle counter
    const phases = [0, 1, 2, 3, 4, 5, 6];
    return (
      <div className="flex flex-col items-center gap-2 py-3">
        <div className="flex gap-2">
          {phases.map((p) => (
            <div
              key={p}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                p === trizPhase
                  ? "bg-blue-500 scale-125"
                  : p < trizPhase
                  ? "bg-green-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        {cycleCount > 0 && (
          <div className="text-xs text-gray-500">
            Цикл {cycleCount + 1}
          </div>
        )}
      </div>
    );
  } else {
    // Mystery mode: 5 ПРИЗ stages
    const stages = ["П", "Р", "И", "З", "✨"];
    const stageLabels = {
      "П": "Подготовка",
      "Р": "Разведка",
      "И": "Идеи",
      "З": "Зачёт",
      "✨": "Инсайт"
    };

    return (
      <div className="flex flex-col items-center gap-2 py-3">
        <div className="flex gap-3">
          {stages.map((stage, idx) => (
            <div
              key={stage}
              className={`flex flex-col items-center gap-1 transition-all ${
                idx <= prizStep ? "opacity-100" : "opacity-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  idx === prizStep
                    ? "bg-orange-500 text-white"
                    : idx < prizStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {stage}
              </div>
              <div className="text-xs text-gray-500 text-center max-w-12">
                {stageLabels[stage]}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
