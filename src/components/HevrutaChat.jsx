import { useState, useRef, useEffect } from "react";
import { HAVRUTA_TASKS, matchKeyword } from "../bot/havruta-tasks.js";

async function callHavruta(mode, payload) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, ...payload }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch {
    return { text: null, solved: false };
  }
}

/* ─── Константы фаз ─── */
const PHASE = {
  HEVRUTA: "hevruta",      // Компаньон ищет вместе
  SOLUTION_FOUND: "solution_found", // Решение найдено, ждём согласия
  MASTER: "master",        // Мастер задал вопрос
  BEAUTIFUL: "beautiful",  // Красивое решение найдено
  DONE: "done",
};

/* ─── Начальное состояние ─── */
function makeInitialState(task) {
  return {
    phase: PHASE.HEVRUTA,
    messages: [
      {
        from: "companion",
        text: task.situation,
        type: "situation",
      },
      {
        from: "companion",
        text: task.companion_intro,
        type: "question",
      },
    ],
    nudgeIndex: 0,       // следующий ПРИЗ-вопрос для подсказки
    solutionAccepted: null, // текст принятого решения
    nudgeTimer: null,
  };
}

/* ─── Аватары ─── */
function Avatar({ from }) {
  const styles = {
    companion: { background: "#4A90D9", label: "К" },
    master:    { background: "#8B5CF6", label: "М" },
    user:      { background: "#10B981", label: "Я" },
  };
  const s = styles[from] || styles.companion;
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: s.background,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      {s.label}
    </div>
  );
}

/* ─── Пузырь сообщения ─── */
function Bubble({ msg }) {
  const isUser = msg.from === "user";
  const isMaster = msg.from === "master";
  const isSituation = msg.type === "situation";

  const bubbleStyle = {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: isSituation ? 8 : isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    fontSize: 15,
    lineHeight: 1.5,
    background: isSituation
      ? "#1a1a2e"
      : isUser
      ? "#10B981"
      : isMaster
      ? "#2D1B69"
      : "#1e2a3a",
    color: isSituation ? "#94a3b8" : "white",
    border: isMaster ? "1px solid #8B5CF6" : isSituation ? "1px solid #334155" : "none",
    fontStyle: isSituation ? "italic" : "normal",
  };

  if (isSituation) {
    return (
      <div style={{ width: "100%", display: "flex", justifyContent: "center", margin: "8px 0" }}>
        <div style={{ ...bubbleStyle, maxWidth: "90%", textAlign: "center", fontSize: 13 }}>
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 8,
        alignItems: "flex-end",
      }}
    >
      <Avatar from={msg.from} />
      <div style={bubbleStyle}>{msg.text}</div>
    </div>
  );
}

