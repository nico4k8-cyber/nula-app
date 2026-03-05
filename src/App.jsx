import { useState, useRef, useEffect, useCallback } from "react";
import JSConfetti from 'js-confetti';


/* ═══ CONFIG ═══ */
const CONFIG = {
  cta_telegram: "FormulaIntelligenc",
  cta_message: 'Здравствуйте! Мой ребёнок прошёл тренажёр "Формула Интеллекта". Хочу записать на бесплатный урок.',
  cta_text: "Записать на бесплатный урок",
  cta_subtitle: "60 минут · Онлайн · До 8 детей в группе",
  character: { name: "Идейка", avatar: "💡" },
  delay_ms: { found: 1500, other: 800 },
  parent_phrases: {
    low: "Для первого раза — отличный результат! На пробном уроке будет 3 новых задачи",
    mid: "Впечатляюще! Ваш ребёнок близок к максимуму",
    all: "Все решения найдены — это редкий результат!",
  },
  logging: {
    botToken: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TG_TOKEN) || "8316651117:AAGd7FAWu4Q1vsDd0riKF-UcKYT4S7v3uF0",
    chatId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TG_CHAT) || "122107817",
  }
};

/* ═══ TASKS ═══ */
import { TASKS, PICK, processUserMessage } from "./bot/engine";

/* ═══ RENDER CONDITION ═══ */
function Condition({ text }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return <p className="text-[15px] leading-relaxed text-[#1B1B1B] mb-3">
    {parts.map((part, i) =>
      part.startsWith("**") ? <strong key={i} className="text-[#E57A44] font-bold">{part.slice(2, -2)}</strong> : part
    )}
  </p>;
}

