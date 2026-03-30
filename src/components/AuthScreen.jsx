import React, { useState } from 'react';
import { trackEvent, EVENTS } from '../analytics';
import { supabase } from '../lib/supabase';

export default function AuthScreen({ onLogin, onGuest }) {
  const [loading, setLoading] = useState(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleLogin = async (provider) => {
    setLoading(provider);
    trackEvent(EVENTS.AUTH_STARTED, { provider });
    
    try {
      if (provider === 'email') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Login error:', error.message);
      alert('Ошибка при входе: ' + error.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-sky-400 px-6 py-10 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/30 blur-[120px] animate-pulse-soft" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo/Icon */}
        <div className="w-48 h-48 mb-6 relative flex items-center justify-center">
          <video 
            src="/assets/webm/avatar.webm" 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-contain animate-float relative z-10"
          />
          {/* Subtle glow behind the mascot instead of a hard plate */}
          <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full animate-pulse" />
        </div>

        <h1 className="text-4xl text-white mb-2 text-center font-black tracking-tighter">SHARIEL</h1>
        <p className="text-slate-800 text-center mb-8 font-medium text-sm leading-relaxed max-w-[280px]">
          Твоё путешествие в мир нестандартных идей начинается здесь. Решай задачи и становись мастером открытий.
        </p>

        <div className="w-full space-y-4">
          {!sent ? (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-2 shadow-2xl flex flex-col gap-2 border border-white">
               <input 
                 type="email" 
                 placeholder="Твой почтовый адрес"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full h-14 px-5 rounded-2xl bg-white/50 border-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-800 transition-all outline-none"
               />
               <button 
                 onClick={() => handleLogin('email')}
                 disabled={loading || !email.includes('@')}
                 className="w-full h-14 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl flex items-center justify-center font-black text-lg transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-sky-200"
               >
                 {loading === 'email' ? (
                   <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : "ВОЙТИ ПО ПОЧТЕ →"}
               </button>
            </div>
          ) : (
            <div className="bg-emerald-500 rounded-3xl p-6 text-center text-white shadow-xl animate-scale-in">
              <div className="text-4xl mb-3">✉️</div>
              <p className="font-bold text-lg leading-tight mb-2">Ссылка отправлена!</p>
              <p className="text-white/80 text-sm">Загляни в почту {email} и нажми на кнопку в письме.</p>
            </div>
          )}

          <button 
            onClick={() => handleLogin('google')}
            disabled={loading}
            className="w-full h-16 bg-white rounded-3xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md border-2 border-white disabled:opacity-50"
          >
            {loading === 'google' ? (
              <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span className="text-slate-700 font-bold text-[17px]">Войти через Google</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-4 py-2 opacity-50">
            <div className="h-[1px] flex-1 bg-slate-800" />
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">или</span>
            <div className="h-[1px] flex-1 bg-slate-800" />
          </div>

          <button 
            onClick={onGuest}
            className="w-full py-4 text-sky-700 font-black uppercase text-[12px] tracking-[0.2em] transition-all hover:text-sky-800 active:scale-95"
          >
            Продолжить без регистрации →
          </button>
        </div>

        <p className="mt-8 text-[10px] text-sky-800/60 text-center leading-relaxed max-w-[240px] font-bold">
          Нажимая кнопку, вы принимаете <br />
          Пользовательское соглашение и Политику конфиденциальности
        </p>
      </div>
    </div>
  );
}
