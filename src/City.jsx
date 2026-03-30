import { useEffect, useState, useRef } from 'react';
import WorldMap from './components/WorldMap';
import { useGameStore } from './store/gameStore';

export default function City({ onSelectBuilding, t, onLogoClick }) {
  const { 
    totalStars, 
    islands, 
    unlockRequirements, 
    completedTasks, 
    checkUnlocks,
    user
  } = useGameStore();

  useEffect(() => {
    checkUnlocks();
  }, [totalStars, completedTasks.length]);

  return (
    <div className="flex flex-col flex-1 min-h-screen relative bg-sky-400">
      {/* Floating Header HUD */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-md rounded-[20px] shadow-2xl border border-white/10">
        <div className="flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform" onClick={onLogoClick}>
          <div className="flex flex-col">
            <span className="text-[18px] font-black tracking-tighter text-white leading-none mb-1">SHARIEL</span>
            <div className="flex items-center gap-1.5 text-left">
              <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[12px] text-white font-black uppercase tracking-widest">{user?.name || 'Гость'}</span>
            </div>
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Архипелаг Изобретателей</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Cloud Sync Status */}
          <div 
            onClick={() => !user ? onLogoClick() : null}
            className={`cursor-pointer transition-all active:scale-95 group relative flex items-center justify-center w-10 h-10 rounded-full border ${user ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/10 bg-white/5'}`}
            title={user ? "Прогресс в облаке" : "Войди, чтобы сохранить прогресс"}
          >
            <span className={`text-xl ${user ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-500 opacity-50'}`}>
              ☁️
            </span>
            {!user && <div className="absolute w-[80%] h-[2px] bg-red-400/60 rotate-45" />}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full">
            <span className="text-yellow-400 text-lg drop-shadow-md">⭐</span>
            <span className="font-black text-white text-[16px] tracking-tight">{totalStars}</span>
          </div>

          {user && (
            <button 
              onClick={() => {
                if(window.confirm("Выйти из аккаунта?")) {
                  supabase.auth.signOut().then(() => window.location.reload());
                }
              }}
              className="ml-2 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[10px] text-red-300 font-bold hover:bg-red-500/40 transition-all"
            >
              🚪
            </button>
          )}
        </div>
      </div>

      <div className="w-full flex-1">
        <WorldMap 
          islands={islands}
          unlockRequirements={unlockRequirements}
          totalSolved={completedTasks.length}
          onSelectBuilding={onSelectBuilding}
        />
        
        {/* Floating Info HUD (Bottom) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4 pointer-events-none">
          <div className="px-6 py-2 glass-card border-white/5 text-center flex items-center gap-6">
            <div>
              <p className="text-lg font-bold text-white">{completedTasks.length}</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Миссий</p>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <p className="text-lg font-bold text-white">{islands ? Object.values(islands).filter(i => i.status === 'completed').length : 0}</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Островов</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
