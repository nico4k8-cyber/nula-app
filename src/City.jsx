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
        <h1 className="text-xl font-bold text-gray-800">🏙️ Мой город методов</h1>
        <div className="text-sm text-gray-600 text-right">
          <div className="font-semibold text-base">{collected.length}</div>
          <div>методов открыто</div>
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
                {isCollected ? (
                  <>
                    <img
                      src={method.image}
                      alt={method.building}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    {level > 0 && (
                      <div className="absolute top-2 right-2 flex gap-0.5">
                        {[...Array(Math.min(level, 3))].map((_, i) => (
                          <span key={i} className="text-lg">⭐</span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-5xl font-bold text-gray-300">
                    ?
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
