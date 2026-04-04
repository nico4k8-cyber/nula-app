import React, { useState } from "react";
import { thinkingType } from "../utils/gameUtils";

function ShareButton({ totalStars, completedCount }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const text = `Я решил ${completedCount} задач и заработал ${totalStars} звёзд ТРИЗ-мышления! 🧠⭐\nПопробуй сам: https://shariel.app`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <button
      onClick={handleShare}
      className="w-full py-4 rounded-[22px] bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-black text-[15px] shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
    >
      {copied ? '✅ Скопировано!' : '📤 Поделиться результатом'}
    </button>
  );
}

export default function FinalView({
  totalStars,
  completedTasks,
  TASKS,
  onRestart,
  onBackToCity,
  onUgc,
  t,
  lang
}) {
  const type = thinkingType(totalStars, lang);
  const remaining = TASKS.length - completedTasks.length;

  return (
    <div className="flex flex-col flex-1 bg-white relative animate-fade-in">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-amber-500 to-amber-600 rounded-b-[40px] shadow-2xl" />
      
      <div className="flex flex-col flex-1 justify-center items-center gap-8 px-6 pt-12 relative z-10">
        
        <div className="text-center group">
          <div className="text-8xl mb-6 flex-shrink-0 animate-bounce-slow drop-shadow-2xl">🏆</div>
          <h2 className="text-white text-5xl font-black uppercase tracking-tighter leading-none mb-2 filter drop-shadow-lg">
             {type.label}
          </h2>
          <div className="text-white/80 font-black text-[12px] uppercase tracking-[0.3em] bg-white/10 px-4 py-2 rounded-full inline-block backdrop-blur-md border border-white/20">
             {t('final.my_level')}
          </div>
        </div>

        <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
           <div className="bg-white rounded-[32px] p-6 shadow-2xl border-4 border-amber-400 flex flex-col items-center">
              <span className="text-5xl mb-2">⭐</span>
              <span className="text-4xl font-black text-slate-800">{totalStars}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('final.stars_power')}</span>
           </div>
           <div className="bg-white rounded-[32px] p-6 shadow-2xl border-4 border-emerald-400 flex flex-col items-center">
              <span className="text-5xl mb-2">🏝️</span>
              <span className="text-4xl font-black text-slate-800">{completedTasks.length}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('final.islands_passed')}</span>
           </div>
        </div>

        <div className="w-full bg-white rounded-[36px] p-8 shadow-2xl border-2 border-slate-100 flex flex-col items-center text-center max-w-[400px] animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
           <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">{t('final.path_continues')}</h3>
           <p className="text-slate-500 text-[15px] leading-relaxed mb-6 font-medium">
             {t('final.remaining_tasks').replace('{count}', remaining)}
           </p>
           
           <div className="flex flex-col w-full gap-4">
              <ShareButton totalStars={totalStars} completedCount={completedTasks.length} />

              <button onClick={onBackToCity}
                className="w-full bg-slate-900 text-white text-[16px] font-black py-4 rounded-[22px] active:scale-[0.97] transition-all shadow-xl hover:bg-black"
              >
                {t('world_map')} →
              </button>

              <button onClick={onRestart}
                className="w-full text-slate-400 text-[14px] font-bold py-2 hover:text-slate-600 transition-all"
              >
                {t('final.reset_game')}
              </button>
           </div>
        </div>

        {/* Mentor coal footer */}
        <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.8s' }}>
           <img src="./img/ugolok_3d.png" alt="Уголёк" className="w-10 h-10 rounded-full" />
           <p className="text-slate-400 font-bold text-[12px] uppercase tracking-widest italic">{t('final.mentor_footer')}</p>
        </div>
      </div>

    </div>
  );
}
