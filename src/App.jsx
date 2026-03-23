import { useState, useRef, useEffect } from "react";
import { TASKS } from "./tasks";
import { askAI } from "./ai";

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
function SettingsMenu({ isOpen, onClose, ageGroup, onChangeAge, onResetProgress, collected }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[24px] p-6 flex flex-col gap-4 shadow-lg">
        <div className="text-center mb-2">
          <h3 className="text-[18px] font-bold text-gray-900">Меню</h3>
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
          {/* Age selection */}
          <button onClick={() => { onChangeAge(); onClose(); }}
            className="w-full text-left px-4 py-3 rounded-[14px] hover:bg-gray-50 flex items-center gap-3 transition-all"
          >
            <span className="text-xl">🧠</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-[15px]">Выбрать возраст</div>
              <div className="text-gray-500 text-[13px]">
                {ageGroup === "junior" ? "10–12 лет" : "13–16 лет"}
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
  const greeting = "Привет! Я помогу тебе разгадать загадки природы. Выбери возраст и начинай!";

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
    }, 40);
    return () => clearInterval(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end pointer-events-none">
      <div className="absolute bottom-80 left-1/2 -translate-x-1/2 max-w-xs pointer-events-auto">
        <div className="bg-white rounded-3xl rounded-bl-none px-4 py-3 shadow-lg border-2 border-amber-200 relative">
          <div className="absolute -bottom-3 left-8 w-4 h-4 bg-white border-b-2 border-r-2 border-amber-200 transform rotate-45"></div>
          <p className="text-gray-800 text-sm leading-relaxed min-h-8">
            {displayedText}<span className={displayedText.length < greeting.length ? "animate-pulse" : ""}>▌</span>
          </p>
          {displayedText.length === greeting.length && (
            <button onClick={onClose} className="mt-2 text-xs text-amber-600 font-semibold hover:text-amber-700">
              Закрыть →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ DragonInfo ═══ */
function DragonInfo({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[24px] p-6 flex flex-col gap-4 shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-2">
          <img src="./img/webp/ugolok.webp" alt="" className="w-44 h-44 mx-auto mb-3 object-contain drop-shadow-md" />
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
          <p className="text-gray-700 text-[15px] leading-relaxed">
            Я живу в <strong>генизе</strong> — месте, куда приносят книги, которые нельзя выбросить. Не потому что жалко бумагу, а потому что в словах остаётся <strong>что-то живое</strong>.
          </p>
          <p className="text-gray-700 text-[15px] leading-relaxed">
            Я прочитал <strong>все эти книги</strong>. Спорил с ними. С книгами можно спорить — это нормально, даже <strong>правильно</strong>.
          </p>
          <p className="text-gray-700 text-[15px] leading-relaxed">
            Рядом со свитками стоят <strong>сломанные дроны</strong>, старые платы, <strong>прототипы вещей без названия</strong>. Для меня нет границы между древней мудростью и современным изобретением.
          </p>
          <p className="text-gray-700 text-[15px] leading-relaxed">
            Я не даю ответы. Я <strong>задаю вопросы</strong> — не потому что не знаю, а потому что твой ответ интереснее моего.
          </p>
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

/* ═══ Main App ═══ */
export default function App() {
  const saved = loadState();

  const [ageGroup,    setAgeGroup]    = useState(saved.ageGroup || "senior");
  const [phase,       setPhase]       = useState(saved.ageGroup ? "picker" : "age-select");
  const [taskIdx,     setTaskIdx]     = useState(0);
  const [collected,   setCollected]   = useState(saved.collected || []);
  const [totalStars,  setTotalStars]  = useState(saved.totalStars || 0);

  // dialog
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [isTyping,    setIsTyping]    = useState(false);
  const [prizStep,    setPrizStep]    = useState(0);
  const [debriefBingo,setDebriefBingo]= useState(false);
  const [bingoFlash,  setBingoFlash]  = useState(false);
  const [sessionStars,setSessionStars]= useState(0);

  // twist
  const [twistChoice, setTwistChoice] = useState(null);

  // menu
  const [menuOpen, setMenuOpen] = useState(false);

  // dragon info
  const [dragonInfoOpen, setDragonInfoOpen] = useState(false);
  const [dragonGreeting, setDragonGreeting] = useState(saved.dragonGreetingShown ? false : true);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const task = TASKS[taskIdx];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, phase]);

  useEffect(() => {
    saveState({ ageGroup, collected, totalStars });
  }, [ageGroup, collected, totalStars]);

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
          "🐉 А вот и появилась интересная загадка!",
          "🐉 Хм, у меня есть для тебя кое-что интересное...",
          "🐉 Слушай внимательно! Вот мне нужен твой мозг для этого..."
        ]
      : [
          "🐉 О! Готов разгадать мою загадку? 🔥",
          "🐉 Вот это задачка! Сможешь её решить? 💪",
          "🐉 Внимание! Вот загадка, которая заставит тебя подумать! 🧠"
        ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    setMessages([
      { type: "bot", text: greeting },
      { type: "bot", text: "🔍 Вот что произойдёт:" },
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
    const newCollected = collected.includes(task.id) ? collected : [...collected, task.id];
    setTotalStars(newTotal);
    setCollected(newCollected);
    setPhase("outcome");
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
    setDebriefBingo(false);
    setMessages([]);
    setPhase("picker");
    saveState({ ageGroup, collected: [], totalStars: 0 });
  }

  function changeAgeGroup() {
    setCollected([]);
    setTotalStars(0);
    setDebriefBingo(false);
    setMessages([]);
    setPhase("age-select");
    saveState({ collected: [], totalStars: 0 });
  }

  async function handleUserMessage() {
    const text = input.trim();
    if (!text || isTyping) return;

    setInput("");
    const newMessages = [...messages, { type: "child", text }];
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
        2: "💡 Нашёл идею!",
        3: "✓ Решение найдено!",
        4: "🎉 Путь открыт!"
      };

      setMessages(prev => {
        let updates = [...prev, { type: "bot", text: messageText, stars: result.stars }];
        if (prizAdvanced && stageMessages[newPrizStep]) {
          updates.push({ type: "bot", text: stageMessages[newPrizStep], isStageMsg: true });
        }
        return updates;
      });

      if (isSolved) {
        setTimeout(() => {
          setMessages(prev => [...prev, { type: "bot", text: `✨ Ты открыл метод: ${task.trick.name}`, isDiscovery: true }]);
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-white shadow-sm">

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
                  if (dragonGreeting) {
                    setDragonGreeting(true);
                    setTimeout(() => { setDragonGreeting(false); saveState({ ageGroup, collected, totalStars, dragonGreetingShown: true }); }, 100);
                  } else {
                    setDragonInfoOpen(true);
                  }
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
                {dragonGreeting && <p className="text-[11px] text-gray-400">Нажми на дракона</p>}
              </div>
              <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
                Разгадай загадки природы
              </h1>
              <div className="text-gray-500 text-[14px] mt-4 max-w-xs leading-relaxed">
                <p className="font-semibold text-gray-700">Природа придумала это давно</p>
                <p className="text-[13px] mt-2">Инженеры и изобретатели берут идеи из природы. Сможешь ли ты найти решение, которое природа хранила миллионы лет?</p>
                <p className="text-[12px] mt-2 text-gray-400">2–3 минуты на одну загадку.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => { setAgeGroup("junior"); setPhase("picker"); }}
                className="w-full py-4 rounded-[18px] bg-orange-500 text-white flex flex-col items-center gap-1 active:scale-95 transition-transform border-2 border-orange-500"
              >
                <span className="text-[16px] font-bold">🌟 9–11 лет</span>
                <span className="text-[12px] text-orange-100">Помогу разобраться</span>
              </button>
              <button
                onClick={() => { setAgeGroup("senior"); setPhase("picker"); }}
                className="w-full py-4 rounded-[18px] bg-gray-900 text-white flex flex-col items-center gap-1 active:scale-95 transition-transform border-2 border-gray-900"
              >
                <span className="text-[16px] font-bold">🧠 12–14 лет</span>
                <span className="text-[12px] text-gray-300">Найдёшь сам</span>
              </button>
            </div>
          </div>
        )}

        {/* DRAGON GREETING */}
        <DragonsGreeting isVisible={dragonGreeting} onClose={() => setDragonGreeting(false)} />

        {/* PICKER */}
        {phase === "picker" && (
          <div className="flex flex-col flex-1 px-4 pb-6">
            <div className="flex items-center justify-between pt-3 pb-2">
              <div className="w-8" />
              <TopProgress collected={collected} current={-1} />
              <button onClick={() => setMenuOpen(true)}
                className="w-8 h-8 flex items-center justify-center text-[24px] hover:bg-gray-100 rounded-[8px] transition-all"
                title="Меню"
              >
                ☰
              </button>
            </div>
            <h2 className="text-[20px] font-bold text-gray-900 mb-2 mt-1 text-center">
              🐉 Разгадай загадки природы
            </h2>
            <p className="text-gray-500 text-[13px] text-center mb-3">
              Дракон ждёт • {collected.length} из {TASKS.length} разгадано
            </p>
            {/* Progress bar */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${(collected.length / TASKS.length) * 100}%` }}
                />
              </div>
              <span className="text-[12px] font-semibold text-gray-600">{Math.round((collected.length / TASKS.length) * 100)}%</span>
            </div>
            {/* Motivational message at 50% */}
            {collected.length === 3 && (
              <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-[12px] text-center text-[13px] text-yellow-700 font-medium">
                🌟 Половина пути! Ты уже видишь, как думают инженеры
              </div>
            )}
            <div className="flex flex-col gap-3">
              {TASKS.map((t, i) => {
                const done = collected.includes(t.id);
                const questionLength = t.puzzle.question.split(" ").length;
                const difficultyLevel = questionLength < 8 ? 1 : questionLength < 12 ? 2 : 3;
                const difficultyColor = difficultyLevel === 1 ? "text-green-500" : difficultyLevel === 2 ? "text-amber-500" : "text-red-500";
                return (
                  <button key={t.id}
                    onClick={() => startTask(i)}
                    className={`w-full rounded-[18px] p-4 flex items-start gap-3 text-left border-2 active:scale-95 transition-all
                      ${done ? "border-green-200 bg-green-50 shadow-sm" : "border-gray-100 bg-white hover:border-orange-400 hover:shadow-md hover:scale-105"}`}
                  >
                    <span className="text-4xl flex-shrink-0">{t.puzzle.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-[14px] leading-snug line-clamp-2 flex gap-1 items-start">
                        <span className="flex-1">{t.puzzle.question}</span>
                        {done && <span className="text-green-500 text-xs flex-shrink-0 mt-1">✓</span>}
                      </div>
                      {!done && (
                        <div className={`text-[13px] font-semibold mt-2 ${difficultyColor}`}>
                          {"⭐".repeat(difficultyLevel)}
                        </div>
                      )}
                      {done && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="inline-block text-[11px] font-semibold px-2 py-1 rounded-full"
                            style={{ backgroundColor: t.trick.color + "20", color: t.trick.color }}>
                            {t.trick.name}
                          </span>
                          <span className="text-[12px]" style={{ color: t.trick.color }}>
                            {t.trick.animal}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-200 text-green-700">
                            Освоен
                          </span>
                          <span className={`text-[12px] font-semibold ${difficultyColor}`}>
                            {"⭐".repeat(difficultyLevel)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {collected.length === 0 && (
              <p className="text-center text-gray-400 text-[13px] mt-8 leading-relaxed">
                💡 Нажми на любую задачу, чтобы начать расследование с драконом
              </p>
            )}
          </div>
        )}

        {/* DIALOG */}
        {phase === "dialog" && (
          <div className="flex flex-col flex-1">
            <div className="flex items-center px-4 pt-2">
              <button
                onClick={() => {
                  if (messages.length > 1 && !window.confirm("Выйти из расследования? Прогресс в этой задаче не сохранится.")) return;
                  setPhase("picker");
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
                  return (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-2xl flex-shrink-0 mt-1">🐉</span>
                      <div className="bg-gray-100 rounded-[16px] rounded-tl-[4px] px-4 py-3 text-[15px] text-gray-800 max-w-[80%]">
                        {m.text}
                        {m.stars > 0 && <span className="ml-2 text-yellow-500">{"⭐".repeat(m.stars)}</span>}
                      </div>
                    </div>
                  );
                }
                if (m.type === "child") return (
                  <div key={i} className="flex justify-end">
                    <div className={`bg-orange-500 text-white rounded-[16px] rounded-tr-[4px] px-4 py-3 text-[15px] max-w-[85%] ${bingoFlash ? "animate-pulse" : ""}`}>
                      {m.text}
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
                <div className="flex gap-2 items-center">
                  <span className="text-xl">🐉</span>
                  <div className="bg-gray-100 rounded-[16px] px-4 py-3 flex gap-1">
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
              <div className="w-full rounded-[16px] p-4 border-2" style={{ borderColor: task.trick.color, backgroundColor: task.trick.color + "10" }}>
                <p className="font-semibold text-[12px] mb-2" style={{ color: task.trick.color }}>🔑 ПРИРОДНЫЙ ТРЮК</p>
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
                <p>Ты открыл <span className="font-semibold text-gray-700">{collected.length + 1} из {TASKS.length}</span> природных трюков</p>
                <p className="text-[12px] mt-1">{TASKS.length - collected.length - 1} загадок осталось</p>
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
              <h2 className="text-[24px] font-bold text-gray-900 mb-2">Все 6 природных трюков открыты! 🌟</h2>
              <p className="text-gray-500 text-[15px]">Ты теперь видишь природу как инженер.</p>
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
            <button onClick={resetProgress}
              className="w-full py-4 rounded-[18px] border-2 border-orange-500 text-orange-500 font-semibold text-[16px] active:scale-95 transition-transform"
            >
              Переиграть →
            </button>
          </div>
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
      />

      {/* Dragon Info Modal */}
      <DragonInfo
        isOpen={dragonInfoOpen}
        onClose={() => setDragonInfoOpen(false)}
      />
    </div>
  );
}
