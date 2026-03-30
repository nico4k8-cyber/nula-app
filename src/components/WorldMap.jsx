import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';

const MAP_CONFIG = [
  { id: 'main', name: 'Главный остров', left: '45%', top: 250, icon: '/assets/webm/main_island.webm' },
  { id: 'craft', name: 'Заповедник', left: '30%', top: 650, icon: '/assets/webm/island_zapovednik.webm' },
  { id: 'science', name: 'Остров Науки', left: '60%', top: 1050, icon: '/assets/webm/island_laboratory.webm' },
  { id: 'summit', name: 'Пик Изобретателей', left: '40%', top: 1450, icon: '/assets/webm/island_tsar.webm' },
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

export default function WorldMap({ islands, unlockRequirements, totalSolved, onSelectBuilding }) {
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
    const observer = new ResizeObserver(updatePaths);
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
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
      className="relative w-full h-[calc(100vh-80px)] overflow-y-auto bg-sky-300 select-none scrollbar-hide"
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
          backgroundImage: 'url(/img/cloud.png)',
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

               {status === 'active' && <div className="island-glow scale-150 opacity-40 animate-pulse-soft" />}
               
               <div className="relative z-10 transition-transform active:scale-95 duration-200 cursor-pointer flex flex-col items-center">
                  <div className={`island-img-wrapper ${status !== 'fog' ? 'animate-float' : ''}`} style={{ animationDelay: `${idx * 0.5}s` }}>
                    <video 
                      src={config.icon} 
                      autoPlay 
                      muted 
                      loop 
                      playsInline
                      onLoadedData={updatePaths}
                      className={`w-[140px] h-[140px] object-contain transition-all duration-500 cursor-pointer
                        ${status === 'active' ? 'drop-shadow-[0_20px_40px_rgba(79,70,229,0.3)] scale-110' : 'drop-shadow-lg'}
                        ${status === 'fog' ? 'grayscale opacity-20 text-slate-800' : ''}
                        hover:scale-150 active:scale-125 hover:z-50
                      `}
                    />
                    
                    {status === 'locked' && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] rounded-full scale-50 border border-white/10 shadow-2xl">
                        <span className="text-3xl filter drop-shadow-md">🔒</span>
                      </div>
                    )}
                  </div>

                   {/* Island Tooltip/Label on Hover */}
                   <div className={`mt-2 whitespace-nowrap px-6 py-2 rounded-full shadow-2xl border backdrop-blur-md z-20 font-display font-extrabold uppercase tracking-widest text-[11px] transition-all duration-300
                     opacity-0 group-hover:opacity-100 group-hover:translate-y-[-10px] pointer-events-none
                     ${status === 'completed' ? 'bg-emerald-500/90 text-white border-emerald-300/50' : ''}
                     ${status === 'active' ? 'bg-indigo-600/90 text-white border-indigo-400/50' : ''}
                     ${status === 'locked' ? 'bg-slate-800/80 text-slate-400 border-slate-700/50' : ''}
                   `}>
                     {status === 'completed' ? `✓ ${config.name}` : config.name}
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
                ОСТРОВ ЗАБЛОКИРОВАН
              </h3>
              <p className="text-slate-400 font-medium">
                Чтобы открыть <span className="text-indigo-400">{selectedLock.name}</span>, <br/>нужно решить ещё несколько задач
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-[32px] p-8 mb-10 border border-white/5">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Прогресс</span>
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
              ПРИНЯТО! ✨
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
