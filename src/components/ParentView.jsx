import React, { useState } from 'react';

const BUILDING_NAMES = {
  'library': 'Библиотека',
  'city-hall': 'Мэрия',
  'nature-reserve': 'Заповедник',
  'workshop': 'Мастерская',
  'farm': 'Ферма',
  'bredo': 'Генератор идей',
  'laboratory': 'Лаборатория',
  'tsar': 'Царь-гора'
};

export default function ParentView({ completedTasks, totalStars, streak, TASKS = [], onUnlock, onBack }) {
  const [promoInput, setPromoInput] = useState('');

  const taskMap = Object.fromEntries(TASKS.map(t => [t.id, t]));

  const solvedTasks = (completedTasks || [])
    .map(ct => {
      const task = taskMap[ct.taskId];
      // Fallback to snapshot metadata stored at completion time
      const resolved = task || (ct.taskTitle ? {
        id: ct.taskId,
        title: ct.taskTitle,
        icon: ct.taskIcon || '📝',
        category: ct.taskCategory || '',
      } : null);
      if (!resolved) return null;
      return { ...ct, task: resolved };
    })
    .filter(Boolean);

  const progressPct = TASKS.length > 0 ? (solvedTasks.length / TASKS.length) * 100 : 0;

  return (
    <div className="flex flex-col flex-1 bg-white min-h-[100dvh]">
      <div className="px-5 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">Мой прогресс</h1>
          <p className="text-[13px] text-gray-500">Что ты уже решил</p>
        </div>
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-600">
          ✕
        </button>
      </div>

      <div className="p-5 flex flex-col gap-6 overflow-y-auto flex-1">
        {/* Stats Card */}
        <div className="bg-orange-50 rounded-[24px] p-5 border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[15px] font-bold text-gray-900">
              Решено {solvedTasks.length} задач · ⭐ {totalStars} звёзд · 🔥 {streak || 0} дней подряд
            </div>
          </div>
          <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-orange-100">
            <div
              className="h-full bg-orange-500 transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-orange-400 mt-1">{solvedTasks.length} {solvedTasks.length === 1 ? 'задача решена' : solvedTasks.length < 5 ? 'задачи решено' : 'задач решено'}</div>
        </div>

        {/* Solved tasks list */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[16px] font-bold text-gray-800">Решённые задачи</h2>

          {solvedTasks.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-[14px]">Ты ещё не решил ни одной задачи</p>
              <p className="text-[12px]">Начни играть — здесь появится прогресс</p>
            </div>
          )}

          {solvedTasks.map(({ taskId, stars, foundPrinciple, solutions, task }) => {
            const allSolutions = solutions?.length ? solutions : (foundPrinciple ? [foundPrinciple] : []);
            return (
              <div key={taskId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-2xl">{task.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] text-gray-900">{task.title}</div>
                  <div className="text-[12px] text-gray-400 mb-1">
                    {BUILDING_NAMES[task.category] || task.category}
                  </div>
                  {allSolutions.map((sol, i) => (
                    <div key={i} className="text-[12px] text-indigo-700 bg-indigo-50 rounded-lg px-2 py-1 mb-1">
                      {allSolutions.length > 1 && <span className="font-bold text-indigo-400 mr-1">#{i + 1}</span>}
                      💡 {sol}
                    </div>
                  ))}
                </div>
                <div className="text-[14px] text-orange-500 shrink-0">{'⭐'.repeat(stars || 1)}</div>
              </div>
            );
          })}
        </div>

        {/* Benefits section */}
        <div className="bg-indigo-50 rounded-[20px] p-5 border border-indigo-100">
          <h3 className="font-bold text-[16px] mb-3 text-indigo-900">Зачем это?</h3>
          <ul className="flex flex-col gap-3">
            <li className="flex gap-3 text-[14px] text-indigo-800">
              <span className="text-xl">🚀</span>
              <span><strong>Видеть связи:</strong> Учишься замечать, как всё в мире устроено и зачем.</span>
            </li>
            <li className="flex gap-3 text-[14px] text-indigo-800">
              <span className="text-xl">🛠️</span>
              <span><strong>Решать проблемы:</strong> Методы ТРИЗ помогают найти выход даже из сложных ситуаций.</span>
            </li>
            <li className="flex gap-3 text-[14px] text-indigo-800">
              <span className="text-xl">🧠</span>
              <span><strong>Думать иначе:</strong> Смотришь на вещи под разным углом — как настоящий изобретатель.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA bottom */}
      <div className="bg-white rounded-t-[24px] p-6 shadow-xl border border-gray-100 flex flex-col items-center text-center gap-4 border-t-4 border-t-orange-500">
        <div className="text-[14px] font-bold text-orange-600">ПРЕДЛОЖЕНИЕ ДЛЯ ВАС</div>
        <h3 className="text-[18px] font-bold leading-tight">
          Полный доступ — все острова и задачи
        </h3>
        <p className="text-[13px] text-gray-500">
          Открой все методы ТРИЗ и стань настоящим изобретателем.
        </p>

        <button
          onClick={() => onUnlock && onUnlock()}
          className="w-full py-4 rounded-[18px] bg-orange-500 text-white font-bold text-[16px] shadow-lg shadow-orange-200 active:scale-95 transition-all"
        >
          КУПИТЬ ВСЁ ЗА 199₽/мес при оплате за год
        </button>

        <p className="text-[11px] text-gray-400">
          Безопасная оплата · Доступ на год · Обновления включены
        </p>

        {/* Promo Code Section */}
        <div className="w-full mt-4 pt-4 border-t border-gray-100">
          <details className="w-full text-left">
            <summary className="text-[12px] text-indigo-400 cursor-pointer hover:text-indigo-600 transition-colors">У меня есть код доступа</summary>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={e => setPromoInput(e.target.value)}
                placeholder="Введите код"
                className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-[12px] text-[14px] outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                onClick={() => onUnlock && onUnlock(promoInput)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-[12px] text-[13px] font-bold"
              >
                Ок
              </button>
            </div>
          </details>
        </div>
      </div>

      <p className="text-center text-[12px] text-gray-400 mt-4 mb-4">
        SHARIEL — TRIZ Academy for Kids
      </p>
    </div>
  );
}
