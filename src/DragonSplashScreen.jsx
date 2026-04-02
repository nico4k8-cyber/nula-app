import { useState, useEffect } from "react";

const ASSETS_TO_PRELOAD = [
  "/assets/webm/main_island.webm",
  "/assets/webm/island_zapovednik.webm",
  "/assets/webm/island_laboratory.webm",
  "/assets/webm/island_tsar.webm",
  "/assets/webm/avatar.webm",
  "/assets/library.png",
  "/assets/city-hall.png",
  "/assets/workshop.png",
  "/assets/laboratory.png",
  "/assets/nature-reserve.png",
  "/img/ugolok_3d.png",
  "/img/splash_bg.png",
  "/img/cloud.png"
];

export default function DragonSplashScreen({ onAnimationEnd, t }) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let loadedCount = 0;
    const total = ASSETS_TO_PRELOAD.length;

    const minTimePromise = new Promise(resolve => setTimeout(resolve, 2000));
    
    const assetPromises = ASSETS_TO_PRELOAD.map(url => {
      const isVideo = url.endsWith('.webm');
      return new Promise((resolve) => {
        if (isVideo) {
          fetch(url).then(() => {
            loadedCount++;
            setProgress(Math.round((loadedCount / total) * 100));
            resolve();
          }).catch(resolve);
        } else {
          const img = new Image();
          img.src = url;
          img.onload = () => {
            loadedCount++;
            setProgress(Math.round((loadedCount / total) * 100));
            resolve();
          };
          img.onerror = resolve;
        }
      });
    });

    Promise.all([...assetPromises, minTimePromise]).then(() => {
      setProgress(100);
      setTimeout(() => {
        setIsDone(true);
        onAnimationEnd?.();
      }, 500);
    });
  }, [onAnimationEnd]);

  return (
    <div className={`splash-container ${isDone ? 'fade-out' : ''}`}>
      <img className="splash-bg" src="/img/splash_bg.png" alt="Archipelago" />
      <div className="splash-overlay" />
      
      <div className="splash-content">
        <h1 className="splash-title">SHARIEL</h1>
        <p className="splash-subtitle">
          {t('title')}
        </p>
        
        {/* Progress Bar Container */}
        <div className="progress-wrapper">
           <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress}%` }} 
              />
           </div>
           <p className="progress-text">
              {progress < 100 ? `${t('lang') === 'ru' ? 'Загрузка мира...' : 'Loading world...'} ${progress}%` : (t('lang') === 'ru' ? 'Готово!' : 'Ready!')}
           </p>
        </div>
      </div>

      <style>{`
        .splash-container {
          width: 100vw;
          height: 100vh;
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 12vh;
          overflow: hidden;
          background: black;
          z-index: 9999;
          transition: opacity 0.8s ease-out;
        }

        .splash-container.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        .splash-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          animation: slow-zoom 20s linear infinite alternate;
        }

        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }

        .splash-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.1) 0%,
            rgba(0,0,0,0) 40%,
            rgba(0,0,0,0.5) 75%,
            rgba(0,0,0,0.85) 100%
          );
        }

        .splash-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          width: 100%;
          padding: 0 5vw;
          animation: slide-up 1s ease-out 0.3s both;
        }

        .splash-title {
          font-family: Georgia, serif;
          font-weight: 900;
          font-size: clamp(48px, 12vw, 140px);
          color: #FFD700;
          letter-spacing: clamp(4px, 1.5vw, 16px);
          line-height: 1;
          text-align: center;
          text-shadow:
            0 0 50px rgba(255,180,0,0.4),
            2px 2px 0 #7a5500;
          margin-bottom: 12px;
        }

        .splash-subtitle {
          font-family: Georgia, serif;
          font-weight: 400;
          font-size: clamp(12px, 2.5vw, 32px);
          color: rgba(255,255,255,0.8);
          letter-spacing: 4px;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 40px;
        }

        .progress-wrapper {
           width: 100%;
           max-width: 280px;
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 12px;
        }

        .progress-bar-bg {
           width: 100%;
           height: 8px;
           background: rgba(255,255,255,0.1);
           border-radius: 10px;
           overflow: hidden;
           border: 1px solid rgba(255,255,255,0.1);
        }

        .progress-bar-fill {
           height: 100%;
           background: linear-gradient(90deg, #FFD700, #FFA500);
           box-shadow: 0 0 15px rgba(255,215,0,0.6);
           transition: width 0.3s ease-out;
           border-radius: 10px;
        }

        .progress-text {
           color: rgba(255,255,255,0.5);
           font-size: 10px;
           font-weight: 900;
           text-transform: uppercase;
           letter-spacing: 2px;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .splash-bg { object-position: 65% center; }
        }
      `}</style>
    </div>
  );
}
