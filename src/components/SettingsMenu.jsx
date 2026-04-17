import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export default function SettingsMenu({
  isOpen,
  onClose,
  onResetProgress,
  onStartOnboarding,
  onShowParentView,
  onShowPaywall,
  completedTasks,
  audio,
  audioTracks,
  lang,
  setLang,
  t
}) {
  const { user, setUser } = useGameStore();

  const handleNameChange = (e) => {
    if (setUser) {
      setUser({ ...user, name: e.target.value });
    }
  };


  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) alert("Ошибка входа: " + error.message);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-[48px] p-8 pb-12 flex flex-col gap-6 shadow-2xl animate-fade-in-up border-t border-slate-100 max-h-[90dvh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto -mt-4 mb-2" />
        
        <div className="flex flex-col gap-4">
          {!user ? (
            <button
              onClick={handleLogin}
              className="w-full group flex items-center gap-4 bg-orange-500 hover:bg-orange-600 active:translate-y-0.5 rounded-[28px] px-6 py-5 shadow-lg shadow-orange-900/30 border-b-4 border-orange-700 active:border-b-0 transition-all"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">☁️</div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-black text-[16px] uppercase tracking-tight leading-tight">{t('save_progress')}</h3>
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-0.5">{t('login_google')}</p>
              </div>
              <span className="text-white/50 text-xl group-hover:translate-x-1 transition-transform">→</span>
            </button>
          ) : (
            <div className="w-full bg-emerald-50 p-6 rounded-[32px] border-2 border-emerald-100 flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
                👤
              </div>
              <div className="flex-1 text-left flex flex-col justify-center">
                 <input 
                    type="text" 
                    value={user?.name || ""} 
                    onChange={handleNameChange}
                    className="bg-transparent font-black text-lg uppercase tracking-tight text-slate-900 outline-none w-full placeholder-slate-400"
                    placeholder={t('hud.guest')}
                 />
                 <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">{t('cloud_sync')}</p>
              </div>
              <button 
                onClick={() => { 
                  if(confirm("Выйти?")) {
                     localStorage.removeItem('nula-game-storage');
                     supabase.auth.signOut().then(() => window.location.reload()); 
                  }
                }}
                className="w-10 h-10 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
              >
                🚪
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => audio.toggle()}
              className="p-6 rounded-[28px] bg-slate-50 border-2 border-transparent hover:border-indigo-100 flex flex-col items-center gap-2 transition-all active:scale-95 group"
            >
              <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                {audio.isEnabled ? "🔊" : "🔇"}
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{t('music')}</span>
            </button>

            <button 
              onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
              className="p-6 rounded-[28px] bg-slate-50 border-2 border-transparent hover:border-indigo-100 flex flex-col items-center gap-2 transition-all active:scale-95 group"
            >
              <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🌎</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{t('language')}: {lang.toUpperCase()}</span>
            </button>
          </div>

          <button
            onClick={() => { window.__openCity = true; onClose(); }}
            className="w-full group flex items-center gap-4 bg-orange-500 hover:bg-orange-600 active:translate-y-0.5 rounded-[28px] px-6 py-5 shadow-lg shadow-orange-900/30 border-b-4 border-orange-700 active:border-b-0 transition-all"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">🗺️</div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-black text-[16px] uppercase tracking-tight leading-tight">{t('world_map')}</h3>
              <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-0.5">{t('back_to_islands')}</p>
            </div>
            <span className="text-white/50 text-xl group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <a
            href="https://t.me/triz_train_bot?start=reminders"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 font-semibold text-sm active:scale-95 transition-all"
          >
            <span className="text-xl">📬</span>
            <span>Напоминания в Telegram</span>
            <span className="ml-auto text-blue-400">→</span>
          </a>

          {onShowPaywall && (
            <button onClick={() => { onShowPaywall(); }}
              className="w-full group flex items-center gap-4 bg-emerald-500 hover:bg-emerald-600 active:translate-y-0.5 rounded-[28px] px-6 py-5 shadow-lg shadow-emerald-900/30 border-b-4 border-emerald-700 active:border-b-0 transition-all"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">💎</div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-black text-[16px] uppercase tracking-tight leading-tight">Полный доступ</h3>
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-0.5">Демо · попробуй бесплатно</p>
              </div>
              <span className="text-white/50 text-xl group-hover:translate-x-1 transition-transform">→</span>
            </button>
          )}

          {onShowParentView && (
            <button onClick={() => { onShowParentView(); }}
              className="w-full group flex items-center gap-4 bg-indigo-500 hover:bg-indigo-600 active:translate-y-0.5 rounded-[28px] px-6 py-5 shadow-lg shadow-indigo-900/30 border-b-4 border-indigo-700 active:border-b-0 transition-all"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">🏆</div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-black text-[16px] uppercase tracking-tight leading-tight">Мой прогресс</h3>
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-0.5">Звёзды и достижения</p>
              </div>
              <span className="text-white/50 text-xl group-hover:translate-x-1 transition-transform">→</span>
            </button>
          )}

          {onStartOnboarding && (
            <button onClick={() => { onStartOnboarding(); onClose(); }}
              className="w-full text-center py-4 text-slate-500 font-black text-[12px] uppercase tracking-widest hover:text-slate-400 transition-all mt-2 border-2 border-slate-200 rounded-2xl"
            >
              🧭 Показать подсказки (онбординг)
            </button>
          )}

          {user?.email === "k.sunstroke@gmail.com" && (
            <button onClick={() => { window.__openAdmin = true; onClose(); }}
              className="w-full text-center py-4 text-indigo-400 font-black text-[12px] uppercase tracking-widest hover:text-indigo-300 transition-all mt-4 border-2 border-indigo-900/10 rounded-2xl"
            >
              🛠️ Админка задач
            </button>
          )}

          <button onClick={() => {
            if (confirm("Вы уверены? Весь прогресс и звёзды будут удалены.")) {
               onResetProgress();
               onClose();
               // Полная очистка localStorage — иначе hasSeenOnboarding остаётся и сплэш пропускается
               localStorage.removeItem('nula-game-storage');    // Zustand store
               localStorage.removeItem('razgadai_v1');         // App global state (hasSeenOnboarding etc)
               localStorage.removeItem('razgadai_triz_state'); // TRIZ state
               localStorage.removeItem('razgadai_user_id');
               localStorage.removeItem('razgadai_session_id');
               localStorage.removeItem('nula-onboarding-done');
               localStorage.removeItem('nula-last-visit');
               setTimeout(() => window.location.reload(), 300);
            }
          }}
            className="w-full text-center py-4 text-slate-300 font-bold text-[12px] uppercase tracking-widest hover:text-red-500 transition-all mt-4"
          >
            {t('reset_all')}
          </button>
        </div>
      </div>
    </div>
  );
}
