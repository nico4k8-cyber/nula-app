import { useEffect, useState } from 'react';
import WorldMap from './components/WorldMap';
import { ISLAND_MAPPING } from './utils/gameUtils';

export default function City({ 
  onSelectBuilding, t, onLogoClick, 
  user, totalStars, completedTasks, islands, unlockRequirements,
  checkUnlocks
}) {
  const [selectedIslandId, setSelectedIslandId] = useState(null);

  useEffect(() => {
    checkUnlocks();
  }, [totalStars, completedTasks.length]);

  const islandData = selectedIslandId ? ISLAND_MAPPING[selectedIslandId] : null;

  return (
    <div className="flex flex-col flex-1 min-h-screen relative bg-slate-900 overflow-hidden">
      {/* Floating Header HUD (Premium Glass) */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-sm flex items-center justify-between px-6 py-4 glass-dark rounded-[32px] shadow-premium">
        <div 
          className="flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform" 
          onClick={onLogoClick}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl shadow-lg border border-white/20">
            {user ? '👤' : '☁️'}
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-black text-white uppercase tracking-wider leading-none mb-1">
              {user?.name || t('hud.guest')}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[9px] text-white/50 font-black uppercase tracking-[0.2em]">
                {user ? t('hud.online') : t('hud.offline')}
              </span>
            </div>
          </div>
        </div>
        
        <div 
          className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-transform cursor-pointer"
          onClick={() => window.location.reload()}
          title={t('hud.sync')}
        >
          <span className="text-yellow-400 text-lg">⭐</span>
          <span className="font-black text-white text-[18px] tracking-tighter">{totalStars}</span>
        </div>
      </div>

      <div className="w-full flex-1">
        {!selectedIslandId ? (
          <WorldMap 
            islands={islands}
            unlockRequirements={unlockRequirements}
            totalSolved={completedTasks.length}
            onSelectBuilding={(id) => setSelectedIslandId(id)}
            t={t}
          />
        ) : (
          <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-3xl animate-fade-in flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white rounded-[48px] shadow-full overflow-hidden flex flex-col relative animate-slide-up">
              <div className="h-56 bg-slate-900 relative overflow-hidden">
                 <img 
                   src={islandData?.imgUrl} 
                   className="w-full h-full object-cover opacity-60 scale-110" 
                   alt=""
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                 
                 <button 
                  onClick={() => setSelectedIslandId(null)}
                   className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl text-white text-xl transition-all active:scale-95 z-20 backdrop-blur-md border border-white/10"
                 >
                   ←
                 </button>
                 
                 <div className="absolute bottom-10 left-10 text-white">
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-1 font-display">{t(`buildings.${selectedIslandId}`)}</h2>
                    <div className="flex items-center gap-3 px-3 py-1 bg-white/10 rounded-full w-fit backdrop-blur-md border border-white/5">
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">{t('picker.choose')}</span>
                    </div>
                 </div>
              </div>

              <div className="p-8 grid grid-cols-1 gap-5 overflow-y-auto max-h-[55vh] custom-scrollbar bg-slate-50/50">
                {islandData?.buildings.map((b, idx) => (
                  <button 
                    key={b.id}
                    onClick={() => onSelectBuilding(b.id)}
                    className="flex items-center gap-6 p-6 bg-white hover:bg-slate-50 border-2 border-transparent hover:border-indigo-100 rounded-[32px] transition-all group active:scale-[0.98] shadow-sm hover:shadow-xl"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className={`w-16 h-16 flex items-center justify-center text-3xl rounded-[20px] shadow-lg group-hover:scale-110 transition-transform ${b.color || 'bg-indigo-500'}`}>
                      {b.icon}
                    </div>
                    <div className="flex-1 text-left">
                       <h3 className="text-xl font-black font-display text-slate-800 uppercase tracking-tight">{t(`buildings.${b.id}`)}</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{t('picker.go')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                      →
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-6 bg-slate-50 flex justify-center border-t border-slate-100">
                   <button 
                     onClick={() => setSelectedIslandId(null)} 
                     className="px-8 py-3 bg-slate-200 hover:bg-slate-300 rounded-full text-[11px] font-black uppercase tracking-widest text-slate-600 transition-all active:scale-95"
                   >
                      {t('world_map')}
                   </button>
                </div>
            </div>
          </div>
        )}
        
        {/* Floating Mini HUD (Bottom Progress) */}
        {!selectedIslandId && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-4 pointer-events-none animate-fade-in">
            <div className="px-8 py-4 glass-dark rounded-full border border-white/10 text-center flex items-center gap-8 shadow-premium">
              <div className="flex flex-col items-center">
                <p className="text-xl font-black text-white leading-none">{completedTasks.length}</p>
                <p className="text-[8px] text-white/40 uppercase font-black tracking-[0.2em] mt-1">{t('hud.missions')}</p>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div className="flex flex-col items-center">
                <p className="text-xl font-black text-white leading-none">
                   {Object.values(islands || {}).filter(i => i.status === 'active' || i.status === 'completed').length}
                </p>
                <p className="text-[8px] text-white/40 uppercase font-black tracking-[0.2em] mt-1">{t('hud.islands')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
