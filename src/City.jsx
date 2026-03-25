import { TASKS } from "./tasks";

export default function City({ collected, solveCount = {}, onBack, onSelectTask }) {
  // Получаем только 9 методов для MVP
  const methods = TASKS.slice(0, 9).map((task) => ({
    id: task.id,
    name: task.trick.name,
    building: task.trick.building || task.trick.name,
    color: task.trick.color,
    image: `/img/grid_clean_${task.id}.jpg`,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-100 text-gray-900 overflow-y-auto">
      {/* Заголовок */}
      <div className="sticky top-0 bg-white/80 backdrop-blur px-4 py-4 flex items-center justify-between border-b border-indigo-100/50">
        <button
          onClick={onBack}
          className="text-lg px-3 py-2 hover:bg-indigo-100 text-gray-700 rounded-lg transition-all"
        >
          ← Назад
        </button>
        <h1 className="text-xl font-bold text-gray-800">🏙️ Мой город</h1>
        <div className="text-sm text-gray-600 text-right">
          <div className="font-semibold text-base">{collected.length}/{methods.length}</div>
          <div>зданий открыто</div>
        </div>
      </div>

      {/* Статистика */}
      <div className="px-4 py-4 bg-indigo-100/50 border-b border-indigo-200/30">
        <div className="w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all"
            style={{ width: `${(collected.length / methods.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Подсказка */}
      <div className="px-4 py-3 text-center text-sm text-indigo-700 bg-indigo-50/80 border-b border-indigo-100/50">
        💡 Решай загадки, чтобы открыть здания города
      </div>

      {/* Сетка 9 методов MVP (3x3) */}
      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {methods.map((method) => {
            const isCollected = collected.includes(method.id);
            const solves = solveCount[method.id] || 0;
            const level = solves > 0 ? Math.min(Math.ceil(solves / 2), 3) : 0;

            return (
              <div
                key={method.id}
                onClick={() => isCollected && onSelectTask && onSelectTask(method.id - 1)}
                className={`aspect-square rounded-xl overflow-hidden transition-all transform relative ${
                  isCollected ? "hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl" : "cursor-default"
                }`}
              >
                {/* Building image - shown for both locked and unlocked */}
                <img
                  src={method.image}
                  alt={method.building}
                  className={`w-full h-full object-cover transition-all ${
                    isCollected ? "opacity-100" : "opacity-50 grayscale"
                  }`}
                  onError={(e) => {
                    // If image fails to load, show fallback gradient
                    e.target.style.display = "none";
                  }}
                />

                {/* Fallback for when image fails to load */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center"
                  style={{ display: 'none' }}
                  ref={(el) => {
                    const img = el?.parentElement?.querySelector('img');
                    if (img && img.style.display === 'none') {
                      el.style.display = 'flex';
                    }
                  }}
                >
                  <div className="text-4xl">{method.building}</div>
                </div>

                {/* Stars for unlocked buildings with multiple solves */}
                {isCollected && level > 0 && (
                  <div className="absolute top-2 right-2 flex gap-0.5">
                    {[...Array(Math.min(level, 3))].map((_, i) => (
                      <span key={i} className="text-lg">⭐</span>
                    ))}
                  </div>
                )}

                {/* Lock icon for locked buildings */}
                {!isCollected && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="text-5xl">🔒</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
