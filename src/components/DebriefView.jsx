import React from "react";
import TopProgress from "./TopProgress";
import { methodDescription } from "../utils/gameUtils";

export default function DebriefView({ 
  task, 
  completedTasks, 
  taskIdx, 
  debriefBingo, 
  sessionStars, 
  TASKS, 
  onNext,
  t,
  lang
}) {
  return (
    <div className="flex flex-col flex-1 px-5 pb-8 animate-fade-in-up">
      <TopProgress completedTasks={completedTasks} current={taskIdx} TASKS={TASKS} t={t} />
      
      <div className="flex flex-col flex-1 justify-center items-center gap-5 mt-4">
        <div className="text-center text-5xl mb-1 animate-bounce-slow">{debriefBingo ? "🎉" : "⚡"}</div>
        
        <div className="text-center">
          <h3 className="text-2xl font-black text-slate-800 mb-1">
            {debriefBingo ? t('debrief.bingo') : t('debrief.just_so')}
          </h3>
          <p className="text-slate-400 font-bold text-[12px] uppercase tracking-widest">{t('debrief.method_discovered')}</p>
        </div>

        <div className="bg-amber-50 border-2 border-amber-100 rounded-[24px] p-5 text-[15px] text-amber-900 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">💡</div>
          <div className="flex gap-4">
            <img src="./img/ugolok_3d.png" alt="Уголёк" className="w-12 h-12 flex-shrink-0 rounded-full object-cover shadow-md border-2 border-white" />
            <p className="leading-relaxed">
              <span className="font-black block mb-1 text-amber-600 uppercase text-[11px] tracking-wider">{t('debrief.mentor_says')}</span>
              {lang === 'ru' 
                ? `Этот мир разгадан! Ты открыл "${task.trick.name}" — мощный инструмент, которым природа пользуется миллионы лет.`
                : `This world is solved! You discovered "${task.trick.name}" — a powerful tool that nature has been using for millions of years.`
              }
            </p>
          </div>
        </div>

        <div className="w-full rounded-[24px] p-6 border-4 shadow-xl transition-transform hover:scale-[1.02]" 
          style={{ borderColor: task.trick.color, backgroundColor: 'white' }}>
          <p className="font-black text-[11px] mb-3 uppercase tracking-[0.2em]" style={{ color: task.trick.color }}>🔑 {t('debrief.method_discovered').toUpperCase()}</p>
          <div className="text-2xl font-black mb-1" style={{ color: task.trick.color }}>
            {task.trick.name}
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase mb-4 tracking-tighter">{task.trick.animalName}</div>
          <p className="text-[14px] text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
            {methodDescription(task.trick.name, lang)}
          </p>
        </div>

        {task.customer && (
          <div className="w-full bg-orange-50 border-2 border-orange-100 rounded-[24px] p-5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex gap-4">
              <div className="text-4xl flex-shrink-0 drop-shadow-md">{task.customer.emoji}</div>
              <div className="flex-1">
                <p className="font-black text-slate-800 text-[14px] mb-1 uppercase tracking-tight">{task.customer.name}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-3">
                  {lang === 'ru' ? "Спасибо! Это решение спасёт мой день. Теперь ответь на вопрос..." : "Thank you! This solution will save my day. Now answer the question..."}
                </p>
                <div className="bg-white/60 p-3 rounded-xl border border-orange-200">
                  <p className="text-[13px] text-orange-900 font-bold italic leading-snug">
                    {lang === 'ru' 
                      ? "\"А что если эту же идею применить где-нибудь ещё? Где ещё это сработает?\""
                      : "\"What if we apply the same idea somewhere else? Where else would it work?\""
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {sessionStars > 0 && (
          <div className="text-center py-4 px-6 bg-yellow-50 rounded-full border border-yellow-100 animate-pulse">
            <div className="text-yellow-500 text-xl font-black mb-1">
              {"⭐".repeat(Math.min(sessionStars, 7))}
            </div>
            <p className="text-yellow-700 text-[12px] font-black uppercase tracking-widest">+{sessionStars} {t('stars_total')}</p>
          </div>
        )}

        <button onClick={onNext}
          className="w-full bg-slate-900 text-white text-[17px] font-black py-5 rounded-[24px] active:scale-[0.97] transition-all shadow-xl hover:bg-black mt-4"
        >
          {t('debrief.engineers_how')}
        </button>
      </div>
    </div>
  );
}
