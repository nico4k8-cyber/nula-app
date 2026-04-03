import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';

const MAP_CONFIG = [
  { id: 'main', name: 'Главный остров', left: '45%', top: 250, icon: '/assets/webp/main_island.webp?v=2' },
  { id: 'craft', name: 'Заповедник', left: '30%', top: 650, icon: '/assets/webp/island_zapovednik.webp?v=2' },
  { id: 'science', name: 'Остров Науки', left: '60%', top: 1050, icon: '/assets/webp/island_laboratory.webp?v=2' },
  { id: 'summit', name: 'Пик Изобретателей', left: '40%', top: 1450, icon: '/assets/webp/island_tsar.webp?v=2' },
];

function BezierPath({ p1, p2, isDone }) {
  if (!p1 || !p2) return null;
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cp1x = x1 + dx * 0.2;
  const cp1y = y1 + dy * 0.6;
  const cp2x = x2 - dx * 0.2;
  const cp2y = y2 - dy * 0.4;
  
  const d = `M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
  
  return (
    <path 
      d={d}
      stroke={isDone ? '#34d399' : 'rgba(0,0,0,0.15)'}      strokeWidth={isDone ? '6' : '4'}
      strokeDasharray={isDone ? 'none' : '12,10'}
      strokeLinecap="round"
      fill="none"
      className="transition-all duration-1000"
    />
  );
}

export default function WorldMap({ islands, unlockRequirements, totalSolved, onSelectBuilding, t }) {
  const containerRef = useRef(null);
  const scrollContentRef = useRef(null);
  const islandElementRefs = useRef({});
  const [paths, setPaths] = useState([]);
  const [selectedLock, setSelectedLock] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Use offsetTop/offsetLeft for stable calculation inside the absolute-positioned scroll container
  const updatePaths = () => {
    if (!scrollContentRef.current) return;
    
    const newPaths = [];
    for (let i = 0; i < MAP_CONFIG.length - 1; i++) {
      const startId = MAP_CONFIG[i].id;
      const endId = MAP_CONFIG[i + 1].id;
      
      const startEl = islandElementRefs.current[startId];
      const endEl = islandElementRefs.current[endId];
      
      if (startEl) {
        // Find the image wrapper inside the island div (for pure center)
        const startImgWrapper = startEl.querySelector('.island-img-wrapper');
        const endImgWrapper = endEl.querySelector('.island-img-wrapper');
        
        if (startImgWrapper && endImgWrapper) {
          const p1_fixed = {
             x: startEl.offsetLeft,
             y: startEl.offsetTop
          };
          const p2_fixed = {
             x: endEl.offsetLeft,
             y: endEl.offsetTop
          };

          newPaths.push({
            p1: p1_fixed,
            p2: p2_fixed,
            isDone: islands[startId]?.status === 'completed'
          });
        }
      }
    }
    setPaths(newPaths);
  };

  useLayoutEffect(() => {
    const timer = setTimeout(updatePaths, 300);
    let observer = null;
    
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(updatePaths);
      observer.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [islands]);

  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('.island-active');
      if (activeEl) {
         activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  const getIslandStyle = (status, orderIndex) => {
    switch (status) {
      case 'completed': return { opacity: 1, filter: 'none' };
      case 'active': return { opacity: 1, filter: 'none', transform: 'translateX(-50%) translateY(-50%) scale(1.15)' };
      case 'locked': return { opacity: 0.9, filter: 'none', transform: 'translateX(-50%) translateY(-50%)' };
      case 'fog': {
         const depth = Math.min(orderIndex * 1, 5);
         return { 
           opacity: Math.max(0.6 - depth * 0.1, 0.1), 
           filter: `blur(${Math.min(depth + 2, 6)}px)`,
           transform: 'translateX(-50%) translateY(-50%)'
         };
      }
      default: return { transform: 'translateX(-50%) translateY(-50%)' };
    }
  };

  const handleIslandClick = (id, status) => {
    if (status === 'completed' || status === 'active') {
      onSelectBuilding(id);
    } else if (status === 'locked') {
      const req = unlockRequirements[id];
      setSelectedLock({
        id,
        name: MAP_CONFIG.find(c => c.id === id)?.name || id,
        reqType: req.type,
        reqCount: req.count
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="relative w-full h-[100dvh] overflow-y-auto overflow-x-hidden overscroll-none bg-sky-300 select-none scrollbar-hide"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[60%] h-[40%] bg-indigo-600/20 blur-[150px] animate-pulse-soft" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[150px] animate-pulse-soft" style={{ animationDelay: '3s' }} />
      </div>

      {/* Cloud Substrate (Interscroller/Parallax) */}
      {/* Cloud Substrate (Interscroller/Parallax) */}
      <div 
        className="absolute inset-x-0 w-full pointer-events-none opacity-50 will-change-transform"
        style={{ 
          height: '3500px', 
          top: 0, 
          transform: `translateY(${-scrollTop * 0.5}px)`,
          backgroundImage: 'url(/img/cloud.webp)',
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% auto',
          zIndex: 1
        }}
      />

      <div 
        ref={scrollContentRef} 
        className="relative w-full h-[1900px] py-10 z-10"
      >
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          {paths.map((path, idx) => (
            <BezierPath key={`path-${idx}`} {...path} />
          ))}
        </svg>

        {MAP_CONFIG.map((config, idx) => {
          const islandData = islands[config.id] || { status: 'fog' };
          const status = islandData.status;
          const style = getIslandStyle(status, idx);
          
          return (
            <div 
              key={config.id}
              ref={el => islandElementRefs.current[config.id] = el}
              className={`absolute transition-all duration-700 island-node group`}
              style={{ ...style, left: config.left, top: config.top, zIndex: 10 + idx }}
              onClick={() => handleIslandClick(config.id, status)}
            >
               {/* Static Shadow on Clouds */}
               {status !== 'fog' && (
                 <div className="absolute left-1/2 -translate-x-1/2 bottom-[15px] z-[-1] pointer-events-none flex flex-col items-center justify-center">
                    <div className="absolute w-24 h-6 bg-black/80 blur-[8px] rounded-[100%]" />
                    <div className="absolute w-48 h-12 bg-slate-900/60 blur-xl rounded-[100%]" />
                 </div>
               )}

                {status === 'active' && <div className="island-glow scale-150 opacity-100 animate-pulse-soft" />}
               
                <div className="relative z-10 cursor-pointer flex flex-col items-center transition-all duration-500 hover:scale-[1.5] active:scale-95 group/island">
                   <div className={`island-img-wrapper transition-all duration-500 ${status !== 'fog' ? 'animate-float' : ''} group-hover/island:drop-shadow-[0_35px_60px_rgba(0,0,0,0.5)]`} style={{ animationDelay: `${idx * 0.5}s` }}>
                     <img 
                       src={config.icon} 
                       onLoad={updatePaths}
                       className={`w-[130px] h-[130px] object-contain transition-all duration-700
                         ${status === 'active' ? 'drop-shadow-[0_20px_50px_rgba(255,215,0,0.4)] scale-110' : 'drop-shadow-xl'}
                         ${status === 'fog' ? 'grayscale opacity-20' : ''}
                       `}
                       alt={config.name}
                     />
                     
                     {status === 'locked' && (
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-slate-900/60 shadow-xl backdrop-blur-md rounded-full w-12 h-12 border border-white/10 filter drop-shadow-md">
                         <span className="text-2xl pt-1">🔒</span>
                       </div>
                     )}
                   </div>
 
                    {/* Minimalist Premium Label */}
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 flex flex-col items-center gap-1 opacity-100 transition-all duration-500 pointer-events-none z-30 group-hover/island:translate-y-4 group-hover/island:scale-[0.75]">
                       <span className="text-[14px] font-black uppercase tracking-[0.3em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">
                         {t(`buildings.${config.id}`)}
                       </span>
                       
                       {status === 'active' && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                             <div className="w-1 h-1 bg-yellow-950 rounded-full animate-ping" />
                             <span className="text-[8px] font-black uppercase tracking-widest text-yellow-950">{t('picker.go')}</span>
                          </div>
                       )}
                       {status === 'completed' && (
                          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">{t('picker.enter')} ✨</span>
                       )}
                    </div>
                </div>
            </div>
          );
        })}
      </div>

      {selectedLock && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-md"
          onClick={() => setSelectedLock(null)}
        >
          <div 
            className="w-full sm:w-[500px] bg-slate-900 rounded-t-[40px] border-t border-white/10 shadow-full p-10 transform animate-slideUp text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-10" />
            
            <div className="text-center mb-8">
              <div className="text-6xl mb-6">🔒</div>
              <h3 className="text-3xl font-display font-extrabold mb-3 tracking-tight">
                {t?.('picker.locked_title') || 'ОСТРОВ ЗАБЛОКИРОВАН'}
              </h3>
              <p className="text-slate-400 font-medium">
                {t?.('picker.locked_desc', { name: t(`buildings.${selectedLock.id}`) }) || `Чтобы открыть ${selectedLock.name}, нужно решить ещё несколько задач`}
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-[32px] p-8 mb-10 border border-white/5">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t?.('hud.progress') || 'Прогресс'}</span>
                  <span className="text-sm font-bold text-indigo-400">{totalSolved} / {selectedLock.reqCount}</span>
               </div>
               <div className="bg-slate-900 rounded-full h-3 overflow-hidden border border-white/5">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                    style={{ width: `${Math.min((totalSolved / selectedLock.reqCount) * 100, 100)}%` }} 
                  />
               </div>
            </div>

            <button 
              onClick={() => setSelectedLock(null)}
              className="btn-premium w-full text-lg uppercase tracking-wider"
            >
              {t?.('picker.locked_ok') || 'ПРИНЯТО! ✨'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
