import { useState, useRef, useEffect } from "react";
import { TASKS } from "./tasks";
import { askTriz } from "./ai";
import { createNewState } from "./bot/engine.js";
import { getSourceFromUrl } from "./api-client.js";
import City from "./City";
import DesignBureau from "./DesignBureau";
import DragonBubbleScreen from "./DragonBubbleScreen";
import UnlockAnimation from "./UnlockAnimation";
import DragonSplashScreen from "./DragonSplashScreen";
import AuthScreen, { popReturnPhase, saveReturnPhase } from "./components/AuthScreen";
import IslandUnlockScreen from "./components/IslandUnlockScreen";
import { useAudio } from "./useAudio";
import { trackEvent, EVENTS } from "./analytics";
import sfx from "./sfx";
import { useGameStore } from "./store/gameStore";
import { translations } from "./i18n";
import { supabase, loadProgress, syncProgress } from "./lib/supabase";

// Components
import TopProgress from "./components/TopProgress";
import SettingsMenu from "./components/SettingsMenu";
import TaskPicker from "./components/TaskPicker";
import DialogView from "./components/DialogView";
import TaskPreview from "./components/TaskPreview";
import DebriefView from "./components/DebriefView";
import TwistView from "./components/TwistView";
import FinalView from "./components/FinalView";
import AdminView from "./components/AdminView";
import Paywall from "./components/Paywall";
import BredomakerView from "./components/BredomakerView";
import TsarMountainView from "./components/TsarMountainView";
import UpsellView, { getUpsellMessage } from "./components/UpsellView";
import DailyChallenge from "./components/DailyChallenge";

// Utils
import { 
  STORAGE_KEY, TRIZ_STATE_KEY, USER_KEY, SESSION_KEY,
  generateUUID, ISLAND_MAPPING, AUDIO_TRACKS 
} from "./utils/gameUtils";

/* ═══ Persistence ═══ */
function loadInitialState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    const appState = s ? JSON.parse(s) : {};
    const trizState = localStorage.getItem(TRIZ_STATE_KEY);
    return {
      ...appState,
      trizState: trizState ? JSON.parse(trizState) : null,
      userId: localStorage.getItem(USER_KEY) || generateUUID(),
      sessionId: localStorage.getItem(SESSION_KEY) || generateUUID(),
      source: getSourceFromUrl(),
    };
  } catch {
    return { userId: generateUUID(), sessionId: generateUUID(), source: getSourceFromUrl() };
  }
}

function saveGlobalState(data) {
  try {
    const { trizState, ...rest } = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    if (trizState) localStorage.setItem(TRIZ_STATE_KEY, JSON.stringify(trizState));
  } catch {}
}

