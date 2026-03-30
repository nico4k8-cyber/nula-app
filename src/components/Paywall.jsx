import React, { useState } from 'react';

export default function Paywall({ onSelectPlan, onBack, onDonate }) {
  const [gateOpen, setGateOpen] = useState(false);
  const [mathTask, setMathTask] = useState({ q: '24 + 18', a: 42 });
  const [answer, setAnswer] = useState('');
  const [targetAction, setTargetAction] = useState(null);

  const checkGate = (action) => {
    setTargetAction(action);
    setGateOpen(true);
  };

  const handleGateSubmit = () => {
    if (parseInt(answer) === mathTask.a) {
      setGateOpen(false);
      targetAction();
    } else {
      alert('Неправильно. Попробуй ещё раз!');
    }
  };

  return (
    <div className="flex flex-col flex-1 px-6 py-12 items-center justify-center bg-slate-900 text-white animate-fade-in relative overflow-hidden h-full">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[80%] h-[30%] bg-indigo-600/20 blur-[130px]" />
      
      {!gateOpen ? (
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <div className="w-24 h-24 mb-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
            <span className="text-4xl">💎</span>
          </div>

          <h2 className="text-3xl font-bold mb-4 text-center">Дневной лимит <br/>исчерпан!</h2>
          
          <div className="glass-card p-6 mb-8 w-full border border-white/10">
            <p className="text-slate-300 text-center leading-relaxed">
              Уголёк набрался идей и идет отдыхать. <br/> Твоя поддержка помогает нам добавлять по <span className="text-emerald-400 font-bold">10 новых задач</span> каждую неделю!
            </p>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={() => checkGate(() => onSelectPlan('month'))}
              className="w-full p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl flex flex-col items-center gap-1 shadow-lg active:scale-95 transition-all"
            >
              <span className="font-bold text-lg">Полный безлимит 🚀</span>
              <span className="text-xs text-indigo-100 opacity-80">Тариф «Изобретатель» • 499 ₽ / мес</span>
            </button>

            <button 
              onClick={() => checkGate(() => onSelectPlan('week'))}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <span className="font-bold">Недельный марафон</span>
              <span className="text-xs text-slate-400">Тариф «Спринт» • 199 ₽ / нед</span>
            </button>

            <div className="py-4 flex items-center gap-4 w-full">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-slate-500 text-xs font-bold uppercase">Или</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <button 
              onClick={onDonate}
              className="w-full py-4 text-emerald-400 font-bold border-2 border-emerald-400/20 rounded-2xl hover:bg-emerald-400/10 active:scale-95 transition-all"
            >
              ☕ Поддержать проект (Донат)
            </button>

            <button 
              onClick={onBack}
              className="w-full py-4 text-slate-500 font-bold"
            >
              Отдохнуть до завтра
            </button>

            {/* Мягкий CTA для онлайн занятий */}
            <div className="mt-6 text-center">
              <span className="text-slate-400 text-sm">Хотите заниматься ТРИЗ с преподавателем? </span>
              <a href="#" className="text-indigo-400 text-sm font-bold underline decoration-indigo-400/30 underline-offset-4 hover:text-indigo-300">
                Узнать про онлайн-группы
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
          <div className="text-5xl mb-6">👨‍👩‍👧‍👦</div>
          <h2 className="text-2xl font-bold mb-2">Проверка для родителей</h2>
          <p className="text-slate-400 mb-8">Пожалуйста, решите пример, чтобы продолжить:</p>
          
          <div className="w-full bg-slate-800 rounded-3xl p-8 border border-white/5 shadow-2xl">
            <div className="text-4xl font-bold mb-6 text-indigo-400">{mathTask.q} = ?</div>
            <input 
              type="number"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              autoFocus
              className="w-full bg-slate-900 border-2 border-indigo-500/30 rounded-xl px-6 py-4 text-2xl text-center text-white outline-none focus:border-indigo-500 transition-all mb-6"
            />
            <button 
              onClick={handleGateSubmit}
              className="w-full h-14 bg-indigo-600 rounded-xl font-bold text-lg active:scale-95 transition-all"
            >
              Подтвердить
            </button>
            <button 
              onClick={() => setGateOpen(false)}
              className="w-full mt-4 text-slate-500 font-bold"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
