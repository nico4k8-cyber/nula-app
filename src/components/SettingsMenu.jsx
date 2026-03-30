export default function SettingsMenu({ 
  isOpen, 
  onClose, 
  onResetProgress, 
  completedTasks, 
  audio, 
  audioTracks, 
  lang, 
  setLang, 
  t 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[32px] p-6 pb-12 flex flex-col gap-5 shadow-2xl animate-fade-in-up">
        {/* Grabbable handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto -mt-2 mb-2" />
        
        <div className="text-center">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('menu')}</h3>
        </div>

        <div className="flex flex-col gap-3">
          {/* Language Toggle */}
          <button onClick={() => { setLang(lang === 'ru' ? 'en' : 'ru'); }}
            className="w-full text-left px-5 py-4 rounded-[20px] bg-gray-50 border border-transparent hover:border-blue-100 flex items-center gap-4 transition-all active:scale-[0.98]"
          >
            <span className="text-2xl">🌎</span>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-[16px]">{t('language')}</div>
              <div className="text-gray-500 text-[13px] font-medium">
                {lang === 'ru' ? "🇷🇺 Русский" : "🇺🇸 English"}
              </div>
            </div>
            <span className="text-gray-300">›</span>
          </button>

          {/* Audio toggle */}
          <button onClick={() => { audio.toggle(); }}
            className="w-full text-left px-5 py-4 rounded-[20px] bg-gray-50 border border-transparent hover:border-orange-100 flex items-center gap-4 transition-all active:scale-[0.98]"
          >
            <span className="text-2xl">{audio.isEnabled ? "🔊" : "🔇"}</span>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-[16px]">{t('music')}</div>
              <div className="text-gray-500 text-[13px] font-medium">
                {audio.isEnabled ? t('on') : t('off')}
              </div>
            </div>
            <span className="text-gray-300">›</span>
          </button>

          {/* Track selection (Simplified for one track) */}
          {audio.isEnabled && audioTracks.length > 1 && (
            <div className="px-5 py-4 rounded-[20px] bg-indigo-50 border border-indigo-100 flex flex-col gap-3">
              <div className="text-[13px] font-bold text-indigo-700 flex items-center gap-2">
                🎵 {audio.currentTrack?.name || "Загрузка..."}
              </div>
              <div className="flex items-center gap-2 justify-between">
                <button onClick={() => audio.prevTrack()}
                  className="flex-1 py-2.5 px-3 rounded-[12px] bg-white border border-indigo-200 text-[13px] font-bold text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-all"
                >
                  ←
                </button>
                <div className="text-[12px] font-black text-indigo-300 px-3">
                  {audio.currentTrackIndex + 1}/{audioTracks.length}
                </div>
                <button onClick={() => audio.nextTrack()}
                  className="flex-1 py-2.5 px-3 rounded-[12px] bg-white border border-indigo-200 text-[13px] font-bold text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-all"
                >
                  →
                </button>
              </div>
            </div>
          )}

          {/* Archipelago Button (Reset or Back to Map) */}
          <button onClick={() => {
            window.__openCity = true;
            onClose();
          }}
            className="w-full text-left px-5 py-4 rounded-[20px] bg-slate-900 text-white flex items-center gap-4 transition-all active:scale-[0.98]"
          >
            <span className="text-2xl">🗺️</span>
            <div className="flex-1">
              <div className="font-bold text-[16px]">Карта Мира</div>
              <div className="text-white/60 text-[12px]">Вернуться к островам</div>
            </div>
            <span className="text-white/30">›</span>
          </button>

          <hr className="my-2 border-gray-100" />

          {/* Danger Zone: Reset Progress */}
          <button onClick={() => {
            if (confirm("Вы уверены? Весь прогресс и звёзды будут удалены.")) {
               onResetProgress();
               onClose();
            }
          }}
            className="w-full text-center py-4 rounded-[18px] text-red-500 font-bold text-[14px] hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
          >
            Сбросить весь прогресс
          </button>
        </div>
      </div>
    </div>
  );
}
