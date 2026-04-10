import { useState, useEffect } from "react";
import { pickItem } from "../bot/bredo-items";
import { savePatentToSupabase } from "../lib/supabase";
import { useGameStore } from "../store/gameStore";

const STORAGE_KEY = "shariel_patents";
const USED_BREDO_KEY = "shariel_used_bredo_ids";

function loadLocalPatents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveLocalPatent(patent) {
  const patents = loadLocalPatents();
  patents.push(patent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patents));
}
function loadLocalUsedBreoIds() {
  try { return JSON.parse(localStorage.getItem(USED_BREDO_KEY) || "[]"); } catch { return []; }
}
function saveLocalUsedBreoIds(ids) {
  localStorage.setItem(USED_BREDO_KEY, JSON.stringify(ids));
}

export default function BredomakerView({ onBack, t }) {
  const user = useGameStore(s => s.user);
  const [step, setStep] = useState("intro"); // intro | play | thinking | result
  const [item, setItem] = useState(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [usedIds, setUsedIds] = useState(() => loadLocalUsedBreoIds());
  const patents = loadLocalPatents();

  const QUESTIONS = item ? [
    `Что умеет делать «${item.name}»? Назови 3 свойства.`,
    `Где в жизни не хватает того, что умеет «${item.name}»?`,
    `Придумай устройство или изобретение на основе «${item.name}» — как оно называется и где используется?`,
  ] : [];

  function handleStart() {
    setItem(pickItem(usedIds));
    setQuestionIdx(0);
    setText("");
    setResult(null);
    setStep("play");
  }

  function handleNextQuestion() {
    if (questionIdx < QUESTIONS.length - 1) {
      setQuestionIdx(q => q + 1);
      setText("");
    }
  }

  async function handlePatent() {
    if (!text.trim()) return;
    setStep("thinking");

    let reaction, score;
    try {
      const resp = await fetch("/api/ai-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_invention",
          item: item.name,
          itemHint: item.hint,
          invention: text.trim(),
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        reaction = data.reaction || "Интересная идея!";
        score = data.score || 10;
      } else throw new Error("api error");
    } catch {
      // fallback offline
      const words = text.trim().split(" ").length;
      score = words > 10 ? 20 : words > 5 ? 15 : 10;
      reaction = score >= 20
        ? "Вау! Такого ещё не было — это настоящее изобретение! 🚀"
        : "Хорошая мысль! Орин записывает в копилочку 📜";
    }

    const patent = {
      id: Date.now(),
      itemId: item.id,
      item: item.name,
      itemEmoji: item.emoji,
      invention: text.trim(),
      score,
      date: new Date().toLocaleDateString("ru-RU"),
    };
    const nextUsedIds = [...usedIds, item.id];
    setUsedIds(nextUsedIds);
    saveLocalPatent(patent);
    saveLocalUsedBreoIds(nextUsedIds);
    if (user?.id) savePatentToSupabase(user.id, patent, nextUsedIds);
    setResult({ reaction, score, patent });
    setStep("result");
  }

  /* ─── INTRO ─── */
  if (step === "intro") {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-rose-50 to-orange-50 animate-fade-in">
        <button onClick={onBack} className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/90 rounded-2xl text-slate-800 text-xl shadow-xl active:scale-95 z-20">←</button>

        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center gap-6 pt-24">
          <div className="text-8xl">⚙️</div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Бредогенератор</h1>
          <p className="text-slate-600 text-[16px] leading-relaxed max-w-xs">
            Тебе дадут случайный предмет.<br />
            Придумай из него <strong>изобретение</strong>.<br />
            Лучшие идеи попадут в <strong>Патентную копилочку</strong>!
          </p>

          {patents.length > 0 && (
            <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-rose-100 text-sm text-slate-500">
              📜 В копилочке уже <strong className="text-rose-600">{patents.length}</strong> {patents.length === 1 ? "патент" : patents.length < 5 ? "патента" : "патентов"}
            </div>
          )}

          <button
            onClick={handleStart}
            className="mt-4 w-full max-w-xs py-5 rounded-[28px] bg-rose-500 text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-rose-200 active:scale-95 transition-all"
          >
            Получить предмет ⚙️
          </button>
        </div>
      </div>
    );
  }

  /* ─── PLAY ─── */
  if (step === "play") {
    const isLastQuestion = questionIdx === QUESTIONS.length - 1;
    return (
      <div className="flex flex-col min-h-[100dvh] bg-white animate-fade-in">
        <button onClick={() => setStep("intro")} className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/90 rounded-2xl text-slate-800 text-xl shadow-xl active:scale-95 z-20">←</button>

        {/* Item card */}
        <div className="px-6 pt-24 pb-4">
          <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-[32px] p-8 text-white text-center shadow-xl shadow-rose-200">
            <div className="text-7xl mb-3">{item.emoji}</div>
            <h2 className="text-2xl font-black uppercase tracking-tight">{item.name}</h2>
            <p className="text-white/70 text-sm mt-1">{item.hint}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-3">
          {QUESTIONS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === questionIdx ? "bg-rose-500 w-6" : i < questionIdx ? "bg-rose-300" : "bg-slate-200"}`} />
          ))}
        </div>

        {/* Question */}
        <div className="px-6 flex-1 flex flex-col gap-4">
          <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100">
            <p className="text-[15px] font-bold text-slate-800 leading-snug">
              {QUESTIONS[questionIdx]}
            </p>
          </div>

          <textarea
            className="w-full rounded-[20px] border-2 border-slate-200 focus:border-rose-400 outline-none p-5 text-[15px] text-slate-800 resize-none bg-white transition-colors"
            rows={4}
            placeholder="Пиши сюда..."
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
          />

          {!isLastQuestion ? (
            <button
              onClick={handleNextQuestion}
              disabled={!text.trim()}
              className="w-full py-4 rounded-[20px] bg-slate-800 text-white font-black uppercase tracking-widest text-sm disabled:opacity-30 active:scale-95 transition-all"
            >
              Дальше →
            </button>
          ) : (
            <button
              onClick={handlePatent}
              disabled={!text.trim()}
              className="w-full py-4 rounded-[20px] bg-rose-500 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-rose-200 disabled:opacity-30 active:scale-95 transition-all"
            >
              Запатентовать 📜
            </button>
          )}
        </div>
        <div className="h-10" />
      </div>
    );
  }

  /* ─── THINKING ─── */
  if (step === "thinking") {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-white items-center justify-center gap-6 animate-fade-in">
        <div className="text-6xl animate-bounce">⚙️</div>
        <p className="font-black text-slate-700 uppercase tracking-widest text-sm">Орин оценивает...</p>
      </div>
    );
  }

  /* ─── RESULT ─── */
  if (step === "result" && result) {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-rose-50 to-orange-50 animate-fade-in">
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center gap-6 pt-16">
          <div className="text-6xl">📜</div>
          <div className="bg-white rounded-[32px] p-8 shadow-xl border border-rose-100 w-full max-w-sm">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-3">Патент #{loadLocalPatents().length}</p>
            <div className="text-4xl mb-2">{result.patent.itemEmoji}</div>
            <p className="text-[13px] text-slate-500 mb-3">Предмет: <strong>{result.patent.item}</strong></p>
            <p className="text-[16px] text-slate-800 font-bold leading-snug italic">«{result.patent.invention}»</p>
          </div>

          <div className="bg-indigo-50 rounded-[24px] p-6 border border-indigo-100 max-w-sm w-full">
            <p className="text-[15px] text-indigo-900 font-bold leading-snug">🐉 {result.reaction}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-6 py-3 bg-rose-500 text-white rounded-full font-black text-xl shadow-lg shadow-rose-200">
              +{result.score} ⭐
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={handleStart}
              className="w-full py-5 rounded-[28px] bg-slate-900 text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Ещё предмет ⚙️
            </button>
            <button
              onClick={onBack}
              className="w-full py-4 rounded-[28px] bg-slate-100 text-slate-700 font-black uppercase tracking-widest text-sm active:scale-95 transition-all"
            >
              На карту
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