/* ─── Кнопки быстрых ответов ─── */
function QuickReplies({ options, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "8px 0" }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          style={{
            padding: "6px 14px",
            borderRadius: 16,
            border: "1px solid #334155",
            background: "transparent",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ─── Индикатор фазы ─── */
function PhaseBar({ phase, taskTitle }) {
  const labels = {
    [PHASE.HEVRUTA]: "Хевруса — ищем вместе",
    [PHASE.SOLUTION_FOUND]: "Решение найдено!",
    [PHASE.MASTER]: "Мастер",
    [PHASE.BEAUTIFUL]: "Красивое решение",
    [PHASE.DONE]: "Готово",
  };
  const colors = {
    [PHASE.HEVRUTA]: "#4A90D9",
    [PHASE.SOLUTION_FOUND]: "#10B981",
    [PHASE.MASTER]: "#8B5CF6",
    [PHASE.BEAUTIFUL]: "#F59E0B",
    [PHASE.DONE]: "#F59E0B",
  };

  return (
    <div
      style={{
        padding: "10px 16px",
        background: "#0f172a",
        borderBottom: `2px solid ${colors[phase]}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ color: "#64748b", fontSize: 12 }}>Задача:</div>
      <div style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{taskTitle}</div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          padding: "3px 10px",
          borderRadius: 12,
          background: colors[phase] + "22",
          border: `1px solid ${colors[phase]}`,
          color: colors[phase],
          fontSize: 12,
        }}
      >
        {labels[phase]}
      </div>
    </div>
  );
}

/* ─── Главный компонент ─── */
export default function HevrutaChat({ taskId = "eggs", onBack }) {
  const task = HAVRUTA_TASKS.find((t) => t.id === taskId) || HAVRUTA_TASKS[0];

  const [state, setState] = useState(() => makeInitialState(task));
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Прокрутка вниз при новом сообщении
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, typing]);

  function addMessage(msg, delay = 0) {
    return new Promise((resolve) => {
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, msg],
        }));
        resolve();
      }, delay);
    });
  }

  async function companionReply(text, delay = 600) {
    setTyping(true);
    await new Promise((r) => setTimeout(r, delay));
    setTyping(false);
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { from: "companion", text },
      ],
    }));
  }

  async function masterReply(text, delay = 800) {
    setTyping(true);
    await new Promise((r) => setTimeout(r, delay));
    setTyping(false);
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { from: "master", text },
      ],
    }));
  }

  async function handleSend(text) {
    const trimmed = (text || input).trim();
    if (!trimmed) return;
    setInput("");

    // Добавить сообщение пользователя
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { from: "user", text: trimmed },
      ],
    }));

    const { phase } = state;

    // История для контекста AI
    const historyForAI = state.messages
      .filter((m) => m.type !== "situation")
      .slice(-10)
      .map((m) => ({ from: m.from, text: m.text }));

    // ─── ФАЗА ХЕВРУСА ───
    if (phase === PHASE.HEVRUTA) {
      const match = matchKeyword(trimmed, task.keywords);

      if (match) {
        if (match.accepted) {
          // Решение принято — фиксируем и вызываем Мастера через AI
          setTyping(true);
          await new Promise((r) => setTimeout(r, 700));
          setTyping(false);

          const acceptedText = match.text + " " + task.solution_accepted_suffix;
          setState((prev) => ({
            ...prev,
            phase: PHASE.SOLUTION_FOUND,
            solutionAccepted: trimmed,
            messages: [...prev.messages, { from: "companion", text: acceptedText }],
          }));

          // Мастер через AI
          setTimeout(async () => {
            setTyping(true);
            const intro = await callHavruta("havruta-master", {
              situation: task.situation,
              solution: trimmed,
              userMessage: "появись",
            });
            setTyping(false);
            const masterText = intro.text || task.master_question;

            setState((prev) => ({
              ...prev,
              phase: PHASE.MASTER,
              messages: [
                ...prev.messages,
                { from: "master", text: task.master_intro },
                { from: "master", text: masterText },
              ],
            }));
          }, 1200);
        } else {
          // Решение частично — компаньон из keyword
          await companionReply(match.text);
        }
      } else {
        // Не распознали — AI компаньон
        setTyping(true);
        const aiReply = await callHavruta("havruta-companion", {
          situation: task.situation,
          userMessage: trimmed,
          history: historyForAI,
        });
        setTyping(false);

        if (aiReply.text) {
          if (aiReply.solved) {
            // AI считает что решение найдено
            setState((prev) => ({
              ...prev,
              phase: PHASE.SOLUTION_FOUND,
              solutionAccepted: trimmed,
              messages: [...prev.messages, { from: "companion", text: aiReply.text }],
            }));
            // Мастер
            setTimeout(async () => {
              setTyping(true);
              const masterAI = await callHavruta("havruta-master", {
                situation: task.situation,
                solution: trimmed,
                userMessage: "появись",
              });
              setTyping(false);
              setState((prev) => ({
                ...prev,
                phase: PHASE.MASTER,
                messages: [
                  ...prev.messages,
                  { from: "master", text: task.master_intro },
                  { from: "master", text: masterAI.text || task.master_question },
                ],
              }));
            }, 1200);
          } else {
            await companionReply(aiReply.text, 0);
          }
        } else {
          // AI недоступен — ПРИЗ-подсказка
          const nudgeIndex = state.nudgeIndex;
          const nudge = task.priiz_nudges[nudgeIndex] || "Давай попробуем с другого угла — что если изменить время?";
          await companionReply(nudge, 0);
          setState((prev) => ({ ...prev, nudgeIndex: Math.min(prev.nudgeIndex + 1, task.priiz_nudges.length) }));
        }
      }
      return;
    }

    // ─── ФАЗА МАСТЕР ───
    if (phase === PHASE.MASTER) {
      const match = matchKeyword(trimmed, task.beautiful_keywords);

      if (match) {
        // Красивое решение через keyword
        setTyping(true);
        await new Promise((r) => setTimeout(r, 900));
        setTyping(false);

        setState((prev) => ({
          ...prev,
          phase: PHASE.BEAUTIFUL,
          messages: [...prev.messages, { from: "master", text: `Точно! ${match}` }],
        }));

        // Раскрытие принципа через AI
        setTimeout(async () => {
          setTyping(true);
          const reveal = await callHavruta("havruta-reveal", {
            situation: task.situation,
            beautiful: trimmed,
            userMessage: "расскажи принцип",
          });
          setTyping(false);
          const revealText = reveal.text || task.beautiful_reveal;
          setState((prev) => ({
            ...prev,
            phase: PHASE.DONE,
            messages: [...prev.messages, { from: "master", text: revealText }],
          }));
        }, 1000);
      } else {
        // Мастер через AI — продолжает диалог
        setTyping(true);
        const masterContinue = await callHavruta("havruta-master", {
          situation: task.situation,
          solution: state.solutionAccepted || "",
          userMessage: trimmed,
        });
        setTyping(false);

        if (masterContinue.text) {
          // Проверим — может ребёнок дошёл до красивого решения
          const beautifulMatch = matchKeyword(trimmed, task.beautiful_keywords);
          if (beautifulMatch) {
            setState((prev) => ({
              ...prev,
              phase: PHASE.BEAUTIFUL,
              messages: [...prev.messages, { from: "master", text: masterContinue.text }],
            }));
            setTimeout(async () => {
              setTyping(true);
              const reveal = await callHavruta("havruta-reveal", {
                situation: task.situation,
                beautiful: trimmed,
                userMessage: "расскажи принцип",
              });
              setTyping(false);
              setState((prev) => ({
                ...prev,
                phase: PHASE.DONE,
                messages: [...prev.messages, { from: "master", text: reveal.text || task.beautiful_reveal }],
              }));
            }, 1000);
          } else {
            setState((prev) => ({
              ...prev,
              messages: [...prev.messages, { from: "master", text: masterContinue.text }],
            }));
          }
        } else {
          await masterReply(task.master_hint, 0);
        }
      }
      return;
    }

    // ─── ФАЗА DONE ───
    if (phase === PHASE.DONE || phase === PHASE.BEAUTIFUL) {
      await companionReply("Хочешь попробовать другую задачу?");
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const showMasterAppears =
    state.phase === PHASE.MASTER ||
    state.phase === PHASE.BEAUTIFUL ||
    state.phase === PHASE.DONE;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0a0f1a",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Шапка */}
      <PhaseBar phase={state.phase} taskTitle={task.title} />

      {/* Подсказка о персонажах */}
      {state.phase === PHASE.HEVRUTA && state.messages.length <= 3 && (
        <div
          style={{
            padding: "6px 16px",
            background: "#172033",
            fontSize: 12,
            color: "#64748b",
            borderBottom: "1px solid #1e2a3a",
          }}
        >
          К — Компаньон, твой напарник. Оба ищете вместе — ни он, ни ты не знаете ответа.
        </div>
      )}

      {/* Сообщения */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {state.messages.map((msg, i) => (
          <Bubble key={i} msg={msg} />
        ))}

        {/* Мастер появляется */}
        {showMasterAppears && state.phase === PHASE.MASTER && state.messages.filter(m => m.from === "master").length === 0 && (
          <div style={{ textAlign: "center", color: "#8B5CF6", fontSize: 12, padding: "4px 0" }}>
            — Мастер появляется —
          </div>
        )}

        {/* Индикатор печатания */}
        {typing && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <Avatar from={state.phase === PHASE.MASTER ? "master" : "companion"} />
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "18px 18px 18px 4px",
                background: state.phase === PHASE.MASTER ? "#2D1B69" : "#1e2a3a",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: state.phase === PHASE.MASTER ? "#8B5CF6" : "#4A90D9",
                    animation: `bounce 1s infinite ${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Быстрые варианты (только для первой подсказки) */}
      {state.phase === PHASE.HEVRUTA && state.messages.length === 2 && (
        <div style={{ padding: "0 16px 8px" }}>
          <QuickReplies
            options={["Мокрой тряпкой обмотать", "Везти ночью", "Сварить заранее"]}
            onSelect={(v) => handleSend(v)}
          />
        </div>
      )}

      {/* Кнопка "стоп/хватит" на финале */}
      {state.phase === PHASE.DONE && (
        <div style={{ padding: "0 16px 8px", textAlign: "center" }}>
          <button
            onClick={onBack}
            style={{
              padding: "10px 24px",
              borderRadius: 20,
              border: "1px solid #F59E0B",
              background: "transparent",
              color: "#F59E0B",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Выбрать другую задачу
          </button>
        </div>
      )}

      {/* Поле ввода */}
      <div
        style={{
          padding: "12px 16px",
          background: "#0f172a",
          borderTop: "1px solid #1e2a3a",
          display: "flex",
          gap: 8,
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            state.phase === PHASE.DONE
              ? "Задача решена!"
              : state.phase === PHASE.MASTER
              ? "Ответьте на вопрос Мастера..."
              : "Напишите идею..."
          }
          disabled={state.phase === PHASE.DONE}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 20,
            border: "1px solid #334155",
            background: "#1e2a3a",
            color: "white",
            fontSize: 15,
            outline: "none",
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || state.phase === PHASE.DONE}
          style={{
            padding: "10px 16px",
            borderRadius: 20,
            border: "none",
            background:
              state.phase === PHASE.MASTER ? "#8B5CF6" : "#4A90D9",
            color: "white",
            cursor: "pointer",
            fontSize: 14,
            opacity: input.trim() ? 1 : 0.5,
          }}
        >
          →
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
