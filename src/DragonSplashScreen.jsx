import { useState, useEffect, useRef } from "react";

export default function DragonSplashScreen({ onAnimationEnd }) {
  const [offsetX, setOffsetX] = useState(0);
  const audioRef = useRef(null);
  const touchStartX = useRef(0);
  const lastSwipeTime = useRef(0);

  // Simple splash: show first frame for 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => onAnimationEnd?.(), 3000);
    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  // Музыка - размучить при первом взаимодействии
  useEffect(() => {
    const handleUnmute = () => {
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
      document.removeEventListener('touchstart', handleUnmute);
      document.removeEventListener('click', handleUnmute);
    };
    document.addEventListener('touchstart', handleUnmute);
    document.addEventListener('click', handleUnmute);
    return () => {
      document.removeEventListener('touchstart', handleUnmute);
      document.removeEventListener('click', handleUnmute);
    };
  }, []);

  // Обработка свайпов (влево-вправо)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;

    // Ограничиваем смещение (максимум 50px в каждую сторону)
    if (diff > 0) {
      setOffsetX(Math.min(diff, 50));
    } else {
      setOffsetX(Math.max(diff, -50));
    }
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX.current;
    const now = Date.now();

    // Если свайп был быстрый и значительный
    if (Math.abs(diff) > 30 && now - lastSwipeTime.current > 500) {
      lastSwipeTime.current = now;

      // Влево — переходим вперёд на кадры
      if (diff < 0) {
        setCurrentFrame((prev) => Math.min(prev + 5, TOTAL_FRAMES - 1));
      }
      // Вправо — назад на кадры
      else {
        setCurrentFrame((prev) => Math.max(prev - 5, 0));
      }
    }

    touchStartX.current = 0;
    setOffsetX(0);
  };

  // Вычисляем номер кадра (от 001 до 240)
  const frameUrl = `/dragon/ezgif-frame-001.jpg`; // Always show first frame

  // Трансформация дракона в зависимости от свайпа
  const dragonStyle = {
    transform: `translateX(${offsetX}px) scaleX(${offsetX > 0 ? -1 : 1})`,
    transition: offsetX === 0 ? "transform 0.3s ease-out" : "none",
  };

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden flex flex-col items-center justify-center cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Анимация дракона - заполняет весь экран, центрирована */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <img
          src={frameUrl}
          alt="Dragon animation"
          className="w-full h-full object-cover"
          style={dragonStyle}
        />

        {/* Индикатор прогресса анимации */}

      </div>

      {/* Музыка */}
      <audio
        ref={audioRef}
        src="/audio/dragon-flying.mp3"
        autoPlay
        muted
        loop
        crossOrigin="anonymous"
      />


      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
