import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

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
  const { user } = useGameStore();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) alert("Ошибка входа: " + error.message);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[48px] p-8 pb-12 flex flex-col gap-6 shadow-2xl animate-fade-in-up border-t border-slate-100">
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto -mt-4 mb-2" />
        
        <div className="flex flex-col gap-4">
          {!user ? (
            <button 
              onClick={handleLogin}
              className="w-full bg-indigo-600 p-6 rounded-[32px] flex items-center gap-6 group transition-all active:scale-95 shadow-lg hover:shadow-indigo-200"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                ☁️
              </div>
              <div className="flex-1 text-left">
                 <h3 className="text-white font-black text-lg uppercase tracking-tight">{t('save_progress')}</h3>
                 <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{t('login_google')}</p>
              </div>
              <span className="text-white/40 text-2xl group-hover:translate-x-2 transition-transform">→</span>
            </button>
          ) : (
            <div className="w-full bg-emerald-50 p-6 rounded-[32px] border-2 border-emerald-100 flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
                👤
              </div>
              <div className="flex-1 text-left">
                 <h3 className="text-slate-900 font-black text-lg uppercase tracking-tight">{user.name || t('hud.guest')}</h3>
                 <p className="text-emerald-600 text-xs font-black uppercase tracking-widest">{t('cloud_sync')}</p>
              </div>
              <button 
                onClick={() => { if(confirm("Выйти?")) supabase.auth.signOut().then(() => window.location.reload()); }}
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

          <button onClick={() => { window.__openCity = true; onClose(); }}
            className="w-full text-left px-8 py-6 rounded-[32px] bg-slate-900 text-white flex items-center gap-6 transition-all active:scale-[0.98] group"
          >
            <span className="text-3xl transition-transform group-hover:scale-110">🗺️</span>
            <div className="flex-1">
              <h3 className="font-black text-[18px] uppercase tracking-tight">{t('world_map')}</h3>
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">{t('back_to_islands')}</p>
            </div>
            <span className="text-white/20 text-2xl group-hover:translate-x-2 transition-transform">→</span>
          </button>

          <button onClick={() => { window.__openAdmin = true; onClose(); }}
            className="w-full text-center py-4 text-indigo-400 font-black text-[12px] uppercase tracking-widest hover:text-indigo-300 transition-all mt-4 border-2 border-indigo-900/10 rounded-2xl"
          >
            🛠️ Админка задач
          </button>

          <button onClick={() => {
            if (confirm("Вы уверены? Весь прогресс и звёзды будут удалены.")) {
               onResetProgress();
               onClose();
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
