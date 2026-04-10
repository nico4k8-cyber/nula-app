import React, { useState, useRef, useEffect } from "react";
import PhaseIndicator from "./PhaseIndicator";
import ResourceButtons from "./ResourceButtons";

export default function DialogView({
  phase,
  task,
  messages,
  isTyping,
  trizState,
  prizStep,
  sessionStars,
  totalStars,
  isTutorial,
  onBack,
  onSkip,
  onHint,
  hintsLeft,
  isHinting,
  onSelectResource,
  onSendMessage,
  input,
  setInput,
  inputRef,
  bottomRef,
  childMsgCount,
  bingoFlash,
  onGoToDebrief,
  t,
  lang
}) {
  const [isListening, setIsListening] = useState(false);
  const [showExitSheet, setShowExitSheet] = useState(false);
  const [showCondition, setShowCondition] = useState(false);
  const recognitionRef = useRef(null);
  const cancelledRef = useRef(false); // guard: prevent stale recognition firing after task switch
  const isSubmittingRef = useRef(false); // guard: prevent double-send

  useEffect(() => {
    bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    cancelledRef.current = false;
    isSubmittingRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
    };
  }, [task?.id]);

  const toggleMic = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t?.('dialog.no_mic') || "Голосовой ввод недоступен в вашем браузере.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-US' : 'ru-RU';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    let baseInput = input.trim() ? input.trim() + " " : "";

    recognition.onresult = (event) => {
      if (cancelledRef.current) return;
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        baseInput += finalTranscript + " ";
        setInput(baseInput);
      } else if (interimTranscript) {
        setInput(baseInput + interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (cancelledRef.current) return;
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert(t?.('dialog.mic_denied') || "Нет доступа к микрофону. Разреши в настройках браузера.");
      }
    };
    recognition.onend = () => {
      if (!cancelledRef.current) setIsListening(false);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) { console.error("Mic start failed", e); }
  };

  const isTriz = (t) => t?.core_problem && t?.ikr && t?.resources;
  const hintsExhausted = hintsLeft === 0;

  return (
    <div className="flex flex-col h-[100dvh] bg-white relative animate-fade-in-up overflow-hidden">

      {/* HUD Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={() => setShowExitSheet(true)}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 active:scale-90"
        >
          <span className="text-xl">←</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-indigo-50 px-4 py-2.5 rounded-full border border-indigo-100 shadow-sm">
            <span className="text-sm">⭐</span>
            <span className="text-[17px] font-black text-indigo-700 tracking-tight">{totalStars}</span>
          </div>
          {sessionStars > 0 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 px-4 py-2.5 rounded-full border border-yellow-200 shadow-md animate-bounce-slow">
              <span className="text-sm font-bold text-white tracking-widest animate-pulse">+{sessionStars}</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible task condition */}
      {task && (
        <div className="border-b border-slate-100 bg-white">
          <button
            onClick={() => setShowCondition(v => !v)}
            className="w-full flex items-center justify-between px-5 py-2.5 text-left"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-base">{task.icon || '📋'}</span>
              <span className="text-[13px] font-bold text-slate-600 truncate">{task.title}</span>
            </div>
            <span className={`text-slate-400 text-[11px] font-bold uppercase tracking-wider ml-3 shrink-0 transition-transform duration-200 ${showCondition ? 'rotate-180' : ''}`}>
              {showCondition ? '▲' : '▼'}
            </span>
          </button>
          {showCondition && (
            <div className="px-5 pb-4 pt-1 animate-fade-in">
              {task.image_url && (
                <img src={task.image_url} alt={task.title} className="w-full rounded-xl object-cover max-h-[180px] mb-3 border border-slate-100" />
              )}
              <p className="text-[14px] text-slate-700 leading-relaxed font-medium">
                {task.teaser || task.puzzle?.question || ''}
              </p>
              {task.resources && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {task.resources.map((r, i) => (
                    <span key={i} className="text-[12px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">{r.emoji} {r.label}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress Steps */}
      <PhaseIndicator
        trizPhase={trizState?.phase ?? -1}
        prizStep={prizStep}
        cycleCount={trizState?.cycleCount ?? 0}
        t={t}
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4 pt-4 custom-scrollbar bg-gray-50/20">
        {messages.map((m, i) => {
          if (m.type === "bot") {
            if (m.isStageMsg) {
              return (
                <div key={i} className="flex justify-center p-2">
                  <div className="bg-orange-100 border-2 border-orange-200 rounded-[18px] px-5 py-2 text-[14px] font-black text-orange-700 shadow-sm animate-fade-in">
                    🔥 {m.text}
                  </div>
                </div>
              );
            }
            if (m.isDiscovery) {
              return (
                <div key={i} className="flex justify-center p-2">
                  <div className="bg-emerald-500 rounded-[18px] px-6 py-3 text-[15px] font-black text-white shadow-lg animate-bounce border-2 border-emerald-300">
                    ✨ {m.text}
                  </div>
                </div>
              );
            }
            if (m.isHint) {
              return (
                <div key={i} className="flex justify-center p-2 animate-fade-in">
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-[18px] px-5 py-3 text-[14px] text-amber-800 font-semibold max-w-[88%] shadow-sm">
                    💡 {m.text}
                  </div>
                </div>
              );
            }
            const isLastBotMsg = i === messages.length - 1 || messages[i+1]?.type !== 'bot';
            return (
              <div key={i} className="flex gap-3 items-end animate-fade-in-left">
                {isLastBotMsg && <img src="/img/webp/ugolok.webp" alt="Орин" className="w-10 h-10 flex-shrink-0 rounded-full object-cover shadow-md border-2 border-white ring-2 ring-orange-50" />}
                <div className={`flex flex-col gap-0.5 ${!isLastBotMsg ? 'ml-12' : ''}`}>
                  <div className={`bg-white shadow-sm border border-slate-100 rounded-[22px] ${isLastBotMsg ? 'rounded-bl-[4px]' : ''} px-5 py-3.5 text-[16px] text-slate-800 max-w-[90%] leading-relaxed`}>
                    {m.text}
                    {m.stars > 0 && <div className="mt-2 text-yellow-500 font-bold tracking-widest animate-pulse">{"⭐".repeat(m.stars)}</div>}
                  </div>
                  {isLastBotMsg && <span className="text-[11px] font-bold text-slate-300 ml-2 uppercase tracking-widest">{m.timestamp}</span>}
                </div>
              </div>
            );
          }
          if (m.type === "child") return (
            <div key={i} className="flex justify-end gap-3 items-end animate-fade-in-right">
              <div className="flex flex-col gap-0.5 items-end">
                <div className={`bg-orange-500 text-white rounded-[22px] rounded-tr-[4px] px-5 py-3.5 text-[16px] max-w-[85%] leading-relaxed shadow-md shadow-orange-100 ${bingoFlash ? "ring-4 ring-yellow-400 animate-pulse" : ""}`}>
                  {m.text}
                </div>
                <span className="text-[11px] font-bold text-slate-300 mr-1 uppercase tracking-widest">{m.timestamp}</span>
              </div>
            </div>
          );
          return null;
        })}

        {(isTyping || isHinting) && (
          <div className="flex gap-3 items-end px-2">
            <img src="/img/webp/ugolok.webp" alt="Орин" className="w-10 h-10 flex-shrink-0 rounded-full object-cover blur-[0.5px] opacity-70" />
            <div className="bg-slate-100 rounded-[22px] rounded-bl-[4px] px-5 py-3.5 flex gap-1.5 shadow-inner">
              {[0,1,2].map(j => (
                <div key={j} className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Action Footer */}
      <div className="px-5 pb-6 pt-3 bg-white border-t border-slate-100 shadow-up">

        {/* Resources Helper (TRIZ Phase 3-4) */}
        {task && isTriz(task) && task.resources && trizState && (trizState.phase === 3 || trizState.phase === 4) && (
          <div className="mb-4 animate-fade-in-up">
            <p className="text-center text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{t?.('dialog.resources_label') || 'Твои ресурсы для решения:'}</p>
            <ResourceButtons
              resources={task.resources}
              currentResource={trizState.currentResource}
              onSelectResource={onSelectResource}
              disabled={isTyping}
              t={t}
            />
          </div>
        )}

        {/* Tutorial hint above input */}
        {isTutorial && messages.filter(m => m.type === "child").length === 0 && (
          <div className="mb-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
            <span className="text-lg">🐉</span>
            <p className="text-[13px] text-amber-800 font-semibold">
              Напиши свою идею — любую! Орин поможет её улучшить.
            </p>
          </div>
        )}

        {/* Hint button */}
        {childMsgCount >= 1 && !isTyping && !isHinting && (
          <button
            onClick={hintsExhausted ? null : onHint}
            className={`w-full mb-3 py-2.5 rounded-[18px] text-[13px] font-black uppercase tracking-wider border-2 transition-all active:scale-95 flex items-center justify-center gap-2 ${
              hintsExhausted
                ? "bg-slate-50 text-slate-300 border-slate-100 cursor-default"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            💡 Подсказка
            {hintsLeft !== Infinity && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${hintsExhausted ? "bg-slate-100 text-slate-300" : "bg-amber-200 text-amber-800"}`}>
                {hintsExhausted ? "исчерпано" : `осталось ${hintsLeft}`}
              </span>
            )}
          </button>
        )}

        {/* Задача решена — показываем кнопку перехода к результату */}
        {prizStep >= 4 ? (
          <button
            onClick={onGoToDebrief}
            className="w-full py-4 bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[17px] font-black rounded-[22px] shadow-lg shadow-orange-200 active:scale-[0.97] transition-all animate-fade-in-up"
          >
            Посмотреть результат →
          </button>
        ) : (
          /* Chat Input */
          <div className="flex gap-2 items-center">
            <button
              onClick={toggleMic}
              className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-all ${
                isListening ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              }`}
            >
              🎤
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && !isListening && !isSubmittingRef.current) {
                  isSubmittingRef.current = true;
                  onSendMessage();
                  setTimeout(() => { isSubmittingRef.current = false; }, 500);
                }
              }}
              placeholder={isListening ? "Говорите..." : (t?.('dialog.placeholder') || 'Напиши свою идею...')}
              className={`flex-1 border-2 bg-slate-100 rounded-[24px] px-5 py-4 text-[16px] outline-none transition-all font-medium ${
                isListening ? "border-red-400 placeholder:text-red-300 shadow-inner" : "border-transparent focus:border-orange-200 focus:bg-white placeholder:text-slate-400 shadow-inner"
              }`}
              disabled={isTyping || isHinting || isListening}
            />

            <button
              onClick={onSendMessage}
              disabled={!input.trim() || isTyping || isHinting}
              className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full w-14 h-14 flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all shadow-lg shadow-orange-200 flex-shrink-0"
            >
              <span className="text-2xl">↑</span>
            </button>
          </div>
        )}
      </div>

      {/* Exit Bottom Sheet */}
      {showExitSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowExitSheet(false)} />
          <div className="relative bg-white rounded-t-[32px] px-6 pb-10 pt-6 shadow-2xl animate-fade-in-up">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            <h3 className="text-[18px] font-black text-slate-800 text-center mb-1">Эта задачка не идёт?</h3>
            <p className="text-[14px] text-slate-400 text-center mb-6">Это бывает. Что хочешь сделать?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowExitSheet(false)}
                className="w-full py-4 bg-orange-500 text-white font-black text-[16px] rounded-[20px] active:scale-95 transition-all"
              >
                Продолжаю думать →
              </button>
              <button
                onClick={() => { setShowExitSheet(false); onSkip?.(); }}
                className="w-full py-4 bg-slate-100 text-slate-600 font-black text-[16px] rounded-[20px] active:scale-95 transition-all"
              >
                Вернуться позже
              </button>
              <button
                onClick={() => { setShowExitSheet(false); onBack?.(); }}
                className="w-full py-3 text-slate-400 font-bold text-[14px] active:scale-95 transition-all"
              >
                Пропустить совсем
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
