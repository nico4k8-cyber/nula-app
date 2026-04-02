import React from 'react';

export default function IsometricMap({ totalStars, unlockedBuildings, onSelectBuilding, t, theme }) {
  const BUILDINGS = [
    { id: 'city-hall', name: t('buildings.city-hall'), desc: 'Вводные задачи', cost: 0, icon: '🏛️' },
    { id: 'library', name: t('buildings.library'), desc: 'Изучение ресурсов', cost: 5, icon: '📚' },
    { id: 'nature-reserve', name: t('buildings.nature-reserve'), desc: 'Бионика и природа', cost: 15, icon: '🌿' },
    { id: 'farm', name: t('buildings.farm'), desc: 'Агро-вызовы', cost: 25, icon: '🚜' },
    { id: 'workshop', name: t('buildings.workshop'), desc: 'Инженерия', cost: 40, icon: '🛠️' },
    { id: 'laboratory', name: t('buildings.laboratory'), desc: 'Сложные системы', cost: 60, icon: '🧪' },
    { id: 'bureau', name: t('buildings.bureau'), desc: 'Проектирование будущего', cost: 80, icon: '📐' },
    { id: 'danetka', name: t('buildings.danetka'), desc: 'Мастер ТРИЗ', cost: 100, icon: '👑' },
  ];

  return (
    <div className={`w-full max-h-[660px] overflow-y-auto rounded-[32px] p-6 shadow-inner transition-colors duration-500 ${theme === 'scifi' ? 'bg-slate-900' : 'bg-gray-50/80'}`}>
      
      <div className="flex flex-col gap-4 pb-20">
        {BUILDINGS.map((b) => {
          const isUnlocked = unlockedBuildings.includes(b.id) || totalStars >= b.cost;
          
          return (
            <div 
              key={b.id}
              onClick={() => isUnlocked && onSelectBuilding(b.id)}
              className={`relative flex items-center p-4 rounded-[20px] transition-all duration-300 ${isUnlocked ? 'cursor-pointer transform hover:scale-[1.02] active:scale-95' : 'opacity-75 grayscale cursor-not-allowed'} ${theme === 'scifi' ? 'bg-slate-800 border border-slate-700 hover:border-cyan-500 shadow-lg' : 'bg-white border border-gray-100 hover:border-orange-300 shadow-sm'}`}
            >
              <div className={`w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center text-3xl ${theme === 'scifi' ? 'bg-slate-900 border border-slate-700' : 'bg-orange-50 border border-orange-100'}`}>
                <img 
                  src={`/assets/${b.id}.png`} 
                  alt={b.name}
                  className="w-full h-full object-cover transform scale-125" 
                  onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
                />
                <span style={{ display: 'none' }}>{b.icon}</span>
              </div>

              <div className="ml-5 flex-1">
                <h3 className={`font-bold text-[18px] ${theme === 'scifi' ? 'text-cyan-400' : 'text-gray-900'}`}>
                  {b.name}
                </h3>
                <p className={`text-[13px] mt-1 ${theme === 'scifi' ? 'text-slate-400' : 'text-gray-500'}`}>
                  {b.desc}
                </p>
              </div>

              <div className="ml-4 flex flex-col items-end justify-center">
                {isUnlocked ? (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'scifi' ? 'bg-cyan-900/50 text-cyan-400' : 'bg-orange-100 text-orange-600'}`}>
                    →
                  </div>
                ) : (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[13px] ${theme === 'scifi' ? 'bg-slate-900 text-slate-500 border border-slate-700' : 'bg-gray-100 text-gray-400'}`}>
                    <span>🔒</span>
                    <span>{b.cost} ⭐</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