/* ═══ Main App Orchestrator ═══ */
export default function App() {
  const saved = loadInitialState();
  const {
    totalStars, completedTasks, completeTask, resetGame,
    difficulty, user, setUser, dailyTasksCount, isPremium, resetDailyCountIfNeeded,
    islands, unlockRequirements, checkUnlocks, unlockedBuildings,
    streak, updateStreak, upsellShownAt, markUpsellShown,
    useHint, getHintsLeft,
  } = useGameStore();

  // Navigation & UI State
  const [phase, setPhase] = useState("dragon-splash");
  const [lang, setLang] = useState(saved?.lang || "ru");
  const [theme, setTheme] = useState(saved?.theme || "hayday");
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(saved?.hasSeenOnboarding || false);
  const [hasSeenDragonSplash, setHasSeenDragonSplash] = useState(saved?.hasSeenDragonSplash || false);
  
  // Game Logic State
  const [taskIdx, setTaskIdx] = useState(0);
  const [task, setTask] = useState(TASKS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [trizState, setTrizState] = useState(saved?.trizState || null);
  const [sessionStars, setSessionStars] = useState(0);
  const [debriefBingo, setDebriefBingo] = useState(false);
  const [twistChoice, setTwistChoice] = useState(null);
  const [prizStep, setPrizStep] = useState(0);
  const [isHinting, setIsHinting] = useState(false);
  const [bingoFlash, setBingoFlash] = useState(false);
  const [upsellMessage, setUpsellMessage] = useState(null);
  
  // Modals & Overlays
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [activeCategory, setActiveCategory] = useState(saved?.activeCategory || "library");
  const [unlockedBuildingId, setUnlockedBuildingId] = useState(null);
  const [activeIslandId, setActiveIslandId] = useState(saved?.activeIslandId || null);
  const [isTutorial, setIsTutorial] = useState(false);
  const [showIslandUnlock, setShowIslandUnlock] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Audio Hook - Plays main theme throughout the app
  const t = (key) => {
    const keys = key.split('.');
    let res = translations[lang] || translations['ru'];
    for (const k of keys) {
      if (res[k]) res = res[k];
      else return key;
    }
    return res;
  };

  const audio = useAudio(AUDIO_TRACKS);

  /* ═══ Effects ═══ */
  useEffect(() => {
    resetDailyCountIfNeeded();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email, name: session.user.user_metadata?.full_name || "Инженер" });
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          setHasSeenOnboarding(true);
          audio.playTrack(0);

          // Return to the screen that triggered login
          const returnPhase = popReturnPhase();
          if (returnPhase && returnPhase !== 'auth') {
            setPhase(returnPhase);
          } else {
            setPhase('city');
          }

          // 1. Save local progress to cloud FIRST (so nothing is lost)
          const localState = useGameStore.getState();
          if (localState.completedTasks.length > 0 || localState.totalStars > 0) {
            await syncProgress(session.user.id, {
              stars: localState.totalStars,
              completedTasks: localState.completedTasks,
              unlockedBuildings: localState.unlockedBuildings,
            });
          }

          // 2. Load cloud and merge (union of both)
          const cloudData = await loadProgress(session.user.id);
          if (cloudData) {
            useGameStore.setState((state) => ({
              totalStars: Math.max(state.totalStars, cloudData.stars || 0),
              completedTasks: Array.from(new Set([...state.completedTasks, ...(cloudData.completedTasks || [])])),
              unlockedBuildings: Array.from(new Set([...state.unlockedBuildings, ...(cloudData.unlockedBuildings || [])]))
            }));
          }
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cloud Sync Effect (triggered when user progress changes)
  useEffect(() => {
    if (user && user.id) {
       syncProgress(user.id, { 
          stars: totalStars, 
          completedTasks, 
          unlockedBuildings 
       });
    }
  }, [totalStars, completedTasks.length, unlockedBuildings.length, user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    saveGlobalState({ theme, hasSeenOnboarding, hasSeenDragonSplash, trizState, lang, phase, activeCategory, activeIslandId });
  }, [theme, hasSeenOnboarding, hasSeenDragonSplash, trizState, lang, phase, activeCategory, activeIslandId]);

  useEffect(() => {
    if (window.__openCity) {
      window.__openCity = false;
      setPhase("city");
      setMenuOpen(false);
    }
    if (window.__openAdmin) {
      window.__openAdmin = false;
      setPhase("admin");
      setMenuOpen(false);
    }
  }, [menuOpen]);

  /* ═══ Handlers ═══ */

  function startTaskPreview(taskKey) {
    if (taskKey === null || taskKey === undefined) return;
    
    // 1. Сначала ищем четко по ID (обрабатываем и числа, и строки)
    let tDef = TASKS.find(t => String(t.id) === String(taskKey));
    
    // 2. Если не нашли по ID (может пришел 0 из-за индекса), ищем по категории
    if (!tDef) {
       tDef = TASKS.find(t => t.category === taskKey);
    }
    
    // 3. Если всё еще не нашли, берем первую задачу как дефолтную (защита от '0')
    if (!tDef && (taskKey === 0 || taskKey === "0")) {
       tDef = TASKS[0];
    }

    if (!tDef) {
       console.error("Task not found for key:", taskKey);
       return;
    }
    
    setTask(tDef);
    setPhase("task-preview");
  }

  function startDialog() {
    if (!isPremium && dailyTasksCount >= 3) {
      setPhase("paywall");
      return;
    }
    setMessages([]);
    setSessionStars(0);
    setTwistChoice(null);
    setPrizStep(0);
    setIsHinting(false);
    
    // Auto-create TRIZ state if it's a TRIZ task
    if (task.core_problem && task.ikr) {
      // difficulty 1 → ПРИЗ-базовый (3 фазы, age<8 в движке)
      // difficulty 2 → ПРИЗ-стандарт (5 фаз, age 8-12)
      // difficulty 3 → ПРИЗ-про (7 фаз, age 13+)
      const ageForEngine = task.difficulty === 1 ? 7 : task.difficulty === 2 ? 10 : 14;
      const newState = createNewState(task.id, ageForEngine);
      setTrizState(newState);
      const hook = (task.difficulty >= 2 ? task.puzzle?.hookSenior : task.puzzle?.hookJunior)
        || task.teaser
        || task.puzzle?.question_ru
        || task.puzzle?.question
        || "Что здесь является главным противоречием?";
      setMessages([
        { type: "bot", text: "🐉 Давай решим эту задачу вместе!" },
        { type: "bot", text: hook },
      ]);
    }
    
    setPhase("dialog");
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  async function handleUserMessage() {
    const text = input.trim();
    if (!text || isTyping) return;

    // Clear tutorial after first message
    if (isTutorial) setIsTutorial(false);

    setInput("");
    const timestamp = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const newMessages = [...messages, { type: "child", text, timestamp }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const history = newMessages.map(m => ({ role: m.type === "bot" ? "bot" : "user", text: m.text }));
      const result = await askTriz(text, task, { ...(trizState || {}), phase: prizStep }, history.slice(0, -1), difficulty);

      if (result.newState) setTrizState(result.newState);

      // Update stage from AI response (AI decides when to advance)
      const newPrizStep = (result.prizStep != null && result.prizStep >= prizStep)
        ? result.prizStep
        : prizStep;
      setPrizStep(newPrizStep);

      // Always give at least 1 star per message
      const earnedStars = Math.max(1, result.stars || 0);
      setSessionStars(s => s + earnedStars);

      const replyText = result.reply || result.text || "";
      setMessages(prev => [...prev, { type: "bot", text: replyText, stars: earnedStars, timestamp }]);

      // Stage 3 (З) = task solved → show ✨ then go to debrief
      if (newPrizStep === 3 && prizStep < 3) {
        setTimeout(() => {
          setPrizStep(4); // light up ✨ briefly
          setTimeout(() => setPhase("debrief"), 1200);
        }, 1000);
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: "bot", text: "Что-то пошло не так. Попробуй ещё раз." }]);
    } finally {
      setIsTyping(false);
    }
  }

  async function handleHint() {
    if (getHintsLeft() === 0) return;
    useHint();
    setIsHinting(true);
    try {
      const history = messages.map(m => ({ role: m.type === "bot" ? "bot" : "user", text: m.text }));
      const result = await askTriz(
        "[ПОДСКАЗКА] Ребёнок просит подсказку. Дай один наводящий вопрос — не ответ, только вопрос который поможет думать дальше.",
        task,
        { ...(trizState || {}), phase: prizStep },
        history,
        difficulty
      );
      const hintText = result.reply || result.text || "Подумай: какие ресурсы уже есть рядом с местом проблемы?";
      setMessages(prev => [...prev, { type: "bot", text: hintText, isHint: true }]);
    } catch {
      setMessages(prev => [...prev, { type: "bot", text: "Подумай: что уже есть рядом, что можно использовать?", isHint: true }]);
    } finally {
      setIsHinting(false);
    }
  }

  function goOutcome() {
    const isNew = !completedTasks.includes(task.id);
    completeTask(task.id, sessionStars);
    updateStreak();
    if (isNew) {
      const nextCount = completedTasks.length + 1;

      // First ever task → show island unlock animation, then city
      if (nextCount === 1) {
        setShowIslandUnlock(true);
        // Save prompt after island animation
        setTimeout(() => {
          setShowIslandUnlock(false);
          setPhase("city");
          // Suggest saving progress if not logged in
          setTimeout(() => setShowSavePrompt(true), 1000);
        }, 4000);
        return;
      }

      // After 3rd task → save prompt
      if (nextCount === 3 && !user) {
        setTimeout(() => setShowSavePrompt(true), 2000);
      }

      const upsell = getUpsellMessage(nextCount, upsellShownAt);
      if (upsell) {
        markUpsellShown(upsell.trigger);
        setTimeout(() => setUpsellMessage(upsell), 2000);
      }
      setUnlockedBuildingId(task.id);
      setTimeout(() => { setUnlockedBuildingId(null); setPhase("outcome"); }, 2500);
    } else setPhase("outcome");
  }

  /* ─── Render ─── */
  const renderHUD = (phase !== "dragon-splash" && phase !== "auth");
  
  return (
    <div className="min-h-[100dvh] flex flex-col items-center bg-slate-900 overflow-hidden" data-theme={theme}>
      {unlockedBuildingId && <UnlockAnimation buildingId={unlockedBuildingId} t={t} />}
      {upsellMessage && (
        <UpsellView
          message={upsellMessage}
          onDismiss={() => setUpsellMessage(null)}
          onSignup={() => { setUpsellMessage(null); window.open("https://t.me/ugolok_triz", "_blank"); }}
        />
      )}

      {/* Island Unlock Animation */}
      {showIslandUnlock && (
        <IslandUnlockScreen
          islandName="Главный остров"
          onComplete={() => { setShowIslandUnlock(false); setPhase("city"); }}
        />
      )}

      {/* Save Progress Prompt */}
      {showSavePrompt && !user && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center pointer-events-none">
          <div className="w-full max-w-md px-4 pb-8 pointer-events-auto">
            <div className="bg-white rounded-[32px] p-6 shadow-2xl border border-orange-100">
              <div className="flex items-start gap-4">
                <span className="text-3xl">🐉</span>
                <div className="flex-1">
                  <p className="font-black text-slate-900 text-[16px] leading-tight mb-1">
                    Сохрани прогресс!
                  </p>
                  <p className="text-slate-500 text-[13px] leading-snug">
                    Орин помнит твои открытия — но только если ты сохранишь их в облако.
                  </p>
                </div>
                <button onClick={() => setShowSavePrompt(false)} className="text-slate-300 text-xl leading-none">✕</button>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setShowSavePrompt(false); saveReturnPhase(phase); setPhase("auth"); }}
                  className="flex-1 py-3 bg-orange-500 text-white font-black rounded-2xl text-[14px] uppercase tracking-wide shadow-lg shadow-orange-200 active:scale-95 transition-all"
                >
                  Сохранить →
                </button>
                <button
                  onClick={() => setShowSavePrompt(false)}
                  className="px-5 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl text-[13px] active:scale-95 transition-all"
                >
                  Потом
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full ${phase === 'admin' ? 'max-w-[1920px]' : 'max-w-md'} h-full flex flex-col bg-white shadow-2xl relative overflow-hidden text-slate-800`}>

        {renderHUD && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
            {/* Стрик */}
            {streak >= 2 && (
              <div className="flex items-center gap-1 bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-orange-900/30">
                🔥 {streak}
              </div>
            )}
            <div
              className="cursor-pointer active:scale-95 transition-transform"
              onClick={() => setMenuOpen(true)}
              title={user ? user.name : t('hud.guest')}
            >
            <div className="relative">
              {/* Круглая кнопка аватара */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl shadow-xl border-2 border-white/20">
                {user ? '👤' : '☁️'}
              </div>

              {/* Точка статуса онлайн/офлайн */}
              <div
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${user ? 'bg-emerald-400' : 'bg-rose-400'} shadow-sm`} 
              />
            </div>
            </div>
          </div>
        )}

        {phase === "dragon-splash" && (
          <DragonSplashScreen t={t} onAnimationEnd={() => {
            audio.playTrack(0);
            setPhase(hasSeenOnboarding ? "city" : "dragon-bubble");
          }} />
        )}

        {phase === "dragon-bubble" && (
          <DragonBubbleScreen t={t} theme={theme} lang={lang} onStart={(opts) => {
            setHasSeenOnboarding(true);
            if (opts?.tutorial) {
              setTask(TASKS[0]);
              setIsTutorial(true);
              setPhase("task-preview");
            } else {
              setPhase("city");
            }
          }} />
        )}

        {phase === "auth" && (
          <AuthScreen
            returnPhase={phase}
            onGuest={() => setPhase(popReturnPhase() || "city")}
          />
        )}

        {phase === "city" && (
          <div className="flex flex-col flex-1 min-h-screen relative overflow-hidden">
            <City 
            theme={theme} 
            totalStars={totalStars} 
            t={t} 
            user={user}
            completedTasks={completedTasks}
            islands={islands}
            unlockRequirements={unlockRequirements}
            checkUnlocks={checkUnlocks}
            onLogoClick={() => setMenuOpen(true)}
            onSelectBuilding={(bId) => {
              if (bId === "bredo") { setPhase("bredo-play"); return; }
              if (bId === "tsar")  { setPhase("mountain-play"); return; }
              setActiveCategory(bId); setPhase("picker");
            }}
            activeIslandId={activeIslandId}
            setActiveIslandId={setActiveIslandId}
          />
          </div>
        )}

        {phase === "picker" && (
          <TaskPicker activeCategory={activeCategory} onBack={() => setPhase("city")}
            onOpenMenu={() => setMenuOpen(true)}
            TASKS={TASKS} completedTasks={completedTasks} onStartTask={startTaskPreview} t={t} lang={lang}
          />
        )}

        {phase === "task-preview" && (
          <TaskPreview
            task={task}
            t={t}
            lang={lang}
            isTutorial={isTutorial}
            onBack={() => { setIsTutorial(false); setPhase("picker"); }}
            onStart={startDialog}
          />
        )}

        {phase === "dialog" && (
          <DialogView
            task={task}
            messages={messages}
            isTyping={isTyping}
            isHinting={isHinting}
            trizState={trizState}
            prizStep={prizStep}
            sessionStars={sessionStars}
            totalStars={totalStars}
            isTutorial={isTutorial}
            t={t}
            lang={lang}
            childMsgCount={messages.filter(m => m.type === "child").length}
            hintsLeft={getHintsLeft()}
            onHint={handleHint}
            onBack={() => { setIsTutorial(false); setPhase("picker"); }}
            onSkip={() => { setIsTutorial(false); setPhase("picker"); }}
            onSendMessage={handleUserMessage}
            input={input}
            setInput={setInput}
            inputRef={inputRef}
            bottomRef={bottomRef}
          />
        )}

        {phase === "debrief" && (
          <DebriefView
            task={task}
            sessionStars={sessionStars}
            t={t}
            lang={lang}
            onNext={goOutcome}
          />
        )}

        {phase === "twist" && (
          <TwistView 
            task={task} 
            completedTasks={completedTasks} 
            taskIdx={taskIdx} 
            TASKS={TASKS}
            twistChoice={twistChoice} 
            setTwistChoice={setTwistChoice} 
            t={t}
            lang={lang}
            onNext={goOutcome} 
          />
        )}

        {phase === "outcome" && (
          <FinalView 
            totalStars={totalStars} 
            completedTasks={completedTasks} 
            TASKS={TASKS}
            t={t}
            lang={lang}
            onRestart={() => resetGame()} 
            onBackToCity={() => setPhase("city")} 
            onUgc={() => {}}
          />
        )}

        {phase === "admin" && (
          <AdminView TASKS={TASKS} t={t} onBack={() => setPhase("city")} />
        )}

        {phase === "bredo-play" && (
          <BredomakerView
            onBack={() => setPhase("city")}
            t={t}
          />
        )}

        {phase === "mountain-play" && (
          <TsarMountainView
            onBack={() => setPhase("city")}
            onComplete={(score) => completeTask(`tsar-${Date.now()}`, score)}
          />
        )}

        {phase === "paywall" && (
          <Paywall
            onBack={() => setPhase("task-preview")}
            onSelectPlan={() => setPhase("task-preview")}
            onDonate={() => setPhase("city")}
          />
        )}

      </div>

      <SettingsMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onResetProgress={() => resetGame()}
        completedTasks={completedTasks} audio={audio} audioTracks={AUDIO_TRACKS} lang={lang} setLang={setLang} t={t} user={user} setUser={setUser}
      />

      {/* NEW: Centered & Thematic Exit Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowConfirmDialog(false)} />
          <div className="relative w-full max-w-[320px] bg-white rounded-[40px] shadow-premium overflow-hidden animate-bounce-in">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                🤔
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">
                {t('confirm_exit')}
              </h3>
              <p className="text-slate-500 text-[14px] leading-relaxed mb-8">
                {t('exit_warning')}
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowConfirmDialog(false)}
                  className="w-full py-4 rounded-2xl bg-slate-100 text-slate-800 font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all"
                >
                  {t('continue_solve')}
                </button>
                <button 
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setPhase("picker");
                  }}
                  className="w-full py-4 rounded-2xl bg-orange-500 text-white font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-lg shadow-orange-200"
                >
                  {t('exit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
