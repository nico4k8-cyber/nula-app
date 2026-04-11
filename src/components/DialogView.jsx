import React, { useState, useRef, useEffect, useCallback } from "react";
import PhaseIndicator from "./PhaseIndicator";
import ResourceButtons from "./ResourceButtons";

// ─── Цветовые токены для тёмной и светлой темы ──────────────────────
const THEMES = {
  dark: {
    shell:     '#0c1120',
    panel:     '#141b2e',
    card:      '#1c2540',
    inputBg:   '#1c2540',
    footerBg:  '#141b2e',
    chatBg:    '#0c1120',
    amber:     '#f59e0b',
    amberLt:   '#fbbf24',
    glow:      '#ff6b2b',
    glow2:     '#ff4500',
    text:      '#ddd6c8',
    dim:       '#6b7a99',
    border:    'rgba(255,255,255,0.07)',
    orinBub:   '#141b2e',
    sysBg:     'rgba(245,158,11,0.10)',
    sysBdr:    'rgba(245,158,11,0.28)',
    sysClr:    '#f59e0b',
    imgBg:     'linear-gradient(135deg,#1a2545,#0d1225)',
    imgGrad:   'linear-gradient(to top,rgba(12,17,32,0.85),transparent 55%)',
    exitBg:    '#141b2e',
    exitTitle: '#f0e8d8',
    exitSub:   '#6b7a99',
    skipClr:   '#6b7a99',
  },
  light: {
    shell:     '#f5f0e6',
    panel:     '#f5f0e6',
    card:      '#ede0c8',
    inputBg:   '#ede0c8',
    footerBg:  '#f5f0e6',
    chatBg:    '#ede8db',
    amber:     '#b45309',
    amberLt:   '#d97706',
    glow:      '#ea580c',
    glow2:     '#c2410c',
    text:      '#2c1e0f',
    dim:       '#7c6a50',
    border:    'rgba(100,70,30,0.12)',
    orinBub:   '#fff8ee',
    sysBg:     'rgba(180,83,9,0.08)',
    sysBdr:    'rgba(180,83,9,0.22)',
    sysClr:    '#92400e',
    imgBg:     'linear-gradient(135deg,#c8a97a,#a07840)',
    imgGrad:   'linear-gradient(to top,rgba(40,25,10,0.7),transparent 55%)',
    exitBg:    '#f5f0e6',
    exitTitle: '#1a1008',
    exitSub:   '#7c6a50',
    skipClr:   '#9c8060',
  },
};

