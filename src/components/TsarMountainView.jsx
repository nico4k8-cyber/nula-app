import { useState, useEffect } from "react";
import { TWENTY_Q_WORDS, pickWord, localAnswer } from "../bot/twenty-q-words";
import { loadUsedTsarIds, saveUsedTsarIds, loadTsarWords } from "../lib/supabase";
import { useGameStore } from "../store/gameStore";

const TSAR_USED_KEY = "shariel_used_tsar_ids";
function loadLocalTsarIds() {
  try { return JSON.parse(localStorage.getItem(TSAR_USED_KEY) || "[]"); } catch { return []; }
}
function saveLocalTsarIds(ids) {
  localStorage.setItem(TSAR_USED_KEY, JSON.stringify(ids));
}

const MAX_Q = 20;
const SCORE_TABLE = [
  { max: 5,  score: 50 },
  { max: 10, score: 30 },
  { max: 15, score: 20 },
  { max: 20, score: 10 },
];

function calcScore(questionsUsed) {
  return (SCORE_TABLE.find(s => questionsUsed <= s.max) || { score: 0 }).score;
}

const MOUNTAIN_STAGES = [
  { emoji: '🌄', label: 'Подножие' },
  { emoji: '⛰️', label: 'Склон' },
  { emoji: '🗻', label: 'Почти' },
  { emoji: '🏔️', label: 'Вершина!' },
];

function getMountainStage(questionsLeft) {
  if (questionsLeft > 15) return 0;
  if (questionsLeft > 10) return 1;
  if (questionsLeft > 5)  return 2;
  return 3;
}

