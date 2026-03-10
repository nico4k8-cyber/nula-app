import { useState, useRef, useEffect, useCallback } from "react";
import JSConfetti from 'js-confetti';
import posthog from 'posthog-js';

// PostHog Analytics
const POSTHOG_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POSTHOG_KEY)
  || 'phc_SUO1vWSfLfRqKQ7JQjAKKiXm4DZS3os9COiCmcMzonI';
posthog.init(POSTHOG_KEY, {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-01-30',
  person_profiles: 'identified_only',
  autocapture: false,       // только ручные события, не спамим кликами
  capture_pageview: true,
});

/* ═══ CONFIG ═══ */
const CONFIG = {
  cta_telegram: "FormulaIntelligenc",
  subscribe_bot: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUBSCRIBE_BOT) || "ВАШ_БОТ",
  cta_message: 'Здравствуйте! Интересуюсь ТРИЗ-занятиями для развития мышления.',
  cta_text: "Записаться на встречу",
  cta_subtitle: "60 минут · Онлайн · До 8 детей в группе",
  character: { name: "Уголёк", avatar: "🐉" },
  delay_ms: { found: 1500, other: 800 },
  parent_phrases: {
    low: "Для начала — отличный результат! На занятии мы разберем ещё 3 необычных задачи.",
    mid: "Впечатляюще! Мышление работает нестандартно, ресурсы найдены быстро.",
    all: "Уникальный результат! Все решения найдены — настоящий талант к изобретательству.",
  },
  logging: {
    botToken: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TG_TOKEN) || "8316651117:AAGd7FAWu4Q1vsDd0riKF-UcKYT4S7v3uF0",
    chatId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TG_CHAT) || "122107817",
  },
  DAILY_TOKEN_LIMIT: 1_000_000,
  ALERT_THRESHOLD: 0.8,
};

/* ═══ TASKS ═══ */
import { TASKS, PICK, processUserMessage } from "./bot/engine";
import { TRIZ_PRINCIPLES } from "./bot/principles";

/* ═══ FUZZY PRINCIPLE LOOKUP ═══ */
const PRINCIPLE_KEYS = Object.keys(TRIZ_PRINCIPLES);
function findPrinciple(name) {
  if (!name) return null;
  // Exact match
  if (TRIZ_PRINCIPLES[name]) return name;
  // Normalize: lowercase + trim
  const norm = name.toLowerCase().trim();
  // Direct key match (case-insensitive)
  const exactCI = PRINCIPLE_KEYS.find(k => k.toLowerCase() === norm);
  if (exactCI) return exactCI;
  // Key is substring of AI name (e.g. "Вынесение" inside "Замена вещества (Вынесение свойств)")
  const partial = PRINCIPLE_KEYS.find(k => norm.includes(k.toLowerCase()));
  if (partial) return partial;
  // AI name is substring of key
  const reverse = PRINCIPLE_KEYS.find(k => k.toLowerCase().includes(norm));
  if (reverse) return reverse;
  return null;
}

/* ═══ RANDOM EXAMPLE PICKER ═══ */
function pickRandom(arr, count = 1) {
  if (!arr || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

/* ═══ RENDER CONDITION ═══ */
function Condition({ text, dm }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return <p className={`text-[17px] md:text-[18px] leading-relaxed mb-3 ${dm ? 'text-white/90' : 'text-[#1B1B1B]'}`}>
    {parts.map((part, i) =>
      part.startsWith("**") ? <strong key={i} className={`${dm ? 'text-amber-300' : 'text-[#E57A44]'} font-bold`}>{part.slice(2, -2)}</strong> : part
    )}
  </p>;
}

/* ═══ TASK IMAGE ═══ */
function TaskImage({ task, size = "large", dm }) {
  const isLarge = size === "large";
  const src = isLarge ? task.image : (task.thumb || task.image);
  return (
    <div className={`relative overflow-hidden transition-all duration-500 ${isLarge ? "h-[220px] md:h-[300px] bg-gray-100" : "w-full aspect-[16/10] bg-gray-50 rounded-2xl"}`}>
      <img
        src={src}
        alt={task.title}
        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${dm ? 'brightness-[0.7] contrast-[1.1]' : ''}`}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${dm ? 'from-slate-900/80' : 'from-black/30'} to-transparent pointer-events-none`}></div>
    </div>
  );
}

/* ═══ PHASE TRACKER ═══ */
function PhaseTracker({ step, dm }) {
  const steps = [
    { id: 0, label: "Загадка", icon: "🔥" },
    { id: 1, label: "Анализ", icon: "🔍" },
    { id: 2, label: "Гипотезы", icon: "🏹" },
    { id: 3, label: "Отбор", icon: "🏆" },
    { id: 4, label: "Проверка", icon: "🧪" }
  ];

  return (
    <div className="flex items-center justify-between px-3 py-2 gap-1 mb-2 overflow-x-auto no-scrollbar">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] md:text-[11px] font-bold transition-all border ${step === s.id
            ? (dm ? 'bg-amber-700 text-amber-100 shadow-lg border-amber-800' : 'bg-amber-500 text-white shadow-lg border-amber-600')
            : step > s.id
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : dm ? 'bg-white/5 text-gray-500 border-white/5' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
            <span className="text-sm">{s.icon}</span>
            {step === s.id && <span>{s.label}</span>}
          </div>
          {idx < steps.length - 1 && <div className={`flex-1 h-[2px] rounded-full mx-1 ${step > s.id ? 'bg-emerald-500/30' : dm ? 'bg-white/10' : 'bg-gray-100'}`} />}
        </div>
      ))}
    </div>
  );
}

/* ═══ FULLSCREEN IMAGE MODAL ═══ */
function ImageModal({ src, onClose, dm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 text-white text-4xl font-light hover:scale-110 transition-transform">&times;</button>
      <img src={src} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 cursor-zoom-out" onClick={onClose} />
    </div>
  );
}

