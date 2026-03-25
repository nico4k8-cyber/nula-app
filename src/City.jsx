export default function City({ collected, solveCount = {}, onBack, onSelectTask }) {
  // Временные данные для 40 методов ТРИЗ
  const methods = [
    // 6 открытых методов (с картинками)
    { id: 1, name: "Наоборот", emoji: "🏛️", building: "Дворец Инверсии", color: "#ff6b35", unlockable: true, image: "/img/grid_clean_1.jpg" },
    { id: 2, name: "Дробление", emoji: "🏢", building: "Башня Осколков", color: "#2ec4b6", unlockable: true, image: "/img/grid_clean_2.jpg" },
    { id: 3, name: "Посредник", emoji: "🏰", building: "Замок Союза", color: "#f4a261", unlockable: true, image: "/img/grid_clean_3.jpg" },
    { id: 4, name: "Фазовый переход", emoji: "🏭", building: "Завод Превращений", color: "#8338ec", unlockable: true, image: "/img/grid_clean_4.jpg" },
    { id: 5, name: "Эхо", emoji: "🏫", building: "Школа Отклика", color: "#0ea5e9", unlockable: true, image: "/img/grid_clean_5.jpg" },
    { id: 6, name: "Слои", emoji: "🏗️", building: "Укрепление Слоёв", color: "#16a34a", unlockable: true, image: "/img/grid_clean_6.jpg" },

    // 34 метода в разработке
    { id: 7, name: "Периодичность", emoji: "🔔", building: "Колокол Ритма", color: "#a78bfa", unlockable: false },
    { id: 8, name: "Асимметрия", emoji: "⚔️", building: "Форт Перекоса", color: "#ec4899", unlockable: false },
    { id: 9, name: "Динамичность", emoji: "🎡", building: "Карусель Гибкости", color: "#6366f1", unlockable: false },
    { id: 10, name: "Универсальность", emoji: "🎪", building: "Палатка Всемогущества", color: "#f59e0b", unlockable: false },
    { id: 11, name: "Вложенность", emoji: "🎭", building: "Театр Слоёв", color: "#8b5cf6", unlockable: false },
    { id: 12, name: "Местный контроль", emoji: "🏞️", building: "Храм Гармонии", color: "#06b6d4", unlockable: false },
    { id: 13, name: "Обратная связь", emoji: "🔄", building: "Круговорот Знаний", color: "#10b981", unlockable: false },
    { id: 14, name: "Промежуточный результат", emoji: "🎯", building: "Башня Целей", color: "#ef4444", unlockable: false },
    { id: 15, name: "Динамизм параметров", emoji: "📊", building: "Дворец Графиков", color: "#3b82f6", unlockable: false },
    { id: 16, name: "Другая размерность", emoji: "🌀", building: "Спираль Времени", color: "#8b5cf6", unlockable: false },
    { id: 17, name: "Механическая вибрация", emoji: "📳", building: "Башня Колебаний", color: "#f97316", unlockable: false },
    { id: 18, name: "Пульсирующий поток", emoji: "💫", building: "Фонтан Импульсов", color: "#06b6d4", unlockable: false },
    { id: 19, name: "Скачкообразное действие", emoji: "⚡", building: "Маяк Вспышек", color: "#fbbf24", unlockable: false },
    { id: 20, name: "Непрерывность действия", emoji: "♾️", building: "Бесконечность", color: "#6366f1", unlockable: false },
    { id: 21, name: "Ускорение", emoji: "🚀", building: "Космодром Скорости", color: "#ec4899", unlockable: false },
    { id: 22, name: "Вредное действие в пользу", emoji: "☠️", building: "Замок Парадокса", color: "#84cc16", unlockable: false },
    { id: 23, name: "Обратимость", emoji: "🔁", building: "Зеркало Обратности", color: "#f59e0b", unlockable: false },
    { id: 24, name: "Посредник", emoji: "🤝", building: "Дворец Союзов", color: "#10b981", unlockable: false },
    { id: 25, name: "Самообслуживание", emoji: "🛠️", building: "Мастерская Самопомощи", color: "#ef4444", unlockable: false },
    { id: 26, name: "Копирование", emoji: "📷", building: "Галерея Отражений", color: "#3b82f6", unlockable: false },
    { id: 27, name: "Дешёвое недолговечное", emoji: "💸", building: "Базар Находок", color: "#8b5cf6", unlockable: false },
    { id: 28, name: "Замена механики", emoji: "⚙️", building: "Фабрика Механизмов", color: "#f97316", unlockable: false },
    { id: 29, name: "Комбинированное действие", emoji: "🔗", building: "Цепь Синергии", color: "#06b6d4", unlockable: false },
    { id: 30, name: "Гибкость оболочек", emoji: "🏠", building: "Дома Гибкости", color: "#fbbf24", unlockable: false },
    { id: 31, name: "Пористость", emoji: "🧽", building: "Город Пор", color: "#6366f1", unlockable: false },
    { id: 32, name: "Изменение окраски", emoji: "🎨", building: "Мастерская Цветов", color: "#ec4899", unlockable: false },
    { id: 33, name: "Однородность", emoji: "🔲", building: "Квадрат Единства", color: "#84cc16", unlockable: false },
    { id: 34, name: "Выброс", emoji: "💨", building: "Шлюз Ветров", color: "#f59e0b", unlockable: false },
    { id: 35, name: "Переход в другое измерение", emoji: "🌌", building: "Портал Миров", color: "#10b981", unlockable: false },
    { id: 36, name: "Инертность", emoji: "🎪", building: "Цирк Равновесия", color: "#ef4444", unlockable: false },
    { id: 37, name: "Механическое колебание", emoji: "🌊", building: "Волна Гармонии", color: "#3b82f6", unlockable: false },
    { id: 38, name: "Эластичность оболочек", emoji: "🎈", building: "Воздушный Замок", color: "#8b5cf6", unlockable: false },
    { id: 39, name: "Слабые связи", emoji: "🕷️", building: "Паутина Связей", color: "#f97316", unlockable: false },
    { id: 40, name: "Синтез", emoji: "✨", building: "Дворец Синтеза", color: "#06b6d4", unlockable: false },
  ];

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
          <div>{collected.length} из {methods.length}</div>
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

      {/* Сетка всех 40 методов */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {methods.map((method) => {
            const isCollected = collected.includes(method.id);
            const taskIndex = method.id - 1;
            const imageUrl = `./img/grid_clean_${method.id}.jpg`;
            const solves = solveCount[method.id] || 0;
            const level = solves > 0 ? Math.min(Math.ceil(solves / 2), 3) : 0;

            return (
              <div
                key={method.id}
                onClick={() => isCollected && onSelectTask && onSelectTask(taskIndex)}
                className={`aspect-square rounded-xl overflow-hidden transition-all transform relative ${
                  isCollected ? "hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl" : "cursor-default"
                }`}
              >
                {isCollected ? (
                  <>
                    <img
                      src={imageUrl}
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
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-400">
                    ❓
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