/* ═══ TASK IMAGE ═══ */
function TaskImage({ task, size = "large" }) {
  const isLarge = size === "large";
  const src = isLarge ? task.image : task.thumb;
  return (
    <div className={`relative overflow-hidden ${isLarge ? "rounded-2xl bg-gray-50 border border-gray-100" : "rounded-xl w-16 h-16 shrink-0"}`}>
      <img
        src={src}
        alt={task.title}
        className={`w-full ${isLarge ? "aspect-[16/9] object-contain" : "h-full object-cover"}`}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
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

/* ═══ APP ═══ */
export default function App() {
  const [screen, setScreen] = useState("select");
  const [task, setTask] = useState(null);
  const [score, setScore] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [found, setFound] = useState([]);
  const [ikrPhase, setIkrPhase] = useState(0);
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
  const [adminClicks, setAdminClicks] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('fi_dark') === '1'; } catch { return false; }
  });
  const [themeClicks, setThemeClicks] = useState(0);
  const [childMode, setChildMode] = useState(() => {
    try { return sessionStorage.getItem('fi_child') === '1'; } catch { return false; }
  });
  const [sessionCompleted, setSessionCompleted] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('fi_completed') || '{}'); } catch { return {}; }
  });
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const ikrResourcesRef = useRef([]);
  const jsConfetti = useRef(null);
  const total = task ? Object.keys(task.branches).length : 0;

  useEffect(() => {
    jsConfetti.current = new JSConfetti();
  }, []);

  /* ─ Analytics (Yandex Metrika ID: 106910217) ─ */
  const trackEvent = useCallback((name, params = {}) => {
    console.log(`[Analytics] Event: ${name}`, params);
    try {
      if (window.ym) window.ym(106910217, 'reachGoal', name, params);
      if (window.gtag) window.gtag('event', name, params);
      if (window.posthog) window.posthog.capture(name, params);
    } catch (e) { }
  }, []);

  /* ─ Dialog logging (localStorage for admin audit) ─ */
  const logInteraction = useCallback((taskId, userText, botResponse, resultType) => {
    try {
      const key = 'fi_all_history';
      const logs = JSON.parse(localStorage.getItem(key) || '[]');
      logs.push({
        ts: new Date().toISOString(),
        task: taskId,
        input: userText,
        result: resultType,
        bot: botResponse?.substring(0, 300)
      });
      // Keep only last 1000 interactions to avoid quota issues
      if (logs.length > 1000) logs.shift();
      localStorage.setItem(key, JSON.stringify(logs));
    } catch (e) { console.warn("Storage quota exceeded"); }
  }, []);

  const formatTime = (ms) => {
    if (ms <= 0) return "0 сек";
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return mins > 0 ? `${mins} мин ${secs} сек` : `${secs} сек`;
  };

  const sendLogsToTelegramBot = useCallback(async (currentTask, currentMessages, currentFound, currentTotal, taskTimeMs) => {
    const { botToken, chatId } = CONFIG.logging;
    if (!botToken || botToken.includes("ВАШ_") || !chatId) {
      console.log("Telegram Bot logging skipped: No credentials.");
      return;
    }

    try {
      const timeStr = formatTime(taskTimeMs || 0);
      const logHeader = `🤖 <b>ОТЧЁТ О СЕССИИ ТРИЗ</b>\n<b>Задача:</b> ${currentTask.title}\n<b>Решений:</b> ${currentFound.length}/${currentTotal}\n<b>Время:</b> ${timeStr}\n\n`;
      const logBody = currentMessages
        .map(m => `<b>${m.role === "user" ? "👤 Ребенок" : "🤖 Бот"}:</b> ${m.text}`)
        .join("\n\n");

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: logHeader + logBody,
          parse_mode: "HTML"
        })
      });
      console.log("Logs sent to Telegram Bot successfully.");
    } catch (e) {
      console.error("Failed to send logs to Telegram Bot:", e);
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
      found_count: found.length
    });
    if (logs.length > 500) logs.shift(); // Limit to 500 sessions
    localStorage.setItem(key, JSON.stringify(logs));
  }, [messages, task, found.length]);

  const handleAdminClick = useCallback(() => {
    const next = adminClicks + 1;
    if (next >= 10) {
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
    const next = themeClicks + 1;
    if (next >= 5) {
      const newDark = !darkMode;
      setDarkMode(newDark);
      try { localStorage.setItem('fi_dark', newDark ? '1' : '0'); } catch { }
      setThemeClicks(0);
    } else {
      setThemeClicks(next);
    }
  }, [themeClicks, darkMode]);

  const markTaskCompleted = useCallback((taskId, foundCount, taskTimeMs) => {
    setSessionCompleted(prev => {
      const next = { ...prev, [taskId]: { solved: foundCount, at: Date.now() } };
      try { sessionStorage.setItem('fi_completed', JSON.stringify(next)); } catch { }
      return next;
    });
    // Trigger background upload & backup
    if (task) {
      sendLogsToTelegramBot(task, messages, found, total, taskTimeMs);
      saveLogsToServer();
    }
  }, [task, messages, found, total, sendLogsToTelegramBot, saveLogsToServer]);

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
          found: found.length,
          attempts: attempts,
          messages: totalMessages,
          title: task.title,
          icon: task.icon,
          total: Object.keys(task.branches).length,
        }
      };
    });
    setTaskStartTime(null);
    return elapsed;
  }, [task, taskStartTime, found.length, attempts, totalMessages]);

  const selectTask = (t) => {
    if (task && taskStartTime) finalizeCurrentTask();
    trackEvent('task_selected', { task_id: t.id });
    setTask(t);
    setScreen("solve");
    setMessages([{ role: "system", text: t.ikr_steps[0] }]);
    setFound([]);
    setIkrPhase(0);
    setFbIdx(0);
    setStreak(0);
    setAttempts(0);
    setTotalMessages(0);
    setPendingBranch(null);
    setShowCondition(true);
    setImageExpanded(false); // Reset on task select
    setTaskStartTime(Date.now());
    ikrResourcesRef.current = [];
  };

  const goBack = () => {
    if (found.length > 0 && screen === "solve") setModal(true);
    else { finalizeCurrentTask(); setScreen("select"); setTask(null); setPendingBranch(null); }
  };

  const send = useCallback(async () => {
    if (sending || !input.trim()) return;
    const txt = input.trim();
    setInput(""); setSending(true);
    setTotalMessages(m => m + 1);
    trackEvent('message_sent', { task_id: task.id, ikr_phase: ikrPhase });
    if (showCondition) setShowCondition(false);
    if (ikrPhase === 0) setAttempts((a) => a + 1);
    setMessages((p) => [...p, { role: "user", text: txt }]);
    setTyping(true);

    /* ─── Call the pure engine function ─── */
    const engineState = {
      ikrPhase,
      found,
      ikrResources: [...ikrResourcesRef.current],
      pendingBranch,
      fbIdx,
      streak,
    };
    const { reply, newState, resultType } = await processUserMessage(txt, task, engineState);
    const delay = resultType === "found" ? CONFIG.delay_ms.found : CONFIG.delay_ms.other;

    setTimeout(() => {
      setTyping(false);

      /* ─── Apply engine state back to React ─── */
      if (newState.ikrPhase !== ikrPhase) setIkrPhase(newState.ikrPhase);
      if (newState.fbIdx !== fbIdx) setFbIdx(newState.fbIdx);
      if (newState.streak !== streak) setStreak(newState.streak);
      if (newState.pendingBranch !== pendingBranch) setPendingBranch(newState.pendingBranch);
      ikrResourcesRef.current = newState.ikrResources || ikrResourcesRef.current;

      setMessages((p) => [...p, { role: "system", text: reply }]);

      if (newState.newBranch) {
        const branchData = task.branches[newState.newBranch];
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
            setFlyingPrinciple({ text: branchData.principle_child, count: next.length, total });
            setTimeout(() => setFlyingPrinciple(null), 2500);
          }, 1200);
          setTimeout(() => setShowChoice(true), 3200);
          if (next.length === total) {
            const elapsed = taskStartTime ? (Date.now() - taskStartTime) : 0;
            markTaskCompleted(task.id, next.length, elapsed);
          }
          return next;
        });
      }
      /* Log the interaction */
      logInteraction(task.id, txt, reply, resultType);
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }, delay);
  }, [input, sending, task, found, fbIdx, total, ikrPhase, pendingBranch, streak]);

  useEffect(() => {
    dialogRef.current?.scrollTo({ top: dialogRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, showChoice, modal]);

  const parentPhrase = found.length === total ? CONFIG.parent_phrases.all : found.length >= total / 2 ? CONFIG.parent_phrases.mid : CONFIG.parent_phrases.low;
  const initialCtaUrl = `https://t.me/${CONFIG.cta_telegram}?text=${encodeURIComponent(CONFIG.cta_message)}`;

  const dm = darkMode;

  /* ─── SCREEN: SELECT ─── */
  if (screen === "select") {
    /* ── PARENT HANDOFF SCREEN ── */
    if (!childMode) return (
      <div className={`min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10 font-['DM_Sans',system-ui,sans-serif] ${dm ? 'bg-[#1a1a2e] text-[#E0E0E0]' : 'bg-[#FAF9F6]'}`}>
        <style>{`@keyframes blink{0%,80%{opacity:.2}40%{opacity:1}}`}</style>
        <div className="max-w-[420px] w-full">
          <h1 className={`font-['Playfair_Display',Georgia,serif] text-[26px] md:text-[32px] leading-tight mb-3 ${dm ? 'text-white' : 'text-[#1B1B1B]'}`}>
            Формула Интеллекта
          </h1>
          <p className={`text-[15px] leading-relaxed mb-6 ${dm ? 'text-[#B0B0C0]' : 'text-[#4A4A4A]'}`}>
            4 нестандартные задачи на изобретательное мышление — для детей 8–12 лет. Каждая задача учит видеть противоречие и находить несколько решений с помощью того, что уже есть под рукой.
          </p>

          <div className={`rounded-2xl p-4 mb-6 ${dm ? 'bg-[#16213e]' : 'bg-white'} border ${dm ? 'border-white/10' : 'border-gray-100'} shadow-sm`}>
            <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-3">Как это работает:</p>
            <div className="space-y-2 text-[14px] text-gray-600">
              <div className="flex gap-2"><span>1.</span><span>Ребёнок читает задачу и предлагает решения в чате</span></div>
              <div className="flex gap-2"><span>2.</span><span>Бот задаёт наводящие вопросы — не даёт готовых ответов</span></div>
              <div className="flex gap-2"><span>3.</span><span>В конце вы видите аналитику и сколько решений нашёл ребёнок</span></div>
            </div>
          </div>

          <button
            onClick={() => {
              try { sessionStorage.setItem('fi_child', '1'); } catch { }
              setChildMode(true);
            }}
            className="w-full bg-[#2D6A4F] text-white border-none rounded-2xl py-4 px-6 text-[17px] font-bold cursor-pointer hover:bg-[#24533e] transition-colors shadow-md mb-3">
            Передать телефон ребёнку →
          </button>
          <p className="text-center text-[12px] text-gray-400">Нажмите и передайте телефон — дальше бот работает сам</p>
        </div>
      </div>
    );

    /* ── CHILD TASK SELECT SCREEN ── */
    return (
      <div className={`min-h-[100dvh] px-4 py-5 font-['DM_Sans',system-ui,sans-serif] ${dm ? 'bg-[#1a1a2e] text-[#E0E0E0]' : 'bg-[#FAF9F6]'}`}>
        <div className="max-w-[480px] md:max-w-[720px] lg:max-w-[900px] mx-auto">

          {/* Small "back to parent" link */}
          <div className="flex justify-end mb-3">
            <button onClick={() => {
              try { sessionStorage.removeItem('fi_child'); } catch { }
              setChildMode(false);
            }} className="text-[12px] text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer underline">
              👋 Для родителя
            </button>
          </div>

          {/* Идейка greeting */}
          <div className={`rounded-2xl p-4 mb-6 flex gap-3 items-start ${dm ? 'bg-amber-900/20' : 'bg-amber-50'} border ${dm ? 'border-amber-700/30' : 'border-amber-100'} shadow-sm`}>
            <span className="text-3xl cursor-pointer select-none active:scale-95 transition-transform"
              title="Для учителя"
              onClick={handleAdminClick}>{CONFIG.character.avatar}</span>
            <div>
              <div className="text-[12px] font-bold text-amber-600 mb-0.5 uppercase tracking-wider">{CONFIG.character.name}</div>
              <div className="text-[16px] text-gray-800 leading-snug">
                Привет! Выбирай любую задачу. В каждой — своя загадка: что-то мешает, и нужно придумать хитрое решение. Подсказки будут, если застрянешь. <strong>Готов?</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TASKS.map((t) => {
              const completed = sessionCompleted[t.id];
              return (
                <div key={t.id} onClick={() => selectTask(t)}
                  role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && selectTask(t)}
                  className={`rounded-2xl p-4 cursor-pointer border-2 transition-all duration-200 shadow-sm outline-none focus:border-[#2D6A4F] ${dm ? 'bg-[#16213e]' : 'bg-white'} ${completed ? 'border-[#2D6A4F]/30 opacity-60' : `border-transparent hover:border-[#2D6A4F] hover:-translate-y-0.5`}`}>
                  <div className="mb-3 relative">
                    <TaskImage task={t} size="small" />
                    {completed && <div className="absolute top-1 right-1 bg-[#2D6A4F] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</div>}
                  </div>
                  <div className={`font-bold text-[15px] mb-1 ${dm ? 'text-[#E0E0E0]' : 'text-[#1B1B1B]'}`}>{t.title}</div>
                  <div className="text-[13px] text-gray-500 leading-snug">{completed ? 'Решено ✔' : t.teaser}</div>
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
    <div className={`h-[100dvh] flex flex-col max-w-[480px] md:max-w-[720px] lg:max-w-[900px] mx-auto font-['DM_Sans',system-ui,sans-serif] ${dm ? 'bg-[#1a1a2e] text-[#E0E0E0]' : 'bg-[#FAF9F6]'}`}>
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
      `}</style>

      {imageExpanded && <ImageModal src={task.image} onClose={() => setImageExpanded(false)} dm={dm} />}

      {/* Header with inline progress */}
      <div className={`px-3 py-2 flex items-center gap-2 border-b ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
        <button onClick={goBack} aria-label="Назад к задачам" className={`bg-transparent border-none text-lg cursor-pointer p-3 -ml-1 rounded-lg hover:bg-black/5 active:bg-black/10 transition-colors ${dm ? 'text-white' : ''}`}>←</button>
        <span className="text-lg cursor-pointer active:scale-90 transition-transform" onClick={handleThemeToggle}>{CONFIG.character.avatar}</span>
        <span className={`font-bold text-[14px] truncate flex-1 ${dm ? 'text-white' : 'text-[#1B1B1B]'}`}>{task.title}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#2D6A4F] rounded-full transition-all duration-700"
              style={{ width: `${(found.length / total) * 100}%`, animation: flyingPrinciple ? 'progressPulse 0.8s ease-out' : 'none' }} />
          </div>
          <span className="text-[12px] font-bold text-[#2D6A4F] min-w-[24px]">{found.length}/{total}</span>
        </div>
      </div>

      {/* Task Condition block — Sticky & Compact as requested */}
      <div className={`sticky top-0 z-20 px-3 py-1.5 border-b transition-all duration-300 ${dm ? 'bg-[#1a1a2e]/95 border-gray-700' : 'bg-white/95 border-gray-200'} backdrop-blur-md`}>
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="text-sm">📜</span>
            <div className={`text-[13px] font-bold truncate ${dm ? 'text-white' : 'text-[#1B1B1B]'}`}>{task.title}</div>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-100/80 px-2.5 py-1 rounded-full border border-yellow-200 shadow-sm">
            <span className="text-yellow-600 text-sm animate-pulse">⭐</span>
            <span className="text-yellow-700 font-bold text-xs">{score}</span>
          </div>
        </div>

        {/* Task Image — Always visible, toggles size */}
        <div className={`relative rounded-xl overflow-hidden border border-gray-100 mb-2 cursor-zoom-in group transition-all duration-300 ${showCondition ? 'max-h-[320px]' : 'max-h-[64px]'}`}
          onClick={() => setImageExpanded(true)}>
          <img src={task.image} alt={task.title} className="w-full h-auto object-contain bg-gray-50"
            style={{ maxHeight: showCondition ? '320px' : '64px' }} />
          <div className={`absolute inset-0 bg-black/5 flex items-center justify-center transition-opacity ${showCondition ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            <span className={`${showCondition ? 'text-2xl' : 'text-lg'} drop-shadow-md`}>🔍</span>
          </div>
        </div>

        {showCondition && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300 mb-2">
            <Condition text={task.condition} />
          </div>
        )}

        <button onClick={() => setShowCondition(!showCondition)} className={`w-full py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-colors uppercase tracking-wider rounded-lg ${dm ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
          {showCondition ? "Свернуть описание" : "Развернуть описание"}
          <span className={`transition-transform duration-300 ${showCondition ? 'rotate-180' : ''}`}>▼</span>
        </button>
      </div>

      {/* Dialog area — only messages scroll */}
      <div ref={dialogRef} className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-3 scroll-smooth">
        {/* Show all button — moved higher to avoid accidental clicks near input */}
        {attempts >= 8 && found.length < total && !showChoice && (
          <button onClick={() => { finalizeCurrentTask(); setScreen("result"); }}
            className="self-center bg-white border border-gray-300 rounded-lg px-4 py-2 text-[12px] text-gray-400 cursor-pointer mb-2 hover:bg-gray-50 transition-colors shadow-sm"
            style={{ animation: 'popIn 0.4s ease-out' }}>
            🏁 Показать все решения
          </button>
        )}

        {/* Messages */}
        {messages.map((m, i) => {
          const parts = m.text.split('\n\n').filter(p => p.trim() !== '');
          return (
            <div key={i} className={`flex flex-col gap-2 w-full mt-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
              {parts.map((part, partIdx) => (
                <div key={partIdx} className={`max-w-[82%] md:max-w-[70%] px-3.5 py-2.5 text-[15px] md:text-[16px] leading-snug whitespace-pre-wrap ${m.role === "user" ? `rounded-[14px_14px_4px_14px] ${dm ? 'bg-[#2D6A4F]/30 text-[#E0E0E0]' : 'bg-[#2D6A4F]/10 text-[#1B1B1B]'}` : `rounded-[14px_14px_14px_4px] ${dm ? 'bg-[#C9943A]/20 text-[#E0E0E0]' : 'bg-[#C9943A]/10 text-[#1B1B1B]'}`}`}>
                  {m.role === "system" && partIdx === 0 && <div className="text-[11px] font-bold text-[#C9943A] mb-0.5">{CONFIG.character.name}</div>}
                  {m.role === "system"
                    ? <span dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') }} />
                    : part}
                </div>
              ))}
            </div>
          );
        })}

        {/* Typing indicator */}
        {typing && (
          <div className="flex">
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
        <div className="bg-white rounded-[16px] p-5 shadow-lg border-2 border-[#2D6A4F]/10 mx-3 mb-4 transition-all" style={{ animation: "popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
          <div className="flex flex-col gap-2.5">
            {found.length < total && (
              <button onClick={() => { setShowChoice(false); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="w-full bg-[#2D6A4F] text-white border-none rounded-xl py-3.5 px-4 text-[16px] font-bold cursor-pointer hover:bg-[#24533e] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2">
                <span>💡</span> Искать другие решения!
              </button>
            )}
            <button onClick={() => {
              setShowChoice(false);
              const elapsed = finalizeCurrentTask();
              trackEvent('result_screen_opened', { task_id: task.id, found: found.length });
              sendLogsToTelegramBot(task, messages, found, total, elapsed);
              setScreen("result");
            }}
              className="w-full bg-white border-2 border-gray-200 text-[#1B1B1B] rounded-xl py-3.5 px-4 text-[15px] font-medium cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <span>🏆</span> Посмотреть результаты
            </button>
          </div>
        </div>
      )}

      {/* Input — hidden when choice card is shown */}
      {!showChoice && (
        <div className={`px-3 py-2 border-t flex gap-2 transition-all duration-300 ${dm ? 'border-gray-700 bg-[#1a1a2e]' : 'border-gray-200 bg-[#FAF9F6]'} ${isFocused ? 'pb-2' : 'pb-3'}`}>
          <input ref={inputRef} value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 50)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={ikrPhase === 2 ? "Перечисли, что видишь..." : ikrPhase === 1 ? "Что мешает и почему?" : ikrPhase === 3 ? "Как это сделать САМО? 🌟" : attempts === 0 ? "Напиши свою идею сюда..." : "А ещё как можно? Совсем по-другому"}
            className={`flex-1 border-2 rounded-xl px-3.5 py-2.5 text-base outline-none font-inherit transition-colors ${dm ? 'bg-[#16213e] border-gray-600 text-white focus:border-[#2D6A4F] placeholder:text-gray-500' : 'bg-white border-gray-200 focus:border-[#2D6A4F]'}`} />
          <button onClick={send} disabled={!input.trim() || sending} aria-label="Отправить сообщение" title="Отправить"
            className={`shrink-0 w-[48px] h-[48px] rounded-xl border-none text-white text-xl transition-colors ${!input.trim() || sending ? "bg-gray-200 cursor-default" : "bg-[#2D6A4F] cursor-pointer hover:bg-[#24533e]"}`}>
            ➤
          </button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center">
            <p className="text-base font-medium mb-4 text-[#1B1B1B]">Найдено {found.length} из {total}. Уйти?</p>
            <div className="flex gap-2.5">
              <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-lg border border-gray-200 bg-white text-[15px] text-[#1B1B1B] cursor-pointer hover:bg-gray-50">Остаться</button>
              <button onClick={() => { setModal(false); finalizeCurrentTask(); setScreen("select"); setTask(null); setPendingBranch(null); }} className="flex-1 py-3 rounded-lg border-none bg-[#2D6A4F] text-white text-[15px] cursor-pointer hover:bg-[#24533e]">Уйти</button>
            </div>
          </div>
        </div>
      )}

      {/* Flying principle animation */}
      {flyingPrinciple && (
        <div className="fixed bottom-24 left-1/2 z-50 pointer-events-none"
          style={{ animation: 'flyUp 2.5s ease-in-out forwards', transform: 'translateX(-50%)' }}>
          <div className="bg-[#2D6A4F] text-white px-5 py-3 rounded-2xl shadow-xl text-[15px] font-bold whitespace-nowrap">
            ✓ {flyingPrinciple.text} ({flyingPrinciple.count}/{flyingPrinciple.total})
          </div>
        </div>
      )}
    </div>
  );

  /* ─── SCREEN: RESULT ─── */
  const currentTaskStats = taskStats[task?.id];
  const currentTaskTimeMs = currentTaskStats?.timeMs || 0;
  const timeStr = formatTime(currentTaskTimeMs);

  const getTeacherComment = (foundCount, totalCount) => {
    if (foundCount === totalCount) return `Ваш ребёнок нашёл все ${totalCount} решения — это редкий результат. Он не остановился на первой идее, а последовательно искал разные подходы. Именно так работает изобретательское мышление: не одно «правильное» решение, а несколько рабочих.`;
    if (foundCount >= 2) return `${foundCount} из ${totalCount} решений — сильный результат. Ребёнок смог переключаться между разными подходами к одной задаче. Это ключевой навык ТРИЗ: видеть задачу с нескольких сторон.`;
    if (foundCount === 1) return `Первое решение найдено. Для открытой задачи — это уже хороший старт: нет единственно верного ответа, и ребёнок это понял. Остальные решения можно разобрать вместе, нажав «Показать».`;
    return `Открытые задачи непривычны — в них нет «правильного» ответа в учебнике. Попробуйте разобрать решения вместе: нажмите «Показать» рядом с каждым и обсудите, почему это работает.`;
  };

  const finalCtaUrl = `https://t.me/${CONFIG.cta_telegram}?text=${encodeURIComponent(CONFIG.cta_message)}`;

  return (
    <div className={`min-h-[100dvh] px-4 py-5 font-['DM_Sans',system-ui,sans-serif] ${dm ? 'bg-[#1a1a2e] text-[#E0E0E0]' : 'bg-[#FAF9F6]'}`}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;700&display=swap');`}</style>
      <div className="max-w-[480px] md:max-w-[720px] lg:max-w-[900px] mx-auto">

        {/* ── ДЛЯ РЕБЁНКА ── */}
        <div className="mb-8">
          <div className="text-center mb-5">
            <div className="text-[48px] mb-2">{found.length === total ? "🏆" : found.length >= 2 ? "🌟" : "👍"}</div>
            <h1 className={`font-['Playfair_Display',Georgia,serif] text-[24px] md:text-[28px] leading-tight mb-1 ${dm ? 'text-white' : 'text-[#1B1B1B]'}`}>
              {found.length === total ? "Все решения найдены!" : found.length >= 2 ? `Найдено ${found.length} решения!` : found.length === 1 ? "Одно решение найдено!" : "Задача пройдена!"}
            </h1>
            <p className={`text-[14px] ${dm ? 'text-[#B0B0C0]' : 'text-gray-500'}`}>Задача «{task.title}»</p>
          </div>

          {/* Навигация */}
          <div className="flex gap-2 mb-5">
            {found.length < total && (
              <button onClick={() => { setTaskStartTime(Date.now()); setScreen("solve"); }}
                className={`flex-1 border rounded-xl py-2.5 px-3 text-[14px] font-medium cursor-pointer transition-colors ${dm ? 'bg-[#16213e] border-white/10 text-[#E0E0E0] hover:bg-white/5' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                ⬅️ Дорешать
              </button>
            )}
            <button onClick={() => { setScreen("select"); setTask(null); }}
              className={`${found.length < total ? "flex-1" : "w-full"} rounded-xl py-2.5 px-3 text-[14px] font-medium cursor-pointer transition-colors border ${dm ? 'bg-[#2D6A4F]/20 border-[#2D6A4F]/30 text-[#52a880] hover:bg-[#2D6A4F]/30' : 'bg-white border-[#2D6A4F]/30 text-[#2D6A4F] hover:bg-[#2D6A4F]/5'}`}>
              🔄 Другая задача
            </button>
          </div>

          {/* Что было решено */}
          <p className={`text-center text-[13px] italic mb-3 px-2 ${dm ? 'text-[#52a880]' : 'text-[#2D6A4F]'}`}>{task.final_phrase}</p>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(task.branches).map(([id, b]) => {
              const isFound = found.includes(id);
              const isRevealed = revealed[id];
              return (
                <div key={id} className={`rounded-xl px-4 py-3 border ${isFound
                  ? dm ? "border-[#2D6A4F]/50 bg-[#2D6A4F]/10" : "border-[#2D6A4F] bg-[#2D6A4F]/5"
                  : dm ? "border-white/10 bg-[#16213e]" : "border-gray-200 bg-white"}`}>
                  <div className="flex justify-between items-center gap-2">
                    <span className={`font-bold text-[13px] ${isFound ? "text-[#2D6A4F]" : dm ? "text-gray-500" : "text-gray-400"}`}>
                      {isFound ? "✓ " : ""}{b.principle_child}
                    </span>
                    {!isFound && !isRevealed && (
                      <button onClick={() => setRevealed((p) => ({ ...p, [id]: true }))}
                        className={`bg-transparent border rounded px-2 py-0.5 text-[11px] cursor-pointer ${dm ? 'border-white/20 text-gray-400 hover:bg-white/5' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                        Показать
                      </button>
                    )}
                  </div>
                  {(isFound || isRevealed) && (
                    <p className={`text-[12px] leading-snug mt-1 m-0 ${dm ? 'text-[#B0B0C0]' : 'text-gray-600'}`}>
                      {b.reaction_found_detailed || b.echo_word}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── РАЗДЕЛИТЕЛЬ ── */}
        <div className={`flex items-center gap-3 mb-6 ${dm ? 'text-gray-600' : 'text-gray-300'}`}>
          <div className="flex-1 h-px bg-current opacity-30" />
          <span className={`text-[11px] uppercase tracking-widest font-semibold ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Для родителя</span>
          <div className="flex-1 h-px bg-current opacity-30" />
        </div>

        {/* ── ДЛЯ РОДИТЕЛЯ ── */}

        {/* Аналитика */}
        <div className={`rounded-[16px] p-5 shadow-sm border mb-4 ${dm ? 'bg-[#16213e] border-white/10' : 'bg-white border-gray-100'}`}>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className={`rounded-xl p-3 ${dm ? 'bg-[#2D6A4F]/20' : 'bg-[#2D6A4F]/5'}`}>
              <div className="text-[20px] font-bold text-[#2D6A4F] mb-1">{found.length}/{total}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Решений</div>
            </div>
            <div className={`rounded-xl p-3 ${dm ? 'bg-[#2D6A4F]/20' : 'bg-[#2D6A4F]/5'}`}>
              <div className="text-[16px] font-bold text-[#2D6A4F] mb-1 mt-[2px]">{timeStr}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-[2px]">Время</div>
            </div>
            <div className={`rounded-xl p-3 ${dm ? 'bg-[#2D6A4F]/20' : 'bg-[#2D6A4F]/5'}`}>
              <div className="text-[20px] font-bold text-[#2D6A4F] mb-1">{totalMessages}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Попыток</div>
            </div>
          </div>
          <h3 className={`font-bold text-[16px] mb-2 flex items-center gap-2 ${dm ? 'text-[#E0E0E0]' : 'text-[#1B1B1B]'}`}>
            <span className="text-xl">👩‍🏫</span> Комментарий педагога:
          </h3>
          <p className={`text-[14px] leading-relaxed italic rounded-xl p-4 border ${dm ? 'text-[#B0B0C0] bg-white/5 border-white/10' : 'text-[#4A4A4A] bg-gray-50 border-gray-100'}`}>
            «{getTeacherComment(found.length, total)}»
          </p>
        </div>

        {/* Статистика сессии */}
        {Object.keys(taskStats).length > 1 && (
          <div className={`rounded-[16px] p-4 shadow-sm border mb-4 ${dm ? 'bg-[#16213e] border-white/10' : 'bg-white border-gray-100'}`}>
            <h3 className={`font-bold text-[15px] mb-3 flex items-center gap-2 ${dm ? 'text-[#E0E0E0]' : 'text-[#1B1B1B]'}`}>
              <span className="text-lg">📊</span> Статистика сессии
            </h3>
            {(() => {
              const entries = Object.entries(taskStats);
              const totalTimeAll = entries.reduce((s, [, v]) => s + v.timeMs, 0);
              return (
                <div className="space-y-1.5">
                  {entries.map(([id, s]) => (
                    <div key={id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] ${id === task?.id
                      ? dm ? 'bg-[#2D6A4F]/20 border border-[#2D6A4F]/30' : 'bg-[#2D6A4F]/10 border border-[#2D6A4F]/20'
                      : dm ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <span className="text-base">{s.icon}</span>
                      <span className={`flex-1 font-medium truncate ${id === task?.id ? 'text-[#2D6A4F]' : dm ? 'text-[#E0E0E0]' : 'text-[#1B1B1B]'}`}>{s.title}</span>
                      <span className="text-[12px] text-gray-500 shrink-0">{s.found}/{s.total}</span>
                      <span className="text-[12px] text-gray-400 shrink-0 min-w-[60px] text-right">{formatTime(s.timeMs)}</span>
                    </div>
                  ))}
                  <div className={`text-[12px] text-right pt-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                    Всего: {formatTime(totalTimeAll)}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* CTA */}
        <a href={finalCtaUrl} className="block no-underline mb-2" onClick={() => trackEvent('cta_clicked', { task_id: task.id, source: 'result_screen' })}>
          <button className="w-full bg-[#E57A44] text-white border-none rounded-[14px] py-4 px-6 text-[17px] font-bold cursor-pointer font-inherit hover:bg-[#d66a36] transition-colors shadow-md">
            ✈️ {CONFIG.cta_text}
          </button>
        </a>
        <p className="text-center text-[12px] text-gray-400 mt-1 mb-6">{CONFIG.cta_subtitle}</p>

        {/* Поделиться */}
        <button onClick={() => {
          trackEvent('share_clicked', { task_id: task.id });
          const shareText = `Прошли ТРИЗ-тренажёр «Формула Интеллекта» — задача «${task.title}», найдено ${found.length}/${total} решений. Попробуйте: https://formula-intellect.vercel.app`;
          if (navigator.share) {
            navigator.share({ title: 'Формула Интеллекта', text: shareText }).catch(() => { });
          } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => alert('Скопировано! Отправьте друзьям 💌'));
          }
        }}
          className={`w-full border rounded-xl py-2.5 px-4 text-[13px] font-medium cursor-pointer transition-colors mb-8 flex items-center justify-center gap-2 ${dm ? 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          📤 Поделиться результатом
        </button>
      </div>
    </div>
  );
}
