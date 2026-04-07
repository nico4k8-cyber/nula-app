import React, { useState, useEffect } from 'react';
import { trackEvent, EVENTS } from '../analytics';
import { supabase } from '../lib/supabase';

const RETURN_PHASE_KEY = 'nula-auth-return-phase';

export function saveReturnPhase(phase) {
  try { localStorage.setItem(RETURN_PHASE_KEY, phase); } catch {}
}

export function popReturnPhase() {
  try {
    const p = localStorage.getItem(RETURN_PHASE_KEY);
    localStorage.removeItem(RETURN_PHASE_KEY);
    return p;
  } catch { return null; }
}

export default function AuthScreen({ onGuest, returnPhase }) {
  const [loading, setLoading] = useState(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [country, setCountry] = useState(null); // null=loading, 'RU'=russia, else=outside

  // Save return phase (for Google OAuth redirect only)
  useEffect(() => {
    if (returnPhase) saveReturnPhase(returnPhase);
  }, [returnPhase]);

  // Detect country
  useEffect(() => {
    fetch('/api/geo')
      .then(r => r.json())
      .then(d => setCountry(d.country || 'XX'))
      .catch(() => setCountry('XX'));
  }, []);

  const showGoogle = country !== null && country !== 'RU';

  // Step 1: send OTP code (no redirect — user stays on the page)
  const handleSendCode = async () => {
    if (!email.includes('@')) return;
    setLoading('email');
    trackEvent(EVENTS.AUTH_STARTED, { provider: 'email' });
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
        // No emailRedirectTo → Supabase sends a 6-digit code
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setLoading(null);
    }
  };

  // Step 2: verify 6-digit code
  const handleVerifyCode = async () => {
    if (code.length < 6) return;
    setLoading('verify');
    setCodeError('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: 'email',
      });
      if (error) throw error;
      // onAuthStateChange in App.jsx will handle the rest
    } catch (err) {
      setCodeError('Неверный код. Попробуй ещё раз или запроси новый.');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading('google');
    trackEvent(EVENTS.AUTH_STARTED, { provider: 'google' });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      alert('Ошибка: ' + err.message);
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-sky-400 px-6 py-10 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/30 blur-[120px] animate-pulse-soft" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="w-32 h-32 mb-4 relative flex items-center justify-center">
          <img src="/assets/webp/avatar.webp"
            className="w-full h-full object-contain relative z-10"
            alt="Орин" />
          <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full animate-pulse" />
        </div>

        <h1 className="text-4xl text-white mb-1 text-center font-black tracking-tighter">SHARIEL</h1>
        <p className="text-slate-800 text-center mb-6 font-medium text-sm leading-relaxed max-w-[260px]">
          Сохрани прогресс — и продолжай с любого устройства
        </p>

        <div className="w-full space-y-3">
          {/* Email OTP — stays on same page, no redirect */}
          {!sent ? (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-2 shadow-2xl flex flex-col gap-2 border border-white">
              <input
                type="email"
                placeholder="Твой email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                className="w-full px-5 py-3.5 rounded-2xl bg-white/60 border-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-800 transition-all outline-none text-[16px]"
              />
              <button
                onClick={handleSendCode}
                disabled={!!loading || !email.includes('@')}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl flex items-center justify-center font-black text-[15px] transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg gap-2"
              >
                {loading === 'email'
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>✉️</span> Получить код на почту</>}
              </button>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-2xl flex flex-col gap-3 border border-white">
              <div className="text-center pt-2">
                <div className="text-3xl mb-1">✉️</div>
                <p className="font-black text-slate-800 text-sm">Код отправлен на {email}</p>
                <p className="text-slate-500 text-xs mt-0.5">Введи 6-значный код из письма</p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setCodeError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-sky-200 focus:border-sky-500 font-black text-slate-800 text-center text-2xl tracking-[0.5em] outline-none transition-all"
                autoFocus
              />
              {codeError && <p className="text-red-500 text-xs text-center font-bold">{codeError}</p>}
              <button
                onClick={handleVerifyCode}
                disabled={!!loading || code.length < 6}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl flex items-center justify-center font-black text-[15px] transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg gap-2"
              >
                {loading === 'verify'
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>Войти →</>}
              </button>
              <button onClick={() => setSent(false)} className="text-slate-400 text-xs text-center hover:text-slate-600 transition-colors">
                ← Изменить email
              </button>
            </div>
          )}

          {/* Google — only outside Russia */}
          {showGoogle && (
            <button
              onClick={handleGoogle}
              disabled={!!loading}
              className="w-full h-14 bg-white rounded-3xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50"
            >
              {loading === 'google' ? (
                <div className="w-5 h-5 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span className="text-slate-700 font-bold text-[16px]">Войти через Google</span>
                </>
              )}
            </button>
          )}

          {/* Geo loading placeholder */}
          {country === null && (
            <div className="h-14 bg-white/30 rounded-3xl animate-pulse" />
          )}

          <div className="flex items-center gap-4 py-1 opacity-40">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">или</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <button
            onClick={onGuest}
            className="w-full py-3.5 text-sky-700 font-black uppercase text-[12px] tracking-[0.2em] transition-all hover:text-sky-800 active:scale-95"
          >
            Продолжить без сохранения →
          </button>
        </div>

        <p className="mt-6 text-[10px] text-sky-800/50 text-center leading-relaxed max-w-[240px] font-bold">
          Нажимая, вы принимаете Пользовательское соглашение и Политику конфиденциальности
        </p>
      </div>
    </div>
  );
}
