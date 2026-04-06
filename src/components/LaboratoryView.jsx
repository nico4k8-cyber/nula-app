import { useState } from "react";
import { saveUgcTask } from "../lib/supabase";
import { useGameStore } from "../store/gameStore";

const STEPS = ["intro", "pick-template", "dialog", "result"];

export default function LaboratoryView({ onBack, completedTasks, allTasks, t }) {
  const user = useGameStore(s => s.user);
  const isPremium = useGameStore(s => s.isPremium);

  const [step, setStep] = useState("intro");
  const [template, setTemplate] = useState(null);
  const [dialogStep, setDialogStep] = useState(0);
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [currentInput, setCurrentInput] = useState("");
  const [savedTask, setSavedTask] = useState(null);
  const [saving, setSaving] = useState(false);

  const solvedTasks = allTasks.filter(task => completedTasks.includes(String(task.id)));

  function handleSelectTemplate(task) {
    setTemplate(task);
    setDialogStep(0);
    setAnswers(["", "", "", ""]);
    setCurrentInput("");
    setStep("dialog");
  }

  function getQuestion(idx) {
    if (!template) return "";
    const questions = [
      `В задаче «${template.title}» нужно было ${template.teaser || "найти решение"}. Что ты хочешь изменить? Место, персонажа или предмет?`,
      `Кому поможет твоя новая задача? Придумай персонажа.`,
      `Какой ИКР (идеальный результат) в твоей задаче? Что должно произойти само, без лишних действий?`,
      `Дай название своей задаче!`,
    ];
    return questions[idx];
  }

  function handleDialogNext() {
    if (currentInput.trim().length < 20) return;
    const newAnswers = [...answers];
    newAnswers[dialogStep] = currentInput.trim();
    setAnswers(newAnswers);
    setCurrentInput("");
    if (dialogStep < 3) {
      setDialogStep(dialogStep + 1);
    } else {
      setStep("result");
    }
  }

  async function handleSave(status) {
    if (saving) return;
    setSaving(true);
    const ugcTask = {
      title: answers[3],
      what_changed: answers[0],
      character: answers[1],
      ikr: answers[2],
      template_id: template?.id || null,
      status,
    };
    const result = await saveUgcTask(user?.id, ugcTask);
    setSaving(false);
    if (result) setSavedTask({ ...ugcTask, ...result });
  }

  /* ─── INTRO ─── */
  if (step === "intro") {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-violet-50 to-indigo-50 animate-fade-in">
        <button
          onClick={onBack}
          className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/90 rounded-2xl text-slate-800 text-xl shadow-xl active:scale-95 z-20"
        >
          ←
        </button>

        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center gap-6 pt-24">
          <div className="text-8xl">🐉</div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Лаборатория</h1>
          <p className="text-slate-600 text-[16px] leading-relaxed max-w-xs">
            Ты уже решил столько задач!<br />
            Давай создадим <strong>твою собственную</strong><br />
            ТРИЗ-задачу для других.
          </p>
          <button
            onClick={() => setStep("pick-template")}
            className="mt-4 w-full max-w-xs py-5 rounded-[28px] bg-violet-600 text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-violet-200 active:scale-95 transition-all"
          >
            Начать 🐉
          </button>
        </div>
      </div>
    );
  }

  /* ─── PICK TEMPLATE ─── */
  if (step === "pick-template") {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-violet-50 to-indigo-50 animate-fade-in">
        <button
          onClick={() => setStep("intro")}
          className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/90 rounded-2xl text-slate-800 text-xl shadow-xl active:scale-95 z-20"
        >
          ←
        </button>

        <div className="flex flex-col flex-1 px-6 pt-24 pb-8 gap-4">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-2">
            Выбери задачу-основу
          </h2>

          {solvedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center gap-4 px-4">
              <div className="text-5xl">🔒</div>
              <p className="text-slate-500 text-[16px]">
                Сначала реши хотя бы одну задачу в другом здании
              </p>
              <button
                onClick={onBack}
                className="mt-2 px-8 py-4 rounded-[28px] bg-violet-600 text-white font-bold shadow-lg active:scale-95"
              >
                Вернуться на карту
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto">
              {solvedTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleSelectTemplate(task)}
                  className="flex items-center gap-4 bg-white rounded-[20px] px-5 py-4 shadow-md border border-violet-100 text-left active:scale-[0.98] transition-all"
                >
                  <span className="text-3xl">{task.icon || "📝"}</span>
                  <div>
                    <div className="font-bold text-slate-900 text-[15px]">{task.title}</div>
                    {task.teaser && (
                      <div className="text-slate-500 text-[13px] mt-0.5 line-clamp-1">{task.teaser}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── DIALOG ─── */
  if (step === "dialog") {
    const isValid = currentInput.trim().length >= 20;
    const isLast = dialogStep === 3;

    return (
      <div className="flex flex-col min-h-[100dvh] bg-white animate-fade-in">
        <button
          onClick={() => {
            if (dialogStep > 0) {
              setDialogStep(dialogStep - 1);
              setCurrentInput(answers[dialogStep - 1] || "");
            } else {
              setStep("pick-template");
            }
          }}
          className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/90 rounded-2xl text-slate-800 text-xl shadow-xl active:scale-95 z-20"
        >
          ←
        </button>

        <div className="flex flex-col flex-1 px-6 pt-20 pb-8 gap-6">
          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all ${i <= dialogStep ? "bg-violet-500" : "bg-slate-100"}`}
              />
            ))}
          </div>

          <div className="text-xs text-slate-400 text-center">
            Шаг {dialogStep + 1} из 4
          </div>

          {/* Dragon bubble */}
          <div className="flex items-start gap-3">
            <div className="text-4xl">🐉</div>
            <div className="bg-violet-50 rounded-[20px] rounded-tl-sm px-5 py-4 shadow-sm max-w-[85%]">
              <p className="text-slate-700 text-[15px] leading-relaxed">
                {getQuestion(dialogStep)}
              </p>
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              className="w-full flex-1 min-h-[140px] rounded-[20px] border border-slate-200 px-5 py-4 text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-400 resize-none shadow-sm"
              placeholder="Напиши свой ответ (минимум 20 символов)..."
              value={currentInput}
              onChange={e => setCurrentInput(e.target.value)}
            />
            <div className="text-right text-xs text-slate-400">
              {currentInput.trim().length}/20 минимум
            </div>
          </div>

          <button
            onClick={handleDialogNext}
            disabled={!isValid}
            className={`w-full py-5 rounded-[28px] font-black text-lg uppercase tracking-widest shadow-xl transition-all active:scale-95
              ${isValid ? "bg-violet-600 text-white shadow-violet-200" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
          >
            {isLast ? "Готово! ✨" : "Далее →"}
          </button>
        </div>
      </div>
    );
  }

  /* ─── RESULT ─── */
  if (step === "result") {
    const shareToken = savedTask?.share_token;
    const shareUrl = shareToken
      ? `${window.location.origin}?ugc=${shareToken}`
      : null;

    return (
      <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-violet-50 to-indigo-50 animate-fade-in">
        <button
          onClick={() => setStep("dialog")}
          className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/90 rounded-2xl text-slate-800 text-xl shadow-xl active:scale-95 z-20"
        >
          ←
        </button>

        <div className="flex flex-col flex-1 px-6 pt-20 pb-8 gap-5">
          <div className="text-center">
            <div className="text-5xl mb-2">✨</div>
            <h2 className="text-2xl font-black text-slate-900">Твоя задача готова!</h2>
          </div>

          {/* Preview card */}
          <div className="bg-white rounded-[24px] shadow-xl border border-violet-100 px-6 py-5 flex flex-col gap-3">
            <div className="text-xl font-black text-violet-700">{answers[3] || "Без названия"}</div>
            <div className="h-px bg-violet-50" />
            <div className="text-[14px] text-slate-600">
              <span className="font-semibold text-slate-800">Что изменилось:</span> {answers[0]}
            </div>
            <div className="text-[14px] text-slate-600">
              <span className="font-semibold text-slate-800">Персонаж:</span> {answers[1]}
            </div>
            <div className="text-[14px] text-slate-600">
              <span className="font-semibold text-slate-800">ИКР:</span> {answers[2]}
            </div>
            {template && (
              <div className="text-[12px] text-slate-400 mt-1">
                На основе задачи: {template.title}
              </div>
            )}
          </div>

          {savedTask ? (
            <div className="flex flex-col gap-3">
              <div className="bg-green-50 rounded-[20px] px-5 py-4 text-center text-green-700 font-semibold">
                Сохранено в коллекцию!
              </div>
              {shareUrl && (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(shareUrl).catch(() => {});
                    alert("Ссылка скопирована: " + shareUrl);
                  }}
                  className="w-full py-4 rounded-[28px] bg-indigo-100 text-indigo-700 font-bold text-[15px] active:scale-95 transition-all"
                >
                  Скопировать ссылку
                </button>
              )}
              <button
                onClick={onBack}
                className="w-full py-4 rounded-[28px] bg-white border border-slate-200 text-slate-700 font-bold text-[15px] active:scale-95 transition-all"
              >
                На карту
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSave("private")}
                disabled={saving}
                className="w-full py-5 rounded-[28px] bg-violet-600 text-white font-black text-[16px] uppercase tracking-wide shadow-xl shadow-violet-200 active:scale-95 transition-all disabled:opacity-60"
              >
                {saving ? "Сохраняем..." : "Сохранить в мою коллекцию"}
              </button>

              <button
                onClick={() => handleSave("shared")}
                disabled={saving}
                className="w-full py-4 rounded-[28px] bg-indigo-100 text-indigo-700 font-bold text-[15px] active:scale-95 transition-all disabled:opacity-60"
              >
                Поделиться по ссылке
              </button>

              {isPremium ? (
                <button
                  onClick={() => handleSave("public")}
                  disabled={saving}
                  className="w-full py-4 rounded-[28px] bg-amber-400 text-white font-bold text-[15px] active:scale-95 transition-all disabled:opacity-60"
                >
                  Опубликовать для всех
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 rounded-[28px] bg-slate-100 text-slate-400 font-bold text-[15px] cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>🔒</span> Опубликовать для всех — в платной версии
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
