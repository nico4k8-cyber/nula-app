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
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${done ? "bg-green-500 text-white" : active ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-400"}`}
          >
            {done ? "✓" : active ? "?" : t.puzzle.emoji}
          </div>
        );
      })}
    </div>
  );
}

/* ═══ thinkingType ═══ */
function thinkingType(stars) {
  if (stars >= 28) return { label: "Изобретательское", emoji: "🔬" };
  if (stars >= 16) return { label: "Системное",        emoji: "⚡" };
  if (stars >= 7)  return { label: "Аналитическое",    emoji: "🔍" };
  return               { label: "Любопытное",          emoji: "🌱" };
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
  const inDialogPhases = ["dialog","start","debrief","twist","outcome"].includes(phase);
  const childMsgCount  = messages.filter(m => m.type === "child").length;

  function startTask(idx) {
    setTaskIdx(idx);
    setMessages([]);
    setPrizStep(0);
    setDebriefBingo(false);
    setTwistChoice(null);
    setSessionStars(0);
    setPhase("start");
  }

  function startDialog() {
    const hook = ageGroup === "senior" ? task.puzzle.hookSenior : task.puzzle.hookJunior;
    setMessages([{ type: "bot", text: hook }]);
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

      if (result.stars > 0) setSessionStars(s => s + result.stars);
      setPrizStep(result.prizStep || 0);

      if (isBingo) {
        setDebriefBingo(true);
        setBingoFlash(true);
        if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
        setTimeout(() => setBingoFlash(false), 700);
      }

      setMessages(prev => [...prev, { type: "bot", text: result.text, stars: result.stars }]);

      if (isSolved) {
        setTimeout(goDebrief, 1800);
      }
    } catch {
      setMessages(prev => [...prev, { type: "bot", text: "🔍 Что-то пошло не так. Попробуй ещё раз." }]);
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
          <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 gap-6">
            <div className="text-5xl">🔍</div>
            <h1 className="text-[24px] font-bold text-gray-900 leading-snug text-center px-2">
              Природа решала это<br/>миллионы лет. И оставила подсказки.
            </h1>
            <p className="text-gray-500 text-center text-[15px]">
              Ты — детектив. Следак поможет разгадать загадки природы.
            </p>
            <div className="flex flex-col gap-3 w-full">
              {[
                { id: "senior", label: "13–16 лет",  emoji: "🧠" },
                { id: "junior", label: "10–12 лет",  emoji: "🌟" },
              ].map(ag => (
                <button key={ag.id}
                  onClick={() => { setAgeGroup(ag.id); setPhase("picker"); }}
                  className="w-full py-4 rounded-[18px] border-2 border-gray-200 text-[18px] font-semibold text-gray-800 flex items-center justify-center gap-3 active:scale-95 transition-transform hover:border-orange-400 hover:bg-orange-50"
                >
                  <span>{ag.emoji}</span>{ag.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PICKER */}
        {phase === "picker" && (
          <div className="flex flex-col flex-1 px-4 pb-6">
            <TopProgress collected={collected} current={-1} />
            <h2 className="text-[20px] font-bold text-gray-900 mb-1 mt-2 text-center">Выбери задачу</h2>
            <p className="text-gray-400 text-[13px] text-center mb-4">
              {collected.length} из {TASKS.length} разгадано
            </p>
            <div className="flex flex-col gap-3">
              {TASKS.map((t, i) => {
                const done = collected.includes(t.id);
                return (
                  <button key={t.id}
                    onClick={() => startTask(i)}
                    className={`w-full rounded-[18px] p-4 flex items-center gap-3 text-left border-2 active:scale-95 transition-transform
                      ${done ? "border-green-200 bg-green-50" : "border-gray-100 bg-white hover:border-orange-300"}`}
                  >
                    <span className="text-3xl">{t.puzzle.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-[15px] flex items-center gap-2">
                        {t.puzzle.question.slice(0, 48)}…
                        {done && <span className="text-green-500 text-xs">✓</span>}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: t.trick.color }}>
                        {t.trick.animal} {t.trick.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {collected.length > 0 && (
              <button onClick={resetProgress}
                className="mt-4 text-gray-300 text-[13px] text-center w-full hover:text-gray-400"
              >
                Сбросить прогресс
              </button>
            )}
          </div>
        )}

        {/* START */}
        {phase === "start" && (
          <div className="flex flex-col flex-1 px-5 pb-8">
            <TopProgress collected={collected} current={taskIdx} />
            <div className="flex flex-col items-center flex-1 justify-center gap-5">
              <div className="text-6xl">{task.puzzle.emoji}</div>
              <h2 className="text-[19px] font-bold text-gray-900 text-center leading-snug px-2">
                {task.puzzle.question}
              </h2>
              <div className="w-full bg-gray-50 rounded-[16px] p-4 flex flex-col gap-3">
                <p className="text-[13px] text-gray-500 font-medium">Свидетели</p>
                {task.puzzle.witnesses.map((w, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-2xl">{w.avatar}</span>
                    <div>
                      <span className="text-[13px] font-semibold text-gray-700">{w.name}: </span>
                      <span className="text-[13px] text-gray-600">{w.fact}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={startDialog}
                className="bg-orange-500 text-white text-[19px] font-bold px-10 py-4 rounded-[20px] shadow-lg active:scale-95 transition-transform"
              >
                Начать расследование 🔍
              </button>
              <button onClick={() => setPhase("picker")}
                className="text-gray-400 text-[14px]"
              >
                ← Назад
              </button>
            </div>
          </div>
        )}

        {/* DIALOG */}
        {phase === "dialog" && (
          <div className="flex flex-col flex-1">
            <TopProgress collected={collected} current={taskIdx} />
            <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-3 pt-2" style={{ maxHeight: "calc(100vh - 160px)" }}>
              {messages.map((m, i) => {
                if (m.type === "bot") return (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-xl mt-0.5 flex-shrink-0">🔍</span>
                    <div className="bg-gray-100 rounded-[16px] rounded-tl-[4px] px-4 py-3 text-[15px] text-gray-800 max-w-[85%]">
                      {m.text}
                      {m.stars > 0 && <span className="ml-2 text-yellow-500">{"⭐".repeat(m.stars)}</span>}
                    </div>
                  </div>
                );
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
                  <span className="text-xl">🔍</span>
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
                placeholder="Твоя версия..."
                className="flex-1 bg-gray-100 rounded-[18px] px-4 py-3 text-[15px] outline-none"
                disabled={isTyping}
              />
              <button
                onClick={handleUserMessage}
                disabled={!input.trim() || isTyping}
                className="bg-orange-500 text-white rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0"
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
              <div className="w-full bg-gray-50 rounded-[16px] p-4 text-[15px] text-gray-700 leading-relaxed">
                <p className="font-semibold text-gray-500 text-[12px] mb-2">БОНУСНЫЙ ФАКТ</p>
                {task.puzzle.bonusFact}
              </div>
              {sessionStars > 0 && (
                <div className="text-yellow-500 text-[16px] font-semibold">
                  {"⭐".repeat(Math.min(sessionStars, 9))} +{sessionStars} к мышлению
                </div>
              )}
              <button onClick={goTwist}
                className="w-full bg-gray-900 text-white text-[16px] font-bold py-4 rounded-[18px] active:scale-95 transition-transform"
              >
                А инженеры решили то же самое →
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
                  Получить приём {task.trick.animal} →
                </button>
              )}
            </div>
          </div>
        )}

        {/* OUTCOME */}
        {phase === "outcome" && (
          <div className="flex flex-col flex-1 px-5 pb-8">
            <TopProgress collected={collected} current={-1} />
            <div className="flex flex-col flex-1 justify-center items-center gap-5">
              <div className="text-6xl">{task.trick.animal}</div>
              <div className="text-center">
                <div className="text-[13px] text-gray-400 uppercase tracking-wide mb-1">Приём природы</div>
                <div className="text-[24px] font-bold" style={{ color: task.trick.color }}>
                  {task.trick.name}
                </div>
                <div className="text-[14px] text-gray-500 mt-1">{task.trick.animalName}</div>
              </div>
              <div className="bg-gray-50 rounded-[16px] px-5 py-4 text-center text-[15px] text-gray-700 italic">
                «{task.trick.motto}»
              </div>
              <div className="text-center text-[13px] text-gray-400">
                Мышление: {thinkingType(totalStars).emoji} {thinkingType(totalStars).label}<br/>
                Всего звёзд: {totalStars} ⭐
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
            <div className="text-[60px]">🏆</div>
            <h2 className="text-[22px] font-bold text-center text-gray-900">Все задачи разгаданы!</h2>
            <div className="text-center">
              <div className="text-[32px] font-bold text-orange-500">{totalStars} ⭐</div>
              <div className="text-gray-500 text-[15px]">{thinkingType(totalStars).emoji} {thinkingType(totalStars).label} тип мышления</div>
            </div>
            <div className="w-full bg-gray-50 rounded-[16px] p-4 flex flex-col gap-2">
              {TASKS.map(t => (
                <div key={t.id} className="flex items-center gap-3 text-[14px] text-gray-700">
                  <span className="text-green-500">✓</span>
                  <span className="text-xl">{t.trick.animal}</span>
                  <span className="font-semibold">{t.trick.name}</span>
                  <span className="text-gray-400 text-[12px]">— {t.trick.animalName}</span>
                </div>
              ))}
            </div>
            <button onClick={resetProgress}
              className="w-full py-4 rounded-[18px] border-2 border-gray-200 text-gray-600 font-semibold text-[16px] active:scale-95 transition-transform"
            >
              Начать заново
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
