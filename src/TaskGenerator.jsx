import { useState } from "react";
import { TASKS } from "./tasks";

export default function TaskGenerator({ onBack, onSubmit }) {
  const [step, setStep] = useState("select-method"); // select-method | create | review
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [customTask, setCustomTask] = useState({
    animal: "",
    animalName: "",
    phenomenon: "",
    trickQuestion: "",
    realSolution: "",
  });
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!selectedMethod) {
      setError("Выбери метод ТРИЗ");
      return;
    }
    setError("");
    setStep("create");
  };

  const handleSubmit = () => {
    if (!customTask.animal.trim() || !customTask.animalName.trim() ||
        !customTask.phenomenon.trim() || !customTask.trickQuestion.trim() ||
        !customTask.realSolution.trim()) {
      setError("Заполни все поля");
      return;
    }
    setError("");
    onSubmit({
      methodId: selectedMethod,
      ...customTask,
    });
  };

  const method = selectedMethod ? TASKS[selectedMethod - 1] : null;

  /* Step 1: Select Method */
  if (step === "select-method") {
    return (
      <div className="flex flex-col flex-1 px-5 pb-8 gap-4 overflow-y-auto">
        <div className="sticky top-0 bg-white pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-[20px] hover:opacity-70 transition-opacity"
          >
            ←
          </button>
          <h2 className="text-[20px] font-bold text-gray-900">Создай свою загадку</h2>
        </div>

        <p className="text-gray-600 text-[14px] mt-2">
          Выбери метод ТРИЗ для своей загадки:
        </p>

        <div className="grid grid-cols-2 gap-3">
          {TASKS.map((task) => {
            const isSelected = selectedMethod === task.id;
            return (
              <button
                key={task.id}
                onClick={() => {
                  setSelectedMethod(task.id);
                  setError("");
                }}
                className={`p-4 rounded-[14px] flex flex-col items-center gap-2 border-2 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-[28px]">{task.trick.animal}</span>
                <span className="text-[12px] font-semibold text-gray-700 text-center">
                  {task.trick.name}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-700 text-[14px]">
            {error}
          </div>
        )}

        <div className="mt-auto flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-[14px] border-2 border-gray-300 text-gray-700 font-semibold active:scale-95 transition-transform"
          >
            Отмена
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-[14px] bg-blue-500 text-white font-semibold active:scale-95 transition-transform"
          >
            Дальше →
          </button>
        </div>
      </div>
    );
  }

  /* Step 2: Create Task */
  if (step === "create") {
    return (
      <div className="flex flex-col flex-1 px-5 pb-8 gap-4 overflow-y-auto">
        <div className="sticky top-0 bg-white pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={() => setStep("select-method")}
            className="text-[20px] hover:opacity-70 transition-opacity"
          >
            ←
          </button>
          <h2 className="text-[20px] font-bold text-gray-900">Создай загадку</h2>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-blue-700 text-[14px] mt-2">
          <strong>Метод:</strong> {method?.trick.name}
          <p className="text-[12px] mt-1 opacity-80">{method?.trick.motto}</p>
        </div>

        <div className="space-y-4">
          {/* Animal */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">
              Эмодзи животного / явления
            </label>
            <input
              type="text"
              maxLength="2"
              value={customTask.animal}
              onChange={(e) =>
                setCustomTask({ ...customTask, animal: e.target.value })
              }
              placeholder="например: 🦑"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-[10px] text-[16px] focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Animal Name */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">
              Название животного
            </label>
            <input
              type="text"
              value={customTask.animalName}
              onChange={(e) =>
                setCustomTask({ ...customTask, animalName: e.target.value })
              }
              placeholder="например: осьминог"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-[10px] text-[14px] focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Phenomenon */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">
              Явление в природе
            </label>
            <textarea
              value={customTask.phenomenon}
              onChange={(e) =>
                setCustomTask({ ...customTask, phenomenon: e.target.value })
              }
              placeholder="Опиши явление, которое использует этот метод ТРИЗ..."
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-[10px] text-[14px] focus:border-blue-500 focus:outline-none h-20 resize-none"
            />
          </div>

          {/* Trick Question */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">
              Загадка-вопрос
            </label>
            <textarea
              value={customTask.trickQuestion}
              onChange={(e) =>
                setCustomTask({ ...customTask, trickQuestion: e.target.value })
              }
              placeholder="Какой вопрос поставишь другому ребёнку? Избегай прямых ответов."
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-[10px] text-[14px] focus:border-blue-500 focus:outline-none h-20 resize-none"
            />
          </div>

          {/* Real Solution */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">
              Решение (как это работает в природе)
            </label>
            <textarea
              value={customTask.realSolution}
              onChange={(e) =>
                setCustomTask({ ...customTask, realSolution: e.target.value })
              }
              placeholder="Объясни реальное решение, которое подтверждается наукой..."
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-[10px] text-[14px] focus:border-blue-500 focus:outline-none h-20 resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-700 text-[14px]">
            {error}
          </div>
        )}

        <div className="mt-auto flex gap-3">
          <button
            onClick={() => setStep("select-method")}
            className="flex-1 py-3 rounded-[14px] border-2 border-gray-300 text-gray-700 font-semibold active:scale-95 transition-transform"
          >
            Назад
          </button>
          <button
            onClick={() => setStep("review")}
            className="flex-1 py-3 rounded-[14px] bg-blue-500 text-white font-semibold active:scale-95 transition-transform"
          >
            Проверить →
          </button>
        </div>
      </div>
    );
  }

  /* Step 3: Review */
  if (step === "review") {
    return (
      <div className="flex flex-col flex-1 px-5 pb-8 gap-4 overflow-y-auto">
        <div className="sticky top-0 bg-white pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={() => setStep("create")}
            className="text-[20px] hover:opacity-70 transition-opacity"
          >
            ←
          </button>
          <h2 className="text-[20px] font-bold text-gray-900">Проверь загадку</h2>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[16px] p-4 border-2 border-blue-200 mt-2">
          <div className="flex gap-3 items-start">
            <span className="text-[32px]">{customTask.animal}</span>
            <div>
              <div className="font-bold text-gray-900">{customTask.animalName}</div>
              <div className="text-[12px] text-gray-600 mt-1">Метод: {method?.trick.name}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-[13px] font-bold text-gray-700 mb-2">Явление:</h4>
            <p className="text-[14px] text-gray-700 p-3 bg-gray-50 rounded-[10px]">
              {customTask.phenomenon}
            </p>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-gray-700 mb-2">Вопрос:</h4>
            <p className="text-[14px] text-gray-700 p-3 bg-gray-50 rounded-[10px]">
              {customTask.trickQuestion}
            </p>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-gray-700 mb-2">Решение:</h4>
            <p className="text-[14px] text-gray-700 p-3 bg-gray-50 rounded-[10px]">
              {customTask.realSolution}
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-amber-700 text-[13px]">
          ✨ Отличная загадка! Если она нравится, она может попасть в игру для других детей.
        </div>

        <div className="mt-auto flex gap-3">
          <button
            onClick={() => setStep("create")}
            className="flex-1 py-3 rounded-[14px] border-2 border-gray-300 text-gray-700 font-semibold active:scale-95 transition-transform"
          >
            Отредактировать
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-[14px] bg-green-500 text-white font-semibold active:scale-95 transition-transform"
          >
            Отправить ✓
          </button>
        </div>
      </div>
    );
  }
}
