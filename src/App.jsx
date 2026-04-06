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
import { supabase, loadProgress, syncProgress, loadTasks } from "./lib/supabase";

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
import LaboratoryView from "./components/LaboratoryView";
import TsarMountainView from "./components/TsarMountainView";
import OnboardingTooltip, { useOnboarding } from "./components/OnboardingTooltip";
import UpsellView, { getUpsellMessage } from "./components/UpsellView";
import DailyChallenge from "./components/DailyChallenge";

// Utils
import { 
  STORAGE_KEY, TRIZ_STATE_KEY, USER_KEY, SESSION_KEY,
  generateUUID, ISLAND_MAPPING, AUDIO_TRACKS 
} from "./utils/gameUtils";

/* ═══ Task Tutorial Steps ═══ */
const TASK_TUTORIAL_STEPS = [
  { anchor: "task-title", title: "Твоя задача!", text: "Прочитай — здесь описана проблема, которую нужно решить.", position: "bottom" },
  { anchor: "start-btn", title: "Начинаем!", text: "Нажми кнопку и расскажи Орину свою идею.", position: "top" },
];

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
    useHint, getHintsLeft, canPlayTask,
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
  const [taskRating, setTaskRating] = useState(1); // 1-3 stars, set when task is solved
  const [syncToast, setSyncToast] = useState(null); // { added: [...], alreadyHad: [...] }
  const [debriefBingo, setDebriefBingo] = useState(false);
  const [twistChoice, setTwistChoice] = useState(null);
  const [prizStep, setPrizStep] = useState(0);
  const [isHinting, setIsHinting] = useState(false);
  const [bingoFlash, setBingoFlash] = useState(false);
  const [upsellMessage, setUpsellMessage] = useState(null);
  
  // Onboarding
  const onboarding = useOnboarding();

  // Modals & Overlays
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [activeCategory, setActiveCategory] = useState(saved?.activeCategory || "library");
  const [unlockedBuildingId, setUnlockedBuildingId] = useState(null);
  const [activeIslandId, setActiveIslandId] = useState(saved?.activeIslandId || null);
  const [isTutorial, setIsTutorial] = useState(false);
  const [showIslandUnlock, setShowIslandUnlock] = useState(false);
  const [showNewDayBubble, setShowNewDayBubble] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [remoteTasks, setRemoteTasks] = useState(null);

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

  // Load tasks from Supabase; silently fall back to local TASKS if unavailable
  useEffect(() => {
    loadTasks().then(data => {
      if (data && data.length > 0) setRemoteTasks(data);
    }).catch(() => {/* offline — use local fallback */});
  }, []);

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

          // Read local progress directly from localStorage (bypasses Zustand hydration race)
          let localCompleted = [], localStars = 0, localBuildings = [];
          try {
            const raw = localStorage.getItem('nula-game-storage');
            const saved = raw ? JSON.parse(raw) : {};
            const s = saved.state || {};
            localCompleted = (s.completedTasks || []).map(String); // normalize IDs to strings
            localStars = s.totalStars || 0;
            localBuildings = s.unlockedBuildings || [];
          } catch {}

          // 1. Load cloud FIRST (before any write — don't overwrite with stale local data)
          const cloudData = await loadProgress(session.user.id);
          const cloudCompleted = cloudData?.completedTasks || [];
          const cloudStars = cloudData?.stars || 0;
          const cloudBuildings = cloudData?.unlockedBuildings || [];

          // 2. Merge: union of tasks, max stars, union of buildings
          const mergedCompleted = Array.from(new Set([...cloudCompleted, ...localCompleted]));
          const mergedStars = Math.max(localStars, cloudStars);
          const mergedBuildings = Array.from(new Set([...cloudBuildings, ...localBuildings]));

          // 3. Save merged result back to cloud
          await syncProgress(session.user.id, {
            email: session.user.email,
            stars: mergedStars,
            completedTasks: mergedCompleted,
            unlockedBuildings: mergedBuildings,
          });

          // 4. Apply to Zustand — normalize all IDs to strings for consistent includes() checks
          useGameStore.setState((state) => ({
            totalStars: Math.max(state.totalStars, mergedStars),
            completedTasks: Array.from(new Set([...state.completedTasks.map(String), ...mergedCompleted])),
            unlockedBuildings: Array.from(new Set([...state.unlockedBuildings, ...mergedBuildings]))
          }));

          // For toast: what was new vs already in cloud
          const newlyAdded = localCompleted.filter(id => !cloudCompleted.includes(id));
          const alreadyHad = localCompleted.filter(id => cloudCompleted.includes(id));

          // Show sync result toast
          if (localCompleted.length > 0) {
            setSyncToast({ added: newlyAdded, alreadyHad });
            setTimeout(() => setSyncToast(null), 5000);
          }
        }
      } else {
        setUser(null);
      }
    });

    // Check premium status from server on login
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_premium', userId: session.user.id }),
        }).then(r => r.json()).then(d => {
          if (d.isPremium) useGameStore.getState().setPremium(true);
        }).catch(() => {});
      }
    });

    // Detect return from payment (ЮКасса redirect)
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' || params.get('payment') === 'mock_success') {
      trackEvent(EVENTS.PAYWALL_PURCHASE_COMPLETED, { plan: params.get('plan') });
      useGameStore.getState().setPremium(true);
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => subscription.unsubscribe();
  }, []);

  // Cloud Sync Effect — always merges Zustand state with localStorage to avoid hydration race
  useEffect(() => {
    if (!user?.id) return;
    // Always union with localStorage in case Zustand hasn't hydrated yet
    let mergedCompleted = completedTasks;
    let mergedStars = totalStars;
    let mergedBuildings = unlockedBuildings;
    try {
      const raw = localStorage.getItem('nula-game-storage');
      const s = (raw ? JSON.parse(raw) : {}).state || {};
      mergedCompleted = Array.from(new Set([...completedTasks, ...(s.completedTasks || [])]));
      mergedStars = Math.max(totalStars, s.totalStars || 0);
      mergedBuildings = Array.from(new Set([...unlockedBuildings, ...(s.unlockedBuildings || [])]));
    } catch {}
    syncProgress(user.id, { stars: mergedStars, completedTasks: mergedCompleted, unlockedBuildings: mergedBuildings });
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

  // "Новый день" bubble — показываем если уже играли раньше и сегодня первый заход
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastKey = "nula-last-visit";
    const last = localStorage.getItem(lastKey);
    if (last && last !== today && completedTasks.length > 0) {
      setShowNewDayBubble(true);
      setTimeout(() => setShowNewDayBubble(false), 6000);
    }
    localStorage.setItem(lastKey, today);
  }, []);

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
    trackEvent(EVENTS.TASK_STARTED, { taskId: task?.id, difficulty: task?.difficulty });
    setMessages([]);
    setSessionStars(0);
    setTaskRating(1);
    setTwistChoice(null);
    setPrizStep(0);
    setIsHinting(false);
    
    // Auto-create TRIZ state if it's a TRIZ task
    if (task.core_problem && task.ikr) {
      // difficulty 1 → ПРИЗ-базовый (3 фазы, age<8 в движке)
      // difficulty 2 → ПРИЗ-стандарт (5 фаз, age 8-12)
      // difficulty 3 → ПРИЗ-про (7 фаз, age 13+)
      const ageForEngine = task.difficulty === 1 ? 10 : task.difficulty === 2 ? 12 : 14;
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

      const replyText = result.reply || result.text || "";
      setMessages(prev => [...prev, { type: "bot", text: replyText, timestamp }]);

      // Stage 3 (З) = task solved → record rating, show ✨ then go to debrief
      if (newPrizStep === 3 && prizStep < 3) {
        const rating = Math.min(3, Math.max(1, result.stars || 1));
        setTaskRating(rating);
        setSessionStars(rating); // sessionStars = task reward (1-3)
        setTimeout(() => {
          setPrizStep(4); // light up ✨ briefly
          setTimeout(() => {
            trackEvent(EVENTS.DEBRIEF_VIEWED, { taskId: task?.id, stars: rating });
            setPhase("debrief");
          }, 2500);
        }, 2000);
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
        trackEvent(EVENTS.UPSELL_SHOWN, { trigger: upsell.trigger, type: upsell.type });
        setTimeout(() => setUpsellMessage(upsell), 2000);
      }
      setUnlockedBuildingId(task.id);
      setTimeout(() => { setUnlockedBuildingId(null); setPhase("outcome"); }, 2500);
    } else setPhase("outcome");
  }

  /* ─── Render ─── */
  const renderHUD = (phase !== "dragon-splash" && phase !== "auth" && phase !== "dialog" && phase !== "task-preview" && phase !== "debrief");
  
  return (
    <div className="min-h-[100dvh] flex flex-col items-center bg-slate-900 overflow-hidden" data-theme={theme}>
      <OnboardingTooltip active={onboarding.active} onDone={() => onboarding.setActive(false)} />
      {isTutorial && phase === "task-preview" && (
        <OnboardingTooltip
          active={onboarding.active}
          onDone={() => { onboarding.setActive(false); }}
          steps={TASK_TUTORIAL_STEPS}
          storageKey="nula-task-tutorial-done"
        />
      )}
      {unlockedBuildingId && <UnlockAnimation buildingId={unlockedBuildingId} t={t} />}
      {upsellMessage && (
        <UpsellView
          message={upsellMessage}
          onDismiss={() => { trackEvent(EVENTS.UPSELL_DISMISSED, { trigger: upsellMessage.trigger }); setUpsellMessage(null); }}
          onSignup={() => { trackEvent(EVENTS.UPSELL_CTA_CLICKED, { trigger: upsellMessage.trigger, type: upsellMessage.type }); setUpsellMessage(null); window.open("https://t.me/ugolok_triz", "_blank"); }}
          onPromo={() => { trackEvent(EVENTS.PROMO_CTA_CLICKED, { trigger: upsellMessage.trigger }); setUpsellMessage(null); setPhase("paywall"); }}
        />
      )}

      {/* Новый день bubble */}
      {showNewDayBubble && phase === "city" && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] animate-bounce-in">
          <div className="bg-white rounded-[20px] shadow-2xl px-5 py-4 flex items-center gap-3 border border-orange-100 max-w-[300px]">
            <span className="text-3xl">🌅</span>
            <div>
              <p className="font-black text-slate-800 text-[14px] leading-tight">Новый день!</p>
              <p className="text-slate-500 text-[12px]">Тебя ждёт новая задача дня 🔥</p>
            </div>
            <button onClick={() => setShowNewDayBubble(false)} className="text-slate-300 text-lg ml-1">×</button>
          </div>
        </div>
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

        {/* Sync toast — shown after login merge */}
        {syncToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-down">
            <div className="bg-slate-900 text-white rounded-2xl px-5 py-4 shadow-2xl max-w-xs text-center">
              {syncToast.added.length > 0 ? (
                <>
                  <div className="text-2xl mb-1">✅</div>
                  <p className="font-black text-sm">
                    {syncToast.added.length === 1
                      ? 'Задача добавлена к твоему прогрессу!'
                      : `${syncToast.added.length} задач добавлено к прогрессу!`}
                  </p>
                  {syncToast.alreadyHad.length > 0 && (
                    <p className="text-white/50 text-xs mt-1">{syncToast.alreadyHad.length} задач уже были пройдены</p>
                  )}
                </>
              ) : syncToast.alreadyHad.length > 0 ? (
                <>
                  <div className="text-2xl mb-1">👍</div>
                  <p className="font-black text-sm">Эта задача уже была в твоём прогрессе</p>
                  <p className="text-white/50 text-xs mt-1">Ничего не изменилось</p>
                </>
              ) : null}
            </div>
          </div>
        )}

        {renderHUD && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
            {/* Звёзды */}
            {totalStars > 0 && (
              <div className="flex items-center gap-1 bg-amber-400 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-amber-900/20">
                ⭐ {totalStars}
              </div>
            )}
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
              <div data-onboard="profile-btn" className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl shadow-xl border-2 border-white/20">
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
              setTask(TASKS.find(t => t.id === 2) || TASKS[0]); // лабиринт Тесея
              setIsTutorial(true);
              setPhase("task-preview");
              setTimeout(() => onboarding.startOnboarding(), 400);
            } else {
              setPhase("city");
              // Start tooltip onboarding after city renders
              setTimeout(() => onboarding.checkAndStart(), 600);
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
              if (bId === "bredo") {
                resetDailyCountIfNeeded();
                if (!canPlayTask()) { setUpsellMessage(getUpsellMessage("daily_limit", isPremium)); return; }
                setPhase("bredo-play"); return;
              }
              if (bId === "tsar") {
                resetDailyCountIfNeeded();
                if (!canPlayTask()) { setUpsellMessage(getUpsellMessage("daily_limit", isPremium)); return; }
                setPhase("mountain-play"); return;
              }
              if (bId === "laboratory") {
                resetDailyCountIfNeeded();
                if (!canPlayTask()) { setUpsellMessage(getUpsellMessage("daily_limit", isPremium)); return; }
                setPhase("laboratory-play"); return;
              }
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
            TASKS={remoteTasks || TASKS} completedTasks={completedTasks} onStartTask={startTaskPreview} t={t} lang={lang}
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
            onBack={() => {
              trackEvent(EVENTS.TASK_ABANDONED, { taskId: task?.id, msgCount: messages.filter(m => m.type !== "bot").length });
              setIsTutorial(false); setPhase("picker");
            }}
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
            totalStars={totalStars}
            completedCount={completedTasks.length}
            t={t}
            lang={lang}
            onNext={goOutcome}
            onWantsMore={() => {
              trackEvent(EVENTS.TASK_COMPLETED, { taskId: task?.id, wantsMore: true });
              const isFirstEver = !completedTasks.includes(task.id) && completedTasks.length === 0;
              completeTask(task.id, sessionStars);
              updateStreak();
              if (isFirstEver) {
                setShowIslandUnlock(true);
                setTimeout(() => { setShowIslandUnlock(false); setPhase("picker"); }, 4000);
              } else {
                setPhase("picker");
              }
            }}
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

        {phase === "laboratory-play" && (
          <LaboratoryView
            onBack={() => setPhase("city")}
            completedTasks={completedTasks}
            allTasks={remoteTasks || TASKS}
            t={t}
          />
        )}

        {phase === "paywall" && (
          <Paywall
            onBack={() => setPhase(task ? "task-preview" : "city")}
            onSelectPlan={(planId) => {
              trackEvent(EVENTS.PAYWALL_PLAN_SELECTED, { plan: planId });
              useGameStore.getState().setPremium(true);
              setPhase(task ? "task-preview" : "city");
            }}
            onDonate={() => setPhase("city")}
            userId={user?.id}
            userEmail={user?.email}
            isPromo={completedTasks.length >= 10 && !isPremium}
          />
        )}

      </div>

      <SettingsMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onResetProgress={() => resetGame()}
        onStartOnboarding={() => {
          localStorage.removeItem("nula-onboarding-done");
          setMenuOpen(false);
          setPhase("city");
          setTimeout(() => onboarding.startOnboarding(), 400);
        }}
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
