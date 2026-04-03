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
import AuthScreen from "./components/AuthScreen";
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
import DebriefView from "./components/DebriefView";
import TwistView from "./components/TwistView";
import FinalView from "./components/FinalView";
import AdminView from "./components/AdminView";

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
    islands, unlockRequirements, checkUnlocks
  } = useGameStore();

  // Navigation & UI State
  const [phase, setPhase] = useState(saved?.phase || "dragon-splash");
  const [lang, setLang] = useState(saved?.lang || "ru");
  const [theme, setTheme] = useState(saved?.theme || "hayday");
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(saved?.hasSeenOnboarding || false);
  const [hasSeenDragonSplash, setHasSeenDragonSplash] = useState(saved?.hasSeenDragonSplash || false);
  
  // Game Logic State
  const [taskIdx, setTaskIdx] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [trizState, setTrizState] = useState(saved?.trizState || null);
  const [sessionStars, setSessionStars] = useState(0);
  const [debriefBingo, setDebriefBingo] = useState(false);
  const [twistChoice, setTwistChoice] = useState(null);
  const [prizStep, setPrizStep] = useState(0);
  const [bingoFlash, setBingoFlash] = useState(false);
  
  // Modals & Overlays
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [activeCategory, setActiveCategory] = useState(saved?.activeCategory || "library");
  const [unlockedBuildingId, setUnlockedBuildingId] = useState(null);
  const [activeIslandId, setActiveIslandId] = useState(saved?.activeIslandId || null);
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const task = TASKS[taskIdx];

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
          
          // Download Cloud Progress and merge it to local!
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

  const startTask = (idx) => {
    if (!isPremium && dailyTasksCount >= 3) {
      setPhase("paywall");
      return;
    }
    const taskItem = TASKS[idx];
    setTaskIdx(idx);
    setMessages([]);
    setSessionStars(0);
    setTwistChoice(null);
    
    // Auto-create TRIZ state if it's a TRIZ task
    if (taskItem.core_problem && taskItem.ikr) {
      const newState = createNewState(taskItem.id, difficulty >= 2 ? 14 : 10);
      setTrizState(newState);
      setMessages([
        { type: "bot", text: "🐉 Давай решим эту задачу вместе!" },
        { type: "bot", text: difficulty >= 2 ? taskItem.puzzle?.hookSenior : taskItem.puzzle?.hookJunior }
      ]);
    }
    
    setPhase("dialog");
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  async function handleUserMessage() {
    const text = input.trim();
    if (!text || isTyping) return;

    setInput("");
    const timestamp = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const newMessages = [...messages, { type: "child", text, timestamp }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const history = newMessages.map(m => ({ role: m.type === "bot" ? "bot" : "user", text: m.text }));
      const result = await askTriz(text, task, trizState, history.slice(0, -1), difficulty);
      
      if (result.newState) setTrizState(result.newState);
      if (result.stars > 0) setSessionStars(s => s + result.stars);

      setMessages(prev => [...prev, { type: "bot", text: result.reply, stars: result.stars, timestamp }]);

      if (result.resultType === "session_complete") {
        setTimeout(() => {
          setMessages(prev => [...prev, { type: "bot", text: `✨ Задача решена!`, isDiscovery: true }]);
          setTimeout(() => setPhase("debrief"), 1500);
        }, 1000);
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: "bot", text: "Что-то пошло не так. Попробуй ещё раз." }]);
    } finally {
      setIsTyping(false);
    }
  }

  function goOutcome() {
    const isNew = !completedTasks.includes(task.id);
    completeTask(task.id, sessionStars);
    if (isNew) {
      setUnlockedBuildingId(task.id);
      setTimeout(() => { setUnlockedBuildingId(null); setPhase("outcome"); }, 2500);
    } else setPhase("outcome");
  }

  /* ─── Render ─── */
  const renderHUD = (phase !== "dragon-splash" && phase !== "auth");
  
  return (
    <div className="min-h-screen flex flex-col items-center" data-theme={theme}>
      {unlockedBuildingId && <UnlockAnimation buildingId={unlockedBuildingId} t={t} />}

      <div className={`w-full ${phase === 'admin' ? 'max-w-[1920px]' : 'max-w-md'} min-h-screen flex flex-col bg-white shadow-2xl relative overflow-hidden text-slate-800`}>
        
        {renderHUD && (
          <div 
            className="fixed top-6 right-6 z-50 cursor-pointer active:scale-95 transition-transform"
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
        )}
        
        {phase === "dragon-splash" && (
          <DragonSplashScreen t={t} onAnimationEnd={() => {
            audio.playTrack(0);
            setPhase(hasSeenOnboarding ? "city" : "dragon-bubble");
          }} />
        )}

        {phase === "dragon-bubble" && (
          <DragonBubbleScreen t={t} theme={theme} onStart={() => { setHasSeenOnboarding(true); setPhase("city"); }} />
        )}

        {phase === "city" && (
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
            onSelectBuilding={(bId) => { setActiveCategory(bId); setPhase("picker"); }}
            activeIslandId={activeIslandId}
            setActiveIslandId={setActiveIslandId}
          />
        )}

        {phase === "picker" && (
          <TaskPicker activeCategory={activeCategory} onBack={() => setPhase("city")} 
            TASKS={TASKS} completedTasks={completedTasks} onStartTask={startTask} t={t} lang={lang}
          />
        )}

        {phase === "dialog" && (
          <DialogView 
            task={task} 
            messages={messages} 
            isTyping={isTyping} 
            trizState={trizState}
            prizStep={prizStep} 
            sessionStars={sessionStars} 
            totalStars={totalStars}
            t={t}
            lang={lang}
            onBack={() => {
              if (messages.length > 2) {
                setShowConfirmDialog(true);
              } else {
                setPhase("picker");
              }
            }} 
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
            completedTasks={completedTasks} 
            taskIdx={taskIdx} 
            debriefBingo={debriefBingo} 
            sessionStars={sessionStars} 
            TASKS={TASKS} 
            t={t}
            lang={lang}
            onNext={() => setPhase("twist")} 
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