export default function TsarMountainView({ onBack, onComplete }) {
  const user = useGameStore(s => s.user);
  const [step, setStep] = useState("intro"); // intro | play | guess | fallen | result
  const [word, setWord] = useState(null);
  const [questionsLeft, setQuestionsLeft] = useState(MAX_Q);
  const [history, setHistory] = useState([]); // [{q, a}]
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [won, setWon] = useState(false);
  const [usedIds, setUsedIds] = useState(() => loadLocalTsarIds());
  // wordPool — слова из Supabase (если есть) или встроенный список
  const [wordPool, setWordPool] = useState(TWENTY_Q_WORDS);

  // При монтировании: подгружаем слова из Supabase + синхронизируем использованные
  useEffect(() => {
    loadTsarWords().then(words => {
      if (words?.length) setWordPool(words);
    });
    if (!user?.id) return;
    loadUsedTsarIds(user.id).then(ids => {
      if (ids?.length) {
        setUsedIds(prev => {
          const merged = [...new Set([...prev, ...ids])];
          saveLocalTsarIds(merged);
          return merged;
        });
      }
    });
  }, [user?.id]);

  function handleStart() {
    let currentUsed = usedIds;
    // Все слова пройдены → сбрасываем список (новый круг)
    const available = wordPool.filter(w => !currentUsed.includes(w.id));
    if (available.length === 0) {
      currentUsed = [];
      setUsedIds([]);
      saveLocalTsarIds([]);
      if (user?.id) saveUsedTsarIds(user.id, []);
    }
    const pool = wordPool.filter(w => !currentUsed.includes(w.id));
    const w = pool[Math.floor(Math.random() * pool.length)];
    setWord(w);
    setQuestionsLeft(MAX_Q);
    setHistory([]);
    setInput("");
    setStep("play");
  }

  async function handleAsk() {
    const q = input.trim();
    if (!q || isThinking || questionsLeft <= 0) return;
    setInput("");
    setIsThinking(true);

    let answer = word.category ? localAnswer(q, word) : null;

    if (!answer) {
      try {
        const resp = await fetch("/api/ai-master", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "twenty_q_answer", secretWord: word.word, question: q }),
        });
        if (resp.ok) {
          const data = await resp.json();
          answer = data.answer || "Не знаю";
        } else throw new Error();
      } catch {
        answer = Math.random() > 0.5 ? "Да" : "Нет";
      }
    }

    const newLeft = questionsLeft - 1;
    setQuestionsLeft(newLeft);
    setHistory(h => [...h, { q, a: answer }]);
    setIsThinking(false);

    if (newLeft <= 0) {
      // ran out without guessing
      setFinalScore(0);
      setWon(false);
      setStep("result");
    }
  }

  function handleGuess() {
    setStep("guess");
    setInput("");
  }

  function handleSubmitGuess() {
    const guess = input.trim().toLowerCase();
    const correct = word.word.toLowerCase();
    const questionsUsed = MAX_Q - questionsLeft;

    if (guess === correct || correct.includes(guess) || guess.includes(correct)) {
      const score = calcScore(questionsUsed);
      setFinalScore(score);
      setWon(true);
      setUsedIds(ids => {
        const next = [...ids, word.id];
        saveLocalTsarIds(next);
        if (user?.id) saveUsedTsarIds(user.id, next);
        return next;
      });
      if (onComplete) onComplete(score);
      setStep("result");
    } else {
      // fell off the mountain — but keep same questions counter, go back to play
      setHistory(h => [...h, { q: `Это ${input.trim()}?`, a: "Нет ❌ (упал с горы!)" }]);
      setInput("");
      setStep("play");
    }
  }

  /* ─── INTRO ─── */
  if (step === "intro") {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-violet-900 to-slate-900 animate-fade-in">
        <button onClick={onBack} className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white text-xl active:scale-95 z-20">←</button>

        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center gap-6 pt-16">
          <div className="text-8xl">🏔️</div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Царь-гора</h1>
          <div className="bg-white/10 rounded-[28px] p-6 max-w-xs text-white/80 text-[15px] leading-relaxed space-y-2 text-left">
            <p>🎯 Орин загадывает слово</p>
            <p>❓ Ты задаёшь вопросы — он отвечает <strong className="text-white">Да</strong> или <strong className="text-white">Нет</strong></p>
            <p>⚡ Угадал быстро — больше очков</p>
            <p>❌ Назвал неверное слово — падаешь с горы и начинаешь снова</p>
            <p>📊 Всего <strong className="text-white">{MAX_Q} попыток</strong></p>
          </div>
          <div className="bg-white/5 rounded-2xl px-6 py-3 text-white/50 text-xs font-bold">
            ≤5 вопросов = 50⭐ · ≤10 = 30⭐ · ≤15 = 20⭐ · ≤20 = 10⭐
          </div>
          <button
            onClick={handleStart}
            className="mt-2 w-full max-w-xs py-5 rounded-[28px] bg-violet-500 text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-violet-900 active:scale-95 transition-all"
          >
            Начать восхождение 🏔️
          </button>
        </div>
      </div>
    );
  }

  /* ─── PLAY ─── */
  if (step === "play") {
    const stageIdx = getMountainStage(questionsLeft);
    const stage = MOUNTAIN_STAGES[stageIdx];
    return (
      <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-violet-900 to-slate-900 animate-fade-in text-white">
        <button onClick={() => setStep("intro")} className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white text-xl active:scale-95 z-20">←</button>

        {/* Header */}
        <div className="pt-20 px-6 pb-4 text-center">
          <div className="text-5xl mb-1">{stage.emoji}</div>
          <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">{stage.label}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="bg-white/10 rounded-full px-4 py-1 text-sm font-black">
              Вопросов осталось: <span className={questionsLeft <= 5 ? "text-red-400" : "text-violet-300"}>{questionsLeft}</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 mx-auto max-w-[240px] h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="bg-violet-400 h-full transition-all duration-500" style={{ width: `${((MAX_Q - questionsLeft) / MAX_Q) * 100}%` }} />
          </div>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2 max-h-[35vh]">
          {history.length === 0 && (
            <div className="text-center text-white/30 text-sm py-4 font-bold">Задавай вопросы — я отвечу Да или Нет</div>
          )}
          {history.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-white/40 font-black w-5 shrink-0">{i + 1}.</span>
              <span className="text-white/80 flex-1">{item.q}</span>
              <span className={`font-black shrink-0 ${item.a === 'Да' ? 'text-emerald-400' : item.a.includes('❌') ? 'text-red-400' : 'text-rose-400'}`}>{item.a}</span>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-6 pb-6 space-y-3">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-white/10 border border-white/20 rounded-[16px] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-violet-400 text-[15px]"
              placeholder="Задай вопрос..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAsk()}
              disabled={isThinking}
              autoFocus
            />
            <button
              onClick={handleAsk}
              disabled={!input.trim() || isThinking}
              className="px-5 py-3 rounded-[16px] bg-violet-500 font-black text-sm disabled:opacity-30 active:scale-95 transition-all"
            >
              {isThinking ? "..." : "→"}
            </button>
          </div>
          <button
            onClick={handleGuess}
            className="w-full py-4 rounded-[20px] border-2 border-yellow-400/50 text-yellow-300 font-black uppercase tracking-widest text-sm active:scale-95 transition-all"
          >
            🎯 Я знаю ответ!
          </button>
        </div>
      </div>
    );
  }

  /* ─── GUESS ─── */
  if (step === "guess") {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-violet-900 to-slate-900 animate-fade-in text-white items-center justify-center px-8 gap-6">
        <div className="text-6xl">🎯</div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Назови слово!</h2>
        <p className="text-white/50 text-sm text-center">Если ошибёшься — упадёшь с горы<br />и потеряешь одну попытку</p>
        <input
          className="w-full max-w-xs bg-white/10 border-2 border-white/20 rounded-[20px] px-6 py-4 text-white text-[18px] font-bold text-center placeholder-white/30 outline-none focus:border-yellow-400"
          placeholder="Введи слово..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmitGuess()}
          autoFocus
        />
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => { setInput(""); setStep("play"); }} className="flex-1 py-4 rounded-[20px] bg-white/10 font-black uppercase tracking-widest text-sm active:scale-95">
            Назад
          </button>
          <button
            onClick={handleSubmitGuess}
            disabled={!input.trim()}
            className="flex-1 py-4 rounded-[20px] bg-yellow-400 text-slate-900 font-black uppercase tracking-widest text-sm disabled:opacity-30 active:scale-95"
          >
            Это оно!
          </button>
        </div>
      </div>
    );
  }

  /* ─── RESULT ─── */
  if (step === "result") {
    const questionsUsed = MAX_Q - questionsLeft;
    return (
      <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-violet-900 to-slate-900 animate-fade-in text-white">
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center gap-6 pt-16">
          <div className="text-8xl">{won ? "🏆" : "💫"}</div>
          <h2 className="text-3xl font-black uppercase tracking-tight">
            {won ? "Угадал!" : "Время вышло"}
          </h2>

          <div className="bg-white/10 rounded-[28px] p-6 w-full max-w-sm space-y-2">
            <p className="text-white/50 text-xs uppercase font-black tracking-widest">Загаданное слово</p>
            <div className="text-5xl">{word?.emoji}</div>
            <p className="text-2xl font-black">{word?.word}</p>
            {won && (
              <p className="text-white/60 text-sm">Угадал за <strong className="text-violet-300">{questionsUsed}</strong> вопросов</p>
            )}
          </div>

          {won && (
            <div className="flex items-center gap-3">
              <div className="px-6 py-3 bg-violet-500 text-white rounded-full font-black text-xl shadow-lg shadow-violet-900">
                +{finalScore} ⭐
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={handleStart}
              className="w-full py-5 rounded-[28px] bg-violet-500 text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Новое слово 🏔️
            </button>
            <button
              onClick={onBack}
              className="w-full py-4 rounded-[28px] bg-white/10 text-white font-black uppercase tracking-widest text-sm active:scale-95 transition-all"
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