export default function DialogView({
  isDark = false,
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
  const C = THEMES[isDark ? 'dark' : 'light'];

  const [isListening, setIsListening]   = useState(false);
  const [showExitSheet, setShowExitSheet] = useState(false);
  const [imgOpen, setImgOpen]           = useState(true);
  const [imgLocked, setImgLocked]       = useState(false);
  const [condOpen, setCondOpen]         = useState(true);
  const [condLocked, setCondLocked]     = useState(false);

  const recognitionRef    = useRef(null);
  const cancelledRef      = useRef(false);
  const isSubmittingRef   = useRef(false);
  const chatScrollRef     = useRef(null);

  useEffect(() => {
    bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    cancelledRef.current = false;
    isSubmittingRef.current = false;
    // Сбрасываем состояние картинки при смене задачи
    setImgOpen(true);
    setImgLocked(false);
    setCondOpen(true);   // show task condition when entering a new task
    setCondLocked(false);
    return () => {
      cancelledRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
    };
  }, [task?.id]);

  // Скролл чата → схлопываем незафиксированные блоки
  const onChatScroll = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    if (el.scrollTop > 40) {
      if (!imgLocked)  setImgOpen(false);
      if (!condLocked) setCondOpen(false);
    } else if (el.scrollTop < 8) {
      if (!imgLocked) setImgOpen(true);
    }
  }, [imgLocked, condLocked]);

  const toggleImg = () => {
    const next = !imgOpen;
    setImgOpen(next);
    setImgLocked(next);
    if (next) { setCondOpen(false); setCondLocked(false); }
  };

  const toggleCond = () => {
    const next = !condOpen;
    setCondOpen(next);
    setCondLocked(next);
    if (next && imgOpen) setImgOpen(false);
  };

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
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) { baseInput += finalTranscript + " "; setInput(baseInput); }
      else if (interimTranscript) setInput(baseInput + interimTranscript);
    };
    recognition.onerror = (event) => {
      if (cancelledRef.current) return;
      setIsListening(false);
      if (event.error === 'not-allowed') alert(t?.('dialog.mic_denied') || "Нет доступа к микрофону.");
    };
    recognition.onend = () => { if (!cancelledRef.current) setIsListening(false); };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) { console.error("Mic start failed", e); }
  };

  const isTriz = (t) => t?.core_problem && t?.ikr && t?.resources;
  const hintsExhausted = hintsLeft === 0;

  // ─── Стили ──────────────────────────────────────────────────────────
  const ts = {
    // Переходы
    transition: 'background 0.4s ease, border-color 0.4s ease',
  };

  return (
    <div
      className="flex flex-col h-[100dvh] relative overflow-hidden"
      style={{ background: C.shell, fontFamily: "'Nunito', sans-serif", ...ts }}
    >
      {/* ── Шапка ── */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 z-20"
        style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, ...ts }}
      >
        <button
          onClick={() => setShowExitSheet(true)}
          style={{ width:40, height:40, borderRadius:'50%', background:C.card, border:`1px solid ${C.border}`, color:C.dim, fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
        >←</button>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {sessionStars > 0 && (
            <div style={{ background:`linear-gradient(135deg,${C.glow2},${C.glow})`, color:'#fff', padding:'7px 14px', borderRadius:20, fontSize:14, fontWeight:900, boxShadow:`0 2px 10px rgba(255,90,30,0.35)` }}>
              +{sessionStars} ⭐
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:5, background:C.sysBg, border:`1.5px solid ${C.sysBdr}`, padding:'7px 14px', borderRadius:20 }}>
            <span>⭐</span>
            <span style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:17, fontWeight:900, color:C.amber }}>{totalStars}</span>
          </div>
        </div>
      </div>

      {/* ── Блок задачи ── */}
      {task && (
        <div style={{ flexShrink:0, borderBottom:`1px solid ${C.border}`, background:C.panel, ...ts }}>

          {/* Картинка */}
          <div style={{
            margin: '0 14px',
            height: imgOpen ? 110 : 0,
            opacity: imgOpen ? 1 : 0,
            overflow: 'hidden',
            borderRadius: 16,
            position: 'relative',
            border: imgOpen ? `1px solid ${C.border}` : 'none',
            cursor: 'zoom-in',
            transition: 'height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
          }} onClick={() => {}}>
            {task.image_url
              ? <img src={task.image_url} alt={task.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              : <div style={{ width:'100%', height:'100%', background:C.imgBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:60 }}>{task.icon || '📋'}</div>
            }
            <div style={{ position:'absolute', inset:0, background:C.imgGrad, pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:10, left:14, color:'#fff', fontFamily:"'Baloo 2',sans-serif", fontSize:14, fontWeight:700, textShadow:'0 1px 6px rgba(0,0,0,0.6)', pointerEvents:'none' }}>{task.title}</div>
          </div>

          {/* Тизер + кнопки */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px 6px', gap:8 }}>
            <div style={{ fontSize:13, color:C.dim, fontWeight:700, flex:1 }}>{task.teaser || task.puzzle?.question || ''}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {!imgOpen && (
                <button onClick={toggleImg} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'4px 9px', fontSize:11, fontWeight:800, color:C.dim, cursor:'pointer', whiteSpace:'nowrap' }}>
                  🖼 фото
                </button>
              )}
              <button onClick={toggleCond} style={{ background: condOpen ? C.sysBg : C.card, border:`1px solid ${condOpen ? C.sysBdr : C.border}`, borderRadius:10, padding:'4px 10px', fontSize:11, fontWeight:800, color: condOpen ? C.amber : C.dim, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s' }}>
                условие {condOpen ? '▴' : '▾'}
              </button>
            </div>
          </div>

          {/* Раскрывающееся условие */}
          <div style={{
            overflow:'hidden',
            maxHeight: condOpen ? 300 : 0,
            opacity: condOpen ? 1 : 0,
            transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
          }}>
            <div style={{ padding:'8px 14px 14px', borderTop:`1px solid ${C.border}` }}>
              <p style={{ fontSize:14, color:C.text, fontWeight:600, lineHeight:1.65, marginBottom:8 }}>
                {task.condition || task.teaser || task.puzzle?.question || ''}
              </p>
              {task.puzzle?.question && task.condition && (
                <>
                  <p style={{ fontSize:11, color:C.dim, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Вопрос:</p>
                  <p style={{ fontSize:14, color:C.text, fontWeight:600, lineHeight:1.65 }}>{task.puzzle.question}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Фазы ПРИЗ ── */}
      <PhaseIndicator
        trizPhase={trizState?.phase ?? -1}
        prizStep={prizStep}
        cycleCount={trizState?.cycleCount ?? 0}
        isDark={isDark}
        t={t}
      />

      {/* ── Чат ── */}
      <div
        ref={chatScrollRef}
        onScroll={onChatScroll}
        className="custom-scrollbar"
        style={{ flex:1, overflowY:'auto', padding:'14px 14px 8px', display:'flex', flexDirection:'column', gap:14, background:C.chatBg, transition:'background 0.4s ease' }}
      >
        {messages.map((m, i) => {
          if (m.type === "bot") {

            if (m.isStageMsg) return (
              <div key={m.id ?? m.ts ?? i} style={{ display:'flex', justifyContent:'center', padding:'4px 0' }}>
                <div style={{ background:C.sysBg, border:`1.5px solid ${C.sysBdr}`, borderRadius:14, padding:'7px 14px', fontSize:13, fontWeight:800, color:C.sysClr, fontFamily:"'Baloo 2',sans-serif" }}>
                  {m.text}
                </div>
              </div>
            );

            if (m.isDiscovery) return (
              <div key={m.id ?? m.ts ?? i} style={{ display:'flex', justifyContent:'center', padding:'4px 0' }}>
                <div style={{ background:`linear-gradient(135deg,#059669,#10b981)`, color:'#fff', borderRadius:16, padding:'10px 18px', fontSize:14, fontWeight:900, boxShadow:'0 4px 16px rgba(16,185,129,0.3)' }}>
                  ✨ {m.text}
                </div>
              </div>
            );

            if (m.isHint) return (
              <div key={m.id ?? m.ts ?? i} style={{ display:'flex', justifyContent:'center', padding:'4px 0' }}>
                <div style={{ background:C.sysBg, border:`1.5px solid ${C.sysBdr}`, borderRadius:16, padding:'10px 16px', fontSize:13, fontWeight:700, color:C.text, maxWidth:'88%' }}>
                  💡 {m.text}
                </div>
              </div>
            );

            const isLastBot = i === messages.length - 1 || messages[i+1]?.type !== 'bot';
            return (
              <div key={m.id ?? m.ts ?? i} style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
                {isLastBot
                  ? <img src="/img/webp/ugolok.webp" alt="Орин" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:`2px solid ${C.sysBdr}`, boxShadow:`0 0 14px ${C.sysBg}` }} />
                  : <div style={{ width:44, flexShrink:0 }} />
                }
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  <div style={{ background:C.orinBub, border:`1px solid ${C.border}`, borderRadius: isLastBot ? '20px 20px 20px 4px' : '20px', padding:'13px 16px', fontSize:15, color:C.text, lineHeight:1.55, maxWidth:280, boxShadow:'0 2px 12px rgba(0,0,0,0.1)' }}>
                    {m.text}
                    {m.stars > 0 && <div style={{ marginTop:6, color:C.amber, fontWeight:900 }}>{"⭐".repeat(m.stars)}</div>}
                  </div>
                  {isLastBot && <span style={{ fontSize:10, color:C.dim, fontWeight:800, textTransform:'uppercase', marginLeft:2, opacity:0.6 }}>{m.timestamp}</span>}
                </div>
              </div>
            );
          }

          if (m.type === "child") return (
            <div key={m.id ?? m.ts ?? i} style={{ display:'flex', justifyContent:'flex-end' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                <div style={{
                  background:`linear-gradient(135deg,${C.glow2},${C.glow})`,
                  color:'#fff',
                  borderRadius:'20px 20px 4px 20px',
                  padding:'13px 16px',
                  fontSize:15,
                  lineHeight:1.55,
                  maxWidth:270,
                  boxShadow:`0 4px 16px rgba(255,90,30,0.25)`,
                  fontWeight:600,
                  outline: bingoFlash ? `3px solid ${C.amber}` : 'none',
                }}>
                  {m.text}
                </div>
                <span style={{ fontSize:10, color:C.dim, fontWeight:800, textTransform:'uppercase', opacity:0.6 }}>{m.timestamp}</span>
              </div>
            </div>
          );

          return null;
        })}

        {(isTyping || isHinting) && (
          <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
            <img src="/img/webp/ugolok.webp" alt="Орин" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0, opacity:0.5, filter:'blur(0.3px)' }} />
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'20px 20px 20px 4px', padding:'13px 16px', display:'flex', gap:5, alignItems:'center' }}>
              {[0,1,2].map(j => (
                <div key={j} style={{ width:8, height:8, borderRadius:'50%', background:C.amber, animation:'dialogDot 1.2s infinite ease-in-out', animationDelay:`${j*0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ height:8 }} />
      </div>

      {/* ── Футер ── */}
      <div style={{ background:C.footerBg, borderTop:`1px solid ${C.border}`, padding:'12px 14px 24px', flexShrink:0, transition:'background 0.4s ease' }}>

        {/* Ресурсы (TRIZ фазы 3-4) */}
        {task && isTriz(task) && task.resources && trizState && (trizState.phase === 3 || trizState.phase === 4) && (
          <div style={{ marginBottom:12 }}>
            <p style={{ textAlign:'center', fontSize:11, fontWeight:800, color:C.dim, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>
              {t?.('dialog.resources_label') || 'Твои ресурсы для решения:'}
            </p>
            <ResourceButtons resources={task.resources} currentResource={trizState.currentResource} onSelectResource={onSelectResource} disabled={isTyping} t={t} />
          </div>
        )}

        {/* Туториал-подсказка */}
        {isTutorial && messages.filter(m => m.type === "child").length === 0 && (
          <div style={{ marginBottom:8, display:'flex', alignItems:'center', gap:8, background:C.sysBg, border:`1px solid ${C.sysBdr}`, borderRadius:18, padding:'8px 14px' }}>
            <span style={{ fontSize:18 }}>🐉</span>
            <p style={{ fontSize:13, color:C.text, fontWeight:700 }}>Напиши свою идею — любую! Орин поможет её улучшить.</p>
          </div>
        )}

        {/* Подсказка */}
        {childMsgCount >= 1 && !isTyping && !isHinting && (
          <button
            onClick={hintsExhausted ? undefined : onHint}
            style={{
              width:'100%', marginBottom:10, padding:11,
              borderRadius:14,
              border:`1.5px solid ${hintsExhausted ? C.border : C.sysBdr}`,
              background: hintsExhausted ? 'transparent' : C.sysBg,
              color: hintsExhausted ? C.dim : C.amber,
              fontSize:13, fontWeight:800, letterSpacing:'0.04em', textTransform:'uppercase',
              cursor: hintsExhausted ? 'default' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              fontFamily:"'Nunito',sans-serif",
            }}
          >
            💡 Подсказка
            {hintsLeft !== Infinity && (
              <span style={{ background: hintsExhausted ? C.border : 'rgba(245,158,11,0.2)', color: hintsExhausted ? C.dim : C.amberLt, padding:'2px 8px', borderRadius:8, fontSize:11 }}>
                {hintsExhausted ? 'исчерпано' : `осталось ${hintsLeft}`}
              </span>
            )}
          </button>
        )}

        {/* Задача решена */}
        {prizStep >= 4 ? (
          <button
            onClick={onGoToDebrief}
            style={{ width:'100%', padding:16, background:`linear-gradient(135deg,${C.glow2},${C.glow})`, color:'#fff', fontSize:17, fontWeight:900, borderRadius:22, border:'none', cursor:'pointer', boxShadow:`0 4px 20px rgba(255,90,30,0.4)`, fontFamily:"'Baloo 2',sans-serif" }}
          >
            Посмотреть результат →
          </button>
        ) : (
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button
              onClick={toggleMic}
              style={{ width:52, height:52, borderRadius:'50%', background: isListening ? '#ef4444' : C.card, border:`1px solid ${isListening ? 'rgba(239,68,68,0.5)' : C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, cursor:'pointer', boxShadow: isListening ? '0 0 16px rgba(239,68,68,0.4)' : 'none' }}
            >🎤</button>

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
              style={{ flex:1, background: isListening ? 'rgba(239,68,68,0.08)' : C.inputBg, border:`1.5px solid ${isListening ? 'rgba(239,68,68,0.4)' : C.border}`, borderRadius:26, padding:'14px 18px', fontSize:15, fontFamily:"'Nunito',sans-serif", fontWeight:700, color:C.text, outline:'none', transition:'all 0.2s' }}
              disabled={isTyping || isHinting || isListening}
            />

            <button
              onClick={onSendMessage}
              disabled={!input.trim() || isTyping || isHinting}
              style={{ width:52, height:52, borderRadius:'50%', background:`linear-gradient(135deg,${C.glow2},${C.glow})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff', flexShrink:0, border:'none', cursor: (!input.trim()||isTyping||isHinting) ? 'default' : 'pointer', opacity: (!input.trim()||isTyping||isHinting) ? 0.3 : 1, boxShadow:`0 4px 16px rgba(255,90,30,0.4)`, transition:'opacity 0.2s' }}
            >↑</button>
          </div>
        )}
      </div>

      {/* ── Exit Sheet ── */}
      {showExitSheet && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} onClick={() => setShowExitSheet(false)} />
          <div style={{ position:'relative', background:C.exitBg, borderRadius:'32px 32px 0 0', padding:'24px 20px 40px', boxShadow:'0 -8px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ width:36, height:4, background:C.border, borderRadius:4, margin:'0 auto 20px' }} />
            <h3 style={{ fontSize:18, fontWeight:900, color:C.exitTitle, textAlign:'center', marginBottom:6, fontFamily:"'Baloo 2',sans-serif" }}>Эта задачка не идёт?</h3>
            <p style={{ fontSize:14, color:C.exitSub, textAlign:'center', marginBottom:24 }}>Это бывает. Что хочешь сделать?</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={() => setShowExitSheet(false)} style={{ width:'100%', padding:16, background:`linear-gradient(135deg,${C.glow2},${C.glow})`, color:'#fff', fontWeight:900, fontSize:16, borderRadius:20, border:'none', cursor:'pointer', fontFamily:"'Baloo 2',sans-serif" }}>
                Продолжаю думать →
              </button>
              <button onClick={() => { setShowExitSheet(false); onSkip?.(); }} style={{ width:'100%', padding:16, background:C.card, color:C.text, fontWeight:900, fontSize:16, borderRadius:20, border:`1px solid ${C.border}`, cursor:'pointer' }}>
                Вернуться позже
              </button>
              <button onClick={() => { setShowExitSheet(false); onBack?.(); }} style={{ width:'100%', padding:12, background:'transparent', color:C.skipClr, fontWeight:700, fontSize:14, border:'none', cursor:'pointer' }}>
                Пропустить совсем
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Анимация точек typing */}
      <style>{`
        @keyframes dialogDot {
          0%,80%,100% { transform:translateY(0); opacity:0.5; }
          40% { transform:translateY(-6px); opacity:1; }
        }
      `}</style>
    </div>
  );
}
