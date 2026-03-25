import { useState, useRef, useEffect } from "react";
import { TASKS } from "./tasks";
import { askAI } from "./ai";
import City from "./City";
import DragonBubbleScreen from "./DragonBubbleScreen";
import UnlockAnimation from "./UnlockAnimation";
import TaskGenerator from "./TaskGenerator";
import DragonSplashScreen from "./DragonSplashScreen";
import { useAudio } from "./useAudio";

/* ═══ localStorage ═══ */
const STORAGE_KEY = "razgadai_v1";
function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}
function saveState(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

/* ═══ TopProgress ═══ */
function TopProgress({ collected, current }) {
  return (
    <div className="flex justify-center gap-2 py-3">
      {TASKS.map((t, i) => {
        const done = collected.includes(t.id);
        const active = current === i;
        return (
          <div key={t.id}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all
              ${done ? "bg-green-500 text-white" : active ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"}`}
          >
            {done ? "✓" : active ? t.puzzle.emoji : i + 1}
          </div>
        );
      })}
    </div>
  );
}

/* ═══ thinkingType ═══ */
function thinkingType(stars) {
  if (stars >= 28) return { label: "Гений природы",    emoji: "🧠" };
  if (stars >= 16) return { label: "Мастер решений",   emoji: "⚡" };
  if (stars >= 7)  return { label: "Юный детектив",    emoji: "🔍" };
  return               { label: "Любознайка",          emoji: "🌱" };
}

/* ═══ methodDescription ═══ */
function methodDescription(methodName) {
  const descriptions = {
    "Наоборот": "Ты узнал, что иногда нужно противоположное решение. Переверни проблему — и ответ станет очевидным.",
    "Дробление": "Ты открыл, как природа использует части для решения. Маленькие кусочки работают лучше, чем целое.",
    "Посредник": "Ты увидел, как промежуточный помощник решает конфликт. Добавь посредника — и противоречие исчезнет.",
    "Фазовый переход": "Ты заметил, как смена состояния (жидкое ↔ твёрдое) решает задачу. Фаза вещества — мощный инструмент.",
    "Эхо": "Ты услышал отражение и повтор. Когда система сама себе помогает, проблема решается элегантно.",
    "Слои": "Ты разглядел скрытые слои и оболочки. Природа кладёт решение слой за слоем."
  };
  return descriptions[methodName] || "";
}

/* ═══ SettingsMenu ═══ */
function SettingsMenu({ isOpen, onClose, ageGroup, onChangeAge, onResetProgress, collected, audio, audioTracks }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[24px] p-6 flex flex-col gap-4 shadow-lg">
        <div className="text-center mb-2">
          <h3 className="text-[18px] font-bold text-gray-900">Меню</h3>
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
          {/* Audio toggle */}
          <button onClick={() => { audio.toggle(); }}
            className="w-full text-left px-4 py-3 rounded-[14px] hover:bg-gray-50 flex items-center gap-3 transition-all"
          >
            <span className="text-xl">{audio.isEnabled ? "🔊" : "🔇"}</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-[15px]">Музыка</div>
              <div className="text-gray-500 text-[13px]">
                {audio.isEnabled ? "Включено" : "Отключено"}
              </div>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          {/* Track selection */}
          {audio.isEnabled && (
            <div className="px-4 py-3 rounded-[14px] bg-gray-50 flex flex-col gap-3">
              <div className="text-[13px] font-semibold text-gray-700">
                🎵 {audio.currentTrack?.name || "Загрузка..."}
              </div>
              <div className="flex items-center gap-2 justify-between">
                <button onClick={() => audio.prevTrack()}
                  className="flex-1 py-2 px-3 rounded-[10px] bg-white border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  ← Пред.
                </button>
                <div className="text-[12px] text-gray-500 px-2">
                  {audio.currentTrackIndex + 1}/{audioTracks.length}
                </div>
                <button onClick={() => audio.nextTrack()}
                  className="flex-1 py-2 px-3 rounded-[10px] bg-white border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  След. →
                </button>
              </div>
            </div>
          )}

          {/* City */}
          <button onClick={() => {
            // Signal to App that city was clicked
            window.__openCity = true;
            onClose();
          }}
            className="w-full text-left px-4 py-3 rounded-[14px] hover:bg-gray-50 flex items-center gap-3 transition-all"
          >
            <span className="text-xl">🏙️</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-[15px]">Мой город</div>
              <div className="text-gray-500 text-[13px]">Посмотри свой прогресс</div>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          {/* Age selection */}
          <button onClick={() => { onChangeAge(); onClose(); }}
            className="w-full text-left px-4 py-3 rounded-[14px] hover:bg-gray-50 flex items-center gap-3 transition-all"
          >
            <span className="text-xl">🧠</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-[15px]">Выбрать возраст</div>
              <div className="text-gray-500 text-[13px]">
                {ageGroup === "junior" ? "8–11 лет" : "12–15+ лет"}
              </div>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          {/* Profile (future auth) */}
          <button className="w-full text-left px-4 py-3 rounded-[14px] hover:bg-gray-50 flex items-center gap-3 transition-all opacity-50 cursor-not-allowed"
            disabled
          >
            <span className="text-xl">👤</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-[15px]">Профиль</div>
              <div className="text-gray-500 text-[13px]">Скоро</div>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          {/* Reset progress */}
          {collected.length > 0 && (
            <button onClick={() => { onResetProgress(); onClose(); }}
              className="w-full text-left px-4 py-3 rounded-[14px] hover:bg-red-50 flex items-center gap-3 transition-all"
            >
              <span className="text-xl">🔄</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-[15px]">Сбросить прогресс</div>
                <div className="text-gray-500 text-[13px]">Начать заново</div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          )}
        </div>

        <button onClick={onClose}
          className="w-full mt-2 py-3 rounded-[14px] bg-gray-100 text-gray-700 font-semibold transition-all active:scale-95"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

/* ═══ DragonsGreeting ═══ */
function DragonsGreeting({ isVisible, onClose }) {
  const [displayedText, setDisplayedText] = useState("");
  const greeting = "Привет! Я помогу тебе увидеть скрытые закономерности в природе. Когда ты их найдёшь, сможешь разгадать любую задачу — вот как это работает в науке и технике. Выбери возраст и поехали!";

  useEffect(() => {
    if (!isVisible) {
      setDisplayedText("");
      return;
    }
    let index = 0;
    const timer = setInterval(() => {
      if (index < greeting.length) {
        setDisplayedText(greeting.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-end pointer-events-none pb-64">
      <div className="w-72 pointer-events-auto">
        <div className="bg-amber-50 rounded-2xl px-4 py-3 shadow-lg border-2 border-amber-200 relative min-h-32 flex flex-col">
          <div className="absolute -top-2 left-1/2 w-3 h-3 bg-amber-50 border-t-2 border-l-2 border-amber-200" style={{ transform: 'translateX(-50%) rotate(45deg)' }}></div>
          <p className="text-gray-800 text-sm leading-relaxed flex-1">
            {displayedText}<span className={displayedText.length < greeting.length ? "animate-pulse" : ""}>▌</span>
          </p>
          {displayedText.length === greeting.length && (
            <button onClick={onClose} className="text-xs text-amber-600 font-semibold hover:text-amber-700 cursor-pointer self-start mt-auto">
              Понимаю →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ DragonInfo ═══ */
function DragonInfo({ isOpen, onClose }) {
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const texts = [
    "Привет! Я живу в генизе — месте, где хранятся древние знания и современные изобретения.",
    "Я прочитал много книг, спорил с ними. Убедился — с идеями можно спорить, это правильно.",
    "Рядом со мной сломанные дроны, старые платы, прототипы без названия. Я вижу, как прошлое и будущее работают вместе.",
    "Я не даю ответы. Я задаю вопросы — потому что твой ответ всегда интереснее моего. Готов разгадывать загадки?"
  ];

  useEffect(() => {
    if (!isOpen) {
      setDisplayedIndex(0);
      return;
    }
    if (displayedIndex < texts.length) {
      const timer = setTimeout(() => setDisplayedIndex(displayedIndex + 1), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, displayedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[24px] p-6 flex flex-col gap-4 shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-2">
          <img src="./img/webp/ugolok.webp" alt="" className="w-44 h-44 mx-auto mb-3 object-contain drop-shadow-md" />
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
          {texts.map((text, i) => (
            i < displayedIndex && (
              <p key={i} className="text-gray-700 text-[15px] leading-relaxed animate-fade-in">
                {text.split('**').map((part, j) =>
                  j % 2 === 0 ? part : <strong key={j}>{part}</strong>
                )}
              </p>
            )
          ))}
        </div>

        {displayedIndex === texts.length && (
          <button onClick={onClose}
            className="w-full mt-2 py-3 rounded-[14px] bg-gray-100 text-gray-700 font-semibold transition-all active:scale-95 animate-fade-in"
          >
            Закрыть
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══ Main App ═══ */
export default function App() {
  const saved = loadState();

  // Audio tracks
  const audioTracks = [
    { name: "Epic & Inspiring", path: "/audio/epic-&-inspiring.mp3" },
    { name: "Magical & Calm", path: "/audio/magical-&-calm.mp3" },
    { name: "Adventurous & Inviting", path: "/audio/adventurous-&-inviting.mp3" },
    { name: "Epic & Inspiring 2", path: "/audio/epic-&-inspiring 2.mp3" },
    { name: "Magical & Calm 2", path: "/audio/magical-&-calm 2.mp3" },
    { name: "Adventurous & Inviting 2", path: "/audio/adventurous-&-inviting 2.mp3" },
  ];

  const audio = useAudio(audioTracks);

  const [ageGroup,    setAgeGroup]    = useState(saved.ageGroup || "senior");
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(saved.hasSeenOnboarding || false);
  const [hasSeenDragonSplash, setHasSeenDragonSplash] = useState(saved.hasSeenDragonSplash || false);
  const [phase,       setPhase]       = useState(
    !hasSeenDragonSplash ? "dragon-splash" : !hasSeenOnboarding ? "dragon-bubble" : saved.ageGroup ? "picker" : "age-select"
  );
  const [taskIdx,     setTaskIdx]     = useState(0);
  const [collected,   setCollected]   = useState(saved.collected || []);
  const [totalStars,  setTotalStars]  = useState(saved.totalStars || 0);
  const [userTasks,   setUserTasks]   = useState(saved.userTasks || []);
  const [solveCount,  setSolveCount]  = useState(saved.solveCount || {});

  // dialog
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [isTyping,    setIsTyping]    = useState(false);
  const [prizStep,    setPrizStep]    = useState(0);
  const [debriefBingo,setDebriefBingo]= useState(false);
  const [bingoFlash,  setBingoFlash]  = useState(false);
  const [sessionStars,setSessionStars]= useState(0);
  const [unlockedBuildingId, setUnlockedBuildingId] = useState(null);

  // twist
  const [twistChoice, setTwistChoice] = useState(null);

  // menu
  const [menuOpen, setMenuOpen] = useState(false);

  // dragon greeting bubble on age-select
  const [dragonGreetingOpen, setDragonGreetingOpen] = useState(false);

  // confirmation dialog for leaving task mid-way
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const task = TASKS[taskIdx];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, phase]);

  useEffect(() => {
    saveState({ ageGroup, collected, totalStars, hasSeenOnboarding, userTasks, solveCount, hasSeenDragonSplash });
  }, [ageGroup, collected, totalStars, hasSeenOnboarding, userTasks, solveCount, hasSeenDragonSplash]);

  useEffect(() => {
    if (window.__openCity) {
      window.__openCity = false;
      setPhase("city");
      setMenuOpen(false);
    }
  }, [menuOpen]);

  /* ─── helpers ─── */
  const inDialogPhases = ["dialog","debrief","twist","outcome"].includes(phase);
  const childMsgCount  = messages.filter(m => m.type === "child").length;

  function startTask(idx) {
    const t = TASKS[idx];
    setTaskIdx(idx);
    setMessages([]);
    setPrizStep(0);
    setDebriefBingo(false);
    setTwistChoice(null);
    setSessionStars(0);
    const hook = ageGroup === "senior" ? t.puzzle.hookSenior : t.puzzle.hookJunior;
    // Age-personalized greeting + puzzle question
    const greetings = ageGroup === "senior"
      ? [
          "🐉 Вот интересная загадка!",
          "🐉 Природа спрятала закономерность здесь...",
          "🐉 Посмотри внимательно! Что происходит?"
        ]
      : [
          "🐉 Вот интересная загадка!",
          "🐉 Природа решила эту задачу очень хитро!",
          "🐉 Посмотри! Что здесь необычного?"
        ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    setMessages([
      { type: "bot", text: greeting },
      { type: "bot", text: "🔍 Прочитай загадку:" },
      { type: "bot", text: hook }
    ]);
    setPhase("dialog");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function goDebrief() {
    setPhase("debrief");
  }

  function goTwist() {
    setPhase("twist");
  }

  function goOutcome() {
    const newTotal = totalStars + sessionStars;
    const isNewUnlock = !collected.includes(task.id);
    const newCollected = isNewUnlock ? [...collected, task.id] : collected;
    const newSolveCount = { ...solveCount, [task.id]: (solveCount[task.id] || 0) + 1 };
    setTotalStars(newTotal);
    setCollected(newCollected);
    setSolveCount(newSolveCount);

    if (isNewUnlock) {
      // Trigger unlock animation
      setUnlockedBuildingId(task.id);
      // After animation (2.5s), go to outcome
      setTimeout(() => {
        setUnlockedBuildingId(null);
        setPhase("outcome");
      }, 2500);
    } else {
      // If already collected, skip animation
      setPhase("outcome");
    }
  }

  function nextPuzzle() {
    setDebriefBingo(false);
    if (collected.length >= TASKS.length) {
      setPhase("final");
    } else {
      setPhase("picker");
    }
  }

  function resetProgress() {
    setCollected([]);
    setTotalStars(0);
    setSolveCount({});
    setDebriefBingo(false);
    setMessages([]);
    setPhase("picker");
    saveState({ ageGroup, collected: [], totalStars: 0, solveCount: {} });
  }

  function changeAgeGroup() {
    setCollected([]);
    setTotalStars(0);
    setSolveCount({});
    setDebriefBingo(false);
    setMessages([]);
    setPhase("age-select");
    saveState({ collected: [], totalStars: 0, solveCount: {} });
  }

  async function handleUserMessage() {
    const text = input.trim();
    if (!text || isTyping) return;

    setInput("");
    const timestamp = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const newMessages = [...messages, { type: "child", text, timestamp }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const history = newMessages.map(m => ({ role: m.type === "bot" ? "bot" : "user", text: m.text }));
      const result = await askAI(text, history.slice(0, -1), task.puzzle, ageGroup);

      const isSolved = result.prizStep === 4 || result.text.toLowerCase().includes("задача решена");
      const isBingo  = isSolved && !messages.some(m => m.type === "show-answer");
      const prizAdvanced = result.prizStep > prizStep;

      if (result.stars > 0) setSessionStars(s => s + result.stars);
      const newPrizStep = result.prizStep || 0;
      setPrizStep(newPrizStep);

      if (isBingo) {
        setDebriefBingo(true);
        setBingoFlash(true);
        if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
        setTimeout(() => setBingoFlash(false), 700);
      }

      // Add stage advancement message if ПРИЗ progressed
      let messageText = result.text;
      const stageMessages = {
        1: "🔍 Вижу противоречие!",
        2: "💡 Переходим к идеям!",
        3: "✓ Решение найдено!",
        4: "🎉 Путь открыт!"
      };

      setMessages(prev => {
        const timestamp = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        let updates = [...prev, { type: "bot", text: messageText, stars: result.stars, timestamp }];
        if (prizAdvanced && stageMessages[newPrizStep]) {
          updates.push({ type: "bot", text: stageMessages[newPrizStep], isStageMsg: true, timestamp });
        }
        return updates;
      });

      if (isSolved) {
        setTimeout(() => {
          const timestamp = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
          setMessages(prev => [...prev, { type: "bot", text: `✨ Ты открыл метод: ${task.trick.name}`, isDiscovery: true, timestamp }]);
          setTimeout(goDebrief, 1200);
        }, 800);
      }
    } catch {
      setMessages(prev => [...prev, { type: "bot", text: "Что-то пошло не так. Попробуй ещё раз." }]);
    } finally {
      setIsTyping(false);
    }
  }

  function showAnswer() {
    setMessages(prev => [...prev, { type: "show-answer", text: task.puzzle.answer }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: "bot", text: "Задача решена! 🎉 " + (task.puzzle.bonusFact || "") }]);
      setTimeout(goDebrief, 1800);
    }, 800);
  }

  /* ─── render ─── */
  return (
    <div className={`min-h-screen flex flex-col items-center ${
      phase === "age-select" ? "bg-gradient-to-b from-blue-500 to-white" :
      phase === "picker" ? "bg-gradient-to-b from-indigo-50 to-white" :
      "bg-gray-50"
    }`}>
      {/* Unlock Animation Overlay */}
      {unlockedBuildingId && <UnlockAnimation buildingId={unlockedBuildingId} />}

      <div className={`w-full max-w-md min-h-screen flex flex-col ${phase === "age-select" ? "" : "bg-white shadow-sm"}`}>

        {/* DRAGON SPLASH SCREEN */}
        {phase === "dragon-splash" && (
          <DragonSplashScreen
            onAnimationEnd={() => {
              setHasSeenDragonSplash(true);
              setPhase("dragon-bubble");
            }}
          />
        )}

        {/* DRAGON BUBBLE */}
        {phase === "dragon-bubble" && (
          <DragonBubbleScreen
            onStart={() => {
              setHasSeenOnboarding(true);
              setPhase("age-select");
            }}
          />
        )}

        {/* AGE SELECT */}
        {phase === "age-select" && (
          <div className="flex flex-col items-center justify-center flex-1 px-6 gap-8">
            <div className="text-center">
              <div className="mb-4 flex flex-col items-center gap-2">
                <style>{`
                  @keyframes floatChar { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
                  @keyframes glowPulse { 0%, 100% { filter: blur(28px) opacity(0.6); } 50% { filter: blur(28px) opacity(0.9); } }
                  .dragon-float { animation: floatChar 3.5s ease-in-out infinite; }
                `}</style>
                <button onClick={() => {
                  setDragonGreetingOpen(true);
                }}
                  className="cursor-pointer"
                  title="Узнай о драконе"
                >
                  <div className="relative w-48 h-48 dragon-float">
                    <div className="absolute rounded-full blur-3xl pointer-events-none bg-amber-500/25" style={{ inset: '-28px', animation: '3.5s ease-in-out 0s infinite normal none running glowPulse' }}></div>
                    <div className="absolute rounded-full blur-xl pointer-events-none bg-orange-600/15" style={{ inset: '-14px' }}></div>
                    <img src="./img/webp/ugolok.webp" alt="Дракон" className="relative w-full h-full rounded-full object-cover shadow-2xl border-4 border-amber-500/50" style={{ boxShadow: '0 25px 50px -12px rgba(146, 64, 14, 0.4)' }} />
                  </div>
                </button>
                {!dragonGreetingOpen && <p className="text-[11px] text-gray-400">Узнай больше о драконе</p>}
              </div>
              <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
                SHARIEL
              </h1>
              <p className="text-gray-600 text-[14px] mt-2">🧩 Решай загадки, открывай методы</p>
            </div>
            <style>{`
              @keyframes buttonPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              .start-button {
                animation: buttonPulse 2s ease-in-out infinite;
              }
              .start-button:hover {
                animation: none;
                transform: scale(1.08);
              }
              .start-button:active {
                transform: scale(0.95);
              }
            `}</style>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => { setAgeGroup("senior"); setPhase("picker"); }}
                className="start-button w-full py-4 px-6 rounded-[14px] bg-orange-500 hover:bg-orange-600 text-white font-bold text-[20px] shadow-lg hover:shadow-xl active:scale-95 transition-all"
              >
                НАЧАТЬ
              </button>
            </div>
          </div>
        )}

        {/* PICKER */}
        {phase === "picker" && (
          <div className="flex flex-col flex-1 px-4 pb-6">
            {/* Top bar with title and controls */}
            <div className="flex items-center justify-between pt-3 pb-4 border-b border-gray-100">
              <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <span>🐉</span> SHARIEL
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setPhase("city")}
                  className="text-sm font-semibold px-3 py-2 rounded-[8px] hover:bg-orange-100 transition-all flex items-center gap-2 bg-orange-50"
                  title="Открывай новые методы, решая задачи"
                >
                  <span className="text-lg">🏙️</span> <span className="text-[13px] font-bold text-orange-600">Город</span> <span className="text-[12px] text-orange-500">{collected.length}</span>
                </button>
                <button onClick={() => setMenuOpen(true)}
                  className="w-8 h-8 flex items-center justify-center text-[24px] hover:bg-gray-100 rounded-[8px] transition-all"
                  title="Меню"
                >
                  ☰
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 mb-3 pt-3">
              <p className="text-gray-600 text-[12px] text-center font-semibold">
                💡 Решай задачи и открывай здания
              </p>
            </div>
            <p className="text-gray-600 text-[13px] text-center mb-3 font-medium">
              {collected.length === 0
                ? "👉 Выбери загадку и раскрой секреты природы"
                : `⭐ ${collected.length} из ${TASKS.length} зданий открыто`
              }
            </p>
            {/* Progress bar */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${(collected.length / TASKS.length) * 100}%` }}
                />
              </div>
              <span className="text-[12px] font-bold text-orange-600 whitespace-nowrap">{collected.length}/{TASKS.length}</span>
            </div>
            {/* 3-уровневая структура */}
            <div className="flex-1 overflow-y-auto space-y-5 pb-4">
              {/* УРОВЕНЬ 1: Простые (⭐) */}
              <div className="bg-gradient-to-r from-green-50 to-green-50 rounded-[16px] p-4 border-2 border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <div className="font-bold text-gray-900 text-[14px]">Простые задачи</div>
                      <div className="text-[11px] text-gray-600">Начни здесь</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-semibold text-green-700">Доступно! ✓</div>
                    <div className="text-[11px] text-gray-600">у тебя {totalStars} XP</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[0, 1].map((i) => {
                    const t = TASKS[i];
                    const done = collected.includes(t.id);
                    return (
                      <button key={t.id}
                        onClick={() => startTask(i)}
                        className={`w-full rounded-[14px] p-3 flex items-start gap-2 text-left transition-all active:scale-95
                          ${done ? "bg-green-200 border-2 border-green-400" : "bg-white border-2 border-gray-100 hover:border-green-400"}`}
                      >
                        <span className="text-3xl flex-shrink-0">{t.puzzle.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-gray-800 line-clamp-2">{t.puzzle.question}</div>
                          {done && <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-green-300 text-green-700">✓ Решено</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* УРОВЕНЬ 2: Средние (⭐⭐) */}
              <div className={`rounded-[16px] p-4 border-2 transition-all ${
                totalStars >= 20
                  ? "bg-gradient-to-r from-amber-50 to-amber-50 border-amber-200"
                  : "bg-gray-50 border-gray-200 opacity-60"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐⭐</span>
                    <div>
                      <div className="font-bold text-gray-900 text-[14px]">Средние задачи</div>
                      <div className="text-[11px] text-gray-600">
                        {totalStars >= 20 ? "Открыто!" : `Нужно ${20 - totalStars} XP`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-semibold text-amber-700">
                      {totalStars >= 20 ? "Откроется ✓" : "Откроется при 20 XP"}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      {totalStars >= 20 ? `у тебя ${totalStars} XP` : `нужно ещё ${20 - totalStars}`}
                    </div>
                  </div>
                </div>
                {totalStars >= 20 ? (
                  <div className="space-y-2">
                    {[2, 3].map((i) => {
                      const t = TASKS[i];
                      const done = collected.includes(t.id);
                      return (
                        <button key={t.id}
                          onClick={() => startTask(i)}
                          className={`w-full rounded-[14px] p-3 flex items-start gap-2 text-left transition-all active:scale-95
                            ${done ? "bg-amber-200 border-2 border-amber-400" : "bg-white border-2 border-gray-100 hover:border-amber-400"}`}
                        >
                          <span className="text-3xl flex-shrink-0">{t.puzzle.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-gray-800 line-clamp-2">{t.puzzle.question}</div>
                            {done && <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-300 text-amber-700">✓ Решено</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-3 text-gray-500 text-[12px]">
                    🔒 Решай простые задачи, чтобы открыть этот уровень
                  </div>
                )}
              </div>

              {/* УРОВЕНЬ 3: Сложные (⭐⭐⭐) */}
              <div className={`rounded-[16px] p-4 border-2 transition-all ${
                totalStars >= 50
                  ? "bg-gradient-to-r from-red-50 to-red-50 border-red-200"
                  : "bg-gray-50 border-gray-200 opacity-60"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐⭐⭐</span>
                    <div>
                      <div className="font-bold text-gray-900 text-[14px]">Сложные задачи</div>
                      <div className="text-[11px] text-gray-600">
                        {totalStars >= 50 ? "Открыто!" : `Нужно ${50 - totalStars} XP`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-semibold text-red-700">
                      {totalStars >= 50 ? "Откроется ✓" : "Откроется при 50 XP"}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      {totalStars >= 50 ? `у тебя ${totalStars} XP` : `нужно ещё ${50 - totalStars}`}
                    </div>
                  </div>
                </div>
                {totalStars >= 50 ? (
                  <div className="space-y-2">
                    {[4, 5].map((i) => {
                      const t = TASKS[i];
                      const done = collected.includes(t.id);
                      return (
                        <button key={t.id}
                          onClick={() => startTask(i)}
                          className={`w-full rounded-[14px] p-3 flex items-start gap-2 text-left transition-all active:scale-95
                            ${done ? "bg-red-200 border-2 border-red-400" : "bg-white border-2 border-gray-100 hover:border-red-400"}`}
                        >
                          <span className="text-3xl flex-shrink-0">{t.puzzle.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-gray-800 line-clamp-2">{t.puzzle.question}</div>
                            {done && <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-300 text-red-700">✓ Решено</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-3 text-gray-500 text-[12px]">
                    🔒 Стань мастером средних задач, чтобы открыть этот уровень
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CITY */}
        {phase === "city" && (
          <City
            collected={collected}
            solveCount={solveCount}
            onBack={() => setPhase("picker")}
            onSelectTask={(idx) => startTask(idx)}
          />
        )}

        {/* DIALOG */}
        {phase === "dialog" && (
          <div className="flex flex-col flex-1">
            <div className="flex items-center px-4 pt-2">
              <button
                onClick={() => {
                  if (messages.length > 1) {
                    setShowConfirmDialog(true);
                    setPendingAction("leave-task");
                  } else {
                    setPhase("picker");
                  }
                }}
                className="text-gray-400 text-[13px] flex items-center gap-1 py-1"
              >
                ← задачи
              </button>
              <div className="flex-1">
                <TopProgress collected={collected} current={taskIdx} />
              </div>
            </div>
            <div className="px-4 py-2 flex justify-center gap-2">
              {[
                { emoji: "❓", label: "Вопрос" },
                { emoji: "🔍", label: "Разбор" },
                { emoji: "💡", label: "Идеи" },
                { emoji: "✓", label: "Решение" },
                { emoji: "🎉", label: "Готово" }
              ].map((stage, i) => (
                <div key={i}
                  title={stage.label}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all cursor-help
                    ${i <= prizStep ? "bg-orange-500 text-white scale-110" : "bg-gray-200 text-gray-400"}`}>
                  {stage.emoji}
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-3 pt-2" style={{ maxHeight: "calc(100vh - 160px)" }}>
              {messages.map((m, i) => {
                if (m.type === "bot") {
                  if (m.isStageMsg) {
                    return (
                      <div key={i} className="flex justify-center">
                        <div className="bg-orange-50 border border-orange-200 rounded-[14px] px-3 py-2 text-[13px] font-semibold text-orange-700">
                          {m.text}
                        </div>
                      </div>
                    );
                  }
                  if (m.isDiscovery) {
                    return (
                      <div key={i} className="flex justify-center">
                        <div className="bg-green-50 border border-green-200 rounded-[14px] px-4 py-2 text-[14px] font-bold text-green-700 animate-pulse">
                          {m.text}
                        </div>
                      </div>
                    );
                  }
                  const isLastBotMsg = i === messages.length - 1 || messages[i+1]?.type !== 'bot';
                  return (
                    <div key={i} className="flex gap-2 items-end">
                      {isLastBotMsg && <img src="./img/webp/ugolok.webp" alt="SHARIEL" className="w-8 h-8 flex-shrink-0 rounded-full object-cover" />}
                      <div className={`flex flex-col gap-0.5 ${!isLastBotMsg ? 'ml-10' : ''}`}>
                        <div className={`bg-gray-100 rounded-[16px] ${isLastBotMsg ? 'rounded-bl-[4px]' : ''} px-4 py-3 text-[15px] text-gray-800 max-w-[80%]`}>
                          {m.text}
                          {m.stars > 0 && <span className="ml-2 text-yellow-500">{"⭐".repeat(m.stars)}</span>}
                        </div>
                        {isLastBotMsg && <span className="text-[12px] text-gray-400 ml-2">{m.timestamp}</span>}
                      </div>
                    </div>
                  );
                }
                if (m.type === "child") return (
                  <div key={i} className="flex justify-end gap-2 items-end">
                    <div className="flex flex-col gap-0.5 items-end">
                      <div className={`bg-orange-500 text-white rounded-[16px] rounded-tr-[4px] px-4 py-3 text-[15px] max-w-[85%] ${bingoFlash ? "animate-pulse" : ""}`}>
                        {m.text}
                      </div>
                      <span className="text-[12px] text-gray-400 mr-1">{m.timestamp}</span>
                    </div>
                  </div>
                );
                if (m.type === "show-answer") return (
                  <div key={i} className="bg-blue-50 border border-blue-200 rounded-[14px] px-4 py-3 text-[14px] text-blue-800">
                    <span className="font-semibold">Ответ: </span>{m.text}
                  </div>
                );
                return null;
              })}
              {isTyping && (
                <div className="flex gap-2 items-end">
                  <img src="./img/webp/ugolok.webp" alt="SHARIEL" className="w-8 h-8 flex-shrink-0 rounded-full object-cover" />
                  <div className="bg-gray-100 rounded-[16px] rounded-bl-[4px] px-4 py-3 flex gap-1">
                    {[0,1,2].map(j => (
                      <div key={j} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Show answer button */}
            {childMsgCount >= 3 && !messages.some(m => m.type === "show-answer") && !isTyping && (
              <div className="px-4 pb-2">
                <button onClick={showAnswer}
                  className="w-full py-2 rounded-[14px] border border-gray-200 text-gray-400 text-[13px] hover:text-gray-600"
                >
                  Показать ответ
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleUserMessage()}
                placeholder="Напиши свою версию..."
                className="flex-1 bg-gray-100 rounded-[18px] px-4 py-3 text-[15px] outline-none min-h-[48px] leading-relaxed focus:bg-orange-50 focus:ring-2 focus:ring-orange-300 transition-all"
                disabled={isTyping}
              />
              <button
                onClick={handleUserMessage}
                disabled={!input.trim() || isTyping}
                className="bg-orange-500 text-white rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0 hover:bg-orange-600"
              >
                ↑
              </button>
            </div>
          </div>
        )}

        {/* DEBRIEF */}
        {phase === "debrief" && (
          <div className="flex flex-col flex-1 px-5 pb-8">
            <TopProgress collected={collected} current={taskIdx} />
            <div className="flex flex-col flex-1 justify-center items-center gap-5">
              <div className="text-center text-4xl mb-1">{debriefBingo ? "🎉" : "⚡"}</div>
              <div className="text-center text-xl font-bold text-gray-800 mb-3">
                {debriefBingo ? "Разгадано без подсказок!" : "Именно так!"}
              </div>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-[16px] p-4 text-[15px] text-amber-900">
                <div className="flex gap-3">
                  <img src="./img/webp/ugolok.webp" alt="SHARIEL" className="w-10 h-10 flex-shrink-0 rounded-full object-cover" />
                  <p>
                    <span className="font-bold block mb-1">Видишь закономерность?</span>
                    Этот мир разгадан! Ты открыл <span className="font-semibold" style={{ color: task.trick.color }}>"{task.trick.name}"</span> — метод, которым природа решала эту задачу миллионы лет. Теперь ты знаешь, как она это делает.
                  </p>
                </div>
              </div>
              <div className="w-full rounded-[16px] p-4 border-2" style={{ borderColor: task.trick.color, backgroundColor: task.trick.color + "10" }}>
                <p className="font-semibold text-[12px] mb-2" style={{ color: task.trick.color }}>🔑 ТРИЗ МЕТОД</p>
                <div className="text-[18px] font-bold" style={{ color: task.trick.color }}>
                  {task.trick.name}
                </div>
                <div className="text-[13px] text-gray-600 mt-1">{task.trick.animalName}</div>
                <p className="text-[13px] text-gray-700 mt-3">{methodDescription(task.trick.name)}</p>
              </div>
              <div className="w-full bg-gray-50 rounded-[16px] p-4 text-[15px] text-gray-700 leading-relaxed">
                <p className="font-semibold text-gray-500 text-[12px] mb-2">ЕЩЁ ИНТЕРЕСНОЕ</p>
                {task.puzzle.bonusFact}
              </div>
              {sessionStars > 0 && (
                <div className="text-center">
                  <div className="text-yellow-500 text-[18px] font-bold mb-1">
                    {"⭐".repeat(Math.min(sessionStars, 9))}
                  </div>
                  <p className="text-gray-600 text-[13px]">+{sessionStars} к инженерному мышлению</p>
                  <p className="text-gray-400 text-[12px] mt-1">{debriefBingo ? "Решил быстро и точно!" : "Немного помощи — тоже результат"}</p>
                </div>
              )}
              <div className="text-center text-gray-500 text-[14px] mt-2">
                <p>Ты открыл <span className="font-semibold text-gray-700">{collected.length + 1} из {TASKS.length}</span> методов</p>
                <p className="text-[12px] mt-1">{TASKS.length - collected.length - 1} методов осталось разгадать</p>
              </div>
              <button onClick={goTwist}
                className="w-full bg-gray-900 text-white text-[16px] font-bold py-4 rounded-[18px] active:scale-95 transition-transform"
              >
                Как это решили инженеры? →
              </button>
            </div>
          </div>
        )}

        {/* TWIST */}
        {phase === "twist" && (
          <div className="flex flex-col flex-1 px-5 pb-8">
            <TopProgress collected={collected} current={taskIdx} />
            <div className="flex flex-col flex-1 justify-center gap-4">
              <div className="text-center text-2xl">{task.trick.animal}</div>
              <p className="text-center text-[15px] text-gray-500">{task.contradiction.intro}</p>
              <div className="flex flex-col gap-2">
                <div className="bg-red-50 border border-red-100 rounded-[14px] px-4 py-3 text-[14px] text-red-800">
                  ✗ {task.contradiction.fact1}
                </div>
                <div className="bg-red-50 border border-red-100 rounded-[14px] px-4 py-3 text-[14px] text-red-800">
                  ✗ {task.contradiction.fact2}
                </div>
              </div>
              <p className="text-[15px] text-gray-700 font-medium text-center">{task.contradiction.buddyQuestion}</p>
              <div className="flex flex-col gap-2">
                {task.contradiction.options.map((opt, i) => {
                  const chosen = twistChoice === i;
                  const revealed = twistChoice !== null;
                  const isBingo = opt.temp === "bingo";
                  return (
                    <button key={i}
                      onClick={() => { if (!revealed) setTwistChoice(i); }}
                      disabled={revealed}
                      className={`w-full py-3 px-4 rounded-[16px] border-2 text-left text-[14px] flex items-center gap-3 transition-all
                        ${!revealed ? "border-gray-200 bg-white hover:border-orange-300 active:scale-95" :
                          isBingo ? "border-green-400 bg-green-50 text-green-800 font-semibold" :
                          chosen  ? "border-gray-200 bg-gray-50 text-gray-400" :
                                    "border-gray-100 bg-gray-50 text-gray-300"}`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span>{opt.text}</span>
                      {revealed && isBingo && <span className="ml-auto">✓</span>}
                    </button>
                  );
                })}
              </div>
              {twistChoice !== null && (
                <div className="bg-blue-50 border border-blue-200 rounded-[16px] px-4 py-4 text-[14px] text-blue-900 leading-relaxed">
                  {task.contradiction.realSolution}
                </div>
              )}
              {twistChoice !== null && (
                <button onClick={goOutcome}
                  className="w-full py-4 rounded-[18px] font-bold text-[16px] active:scale-95 transition-transform text-white"
                  style={{ backgroundColor: task.trick.color }}
                >
                  Открыть принцип {task.trick.animal} ✨
                </button>
              )}
            </div>
          </div>
        )}

        {/* OUTCOME */}
        {phase === "outcome" && (
          <div className="flex flex-col flex-1 px-5 pb-8">
            <TopProgress collected={collected} current={-1} />
            <div className="flex flex-col flex-1 justify-center items-center gap-6">
              <div className="text-7xl animate-bounce">{task.trick.animal}</div>
              <div className="text-center">
                <div className="text-[13px] text-gray-400 uppercase tracking-wide mb-2">✨ Метод открыт</div>
                <div className="text-[28px] font-bold" style={{ color: task.trick.color }}>
                  {task.trick.name}
                </div>
                <div className="text-[14px] text-gray-600 mt-2">{task.trick.animalName}</div>
              </div>
              <div className="bg-gradient-to-r rounded-[16px] px-5 py-4 text-center text-[16px] italic font-medium text-gray-800" style={{ backgroundImage: `linear-gradient(135deg, ${task.trick.color}20, ${task.trick.color}05)` }}>
                «{task.trick.motto}»
              </div>
              <div className="text-center text-[14px] text-gray-700 leading-relaxed max-w-sm">
                {methodDescription(task.trick.name)}
              </div>
              <div className="text-center">
                <div className="text-[14px] text-gray-600 mb-2">Твой прогресс в игре:</div>
                <div className="text-center text-[15px] font-semibold text-gray-800">
                  {thinkingType(totalStars).emoji} {thinkingType(totalStars).label}<br/>
                  <span className="text-xl text-yellow-500">{"⭐".repeat(Math.min(totalStars, 9))}</span> {totalStars} звёзд
                </div>
              </div>
              <button onClick={nextPuzzle}
                className="w-full py-4 rounded-[18px] bg-orange-500 text-white font-bold text-[16px] active:scale-95 transition-transform"
              >
                {collected.length >= TASKS.length ? "Финал 🏆" : "Следующая задача →"}
              </button>
            </div>
          </div>
        )}

        {/* FINAL */}
        {phase === "final" && (
          <div className="flex flex-col flex-1 px-5 pb-8 items-center justify-center gap-6">
            <div className="text-[72px] animate-bounce">🏆</div>
            <div className="text-center">
              <h2 className="text-[24px] font-bold text-gray-900 mb-2">6 методов открыты! 🌟</h2>
              <p className="text-gray-500 text-[15px]">Это только начало. Впереди ещё 34 метода ТРИЗ и путь к настоящему изобретателю.</p>
            </div>
            <div className="w-full bg-gradient-to-r rounded-[16px] p-5 text-[15px] text-gray-900 leading-relaxed border-2 border-amber-300" style={{ backgroundImage: "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(249, 115, 22, 0.05))" }}>
              <div className="flex gap-3">
                <img src="./img/webp/ugolok.webp" alt="SHARIEL" className="w-12 h-12 flex-shrink-0 rounded-full object-cover" />
                <div>
                  <p className="font-bold mb-2">Первый этап пройден! 🔍</p>
                  <p>Ты овладел 6 методами. Дальше — три пути: 1️⃣ создавай задачи для других; 2️⃣ учись выбирать нужный метод на сложных задачах; 3️⃣ найди противоречия в реальных проблемах. И в конце — станешь настоящим изобретателем.</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[40px] font-bold text-yellow-500 mb-1">{"⭐".repeat(Math.min(totalStars, 12))}</div>
              <div className="text-[16px] font-semibold text-gray-800">{totalStars} звёзд мышления</div>
              <div className="text-gray-500 text-[14px] mt-1">{thinkingType(totalStars).emoji} {thinkingType(totalStars).label}</div>
              <div className="text-gray-400 text-[12px] mt-3">⭐ = быстрое и точное решение</div>
            </div>
            <div className="w-full bg-gray-50 rounded-[16px] p-4 flex flex-col gap-2">
              {TASKS.map(t => (
                <div key={t.id} className="flex items-center gap-3 text-[14px] text-gray-700">
                  <span className="text-green-500 text-lg">✓</span>
                  <span className="text-2xl">{t.trick.animal}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{t.trick.name}</div>
                    <div className="text-gray-400 text-[12px]">{t.trick.animalName}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => setPhase("ugc")}
                className="w-full py-4 rounded-[18px] bg-orange-500 text-white font-semibold text-[16px] active:scale-95 transition-transform hover:bg-orange-600"
              >
                🚀 Создавай свои загадки
              </button>
              <button onClick={resetProgress}
                className="w-full py-4 rounded-[18px] border-2 border-gray-300 text-gray-700 font-semibold text-[16px] active:scale-95 transition-transform"
              >
                Переиграть →
              </button>
            </div>
          </div>
        )}

        {/* UGC */}
        {phase === "ugc" && (
          <TaskGenerator
            onBack={() => setPhase("final")}
            onSubmit={(newTask) => {
              setUserTasks([...userTasks, { ...newTask, id: Date.now() }]);
              alert("✨ Спасибо! Твоя загадка отправлена на проверку. Если она понравится, её смогут решать другие дети!");
              setPhase("final");
            }}
          />
        )}

      </div>

      {/* Settings Menu */}
      <SettingsMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        ageGroup={ageGroup}
        onChangeAge={changeAgeGroup}
        onResetProgress={resetProgress}
        collected={collected}
        audio={audio}
        audioTracks={audioTracks}
      />

      {/* Dragon Greeting Bubble */}
      <DragonsGreeting
        isVisible={dragonGreetingOpen}
        onClose={() => setDragonGreetingOpen(false)}
      />

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowConfirmDialog(false)} />
          <div className="relative w-full bg-white rounded-t-[24px] p-6 flex flex-col gap-4 shadow-lg">
            <div className="text-center mb-2">
              <h3 className="text-[18px] font-bold text-gray-900">Выйти из загадки?</h3>
            </div>
            <div className="text-gray-600 text-[15px] text-center">
              Прогресс в этой загадке не сохранится. Ты уверен?
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-3 rounded-[14px] border-2 border-gray-300 text-gray-700 font-semibold active:scale-95 transition-transform"
              >
                Продолжить решать
              </button>
              <button onClick={() => {
                setShowConfirmDialog(false);
                setPhase("picker");
                setMessages([]);
                setPrizStep(0);
                setTwistChoice(null);
                setSessionStars(0);
              }}
                className="flex-1 py-3 rounded-[14px] bg-orange-500 text-white font-semibold active:scale-95 transition-transform"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
