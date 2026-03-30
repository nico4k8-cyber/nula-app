import React from 'react';

export default function ParentView({ collected, totalStars, onUnlock, onBack }) {
  // Список артефактов для отображения прогресса в родительском кабинете
  const artifacts = [
    { name: "Лампа", principle: "Разделение" },
    { name: "Мост", principle: "Объединение" },
    { name: "Щит", principle: "Баланс" },
    { name: "Часы", principle: "Инверсия" },
    { name: "Зеркало", principle: "Выбор" },
    { name: "Кубок", principle: "Ресурсы" },
    { name: "Книга", principle: "Философия" }
  ];

  return (
    <div className="flex flex-col flex-1 bg-white">
      <div className="px-5 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">Профиль изобретателя</h1>
          <p className="text-[13px] text-gray-500">Твои достижения в Городе</p>
        </div>
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-600">
          ✕
        </button>
      </div>

      <div className="p-5 flex flex-col gap-6 overflow-y-auto">
        {/* Stats Card */}
        <div className="bg-orange-50 rounded-[24px] p-5 border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[15px] font-bold text-gray-900">{completedTasks.length} / 7 артефактов</div>
            <div className="text-[15px] font-bold text-orange-600">⭐ {totalStars}</div>
          </div>
          <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-orange-100">
            <div 
              className="h-full bg-orange-500 transition-all duration-1000"
              style={{ width: `${(completedTasks.length / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-[20px] p-5 border border-indigo-100">
          <h3 className="font-bold text-[16px] mb-3 text-indigo-900">Что это даёт?</h3>
          <ul className="flex flex-col gap-3">
            <li className="flex gap-3 text-[14px] text-indigo-800">
              <span className="text-xl">🚀</span>
              <span><strong>Системное мышление:</strong> Ребёнок учится видеть связи между явлениями.</span>
            </li>
            <li className="flex gap-3 text-[14px] text-indigo-800">
              <span className="text-xl">🛠️</span>
              <span><strong>Решение проблем:</strong> Методы ТРИЗ помогают находить выход из тупиковых ситуаций.</span>
            </li>
            <li className="flex gap-3 text-[14px] text-indigo-800">
              <span className="text-xl">🧠</span>
              <span><strong>Гибкость ума:</strong> Развитие способности смотреть на вещи под разным углом.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 shadow-xl border border-gray-100 flex flex-col items-center text-center gap-4 border-t-4 border-t-orange-500">
        <div className="text-[14px] font-bold text-orange-600">ПРЕДЛОЖЕНИЕ ДЛЯ ВАС</div>
        <h3 className="text-[18px] font-bold leading-tight">
          Разблокируйте полный доступ <br/> к 40+ урокам мастерства
        </h3>
        <p className="text-[13px] text-gray-500">
          Откройте все 34 скрытых метода и подарите ребёнку возможность стать настоящим изобретателем.
        </p>
        
        <button
          onClick={onUnlock}
          className="w-full py-4 rounded-[18px] bg-orange-500 text-white font-bold text-[16px] shadow-lg shadow-orange-200 active:scale-95 transition-all"
        >
          КУПИТЬ ВСЁ ЗА $4.99
        </button>
        
        <p className="text-[11px] text-gray-400">
          Безопасная оплата • Доступ на год • Обновления включены
        </p>

        {/* Promo Code Section */}
        <div className="w-full mt-4 pt-4 border-t border-gray-100">
          <details className="w-full text-left">
            <summary className="text-[12px] text-indigo-400 cursor-pointer hover:text-indigo-600 transition-colors"> У меня есть код доступа</summary>
            <div className="mt-3 flex gap-2">
              <input 
                type="text" 
                id="promo-input"
                placeholder="Введите код"
                className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-[12px] text-[14px] outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button 
                onClick={() => {
                  const val = document.getElementById('promo-input').value;
                  onUnlock(val);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-[12px] text-[13px] font-bold"
              >
                Ок
              </button>
            </div>
          </details>
        </div>
      </div>

      <p className="text-center text-[12px] text-gray-400 mt-8 mb-4">
        SHARIEL — TRIZ Academy for Kids
      </p>
    </div>
  );
}