/* ═══ TRIZ PRINCIPLE MODAL ═══ */
function PrincipleModal({ principle, childUsage, onClose, dm }) {
  if (!principle) return null;
  const key = findPrinciple(principle);
  const data = key ? TRIZ_PRINCIPLES[key] : { title: principle, description: "Интересный прием, который помогает находить нестандартные решения!", examples: [] };
  const [shownExamples, setShownExamples] = useState(() => pickRandom(data.examples || [], 3));
  const hasMore = (data.examples?.length || 0) > 3;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] ${dm ? 'bg-slate-900 border border-white/10 text-white' : 'bg-white text-slate-900'}`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl">💡</div>
            <div>
              <h3 className="text-xl font-black">{data.title}</h3>
              <p className={`text-xs font-bold uppercase tracking-wider opacity-50`}>Прием ТРИЗ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">&times;</button>
        </div>

        {/* What the child did — personal connection */}
        {childUsage && (
          <div className={`p-4 rounded-2xl mb-4 border-2 ${dm ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
            <div className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${dm ? 'text-amber-400' : 'text-amber-600'}`}>🏆 Твоё решение</div>
            <p className={`text-[15px] leading-relaxed ${dm ? 'text-amber-100' : 'text-amber-900'}`}>{childUsage}</p>
          </div>
        )}

        <p className={`text-[15px] leading-relaxed mb-5 ${dm ? 'text-white/80' : 'text-slate-600'}`}>{data.description}</p>

        {shownExamples.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className={`text-xs font-bold uppercase tracking-widest ${dm ? 'text-white/30' : 'opacity-40'}`}>Настоящие изобретения с этим приёмом</h4>
              {hasMore && (
                <button
                  onClick={() => setShownExamples(pickRandom(data.examples, 3))}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all active:scale-95 ${dm ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'}`}
                >
                  Ещё примеры 🔄
                </button>
              )}
            </div>
            {shownExamples.map((ex, i) => (
              <div key={ex.item} className={`p-4 rounded-2xl border ${dm ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className="font-bold text-amber-500 mb-1">✨ {ex.item}</div>
                <div className={`text-[13px] ${dm ? 'text-white/60' : 'opacity-80'}`}>{ex.text}</div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95">
          Круто! 🔥
        </button>
      </div>
    </div>
  );
}

/* ═══ APP ═══ */
export default function App() {
  const [screen, setScreen] = useState("select");
  const [task, setTask] = useState(null);
  const [score, setScore] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // Dev-only: active persona ID from ?persona= URL param
  const [activePersonaId] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("persona") || null; } catch { return null; }
  });

  /* ─ Telegram Mini App: определяем пользователя ─ */
  const [tgUser, setTgUser] = useState(null); // { id, first_name, username?, is_premium? }
  const isTMA = !!(window.Telegram?.WebApp?.initData); // работаем внутри TMA?
  const [found, setFound] = useState([]);
  const [prizStep, setPrizStep] = useState(0);
  const [prizStepStarted, setPrizStepStarted] = useState(false);
  const [hypotheses, setHypotheses] = useState([]);
  const [fbIdx, setFbIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showCondition, setShowCondition] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [modal, setModal] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [typing, setTyping] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [taskStats, setTaskStats] = useState({});
  const [pendingBranch, setPendingBranch] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [flyingPrinciple, setFlyingPrinciple] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechText, setSpeechText] = useState(""); // текст распознанный в процессе записи
  const [silenceCountdown, setSilenceCountdown] = useState(null); // обратный отсчёт тишины: 5,4,3,2,1
  const speechAccRef = useRef(""); // аккумулятор финальных фрагментов
  const silenceTimerRef = useRef(null); // интервал тишины (посекундный)
  const [hintCount, setHintCount] = useState(0);
  const [adminClicks, setAdminClicks] = useState(0);
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem('fi_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
      // Migrate from old fi_dark key
      const old = localStorage.getItem('fi_dark');
      if (old === '1') return 'dark';
      if (old === '0') return 'light';
      return 'system';
    } catch { return 'system'; }
  });
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  const [countdown, setCountdown] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [activePrinciple, setActivePrinciple] = useState(null);
  const [resultChildMessage, setResultChildMessage] = useState(null);
  const [resultTab, setResultTab] = useState('child');
  const sessionTokensRef = useRef({ input: 0, output: 0 });
  const sessionIdRef = useRef(null);
  const [childMode, setChildMode] = useState(() => {
    try { return sessionStorage.getItem('fi_child') === '1'; } catch { return false; }
  });
  const [sessionCompleted, setSessionCompleted] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('fi_completed') || '{}'); } catch { return {}; }
  });
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const jsConfetti = useRef(null);
  const countdownRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null); // явный MediaStream — чтобы гасить системный индикатор микрофона
  const total = task?.totalSolutions || 3; // Use task-specific total or fallback

  // Явно останавливает все аудиотреки — убирает оранжевый индикатор микрофона на iOS/Android
  const releaseMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    jsConfetti.current = new JSConfetti();
    return () => {
      // Освобождаем микрофон при размонтировании компонента
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { }
      }
      releaseMic();
    };
  }, []);

  /* ─ Telegram Mini App init ─ */
  useEffect(() => {
    const twa = window.Telegram?.WebApp;
    if (!twa?.initData) return; // не TMA — ничего не делаем

    // Говорим Telegram, что приложение готово (убирает лоадер)
    twa.ready();
    // Расширяем на весь экран (по умолчанию TMA занимает ~80% высоты)
    twa.expand();

    // initDataUnsafe — данные, предоставленные Telegram клиентом.
    // Для аналитики (PostHog.identify) этого достаточно: Telegram не даст подделать
    // данные реальному ребёнку через официальный клиент. Бэкенд-верификацию можно
    // добавить позже, когда понадобится авторизованные действия (покупки, прогресс).
    const user = twa.initDataUnsafe?.user;
    if (!user) return;

    setTgUser(user);

    // Линкуем анонимную PostHog-сессию с реальным Telegram-пользователем
    posthog.identify(`tg_${user.id}`, {
      tg_id: user.id,
      tg_username: user.username || null,
      tg_first_name: user.first_name || null,
      tg_is_premium: user.is_premium || false,
    });

    console.log("[TMA] ✅ User from initDataUnsafe:", user.id, user.username || user.first_name);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);


  /* ─ Analytics (Yandex Metrika ID: 106910217) ─ */
  const trackEvent = useCallback((name, params = {}) => {
    console.log(`[Analytics] Event: ${name}`, params);
    try {
      if (window.ym) window.ym(106910217, 'reachGoal', name, params);
      if (window.gtag) window.gtag('event', name, params);
      posthog.capture(name, params);
    } catch (e) { }
  }, []);

  /* ─ Dialog logging (localStorage for admin audit) ─ */
  const logInteraction = useCallback((taskId, userText, botResponse, resultType) => {
    try {
      const logs = JSON.parse(localStorage.getItem('fi_logs') || '[]');
      logs.push({ t: Date.now(), id: taskId, ut: userText, br: botResponse, res: resultType });
      localStorage.setItem('fi_logs', JSON.stringify(logs.slice(-50)));

      // Also track in all history for export
      const key = 'fi_all_history';
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      history.push({
        ts: new Date().toISOString(),
        task: taskId,
        input: userText,
        result: resultType,
        bot: botResponse?.substring(0, 300)
      });
      if (history.length > 500) history.shift();
      localStorage.setItem(key, JSON.stringify(history));
    } catch (e) { console.warn("Log error", e); }
  }, []);

  const formatTime = (ms) => {
    if (ms <= 0) return "0 сек";
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return mins > 0 ? `${mins} мин ${secs} сек` : `${secs} сек`;
  };

  const sendLogsToTelegramBot = useCallback(async (currentTask, currentMessages, currentPrizStep, taskTimeMs, tokens) => {
    const { botToken, chatId } = CONFIG.logging;
    if (!botToken || botToken.includes("ВАШ_") || !chatId) {
      console.log("Telegram Bot logging skipped: No credentials.");
      return;
    }

    try {
      const timeStr = formatTime(taskTimeMs || 0);
      const stageNames = ["—", "Разведка", "Идеи", "Зачёт", "✨ Инсайт"];
      const stageLabel = stageNames[currentPrizStep] || `${currentPrizStep}`;
      const inp = tokens?.input || 0;
      const out = tokens?.output || 0;
      const inputCost = (inp / 1_000_000 * 0.80).toFixed(4);
      const outputCost = (out / 1_000_000 * 4.00).toFixed(4);
      const totalCost = (parseFloat(inputCost) + parseFloat(outputCost)).toFixed(4);
      const RUB_RATE = 90;
      const totalRub = (parseFloat(totalCost) * RUB_RATE).toFixed(2);
      const costLine = `💰 <b>Стоимость:</b> $${totalCost} (≈ ${totalRub} ₽) (вх: ${inp} tok × $0.8/M + исх: ${out} tok × $4/M)\n`;
      const logHeader = `🤖 <b>ОТЧЁТ О СЕССИИ ТРИЗ</b>\n<b>Задача:</b> ${currentTask.title}\n<b>ПРИЗ:</b> ${currentPrizStep}/4 (${stageLabel})\n<b>Время:</b> ${timeStr}\n${costLine}\n`;
      const logBody = currentMessages
        .filter(m => m.text && !m.loading)
        .map(m => `<b>${m.role === "user" ? "👤 Ребенок" : "🤖 Бот"}:</b> ${m.text}`)
        .join("\n\n");

      // Telegram API limit: 4096 chars. Split into chunks of 3800 to be safe.
      const fullText = logHeader + logBody;
      const LIMIT = 3800;
      const chunks = [];
      for (let i = 0; i < fullText.length; i += LIMIT) {
        chunks.push(fullText.slice(i, i + LIMIT));
      }

      for (const chunk of chunks) {
        const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: chunk, parse_mode: "HTML" })
        });
        if (!resp.ok) console.error("Telegram send error:", await resp.text());
      }
      console.log(`Logs sent to Telegram Bot (${chunks.length} part(s)).`);
    } catch (e) {
      console.error("Failed to send logs to Telegram Bot:", e);
    }
  }, []);

  // Fire-and-forget: log AI operation event to Vercel KV via /api/log-event
  const logEvent = useCallback((eventData) => {
    fetch("/api/log-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-log-secret": (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOG_SECRET) || "",
      },
      body: JSON.stringify({ sessionId: sessionIdRef.current, ...eventData }),
    }).catch(() => { });
  }, []);

  const sendErrorToTelegramBot = useCallback(async (errorData) => {
    const { botToken, chatId } = CONFIG.logging;
    if (!botToken || botToken.includes("ВАШ_") || !chatId) {
      console.log("Telegram Bot error logging skipped: No credentials.");
      return;
    }

    try {
      const errorMessage = `🚨 <b>ОШИБКА В ПРИЛОЖЕНИИ</b>\n<b>Задача:</b> ${errorData.taskTitle || "N/A"}\n<b>Ошибка:</b> ${errorData.error || "Unknown"}\n<b>Время:</b> ${errorData.timestamp || new Date().toISOString()}\n\n<code>${(errorData.details || "").substring(0, 1000)}</code>`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: errorMessage,
          parse_mode: "HTML"
        })
      });
      console.log("Error sent to Telegram Bot successfully.");
    } catch (e) {
      console.error("Failed to send error to Telegram Bot:", e);
    }
  }, []);

  const trackTokenUsage = useCallback(async (tokensUsed) => {
    if (!tokensUsed) return;
    const today = new Date().toISOString().slice(0, 10);
    const stored = JSON.parse(localStorage.getItem('fi_token_usage') || '{}');
    const prevUsed = stored.date === today ? stored.used : 0;
    const dailyUsed = prevUsed + tokensUsed;
    localStorage.setItem('fi_token_usage', JSON.stringify({ date: today, used: dailyUsed }));

    const limit = CONFIG.DAILY_TOKEN_LIMIT;
    const { botToken, chatId } = CONFIG.logging;
    if (dailyUsed / limit >= CONFIG.ALERT_THRESHOLD && prevUsed / limit < CONFIG.ALERT_THRESHOLD) {
      if (botToken && chatId) {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `⚠️ <b>ЛИМИТ GEMINI API — 80%</b>\nИспользовано: <b>${dailyUsed.toLocaleString()} / ${limit.toLocaleString()} токенов</b> (${Math.round(dailyUsed / limit * 100)}%)\nОсталось: ~${Math.round((limit - dailyUsed) / 40000)} задачек`,
            parse_mode: "HTML"
          })
        }).catch(e => console.error("Token limit alert failed:", e));
      }
    }
  }, []);

  const saveLogsToServer = useCallback(async () => {
    if (messages.length <= 1) return;
    const key = 'fi_all_history';
    const logs = JSON.parse(localStorage.getItem(key) || '[]');
    logs.push({
      ts: new Date().toISOString(),
      task_id: task?.id,
      task_title: task?.title,
      dialogue: messages, // Full array of {role, text}
      priz_step: prizStep
    });
    if (logs.length > 500) logs.shift(); // Limit to 500 sessions
    localStorage.setItem(key, JSON.stringify(logs));
  }, [messages, task, prizStep]);

  const handleAdminClick = useCallback(() => {
    const next = adminClicks + 1;
    if (next >= 10) {
      // Trigger daily summary → sends stats to Telegram
      fetch("/api/daily-summary", {
        headers: { "x-log-secret": (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOG_SECRET) || "" },
      }).catch(() => { });

      const allLogs = JSON.parse(localStorage.getItem('fi_all_history') || '[]');
      if (allLogs.length === 0) {
        alert("История диалогов пока пуста.");
      } else {
        const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `triz_admin_audit_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setAdminClicks(0);
    } else {
      setAdminClicks(next);
    }
  }, [adminClicks]);

  const handleThemeToggle = useCallback(() => {
    const next = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
    setThemeMode(next);
    try { localStorage.setItem('fi_theme', next); } catch { }
  }, [themeMode]);

  const markTaskCompleted = useCallback((taskId, foundCount, taskTimeMs) => {
    setSessionCompleted(prev => {
      const next = { ...prev, [taskId]: { solved: foundCount, at: Date.now() } };
      try { sessionStorage.setItem('fi_completed', JSON.stringify(next)); } catch { }
      return next;
    });
    // Trigger background upload & backup
    if (task) {
      sendLogsToTelegramBot(task, messages, prizStep, taskTimeMs, sessionTokensRef.current);
      saveLogsToServer();
    }
  }, [task, messages, prizStep, sendLogsToTelegramBot, saveLogsToServer]);

  /* ─ Finalize current task: save timing + stats ─ */
  const finalizeCurrentTask = useCallback(() => {
    if (!task || !taskStartTime) return 0;
    const elapsed = Date.now() - taskStartTime;
    setTaskStats(prev => {
      const existing = prev[task.id] || { timeMs: 0, found: 0, attempts: 0, messages: 0 };
      return {
        ...prev,
        [task.id]: {
          timeMs: existing.timeMs + elapsed,
          priz_step: prizStep,
          attempts: attempts,
          messages: totalMessages,
          title: task.title,
          icon: task.icon,
        }
      };
    });
    setTaskStartTime(null);
    return elapsed;
  }, [task, taskStartTime, prizStep, attempts, totalMessages]);

  const getIconGradient = (id) => {
    const gradients = {
      "solomon-hall": "from-amber-400 to-orange-500",
      "monkeys": "from-green-400 to-emerald-600",
      "flowers": "from-pink-400 to-rose-500",
      "bags": "from-blue-400 to-indigo-600"
    };
    return gradients[id] || "from-gray-400 to-gray-600";
  };

  const FALLBACK_HOOK = "Вот наш маршрут: разберём условие → найдём где загвоздка → придумаем идеи → выберем лучшую.\n\n**Уголёк** уже здесь и готов помогать!\n\nС чего начнёшь?";

  const selectTask = (t) => {
    if (task && taskStartTime) finalizeCurrentTask();
    posthog.capture('task_started', { task_id: t.id, task_title: t.title, age_range: t.ageRange, tg_user_id: tgUser?.id || null });
    setTask(t);
    setScreen("solve");
    setFound([]);
    setPrizStep(0);
    setPrizStepStarted(true);
    setHypotheses([]);
    setFbIdx(0);
    setStreak(0);
    setAttempts(0);
    setTotalMessages(0);
    setHintCount(0);
    setPendingBranch(null);
    setAiReport(null);
    setCountdown(null);
    sessionTokensRef.current = { input: 0, output: 0 };
    sessionIdRef.current = Math.random().toString(36).slice(2, 10);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setShowCondition(false);
    setImageExpanded(false);
    setTaskStartTime(Date.now());

    // Show loading placeholder, then fetch unique AI hook
    setMessages([{ role: "system", text: "...", loading: true }]);
    fetch("/api/hook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: t, ageRange: t.ageRange })
    })
      .then(r => r.json())
      .then(d => {
        setMessages([{ role: "system", text: d.hook || FALLBACK_HOOK }]);
        logEvent({ op: "hook", taskId: t.id, ageRange: t.ageRange, model: d.model, inputTokens: d.inputTokens || 0, outputTokens: d.outputTokens || 0 });
      })
      .catch(() => setMessages([{ role: "system", text: FALLBACK_HOOK }]));
  };

  const continueSolving = (customMsg) => {
    setScreen("solve");
    setPrizStep(2);
    setCountdown(null);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setTaskStartTime(Date.now());
    const replyText = customMsg || "🔄 Давай попробуем найти ещё одно решение! Может, есть совершенно другой подход, который мы ещё не рассматривали?";
    setMessages(prev => [...prev, { role: "system", text: replyText }]);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const goBack = () => {
    if (screen === "solve" && messages.length > 1) setModal(true);
    else { finalizeCurrentTask(); setScreen("select"); setTask(null); setPendingBranch(null); }
  };

  const stopSilenceTimer = () => {
    if (silenceTimerRef.current) { clearInterval(silenceTimerRef.current); silenceTimerRef.current = null; }
    setSilenceCountdown(null);
  };

  const startSilenceTimer = () => {
    stopSilenceTimer();
    let sec = 5;
    setSilenceCountdown(sec);
    silenceTimerRef.current = setInterval(() => {
      sec--;
      if (sec <= 0) {
        stopSilenceTimer();
        // Авто-стоп после 5 сек тишины
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) { }
        }
      } else {
        setSilenceCountdown(sec);
      }
    }, 1000);
  };

  const stopSpeech = () => {
    stopSilenceTimer();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { } // stop (не abort) — чтобы onend получил финальный результат
    }
  };

  const startSpeech = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Голосовой ввод не поддерживается вашим браузером. Попробуй Chrome. 🎙️");
      return;
    }

    // 1. Закрыть клавиатуру ДО показа overlay — иначе fixed inset-0 рисуется только выше клавиатуры на iOS
    inputRef.current?.blur();
    setIsFocused(false);

    // 2. Остановить предыдущую сессию если была
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
      recognitionRef.current = null;
    }
    stopSilenceTimer();
    releaseMic();

    // 3. Явно захватить медиапоток — чтобы потом явно его освободить и погасить индикатор ОС
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch {
      // Нет разрешения — recognition.start() сам покажет ошибку 'not-allowed'
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = 'ru-RU';
    recognition.interimResults = true;   // показываем текст в процессе
    recognition.continuous = true;       // НЕ останавливаемся при паузе — ждём пользователя
    recognition.maxAlternatives = 1;

    // Сброс аккумулятора
    speechAccRef.current = "";
    setSpeechText("");
    setIsRecording(true);

    // Жёсткий предохранитель — 60 сек максимум
    const hardTimeoutId = setTimeout(() => stopSpeech(), 60000);

    recognition.onresult = (event) => {
      // Собираем финальные + промежуточные фрагменты
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      speechAccRef.current = finalText;
      setSpeechText(finalText + interimText);

      // Сброс таймера тишины: 5 секунд без новых слов → авто-стоп с обратным отсчётом
      startSilenceTimer();
    };

    recognition.onerror = (event) => {
      clearTimeout(hardTimeoutId);
      stopSilenceTimer();
      releaseMic();
      setIsRecording(false);
      setSpeechText("");
      recognitionRef.current = null;
      if (event.error === 'not-allowed') {
        alert("Нет доступа к микрофону. Разреши использование микрофона в настройках браузера. 🎙️");
      } else if (event.error === 'no-speech') {
        // тихо — просто закрываем
      } else if (event.error !== 'aborted') {
        console.warn("Speech error:", event.error);
      }
    };

    recognition.onend = () => {
      clearTimeout(hardTimeoutId);
      stopSilenceTimer();
      releaseMic();
      setIsRecording(false);
      recognitionRef.current = null;

      // Авто-отправка накопленного текста
      const text = (speechAccRef.current || "").trim();
      setSpeechText("");
      speechAccRef.current = "";
      if (text) {
        send(text);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      clearTimeout(hardTimeoutId);
      releaseMic();
      setIsRecording(false);
      setSpeechText("");
      recognitionRef.current = null;
      console.warn("Recognition start failed:", e);
    }
  };

  // Генерация шаблонного отчёта если AI не отработал
  const buildFallbackReport = useCallback((currentTask, currentMessages, currentPrizStep) => {
    const stageDescriptions = {
      0: "начал знакомство с задачей",
      1: "исследовал условие и определил, что есть в ситуации",
      2: "искал идеи и предлагал варианты решения",
      3: "нашёл рабочее решение и обосновал его",
      4: "прошёл полный цикл решения задачи и нашёл нестандартный выход",
    };
    const step = Math.min(currentPrizStep ?? 0, 4);
    const childMsgs = currentMessages.filter(m => m.role === "user" && m.text?.trim());
    const lastIdea = childMsgs.length > 0 ? childMsgs[childMsgs.length - 1].text.trim() : null;

    let report = `Ваш ребёнок решал задачу «${currentTask.title}». `;
    report += `В ходе тренировки ${stageDescriptions[step]}. `;
    if (lastIdea && step >= 2) {
      const shortIdea = lastIdea.length > 80 ? lastIdea.slice(0, 80) + "…" : lastIdea;
      report += `Последняя идея ребёнка: «${shortIdea}». `;
    }
    report += step >= 3
      ? "Это отличный результат — умение находить нестандартные пути решения формируется именно через такие задачи."
      : "Каждая попытка — это тренировка мышления. С каждой задачей навык поиска решений становится сильнее.";

    return { report, principles: [], fallback: true };
  }, []);

  const send = useCallback(async (overrideText) => {
    const raw = overrideText || input;
    if (sending || !raw.trim()) return;
    const txt = raw.trim();
    setInput(""); setSending(true);
    setTotalMessages(m => m + 1);
    posthog.capture('message_sent', { task_id: task?.id, priz_step: prizStep, msg_num: totalMessages + 1 });
    if (showCondition) setShowCondition(false);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // We keep track of history for the AI
    const newMessages = [...messages, { role: "user", text: txt }];
    setMessages(newMessages);
    setTyping(true);

    /* ─── Call the engine function with history ─── */
    const engineState = {
      prizStep,
      prizStepStarted,
      found,
      hypotheses,
      pendingBranch,
      fbIdx,
      streak,
    };

    try {
      const { reply, newState, resultType, tokensUsed, inputTokens, outputTokens, stars, model } = await processUserMessage(txt, task, engineState, newMessages, sendErrorToTelegramBot);
      trackTokenUsage(tokensUsed);
      sessionTokensRef.current = { input: sessionTokensRef.current.input + (inputTokens || 0), output: sessionTokensRef.current.output + (outputTokens || 0) };
      const nextPrizStep = (newState.prizStep !== undefined) ? newState.prizStep : prizStep;
      logEvent({ op: "chat", taskId: task.id, ageRange: task.ageRange, personaId: activePersonaId, model, inputTokens: inputTokens || 0, outputTokens: outputTokens || 0, prizStep: nextPrizStep, completed: nextPrizStep === 4 });
      const delay = resultType === "found" ? CONFIG.delay_ms.found : CONFIG.delay_ms.other;

      setTimeout(() => {
        setTyping(false);

        /* ─── Apply engine state back to React ─── */
        if (newState.prizStep !== undefined && newState.prizStep !== prizStep) {
          setPrizStep(newState.prizStep);
        }
        // Stars come from AI (0-3 per message), not from stage advance
        if (stars > 0) {
          setScore(s => s + stars);
          if (stars >= 2 && jsConfetti.current) {
            jsConfetti.current.addConfetti({
              emojis: ['⭐'],
              confettiNumber: stars * 8,
            });
          }
        }
        if (newState.prizStepStarted !== prizStepStarted) setPrizStepStarted(newState.prizStepStarted);
        if (newState.fbIdx !== fbIdx) setFbIdx(newState.fbIdx);
        if (newState.streak !== streak) setStreak(newState.streak);
        if (newState.pendingBranch !== pendingBranch) setPendingBranch(newState.pendingBranch);
        if (newState.hypotheses) setHypotheses(newState.hypotheses);

        setMessages((p) => [...p, { role: "system", text: reply }]);

        if (newState.newBranch && task.branches) {
          const branchData = task.branches.find(b => b.id === newState.newBranch);
          if (branchData) {
            setScore(s => s + 5);
            if (jsConfetti.current) {
              jsConfetti.current.addConfetti({
                emojis: ['⭐', '🌟', '✨', '🎉', '💡'],
                confettiNumber: 30,
              });
            }
            setFound((p) => {
              const next = [...p, newState.newBranch];
              setTimeout(() => {
                setFlyingPrinciple({ text: branchData.triz_principle || "Идея найдена!", count: next.length, total });
                setTimeout(() => setFlyingPrinciple(null), 2500);
              }, 1200);

              if (next.length === total) {
                const elapsed = taskStartTime ? (Date.now() - taskStartTime) : 0;
                markTaskCompleted(task.id, next.length, elapsed);
                setTimeout(() => {
                  const finalElapsed = finalizeCurrentTask();
                  trackEvent('result_screen_opened', { task_id: task.id, found: next.length });
                  setScreen("result");
                }, 4500);
              } else {
                setTimeout(() => setShowChoice(true), 3200);
              }
              return next;
            });
          }
        }
        // Trigger report generation whenever a new idea is found to reduce wait time later
        if (newState.newBranch) {
          const allMsgs = [...newMessages, { role: "system", text: reply }];
          fetch("/api/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: allMsgs, task })
          }).then(r => {
            if (!r.ok) throw new Error(`Server ${r.status}`);
            return r.json();
          }).then(d => {
            if (d.report) {
              setAiReport(d);
            } else {
              // API вернул fallback — генерируем шаблонный отчёт
              setAiReport(buildFallbackReport(task, allMsgs, newState.prizStep ?? prizStep));
              sendErrorToTelegramBot({ error: "Report API fallback (incremental)", details: d.error || "No report in response", taskTitle: task.title });
            }
            logEvent({ op: "report_incremental", taskId: task.id, ageRange: task.ageRange, model: d.model, fallback: !d.report });
          }).catch((err) => {
            setAiReport(buildFallbackReport(task, allMsgs, newState.prizStep ?? prizStep));
            sendErrorToTelegramBot({ error: "Report API failed (incremental)", details: err?.message || String(err), taskTitle: task.title });
          });
        }

        // AI-driven completion: переход на результаты когда AI говорит "Задача решена" (СТАДИЯ:4)
        if (newState.prizStep === 4 && prizStep < 4) {
          const msgsCopy = [...newMessages, { role: "system", text: reply }];

          // Instant rewards!
          setScore(s => s + 10);
          if (jsConfetti.current) {
            jsConfetti.current.addConfetti({
              emojis: ['🎉', '✨', '🏆', '⭐', '💡'],
              confettiNumber: 60,
            });
          }

          // Pre-fetch report if not already generating from a branch
          if (!aiReport) {
            fetch("/api/report", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: msgsCopy, task })
            }).then(r => {
              if (!r.ok) throw new Error(`Server ${r.status}`);
              return r.json();
            }).then(d => {
              if (d.report) {
                setAiReport(d);
              } else {
                setAiReport(buildFallbackReport(task, msgsCopy, 4));
                sendErrorToTelegramBot({ error: "Report API fallback (final)", details: d.error || "No report in response", taskTitle: task.title });
              }
              logEvent({ op: "report", taskId: task.id, ageRange: task.ageRange, model: d.model, inputTokens: d.inputTokens || 0, outputTokens: d.outputTokens || 0, fallback: !d.report });
            }).catch((err) => {
              setAiReport(buildFallbackReport(task, msgsCopy, 4));
              sendErrorToTelegramBot({ error: "Report API failed (final)", details: err?.message || String(err), taskTitle: task.title });
            });
          }

          const goToResult = () => {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            setCountdown(null);
            const finalElapsed = finalizeCurrentTask();
            sendLogsToTelegramBot(task, msgsCopy, 4, finalElapsed, sessionTokensRef.current);
            trackEvent('result_screen_opened', { task_id: task.id, priz_step: 4 });

            // If task is not fully solved, fetch a re-engagement hook for the child
            if (found.length < total) {
              fetch("/api/re-engagement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task, foundCount: found.length, totalCount: total })
              })
                .then(r => r.json())
                .then(d => {
                  if (d.hook) setResultChildMessage(d.hook);
                })
                .catch(() => { });
            }

            setScreen("result");
          };

          // Даём 2 сек прочитать начало финального ответа Уголька, потом запускаем таймер на 60 сек
          setTimeout(() => {
            let t = 60;
            setCountdown(t);
            // Скроллим вниз чтобы последние сообщения были видны над overlay
            setTimeout(() => {
              dialogRef.current?.scrollTo({ top: dialogRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
            const iv = setInterval(() => {
              t--;
              if (t <= 0) {
                goToResult();
              } else {
                setCountdown(t);
              }
            }, 1000);
            countdownRef.current = iv;
            // Expose goToResult for the manual button via ref
            countdownRef.goToResult = goToResult;
          }, 2000); // 2 сек задержки — читаем финальный ответ Уголька
        }

        logInteraction(task.id, txt, reply, resultType);
        setSending(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, delay);
    } catch (err) {
      console.error("Critical send error:", err);
      setTyping(false);
      setSending(false);
      setMessages(p => [...p, { role: "system", text: "Ой, что-то пошло не так в моём драконьем механизме... Давай попробуем ещё раз?" }]);
    }
  }, [input, sending, task, found, fbIdx, total, prizStep, pendingBranch, streak, messages, taskStartTime, markTaskCompleted, finalizeCurrentTask, trackEvent, logInteraction, trackTokenUsage, logEvent]);

  useEffect(() => {
    dialogRef.current?.scrollTo({ top: dialogRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, showChoice, modal]);

  const parentPhrase = found.length === total ? CONFIG.parent_phrases.all : found.length >= total / 2 ? CONFIG.parent_phrases.mid : CONFIG.parent_phrases.low;
  const initialCtaUrl = `https://t.me/${CONFIG.cta_telegram}?text=${encodeURIComponent(CONFIG.cta_message)}`;

  const dm = themeMode === 'dark' || (themeMode === 'system' && systemDark);
  const themeIcon = themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '💻';

  // Sync body/html background so no white margins bleed through on desktop
  useEffect(() => {
    const bg = dm ? '#0F172A' : '#FAF9F6';
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
  }, [dm]);

  /* ─── SCREEN: SELECT ─── */
  if (screen === "select") {
    /* ── PARENT HANDOFF SCREEN ── */
    if (!childMode) return (
      <div className={`min-h-[100dvh] transition-colors duration-300 flex flex-col items-center justify-center px-6 py-6 font-['DM_Sans',system-ui,sans-serif] ${dm ? 'bg-[#0F172A] text-slate-300' : 'bg-[#FAF9F6]'}`}
        style={dm ? { background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)' } : {}}>
        <style>{`@keyframes blink{0%,80%{opacity:.2}40%{opacity:1}}`}</style>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Telegram user chip (показывается только в TMA) */}
          {isTMA && tgUser && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${dm ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              <span>✈️</span>
              <span>{tgUser.first_name || tgUser.username || "Telegram"}</span>
            </div>
          )}
          <button onClick={handleThemeToggle} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${dm ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>
            {themeIcon}
          </button>
        </div>
        <div className="max-w-[440px] w-full">
          {/* Логотип + название */}
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-[#2D6A4F]/20">💡</div>
          </div>
          <p className={`text-center text-[13px] font-medium tracking-wide mb-3 ${dm ? 'text-slate-500' : 'text-[#6B7280]'}`}>
            Формула Интеллекта · ТРИЗ-школа
          </p>

          {/* Киллер-фича */}
          <h1 className={`font-['Playfair_Display',Georgia,serif] text-[26px] md:text-[30px] leading-[1.2] text-center mb-1 ${dm ? 'text-slate-100' : 'text-[#1B1B1B]'}`}>
            За 3 минуты — от <span className="text-[#2D6A4F]">«не знаю»</span> до <span className="text-[#2D6A4F]">«хочу ещё!»</span>
          </h1>
          <p className={`text-[14px] text-center mb-4 ${dm ? 'text-slate-400' : 'text-[#6B7280]'}`}>
            Ребёнок решает задачу через вопросы, получает удовольствие от процесса и хочет ещё
          </p>

          {/* Кто такой Уголёк */}
          <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 mb-2 border ${dm ? 'bg-slate-800/60 border-slate-700/50' : 'bg-amber-50 border-amber-100'}`}>
            <img
              src="./img/webp/ugolok.webp"
              alt="Уголёк"
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-300/60 shadow-sm flex-shrink-0"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <div className={`font-bold text-[14px] ${dm ? 'text-slate-100' : 'text-[#1B1B1B]'}`}>Уголёк</div>
              <div className={`text-[12px] leading-snug ${dm ? 'text-slate-400' : 'text-[#6B7280]'}`}>
                AI-наставник, который не даёт ответы — помогает думать самому
              </div>
            </div>
          </div>

          {/* 5 шагов */}
          <div className={`rounded-2xl p-3 mb-2 ${dm ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white border border-gray-100 shadow-sm'}`}>
            <p className={`text-[13px] font-bold mb-2 ${dm ? 'text-slate-300' : 'text-[#1B1B1B]'}`}>Что будет:</p>
            <div className="space-y-1">
              {[
                { icon: '1️⃣', text: 'Видит задачу — что-то мешает, и непонятно что делать' },
                { icon: '2️⃣', text: 'Уголёк задаёт вопросы — не объясняет, а помогает думать самому' },
                { icon: '3️⃣', text: '🌟 Ребёнок сам находит решение — и удивляется себе' },
                { icon: '4️⃣', text: '🔥 Хочет решать ещё — сам просит продолжение' },
              ].map((s, i) => (
                <div key={i} className={`flex gap-2.5 items-start text-[13px] leading-snug ${dm ? 'text-slate-400' : 'text-[#4A4A4A]'}`}>
                  <span className="shrink-0">{s.icon}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Что получит родитель */}
          <div className={`rounded-2xl p-3 mb-2 ${dm ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white border border-gray-100 shadow-sm'}`}>
            <div className={`flex gap-2.5 items-start text-[13px] leading-snug ${dm ? 'text-slate-400' : 'text-[#4A4A4A]'}`}>
              <span className="shrink-0">📋</span>
              <span>После сессии вы получите персональный отчёт о том, как ребёнок решал задачу — что замечал, где застревал, какую идею нашёл</span>
            </div>
          </div>

          {/* Время */}
          <p className={`text-center text-[13px] leading-tight mb-3 ${dm ? 'text-slate-500' : 'text-[#6B7280]'}`}>
            ⏱ 2–5 минут на задачу<br />
            <span className="opacity-70 text-[11px]">(но обычно дети хотят ещё, поэтому может занять больше времени)</span>
          </p>

          {/* Кнопка */}
          <button
            onClick={() => {
              try { sessionStorage.setItem('fi_child', '1'); } catch { }
              setChildMode(true);
            }}
            className="w-full bg-[#2D6A4F] text-white border-none rounded-2xl py-3.5 px-6 text-[18px] font-bold cursor-pointer hover:bg-[#24533e] transition-all hover:scale-[1.02] shadow-lg active:scale-95 mb-3">
            Передать телефон ребёнку →
          </button>
          <div className="text-center">
            <span className={`text-[12px] px-3 py-1 rounded-full ${dm ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>
              Дальше тренажёр работает в игровом режиме
            </span>
          </div>
        </div>
      </div>
    );
    /* ── CHILD TASK SELECT SCREEN ── */
    return (
      <div className={`min-h-[100dvh] px-4 py-5 font-['DM_Sans',system-ui,sans-serif] ${dm ? 'bg-[#0F172A] text-slate-300' : 'bg-[#FAF9F6]'}`}
        style={dm ? { background: 'radial-gradient(circle at top, #1E293B 0%, #0F172A 100%)' } : {}}>
        <div className="max-w-[480px] md:max-w-[720px] lg:max-w-[900px] mx-auto">

          {/* Header for Child Screen */}
          <div className="flex justify-between items-center mb-4">
            <button onClick={handleThemeToggle} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${dm ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white text-gray-400 border border-gray-100'}`}>
              {themeIcon}
            </button>
            <button onClick={() => {
              try { sessionStorage.removeItem('fi_child'); } catch { }
              setChildMode(false);
            }} className="text-[12px] text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer underline">
              👋 Для родителя
            </button>
          </div>

          {/* Уголёк greeting */}
          <div className={`rounded-2xl p-4 mb-6 flex gap-3 items-start ${dm ? 'bg-amber-900/20' : 'bg-amber-50'} border ${dm ? 'border-amber-700/30' : 'border-amber-100'} shadow-sm`}>
            <img src="./img/webp/ugolok.webp" alt="Уголёк"
              className="w-12 h-12 rounded-full object-cover flex-shrink-0 cursor-pointer select-none active:scale-95 transition-transform border-2 border-amber-300/60 shadow-sm"
              title="Для учителя"
              onClick={handleAdminClick}
              onError={e => { e.currentTarget.outerHTML = `<span class="text-3xl cursor-pointer select-none active:scale-95 transition-transform" title="Для учителя">${CONFIG.character.avatar}</span>`; }} />
            <div>
              <div className="text-[12px] font-bold text-amber-600 mb-0.5 uppercase tracking-wider">{CONFIG.character.name}</div>
              <div className={`text-[16px] leading-snug ${dm ? 'text-white/90' : 'text-gray-800'}`}>
                Привет! Выбирай любую задачу. В каждой — своя загадка: что-то мешает, и нужно придумать хитрое решение. Подсказки будут, если застрянешь. <strong>Начнём?</strong>
              </div>
            </div>
          </div>

          {/* Тупик: все задачи пройдены */}
          {Object.keys(sessionCompleted).length >= TASKS.length && (
            <div className={`rounded-2xl p-5 mb-6 text-center border-2 ${dm ? 'bg-emerald-900/20 border-emerald-700/40' : 'bg-[#E7F3EF] border-[#2D6A4F]/20'}`}>
              <div className="text-4xl mb-2">🏆</div>
              <h2 className={`font-bold text-[18px] mb-1 ${dm ? 'text-emerald-300' : 'text-[#2D6A4F]'}`}>Все задачи решены!</h2>
              <p className={`text-[13px] mb-4 ${dm ? 'text-slate-400' : 'text-gray-600'}`}>
                Ты прошёл весь тренажёр. В нашем клубе таких задач — сотни.
              </p>
              <div className="flex flex-col gap-3">
                <a href={`https://t.me/${CONFIG.cta_telegram}?text=${encodeURIComponent(CONFIG.cta_message)}`}
                  target="_blank" rel="noreferrer"
                  className="block bg-[#2D6A4F] text-white px-6 py-3 rounded-2xl font-bold text-[15px] no-underline shadow-lg active:scale-95 transition-transform">
                  Записаться на бесплатный пробный урок 🚀
                </a>
                {CONFIG.subscribe_bot !== "ВАШ_БОТ" && (
                  <a href={`https://t.me/${CONFIG.subscribe_bot}?start=allDone`} target="_blank" rel="noreferrer"
                    className={`block px-6 py-3 rounded-2xl text-[14px] font-medium no-underline transition-all active:scale-95 ${dm ? 'bg-blue-900/30 border border-blue-700/40 text-blue-300' : 'bg-blue-50 border border-blue-100 text-blue-700'}`}>
                    🔔 Узнать о новых задачах
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TASKS.map((t) => {
              const completed = sessionCompleted[t.id];
              const diff = t.difficulty || 1;
              return (
                <div key={t.id} onClick={() => selectTask(t)}
                  role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && selectTask(t)}
                  className={`group rounded-3xl p-4 cursor-pointer border-2 transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 outline-none ${dm ? 'bg-slate-800 border-white/5' : 'bg-white border-transparent hover:border-[#2D6A4F]/20'}`}>
                  <div className="mb-4 relative rounded-2xl overflow-hidden aspect-[16/10] bg-gray-50 shadow-inner group-hover:shadow-2xl transition-all duration-500">
                    <TaskImage task={t} size="small" dm={dm} />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                    {completed && (
                      <div className="absolute top-3 right-3 bg-[#2D6A4F] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-xl border-2 border-white animate-in zoom-in duration-500 z-10">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className={`font-bold text-[18px] mb-2 transition-colors leading-tight ${dm ? 'text-white' : 'text-[#1B1B1B] group-hover:text-[#2D6A4F]'}`}>{t.title}</div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-0.5 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      {[1, 2, 3].map(s => (
                        <span key={s} className={`text-[11px] ${s <= diff ? 'text-amber-500' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm ${dm ? 'bg-amber-900/40 text-amber-200 border border-amber-800/50' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                      {`${t.ageRange || "10-13"} лет`}
                    </span>
                  </div>

                  <div className="text-[12px] text-gray-500 leading-snug line-clamp-2 min-h-[32px]">{completed ? 'Продолжить тренировку →' : t.teaser}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ─── SCREEN: SOLVE ─── */
  if (screen === "solve") return (
    <div className={`h-[100dvh] flex flex-col relative max-w-[480px] md:max-w-[720px] lg:max-w-[900px] mx-auto font-['DM_Sans',system-ui,sans-serif] ${dm ? 'bg-[#0F172A] text-slate-300' : 'bg-[#FAF9F6]'}`}>
      <style>{`
        @keyframes blink{0%,80%{opacity:.2}40%{opacity:1}}
        @keyframes flyUp{
          0%{transform:translateY(0) scale(1);opacity:1}
          60%{transform:translateY(-55vh) scale(0.9);opacity:1}
          100%{transform:translateY(-65vh) scale(0.7);opacity:0}
        }
        @keyframes popIn{
          0%{transform:scale(0.5);opacity:0}
          50%{transform:scale(1.15);opacity:1}
          100%{transform:scale(1);opacity:1}
        }
        @keyframes progressPulse{
          0%{box-shadow:0 0 0 0 rgba(45,106,79,0.4)}
          70%{box-shadow:0 0 0 6px rgba(45,106,79,0)}
          100%{box-shadow:0 0 0 0 rgba(45,106,79,0)}
        }
        .focus-blur { filter: blur(8px); pointer-events: none; transition: filter 0.3s ease; }
      `}</style>

      {imageExpanded && <ImageModal src={task.image} onClose={() => setImageExpanded(false)} dm={dm} />}
      {activePrinciple && <PrincipleModal principle={activePrinciple.name || activePrinciple} childUsage={activePrinciple.childUsage} onClose={() => setActivePrinciple(null)} dm={dm} />}

      {/* Header with theme toggle and progress */}
      <div className={`px-4 py-3 flex items-center justify-between border-b shadow-sm ${dm ? 'border-slate-800 bg-slate-900/50 backdrop-blur-md' : 'border-gray-100 bg-white'}`}>
        <button onClick={goBack} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${dm ? 'text-slate-400 hover:text-slate-100 bg-slate-800/50' : 'text-gray-400 hover:text-gray-800 bg-gray-50'}`}>
          <span className="text-xl">←</span>
        </button>

        <div className="flex flex-col items-center flex-1 mx-2">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 bg-[#2D6A4F] rounded-lg flex items-center justify-center text-xs shadow-md">💡</div>
            <span className={`text-[10px] uppercase font-black tracking-widest ${dm ? 'text-slate-400' : 'text-gray-400'}`}>Formula Intelligence</span>
          </div>
          <h2 className={`text-sm font-bold truncate max-w-[150px] ${dm ? 'text-slate-100' : 'text-gray-800'}`}>{task.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleThemeToggle} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all text-sm ${dm ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
            {themeIcon}
          </button>
        </div>
      </div>

      {/* Task Condition block — Sticky & Compact as requested */}
      <div className={`sticky top-0 z-20 px-3 py-1.5 border-b transition-all duration-300 ${dm ? 'bg-[#0F172A]/95 border-slate-800' : 'bg-white/95 border-gray-200'} backdrop-blur-md`}>
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="text-sm">📜</span>
            <div className={`text-[13px] font-bold truncate ${dm ? 'text-white' : 'text-[#1B1B1B]'}`}>{task.title}</div>
          </div>
          {/* Dev persona badge — visible only when ?persona= is set */}
          {activePersonaId && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600/90 border border-purple-400/60 shadow-sm">
              <span className="text-[10px] font-mono font-bold text-purple-100 whitespace-nowrap">🧪 {activePersonaId}</span>
            </div>
          )}
        </div>

        {/* Task Image — Always visible, toggles size */}
        <div className={`w-full relative rounded-xl overflow-hidden border ${dm ? 'border-white/10' : 'border-gray-100'} mb-2 cursor-zoom-in group transition-all duration-300 ${showCondition ? 'h-[200px] md:h-[280px]' : 'h-[140px] md:h-[180px]'}`}
          onClick={() => setImageExpanded(true)}>
          <img src={task.image} alt={task.title} className={`w-full h-full object-contain ${dm ? 'bg-gray-900' : 'bg-gray-50'}`} />
          <div className={`absolute inset-0 bg-black/5 flex items-center justify-center transition-opacity ${showCondition ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            <span className={`${showCondition ? 'text-2xl' : 'text-lg'} drop-shadow-md text-white`}>🔍</span>
          </div>
        </div>

        {showCondition && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300 mb-2">
            <Condition text={task.condition} dm={dm} />
          </div>
        )}

        <PhaseTracker step={prizStep} dm={dm} />

        <button onClick={() => setShowCondition(!showCondition)} className={`w-full py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-colors uppercase tracking-wider rounded-lg ${dm ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
          {showCondition ? "Скрыть условие задачи" : "Показать условие задачи"}
          <span className={`transition-transform duration-300 ${showCondition ? 'rotate-180' : ''}`}>▼</span>
        </button>
      </div>

      <div ref={dialogRef} className={`flex-1 overflow-auto px-4 py-4 flex flex-col gap-3 scroll-smooth ${isRecording ? 'focus-blur' : ''} ${prizStep >= 4 && countdown !== null ? 'pb-28' : ''}`}>

        {/* Messages */}
        {messages.map((m, i) => {
          const isBot = m.role === "system";
          // Loading placeholder while AI hook is being fetched
          if (m.loading) return (
            <div key={i} className="flex gap-2 w-full mt-1 items-end">
              <div className="flex-shrink-0 self-end mb-1">
                <img src="./img/webp/ugolok.webp" alt="Уголёк"
                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-300/60 shadow-sm"
                  onError={e => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div className={`px-4 py-3 rounded-[16px_16px_16px_4px] ${dm ? 'bg-slate-800 border border-slate-700/60' : 'bg-amber-50 border border-amber-200/50'} shadow-sm`}>
                <div className="text-[10px] font-bold text-amber-600 mb-1.5 uppercase tracking-tighter">{CONFIG.character.name}</div>
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map(d => (
                    <div key={d} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          );
          const parts = m.text.split('\n\n').filter(p => p.trim() !== '');
          return (
            <div key={i} className={`flex gap-2 w-full mt-1 ${isBot ? "items-end" : "justify-end"}`}>
              {isBot && (
                <div className="flex-shrink-0 self-end mb-1">
                  <img src="./img/webp/ugolok.webp" alt="Уголёк"
                    className="w-8 h-8 rounded-full object-cover border-2 border-amber-300/60 shadow-sm"
                    onError={e => { e.currentTarget.style.display = 'none'; }} />
                </div>
              )}
              <div className={`flex flex-col gap-2 ${isBot ? "items-start" : "items-end"} max-w-[85%] md:max-w-[75%]`}>
                {parts.map((part, partIdx) => (
                  <div key={partIdx} className={`px-3.5 py-2 text-[16px] md:text-[18px] leading-tight whitespace-pre-wrap ${isBot ? `rounded-[16px_16px_16px_4px] ${dm ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-lg' : 'bg-amber-50 text-amber-900 border border-amber-200/50 shadow-sm'}` : `rounded-[16px_16px_4px_16px] ${dm ? 'bg-emerald-950/60 text-emerald-100 border border-emerald-900/50' : 'bg-emerald-50 text-emerald-900 border border-emerald-100'}`}`}>
                    {isBot && partIdx === 0 && <div className="text-[10px] font-bold text-amber-600 mb-0.5 uppercase tracking-tighter">{CONFIG.character.name}</div>}
                    {isBot
                      ? <span dangerouslySetInnerHTML={{
                        __html: part
                          .replace(/^[\s]*[🐉🦎🔥]\s*/u, '')
                          .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
                          .replace(/\*([^*]+)\*/g, '<em style="font-style:italic;opacity:0.8">$1</em>')
                      }} />
                      : part}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typing && (
          <div className="flex gap-2 items-end">
            <img src="./img/webp/ugolok.webp" alt="Уголёк"
              className="w-8 h-8 rounded-full object-cover border-2 border-amber-300/60 shadow-sm flex-shrink-0"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div className="px-3.5 py-2.5 rounded-[14px_14px_14px_4px] bg-[#C9943A]/10 text-[11px]">
              <span className="font-bold text-[#C9943A] block mb-0.5">{CONFIG.character.name}</span>
              <div className="text-xl tracking-widest leading-none text-[#C9943A]">
                <span className="animate-[blink_1.2s_infinite_0s]">•</span>
                <span className="animate-[blink_1.2s_infinite_0.2s]">•</span>
                <span className="animate-[blink_1.2s_infinite_0.4s]">•</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Choice card after correct answer - Simplified Navigation Only */}
      {showChoice && (
        <div className={`rounded-[24px] p-6 shadow-2xl mx-3 mb-4 transition-all border animate-in zoom-in-95 duration-300 ${dm ? 'bg-white/10 border-white/10 backdrop-blur-xl' : 'bg-white border-[#2D6A4F]/10'}`}>
          <div className="flex flex-col gap-3">
            {found.length < total && (
              <button onClick={() => { setShowChoice(false); setPrizStep(2); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="w-full bg-[#2D6A4F] text-white border-none rounded-2xl py-4 px-4 text-[17px] font-bold cursor-pointer hover:bg-[#24533e] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2">
                <span>💡</span> Найти ещё секрет ЭТОЙ задачи
              </button>
            )}
            <button onClick={() => {
              setShowChoice(false);
              const elapsed = finalizeCurrentTask();
              trackEvent('result_screen_opened', { task_id: task.id, priz_step: prizStep });
              sendLogsToTelegramBot(task, messages, prizStep, elapsed, sessionTokensRef.current);

              // Fetch re-engagement hook for early exit
              fetch("/api/re-engagement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task, foundCount: found.length, totalCount: total })
              })
                .then(r => r.json())
                .then(d => {
                  if (d.hook) setResultChildMessage(d.hook);
                })
                .catch(() => { });

              setScreen("result");
              setTimeout(() => jsConfetti.current?.addConfetti({ emojis: ['🏆', '🏅', '✨', '🚀'], confettiNumber: 50 }), 300);
            }}
              className={`w-full border-2 rounded-2xl py-4 px-4 text-[16px] font-bold cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${dm ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'}`}>
              <span>🏆</span> Узнать, какой я изобретатель!
            </button>
          </div>
        </div>
      )}

      {/* FAB removed — countdown overlay handles transition */}

      {/* Input — hidden when choice card is shown */}
      {!showChoice && (
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className={`px-3 py-3 border-t flex gap-3 items-center transition-all duration-300 ${dm ? 'border-slate-800 bg-[#0F172A]' : 'border-gray-100 bg-white'} ${isFocused ? 'pb-3' : 'pb-8'}`}>
          <button type="button" onClick={startSpeech} title="Голосовой ввод" className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all shadow-xl active:scale-90 ${isRecording ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-[#2D6A4F] text-white hover:bg-[#24533e]'}`}>
            {isRecording ? "🔴" : <span className="text-2xl">🎤</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              if (sending) return;
              const hintMessages = ["Подскажи, я не знаю", "Не понимаю, дай ещё подсказку", "Совсем застрял, помоги"];
              const msg = hintMessages[Math.min(hintCount, hintMessages.length - 1)];
              setHintCount(h => h + 1);
              send(msg);
            }}
            title="Подсказка"
            disabled={sending}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all font-bold text-xl shadow-md active:scale-90 ${sending ? (dm ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed') : (dm ? 'bg-amber-900/30 text-amber-400 border-amber-800/50 hover:bg-amber-900/50' : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200')}`}>
            ?
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              enterKeyHint="send"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder={prizStep <= 1 ? "Что ты думаешь?" : "Твоя идея..."}
              className={`w-full border-2 rounded-2xl px-4 py-3.5 text-base outline-none font-inherit transition-all ${dm ? 'bg-slate-800 border-slate-700 text-white focus:border-[#2D6A4F] placeholder:text-slate-500' : 'bg-gray-50 border-gray-100 focus:border-[#2D6A4F] focus:bg-white shadow-inner'}`} />
          </div>

          <button type="submit" disabled={!input.trim() || sending} aria-label="Отправить сообщение" title="Отправить"
            className={`shrink-0 w-[54px] h-[54px] rounded-2xl border-none text-white text-xl transition-all shadow-md active:scale-90 ${!input.trim() || sending ? "bg-gray-200 cursor-default opacity-50" : "bg-[#2D6A4F] cursor-pointer hover:bg-[#24533e]"}`}>
            ➤
          </button>
        </form>
      )}

      {/* Completion Bar — overlay on top of input when task is solved */}
      {prizStep >= 4 && countdown !== null && (
        <div className={`absolute bottom-0 left-0 right-0 z-30 px-3 py-4 border-t transition-all duration-500 animate-in slide-in-from-bottom-full ${dm ? 'border-slate-800 bg-[#0F172A]' : 'border-gray-100 bg-white'} pb-10`}>
          <div className="flex items-center gap-4 bg-[#2D6A4F] p-4 rounded-2xl shadow-lg border border-white/10">
            <div className="text-3xl">🏆</div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-[16px]">Задача решена!</div>
              <div className="text-white/70 text-[13px]">Финал через {countdown} сек.</div>
            </div>
            <button
              onClick={() => countdownRef.goToResult?.()}
              className="bg-white text-[#2D6A4F] px-6 py-3 rounded-xl text-[15px] font-bold shadow-xl active:scale-95 transition-all hover:bg-gray-100 flex-shrink-0">
              Смотреть результаты →
            </button>
          </div>
        </div>
      )}

      {/* Recording overlay — at top-level so fixed positioning works regardless of ancestor filters */}
      {isRecording && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-300 px-6">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${silenceCountdown !== null ? 'bg-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.6)]' : 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.8)] animate-pulse'}`}>
            {silenceCountdown !== null ? (
              <span className="text-white text-5xl font-bold tabular-nums">{silenceCountdown}</span>
            ) : (
              <span className="text-5xl">🎤</span>
            )}
          </div>
          <div className="text-white text-2xl font-bold mb-2">
            {silenceCountdown !== null ? "Тишина..." : speechText ? "Записываю..." : "Слушаю тебя..."}
          </div>
          {speechText ? (
            <div className="text-white/90 text-lg text-center max-w-[90vw] max-h-[30vh] overflow-auto bg-white/10 rounded-2xl px-4 py-3 mb-2 leading-relaxed">
              {speechText}
            </div>
          ) : (
            <div className="text-white/60 text-lg text-center">Говори смело, можно думать вслух!</div>
          )}
          {silenceCountdown !== null ? (
            <div className="text-amber-300/80 text-sm mt-1 mb-3">Отправлю через {silenceCountdown}... Говори — и таймер сбросится!</div>
          ) : (
            <div className="text-white/40 text-sm mt-1 mb-3">Пауза 5 сек → авто-отправка</div>
          )}
          <button onClick={stopSpeech} className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 transition-all active:scale-95">
            Отправить ✓
          </button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-base font-medium mb-1 text-[#1B1B1B]">{found.length > 0 ? `Найдено ${found.length} из ${total}. Уйти?` : "Уголёк не договорил! Точно уходим?"}</p>
            <p className="text-[12px] text-gray-400 mb-4">История переписки не сохранится</p>
            <div className="flex gap-2.5">
              <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-lg border border-gray-200 bg-white text-[15px] text-[#1B1B1B] cursor-pointer hover:bg-gray-50">Остаться</button>
              <button onClick={() => {
                setModal(false);
                const elapsed = finalizeCurrentTask();
                sendLogsToTelegramBot(task, messages, prizStep, elapsed, sessionTokensRef.current);
                setScreen("select"); setTask(null); setPendingBranch(null);
              }} className="flex-1 py-3 rounded-lg border-none bg-[#2D6A4F] text-white text-[15px] cursor-pointer hover:bg-[#24533e]">Уйти</button>
            </div>
          </div>
        </div>
      )}

      {/* Flying principle animation */}
      {flyingPrinciple && (
        <div className="fixed bottom-24 left-1/2 z-50 pointer-events-none"
          style={{ animation: 'flyUp 2.5s ease-in-out forwards', transform: 'translateX(-50%)' }}>
          <div className="bg-[#2D6A4F] text-white px-5 py-3 rounded-2xl shadow-xl text-[15px] font-bold whitespace-nowrap">
            ✓ {flyingPrinciple.text}
          </div>
        </div>
      )}
    </div>
  );

  /* ─── SCREEN: RESULT ─── */
  const currentTaskStats = taskStats[task?.id];
  const currentTaskTimeMs = currentTaskStats?.timeMs || 0;
  const timeStr = formatTime(currentTaskTimeMs);

  const finalCtaUrl = `https://t.me/${CONFIG.cta_telegram}?text=${encodeURIComponent(CONFIG.cta_message)}`;

  /* Stars display helper */
  const starsDisplay = score > 0
    ? Array.from({ length: Math.min(score, 15) }, () => "⭐").join("")
    : "";

  /* Result title — varies by score
     Min 3 stars (always from ✨ insight), max ≈ 6 (+ intermediate) */
  const resultTitle = score >= 6
    ? "Думает как изобретатель!"
    : score >= 4
      ? "Мастер решений!"
      : "Задача решена!";

  const resultSubtitle = score >= 6
    ? "Невероятно — задавал правильные вопросы с самого начала. Настоящий изобретательский склад ума."
    : score >= 4
      ? "Нашёл неочевидный путь и смог объяснить почему. Так и работает изобретательское мышление."
      : "Справился! Это только начало — с каждой задачей мышление становится острее.";

  return (
    <div className={`min-h-[100dvh] font-['DM_Sans',system-ui,sans-serif] ${dm ? 'bg-[#0F172A] text-slate-300' : 'bg-[#FAF9F6]'}`}
      style={dm ? { background: 'radial-gradient(circle at top, #1E293B 0%, #0F172A 100%)' } : {}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* Result screen header */}
      <div className={`px-4 py-4 flex items-center justify-between border-b ${dm ? 'border-slate-800 bg-slate-900/50 backdrop-blur-md' : 'border-gray-100 bg-white'}`}>
        <button onClick={() => setScreen("select")} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${dm ? 'text-slate-400 hover:text-slate-100 bg-slate-800/50' : 'text-gray-400 hover:text-gray-800 bg-gray-50'}`}>
          <span className="text-xl">←</span>
        </button>
        <div className="flex flex-col items-center">
          <span className={`text-[10px] font-black uppercase tracking-widest ${dm ? 'text-amber-500' : 'text-amber-600'}`}>Заслуженная награда</span>
          <span className={`text-sm font-black ${dm ? 'text-white' : 'text-slate-800'}`}>Ты — Мастер Изобретений! 🏆</span>
        </div>
        <button onClick={handleThemeToggle} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all text-sm ${dm ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
          {themeIcon}
        </button>
      </div>

      {/* Tab bar */}
      <div className={`flex border-b ${dm ? 'border-slate-800 bg-slate-900/30' : 'border-gray-100 bg-white'}`}>
        <button onClick={() => setResultTab('child')} className={`flex-1 py-3.5 text-center text-[14px] font-bold transition-all relative ${resultTab === 'child' ? (dm ? 'text-amber-400' : 'text-amber-600') : (dm ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600')}`}>
          🏆 Мои открытия
          {resultTab === 'child' && <div className={`absolute bottom-0 left-4 right-4 h-[3px] rounded-full ${dm ? 'bg-amber-400' : 'bg-amber-500'}`} />}
        </button>
        <button onClick={() => setResultTab('parent')} className={`flex-1 py-3.5 text-center text-[14px] font-bold transition-all relative ${resultTab === 'parent' ? (dm ? 'text-emerald-400' : 'text-[#2D6A4F]') : (dm ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700')}`}>
          📋 Для родителей
          {resultTab === 'parent' && <div className={`absolute bottom-0 left-4 right-4 h-[3px] rounded-full ${dm ? 'bg-emerald-400' : 'bg-[#2D6A4F]'}`} />}
          {resultTab !== 'parent' && (
            <span className="absolute -top-0.5 right-4 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dm ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${dm ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
            </span>
          )}
        </button>
      </div>

      {resultTab === 'child' && (
      <div className={`px-4 py-5 border-b ${dm ? 'border-slate-800 bg-slate-900/40' : 'border-amber-100 bg-amber-50/60'}`}>
        <div className="max-w-[480px] md:max-w-[600px] mx-auto">
          <div className="flex items-start gap-3 mb-4">
            <img src="./img/webp/ugolok.webp" alt="Уголёк"
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-300/60 shadow-sm flex-shrink-0 mt-0.5"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-amber-600 mb-1 uppercase tracking-tighter">{CONFIG.character.name}</div>
              {resultChildMessage ? (
                <p className={`text-[15px] leading-relaxed ${dm ? 'text-slate-100' : 'text-amber-900'}`}
                  dangerouslySetInnerHTML={{
                    __html: resultChildMessage
                      .replace(/^[\s]*[🐉🦎🔥]\s*/u, '')
                      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
                      .replace(/\*([^*]+)\*/g, '<em style="font-style:italic;opacity:0.8">$1</em>')
                  }} />
              ) : (
                <div className="flex items-center gap-2 py-1">
                  <div className="w-3 h-3 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin flex-shrink-0" />
                  <span className={`text-[13px] italic ${dm ? 'text-slate-500' : 'text-amber-700/60'}`}>Уголёк готовит сюрприз...</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {found.length < total && (
              <button
                onClick={() => {
                  const challengeMsg = "🔥 **Вызов принят!** Давай откроем еще один секрет ЭТОЙ ЖЕ задачи?";
                  setResultChildMessage(null);
                  continueSolving(challengeMsg);
                }}
                className="w-full bg-amber-400 text-amber-950 py-3 rounded-xl font-black text-[15px] transition-all active:scale-[0.98] hover:bg-amber-300 shadow-md shadow-amber-400/10">
                💡 ОТКРЫТЬ ЕЩЁ СЕКРЕТ!
              </button>
            )}

            <div className="flex gap-2">
              {!resultChildMessage && (
                <button
                  onClick={() => { setResultChildMessage(null); continueSolving(); }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] border-2 transition-all active:scale-[0.98] ${dm ? 'border-emerald-700/30 text-emerald-400 bg-emerald-900/10' : 'border-[#2D6A4F]/20 text-[#2D6A4F] bg-white'}`}>
                  🔄 Вернуться
                </button>
              )}
              <button
                onClick={() => {
                  setResultChildMessage(null);
                  setScreen('select');
                  setTimeout(() => setTask(null), 300);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-[13px] transition-all active:scale-[0.98] border ${dm ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
                🌟 Другая задача
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className="px-4 py-6 overflow-auto">
        <div className="max-w-[480px] md:max-w-[600px] mx-auto">

          {resultTab === 'child' ? (<>
          {/* ── Заголовок — Победа ── */}
          <div className="text-center mb-6">
            <div className="text-[72px] mb-3 animate-bounce">🏆</div>
            <h1 className={`font-['Playfair_Display',Georgia,serif] text-[26px] md:text-[32px] leading-tight mb-2 ${dm ? 'text-white' : 'text-[#1B1B1B]'}`}>
              {resultTitle}
            </h1>
            <p className={`text-[15px] mb-1 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{resultSubtitle}</p>
            <p className={`text-[13px] ${dm ? 'text-slate-600' : 'text-gray-400'}`}>«{task.title}»</p>
          </div>

          {/* ── TRIZ Invention Cards — BIG ── */}
          {aiReport?.principles?.length > 0 && (
            <div className="mb-6">
              <h2 className={`text-center text-[13px] font-black uppercase tracking-widest mb-4 ${dm ? 'text-amber-500' : 'text-amber-600'}`}>
                🔬 Твои изобретательские приёмы
              </h2>
              <div className="space-y-3">
                {aiReport.principles.map((p, i) => {
                  const key = findPrinciple(p.name);
                  const data = key ? TRIZ_PRINCIPLES[key] : null;
                  const teaserEx = data?.examples?.length > 0 ? data.examples[(i * 7 + p.name.length) % data.examples.length] : null;
                  return (
                  <button
                    key={i}
                    onClick={() => setActivePrinciple({ name: p.name, childUsage: p.childUsage })}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${p.isIFR
                      ? (dm ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'bg-amber-50 border-amber-300 shadow-md shadow-amber-200/50')
                      : (dm ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md')
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{p.isIFR ? '🏆' : '💡'}</span>
                        <div className="min-w-0">
                          <div className={`font-bold text-[16px] ${dm ? 'text-white' : 'text-slate-800'}`}>
                            {data?.title || p.name}
                            {p.isIFR && <span className={`ml-2 text-[11px] font-black px-2 py-0.5 rounded-full ${dm ? 'text-amber-400 bg-amber-500/20' : 'text-amber-600 bg-amber-100'}`}>ИКР</span>}
                          </div>
                          {/* Show child's usage — personal connection */}
                          {p.childUsage ? (
                            <div className={`text-[13px] mt-1 ${dm ? 'text-amber-400/80' : 'text-amber-700'}`}>
                              {p.childUsage}
                            </div>
                          ) : (
                            <div className={`text-[13px] mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                              {data?.description || 'Нажми чтобы узнать больше'}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`text-[20px] flex-shrink-0 ml-2 ${dm ? 'text-slate-600' : 'text-slate-300'}`}>›</span>
                    </div>
                    {teaserEx && (
                      <div className={`mt-3 pt-3 border-t text-[12px] ${dm ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                        ✨ Такой же приём в жизни: <b>{teaserEx.item}</b>
                      </div>
                    )}
                  </button>
                  );
                })}
              </div>
              <p className={`text-center text-[12px] mt-3 ${dm ? 'text-amber-500/60' : 'text-amber-600/60'}`}>
                👆 Нажми на карточку — узнай про настоящие изобретения!
              </p>
            </div>
          )}

          {/* ── Action buttons (child tab) ── */}
          <div className="space-y-3 mb-4">
            {found.length < total && (
              <button
                onClick={() => {
                  const challengeMsg = "🔥 **Вызов принят!** Давай откроем еще один секрет ЭТОЙ ЖЕ задачи?";
                  setResultChildMessage(null);
                  continueSolving(challengeMsg);
                }}
                className="w-full bg-amber-400 text-amber-950 py-3.5 rounded-xl font-black text-[15px] transition-all active:scale-[0.98] hover:bg-amber-300 shadow-md shadow-amber-400/10">
                💡 ОТКРЫТЬ ЕЩЁ СЕКРЕТ!
              </button>
            )}
            <button
              onClick={() => { setResultChildMessage(null); setScreen('select'); setTimeout(() => setTask(null), 300); }}
              className={`w-full py-3 rounded-xl font-bold text-[15px] transition-all active:scale-[0.98] border-2 ${dm ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}>
              🌟 Другая задача
            </button>
            <button onClick={continueSolving}
              className={`w-full py-2.5 rounded-xl text-[13px] font-medium border transition-all active:scale-95 ${dm ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
              🔄 Поискать другое решение
            </button>
          </div>
          </>) : (<>

          {/* ── Итоговая оценка ── */}
          <div className={`rounded-2xl px-5 py-4 mb-5 text-center border-2 ${dm
            ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-300'
            : 'bg-[#E7F3EF] border-[#2D6A4F]/20 text-[#2D6A4F]'}`}>
            <p className="font-bold text-[15px] leading-snug">{parentPhrase}</p>
          </div>

          {/* ── Комментарий педагога ── */}
          <div className={`rounded-[20px] p-5 border mb-5 ${dm ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-gray-100'} shadow-md`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🧠</span>
              <h3 className={`font-bold text-[16px] ${dm ? 'text-white' : 'text-[#1B1B1B]'}`}>Что освоил ребёнок</h3>
              <span className={`ml-auto text-[12px] font-medium ${dm ? 'text-slate-500' : 'text-gray-400'}`}>{timeStr}</span>
            </div>

            {aiReport?.principles?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {aiReport.principles.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePrinciple({ name: p.name, childUsage: p.childUsage })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all active:scale-95 border ${p.isIFR
                      ? (dm ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-amber-100/50 text-amber-700 border-amber-200 shadow-sm')
                      : (dm ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100')}`}>
                    {p.isIFR ? '🏆 ' : '💡 '}{findPrinciple(p.name) ? TRIZ_PRINCIPLES[findPrinciple(p.name)].title : p.name}
                    {p.isIFR && <span className="text-[10px] opacity-70 ml-0.5">ИКР</span>}
                  </button>
                ))}
              </div>
            )}

            {aiReport ? (
              <div className={`text-[14px] leading-relaxed space-y-2 ${dm ? 'text-slate-300' : 'text-gray-700'}`}>
                {typeof aiReport.report === 'string'
                  ? aiReport.report.split(/\n\n|\. (?=[А-ЯA-Z])/).filter(s => s.trim().length > 0).map((chunk, i) => (
                    <p key={i}>{chunk.trim().replace(/\.$/, '')}.</p>
                  ))
                  : typeof aiReport === 'string'
                    ? aiReport.split(/\n\n|\. (?=[А-ЯA-Z])/).filter(s => s.trim().length > 0).map((chunk, i) => (
                      <p key={i}>{chunk.trim().replace(/\.$/, '')}.</p>
                    ))
                    : <p>Ваш ребенок проявил отличную изобретательность при решении задачи!</p>
                }
              </div>
            ) : (
              <div className="flex items-center gap-2.5 py-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#2D6A4F]/40 border-t-[#2D6A4F] animate-spin flex-shrink-0" />
                <p className={`text-[13px] italic ${dm ? 'text-slate-500' : 'text-gray-400'}`}>Составляем комментарий педагога…</p>
              </div>
            )}
          </div>

          {/* ── Главный CTA — сразу после отчёта, на пике эмоций ── */}
          <div className={`rounded-[20px] p-5 border-2 mb-5 ${dm ? 'bg-slate-800/40 border-slate-700/50' : 'bg-[#E7F3EF] border-[#2D6A4F]/20'}`}>
            <h3 className={`font-bold text-[17px] mb-1.5 ${dm ? 'text-emerald-400' : 'text-[#2D6A4F]'}`}>🎓 ТРИЗ-занятия в онлайн-клубе</h3>
            <p className={`text-[13px] mb-4 ${dm ? 'text-slate-400' : 'text-gray-600'}`}>
              В нашем клубе разбираются сотни таких задач — дети учатся спорить, доказывать и изобретать вместе.
            </p>
            <a href={finalCtaUrl} target="_blank" rel="noreferrer"
              className="block w-full bg-[#2D6A4F] text-white py-4 rounded-2xl font-bold text-[17px] no-underline shadow-lg active:scale-95 transition-transform text-center">
              Записаться на бесплатный пробный урок 🚀
            </a>
            <p className={`text-center text-[11px] mt-2 ${dm ? 'text-slate-500' : 'text-gray-400'}`}>{CONFIG.cta_subtitle}</p>
          </div>

          {/* ── Что дала эта тренировка ── */}
          <div className={`rounded-[20px] p-5 border mb-5 ${dm ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🧠</span>
              <h3 className={`font-bold text-[16px] ${dm ? 'text-emerald-300' : 'text-emerald-800'}`}>Что дала эта тренировка</h3>
            </div>
            <div className="space-y-2">
              {[
                { icon: '✅', text: 'Искать ресурсы — видеть то, что уже есть рядом' },
                { icon: '✅', text: 'Формулировать противоречие — находить, что именно мешает' },
                { icon: '✅', text: 'Мыслить нестандартно — переворачивать задачу вместо лобового решения' },
              ].map((item, i) => (
                <div key={i} className={`flex gap-2 items-start text-[13px] leading-snug ${dm ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Подписка на новые задачи ── */}
          {CONFIG.subscribe_bot !== "ВАШ_БОТ" && (
            <a href={`https://t.me/${CONFIG.subscribe_bot}?start=result`} target="_blank" rel="noreferrer"
              className={`flex items-center gap-3 rounded-[20px] p-4 border mb-5 no-underline transition-all active:scale-[0.98] ${dm ? 'bg-blue-900/20 border-blue-800/40 hover:bg-blue-900/30' : 'bg-blue-50 border-blue-100 hover:bg-blue-100/80'}`}>
              <span className="text-2xl flex-shrink-0">🔔</span>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-[14px] ${dm ? 'text-blue-300' : 'text-blue-800'}`}>Следи за новыми задачами</div>
                <div className={`text-[12px] ${dm ? 'text-blue-400/70' : 'text-blue-600/70'}`}>Подпишись на бота — пришлём когда появится что-то новое</div>
              </div>
              <span className={`text-[12px] font-bold flex-shrink-0 ${dm ? 'text-blue-400' : 'text-blue-600'}`}>→</span>
            </a>
          )}

          {/* ── Поддержка ── */}
          {CONFIG.subscribe_bot !== "ВАШ_БОТ" && (
            <a href={`https://t.me/${CONFIG.subscribe_bot}?start=support`} target="_blank" rel="noreferrer"
              className={`flex items-center gap-3 rounded-[20px] p-3 border mb-5 no-underline transition-all active:scale-[0.98] ${dm ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
              <span className="text-lg flex-shrink-0">💬</span>
              <div className={`text-[13px] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                Нашли ошибку или есть идея? <b className={dm ? 'text-slate-300' : 'text-slate-700'}>Напишите нам</b>
              </div>
              <span className={`text-[12px] flex-shrink-0 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>→</span>
            </a>
          )}

          {/* ── Вторичные действия ── */}
          <div className="space-y-3 mb-8">
            <button onClick={async () => {
              const url = window.location.origin;
              const shareText = `Решили задачу «${task.title}» в тренажёре изобретательского мышления! Попробуй: ${url}`;
              try {
                if (navigator.share) { await navigator.share({ title: 'Тренажёр ТРИЗ', text: shareText, url }); return; }
              } catch { }
              try {
                await navigator.clipboard.writeText(shareText);
                alert('Ссылка скопирована в буфер!');
              } catch {
                window.prompt('Скопируй ссылку:', shareText);
              }
            }}
              className={`w-full py-3.5 rounded-2xl text-[15px] font-bold border-2 transition-all active:scale-95 flex items-center justify-center gap-2 ${dm ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              📤 Поделиться результатом
            </button>

            <button onClick={() => { setScreen("select"); setTask(null); }}
              className={`w-full text-[13px] font-medium transition-colors py-2 border-none bg-transparent cursor-pointer ${dm ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}>
              ↩ Вернуться к выбору задач
            </button>
          </div>

          </>)}

        </div>
      </div>
      {modal && <ImageModal src={task.image} onClose={() => setModal(false)} dm={dm} />}
      {activePrinciple && <PrincipleModal principle={activePrinciple.name || activePrinciple} childUsage={activePrinciple.childUsage} onClose={() => setActivePrinciple(null)} dm={dm} />}
    </div>
  );
}
