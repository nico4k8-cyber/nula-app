import React, { useState, useEffect } from 'react';
import { trackEvent, EVENTS } from '../analytics';
import { useGameStore } from '../store/gameStore';

const PERKS = [
  { icon: '♾️', text: 'Безлимитные задачи каждый день' },
  { icon: '🏝️', text: 'Все 4 острова и новые каждый месяц' },
  { icon: '🔬', text: 'Лаборатория, Бредогенератор, Царь-гора' },
  { icon: '🏆', text: 'Патентная копилка изобретений' },
  { icon: '📊', text: 'Прогресс-отчёт для родителей' },
  { icon: '🧊', text: 'Заморозка серии — пропусти день без потери серии' },
];

const PLANS = [
  {
    id: 'year',
    label: 'Годовой',
    badge: 'ВЫГОДНЕЕ НА 60%',
    price: '199 ₽ / мес',
    sub: '2 388 ₽ / год · отмена в любой момент',
    highlight: true,
  },
  {
    id: 'month',
    label: 'Месячный',
    badge: null,
    price: '499 ₽ / мес',
    sub: 'Отмена в любой момент',
    highlight: false,
  },
];

function GateScreen({ onSubmit, onCancel, task }) {
  const [answer, setAnswer] = useState('');
  return (
    <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
      <div className="text-5xl mb-6">👨‍👩‍👧‍👦</div>
      <h2 className="text-2xl font-bold mb-2">Демо-активация</h2>
      <p className="text-slate-400 mb-8">Реши пример, чтобы получить демо-доступ:</p>
      <div className="w-full bg-slate-800 rounded-3xl p-8 border border-white/5 shadow-2xl">
        <div className="text-4xl font-bold mb-6 text-indigo-400">{task.q} = ?</div>
        <input
          type="number" value={answer}
          onChange={e => setAnswer(e.target.value)}
          autoFocus
          className="w-full bg-slate-900 border-2 border-indigo-500/30 rounded-xl px-6 py-4 text-2xl text-center text-white outline-none focus:border-indigo-500 transition-all mb-6"
        />
        <button onClick={() => onSubmit(parseInt(answer))}
          className="w-full h-14 bg-indigo-600 rounded-xl font-bold text-lg active:scale-95 transition-all">
          Подтвердить
        </button>
        <button onClick={onCancel} className="w-full mt-4 text-slate-500 font-bold">Отмена</button>
      </div>
    </div>
  );
}

