import React from "react";
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
  onBack,
  onShowAnswer,
  onSelectResource,
  onSendMessage,
  input,
  setInput,
  inputRef,
  bottomRef,
  childMsgCount,
  bingoFlash,
  t
}) {
  const isTriz = (t) => t?.core_problem && t?.ikr && t?.resources;

  return (
    <div className="flex flex-col flex-1 bg-white relative animate-fade-in-up">
      {/* HUD Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={onBack}
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

      {/* Progress Steps */}
      <PhaseIndicator 
        trizPhase={trizState?.phase ?? -1} 
        prizStep={prizStep} 
        cycleCount={trizState?.cycleCount ?? 0} 
        t={t}
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4 pt-4 custom-scrollbar bg-gray-50/20" style={{ maxHeight: "calc(100vh - 180px)" }}>
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
            const isLastBotMsg = i === messages.length - 1 || messages[i+1]?.type !== 'bot';
            return (
              <div key={i} className="flex gap-3 items-end animate-fade-in-left">
                {isLastBotMsg && <img src="/img/webp/ugolok.webp" alt="Уголёк" className="w-10 h-10 flex-shrink-0 rounded-full object-cover shadow-md border-2 border-white ring-2 ring-orange-50" />}
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
          if (m.type === "show-answer") return (
            <div key={i} className="bg-blue-600 rounded-[22px] px-6 py-4 text-[16px] text-white shadow-xl animate-fade-in border-4 border-blue-400 font-medium italic">
              <span className="font-black uppercase tracking-tighter mr-2">{t?.('dialog.wisdom') || 'МУДРОСТЬ:'}</span> {m.text}
            </div>
          );
          return null;
        })}
        {isTyping && (
          <div className="flex gap-3 items-end px-2">
            <img src="/img/webp/ugolok.webp" alt="Уголёк" className="w-10 h-10 flex-shrink-0 rounded-full object-cover blur-[0.5px] opacity-70" />
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
        {/* Helper: Show answer button */}
        {childMsgCount >= 3 && !messages.some(m => m.type === "show-answer") && !isTyping && (
          <button onClick={onShowAnswer}
            className="w-full mb-3 py-3 rounded-[20px] bg-indigo-50 text-indigo-600 text-[14px] font-black uppercase tracking-wider border-2 border-indigo-100 active:scale-95 transition-all"
          >
            {t?.('dialog.show_answer') || '🔍 Показать ответ'}
          </button>
        )}

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

        {/* Chat Input */}
        <div className="flex gap-3 items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && onSendMessage()}
            placeholder={t?.('dialog.placeholder') || 'Напиши свою идею...'}
            className="flex-1 bg-slate-100 border-2 border-transparent focus:border-orange-200 focus:bg-white rounded-[24px] px-6 py-4 text-[16px] outline-none transition-all placeholder:text-slate-400 font-medium shadow-inner"
            disabled={isTyping}
          />
          <button
            onClick={onSendMessage}
            disabled={!input.trim() || isTyping}
            className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full w-14 h-14 flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all shadow-lg shadow-orange-200 flex-shrink-0"
          >
            <span className="text-2xl">↑</span>
          </button>
        </div>
      </div>
    </div>
  );
}