export default function Paywall({ onSelectPlan, onBack, onDonate, userId, userEmail, isPromo = false }) {
  const [gateOpen, setGateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mathTask = { q: '24 + 18', a: 42 };
  const [pendingPlan, setPendingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(isPromo ? 'promo' : 'year');

  useEffect(() => {
    trackEvent(isPromo ? EVENTS.PROMO_SHOWN : EVENTS.PAYWALL_SHOWN, { isPromo });
  }, []);

  async function handlePlanClick(planId) {
    trackEvent(EVENTS.PAYWALL_CTA_CLICKED, { plan: planId, isPromo });
    setPendingPlan(planId);
    setGateOpen(true);
    trackEvent(EVENTS.PAYWALL_GATE_SHOWN, { plan: planId });
  }

  async function handleGateSubmit(val) {
    if (val !== mathTask.a) {
      alert('Неправильно. Попробуй ещё раз!');
      return;
    }
    trackEvent(EVENTS.PAYWALL_GATE_PASSED, { plan: pendingPlan });
    setGateOpen(false);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_payment',
          planId: pendingPlan,
          userId,
          userEmail,
          returnUrl: window.location.origin + '/?payment=success',
        }),
      });
      const data = await res.json();

      if (data.mock) {
        // Dev mode — simulate success
        useGameStore.getState().addStreakFreeze(3);
        onSelectPlan(pendingPlan);
        return;
      }

      if (data.confirmation_url) {
        trackEvent(EVENTS.PAYWALL_REDIRECT, { plan: pendingPlan, mock: !!data.mock });
        window.location.href = data.confirmation_url;
      } else {
        throw new Error(data.error || 'Ошибка оплаты');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const displayPlans = isPromo
    ? [{ id: 'promo', label: 'Первый месяц', badge: '🎁 СКИДКА 80%', price: '99 ₽', sub: 'Затем 499 ₽/мес · отмена в любой момент', highlight: true }, ...PLANS.slice(1)]
    : PLANS;

  return (
    <div className="flex flex-col flex-1 px-6 py-10 items-center justify-start bg-slate-900 text-white animate-fade-in relative overflow-hidden h-full overflow-y-auto">
      <div className="absolute top-0 right-0 w-[80%] h-[25%] bg-indigo-600/20 blur-[130px] pointer-events-none" />

      {/* Demo mode banner */}
      <div className="relative z-10 w-full max-w-sm mb-4">
        <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🧪</span>
          <div>
            <p className="text-amber-300 font-black text-[13px] uppercase tracking-wide">Демо-режим</p>
            <p className="text-amber-200/70 text-[11px] leading-snug">Оплата не нужна — это тестовый доступ. Реальная оплата появится позже.</p>
          </div>
        </div>
      </div>

      {!gateOpen ? (
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center pt-4 pb-20">
          {/* Hero */}
          <div className="w-20 h-20 mb-5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
            <span className="text-4xl">{isPromo ? '🎁' : '💎'}</span>
          </div>
          <h2 className="text-3xl font-black mb-1 text-center leading-tight">
            {isPromo ? 'Специальное предложение!' : 'Дневной лимит\nисчерпан'}
          </h2>
          <p className="text-slate-400 text-sm text-center mb-6">
            {isPromo
              ? 'Ты решил уже столько задач! Первый месяц Pro — за 99 ₽'
              : 'Подключи полный доступ и учись без ограничений'}
          </p>

          {/* Perks */}
          <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 mb-6 space-y-3">
            {PERKS.map(p => (
              <div key={p.text} className="flex items-center gap-3">
                <span className="text-xl w-7 text-center flex-shrink-0">{p.icon}</span>
                <span className="text-[14px] text-slate-200 font-medium">{p.text}</span>
              </div>
            ))}
          </div>

          {/* Plan selector */}
          <div className="w-full space-y-3 mb-6">
            {displayPlans.map(plan => (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all active:scale-95 text-left ${
                  selectedPlan === plan.id
                    ? 'border-indigo-500 bg-indigo-600/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  selectedPlan === plan.id ? 'border-indigo-400 bg-indigo-500' : 'border-slate-500'
                }`}>
                  {selectedPlan === plan.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white">{plan.label}</span>
                    {plan.badge && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded-full">{plan.badge}</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{plan.sub}</p>
                </div>
                <span className="font-black text-white text-right text-sm leading-tight">{plan.price}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="w-full mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-2xl text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => handlePlanClick(selectedPlan)}
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 font-black text-lg shadow-xl shadow-indigo-900/50 active:scale-95 transition-all mb-3 disabled:opacity-60"
          >
            {loading ? 'Загрузка...' : isPromo ? 'Попробовать за 99 ₽ 🚀' : 'Начать обучение 🚀'}
          </button>

          <div className="flex items-center gap-4 w-full mb-4">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-slate-500 text-xs font-bold uppercase">Или</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <button onClick={() => { trackEvent(EVENTS.PAYWALL_DONATE_CLICKED); onDonate(); }}
            className="w-full py-4 text-emerald-400 font-bold border-2 border-emerald-400/20 rounded-2xl hover:bg-emerald-400/10 active:scale-95 transition-all mb-2">
            ☕ Поддержать проект
          </button>
          <button onClick={() => { trackEvent(EVENTS.PAYWALL_DISMISSED, { isPromo }); onBack(); }} className="w-full py-3 text-slate-500 font-bold text-sm">
            {isPromo ? 'Не сейчас' : 'Отдохнуть до завтра'}
          </button>

          {/* Soft upsell */}
          <div className="mt-6 text-center px-4">
            <p className="text-slate-500 text-xs">Хочешь заниматься ТРИЗ с живым преподавателем?{' '}
              <button onClick={() => window.open('https://t.me/ugolok_triz', '_blank')}
                className="text-indigo-400 font-bold underline decoration-indigo-400/30 underline-offset-4">
                Онлайн-группы →
              </button>
            </p>
          </div>
        </div>
      ) : (
        <GateScreen task={mathTask} onSubmit={handleGateSubmit} onCancel={() => setGateOpen(false)} />
      )}
    </div>
  );
}
