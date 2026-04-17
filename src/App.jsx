import React, { useState, useRef, useEffect } from "react";
import { TASKS } from "./tasks";
import { askTriz, generateDebrief } from "./ai";
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
import { supabase, loadProgress, syncProgress, loadTasks, loadAppConfig } from "./lib/supabase";
import { runMigrations } from "./utils/migrations";

// Запускаем миграции сразу при загрузке модуля — до рендера
runMigrations();

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
import ParentView from "./components/ParentView";
import BredomakerView from "./components/BredomakerView";
import LaboratoryView from "./components/LaboratoryView";
import TsarMountainView from "./components/TsarMountainView";
import OnboardingTooltip, { useOnboarding } from "./components/OnboardingTooltip";
import UpsellView, { getUpsellMessage } from "./components/UpsellView";
import DailyChallenge from "./components/DailyChallenge";
import StreakScreen from "./components/StreakScreen";

// Utils
import { 
  STORAGE_KEY, TRIZ_STATE_KEY, USER_KEY, SESSION_KEY,
  generateUUID, ISLAND_MAPPING, AUDIO_TRACKS 
} from "./utils/gameUtils";

/* ═══ Task Tutorial Steps ═══ */
const TASK_TUTORIAL_STEPS = [
  { anchor: "task-title", title: "Твоя задача!", text: "Это название задачи — прочитай и запомни тему.", position: "bottom" },
  { anchor: "task-desc", title: "Условие задачи 📖", text: "Вот в чём проблема. Именно её нужно решить — прочитай внимательно!", position: "bottom" },
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
    streakFreezeCount, streakFreezeUsedAt,
    useHint, getHintsLeft, canPlayTask, updateAdaptive, getCompletedIds,
    checkAndRefillFreezes,
  } = useGameStore();

  // Navigation & UI State
  // Skip splash if returning from OAuth redirect — go directly to the page user came from
  const getInitialPhase = () => {
    const isOAuthRedirect = window.location.hash.includes('access_token') ||
      window.location.search.includes('code=');
    if (!isOAuthRedirect) return "dragon-splash";
    // Peek at saved return phase without popping (onAuthStateChange will pop it)
    try {
      const saved = localStorage.getItem('nula-auth-return-phase');
      return (saved && saved !== 'auth') ? saved : "city";
    } catch { return "city"; }
  };
  const [phase, setPhase] = useState(getInitialPhase);
  const [lang, setLang] = useState(saved?.lang || "ru");
  const [theme, setTheme] = useState(saved?.theme || "hayday");
  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
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
  const [debriefAI, setDebriefAI] = useState(null); // { feedback, insight } | null = loading
  const [twistChoice, setTwistChoice] = useState(null);
  const [prizStep, setPrizStep] = useState(0);
  const prizStepRef = React.useRef(0); // ref to avoid stale closure in async handlers
  const [isHinting, setIsHinting] = useState(false);
  const [bingoFlash, setBingoFlash] = useState(false);
  const [upsellMessage, setUpsellMessage] = useState(null);
  const [sessionHints, setSessionHints] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [childSolution, setChildSolution] = useState('');

  // Onboarding
  const onboarding = useOnboarding();

  // Modals & Overlays
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showStreakScreen, setShowStreakScreen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [activeCategory, setActiveCategory] = useState(saved?.activeCategory || "library");
  const [unlockedBuildingId, setUnlockedBuildingId] = useState(null);
  const [activeIslandId, setActiveIslandId] = useState(saved?.activeIslandId || null);
  const [isTutorial, setIsTutorial] = useState(false);
  const [showIslandUnlock, setShowIslandUnlock] = useState(false);
  const [showNewDayBubble, setShowNewDayBubble] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [remoteTasks, setRemoteTasks] = useState(null);
  const [tutorialTaskId, setTutorialTaskId] = useState(null); // set via app_config in Supabase

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const isMergingRef = useRef(false); // prevents Cloud Sync Effect from overwriting during login merge
  const msgIdRef = useRef(0); // monotonic counter for stable message keys
  const debriefGenRef = useRef(0); // increments on each new task start; lets async debrief discard stale results
  const nextMsgId = () => { msgIdRef.current += 1; return msgIdRef.current; };

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

  // Start music on first user interaction (browsers block autoplay until gesture)
  useEffect(() => {
    const audioRef = { current: audio };
    const startMusic = () => {
      audioRef.current.playTrack(0);
      document.removeEventListener('click', startMusic, true);
      document.removeEventListener('touchstart', startMusic, true);
    };
    document.addEventListener('click', startMusic, true);
    document.addEventListener('touchstart', startMusic, true);
    return () => {
      document.removeEventListener('click', startMusic, true);
      document.removeEventListener('touchstart', startMusic, true);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load tasks from Supabase; silently fall back to local TASKS if unavailable
  useEffect(() => {
    loadTasks().then(data => {
      if (data && data.length > 0) setRemoteTasks(data);
    }).catch(() => {/* offline — use local fallback */});
    loadAppConfig('tutorial_task_id').then(val => {
      if (val) setTutorialTaskId(Number(val));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    resetDailyCountIfNeeded();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email, name: session.user.user_metadata?.full_name || "Инженер" });
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          // Only navigate on explicit SIGNED_IN (fresh login from auth screen)
          // INITIAL_SESSION = returning user on app load; don't interrupt onboarding flow
          if (event === 'SIGNED_IN') {
            setHasSeenOnboarding(true);
            const returnPhase = popReturnPhase();
            if (returnPhase && returnPhase !== 'auth') {
              setPhase(returnPhase);
            } else {
              setPhase('city');
            }
          }

          // Block Cloud Sync Effect from running during merge (prevents race condition)
          isMergingRef.current = true;

          // Read local progress directly from localStorage (bypasses Zustand hydration race)
          let localTasks = [], localStars = 0, localBuildings = [], localStreak = 0, localLastPlayDate = null;
          try {
            const raw = localStorage.getItem('nula-game-storage');
            const saved = raw ? JSON.parse(raw) : {};
            const s = saved.state || {};
            localTasks = (s.completedTasks || []).map(t =>
              typeof t === 'object' && t !== null ? t : { taskId: String(t), stars: 1, foundPrinciple: '', solutions: [], solvedAt: '' }
            );
            localStars = s.totalStars || 0;
            localBuildings = s.unlockedBuildings || [];
            localStreak = s.streak || 0;
            localLastPlayDate = s.lastPlayDate || null;
          } catch {}

          // Also read from current Zustand state (in case rehydration has newer data than localStorage snapshot)
          const currentZustand = useGameStore.getState();
          // Merge local+zustand tasks by taskId, keeping richer data
          const localTaskMap = new Map(localTasks.map(t => [String(t.taskId), t]));
          for (const t of currentZustand.completedTasks) {
            const id = String(typeof t === 'object' ? t.taskId : t);
            const obj = typeof t === 'object' ? t : { taskId: id, stars: 1, foundPrinciple: '', solutions: [], solvedAt: '' };
            if (!localTaskMap.has(id) || (obj.solutions?.length || 0) > (localTaskMap.get(id).solutions?.length || 0)) {
              localTaskMap.set(id, obj);
            }
          }
          localTasks = Array.from(localTaskMap.values());
          localStars = Math.max(localStars, currentZustand.totalStars);
          localBuildings = Array.from(new Set([...localBuildings, ...currentZustand.unlockedBuildings]));
          localStreak = Math.max(localStreak, currentZustand.streak || 0);
          localLastPlayDate = localLastPlayDate || currentZustand.lastPlayDate || null;

          // 1. Load cloud FIRST (before any write — don't overwrite with stale local data)
          const cloudData = await loadProgress(session.user.id);
          const cloudTasks = cloudData?.completedTasks || []; // now rich objects
          const cloudStars = cloudData?.stars || 0;
          const cloudBuildings = cloudData?.unlockedBuildings || [];
          const cloudStreak = cloudData?.streak || 0;
          const cloudLastPlayDate = cloudData?.lastPlayDate || null;

          // 2. Merge rich task objects — union by taskId, prefer richer solutions[], higher stars
          const mergedTaskMap = new Map(cloudTasks.map(t => [String(t.taskId), t]));
          for (const t of localTasks) {
            const id = String(t.taskId);
            const cloud = mergedTaskMap.get(id);
            if (!cloud) {
              mergedTaskMap.set(id, t);
            } else {
              mergedTaskMap.set(id, {
                ...cloud,
                stars: Math.max(cloud.stars || 1, t.stars || 1),
                solutions: (t.solutions?.length || 0) >= (cloud.solutions?.length || 0) ? (t.solutions || []) : (cloud.solutions || []),
                foundPrinciple: t.foundPrinciple || cloud.foundPrinciple || '',
                solvedAt: t.solvedAt || cloud.solvedAt || '',
              });
            }
          }
          const mergedCompleted = Array.from(mergedTaskMap.values());
          const mergedStars = Math.max(localStars, cloudStars);
          const mergedBuildings = Array.from(new Set([...cloudBuildings, ...localBuildings]));
          const mergedStreak = Math.max(localStreak, cloudStreak);
          const mergedLastPlayDate = localLastPlayDate || cloudLastPlayDate;

          // 3. Save merged result back to cloud
          await syncProgress(session.user.id, {
            email: session.user.email,
            stars: mergedStars,
            completedTasks: mergedCompleted,
            unlockedBuildings: mergedBuildings,
            streak: mergedStreak,
            lastPlayDate: mergedLastPlayDate,
          });

          // 4. Apply to Zustand — use merged rich objects directly
          useGameStore.setState((state) => {
            const existingIds = new Set(state.completedTasks.map(t => String(typeof t === 'object' ? t.taskId : t)));
            const cloudOnly = mergedCompleted.filter(t => !existingIds.has(String(t.taskId)));
            return {
              totalStars: Math.max(state.totalStars, mergedStars),
              completedTasks: [...state.completedTasks, ...cloudOnly],
              unlockedBuildings: Array.from(new Set([...state.unlockedBuildings, ...mergedBuildings])),
              streak: Math.max(state.streak || 0, mergedStreak),
              lastPlayDate: state.lastPlayDate || mergedLastPlayDate,
            };
          });

          // Allow Cloud Sync Effect to run again now that merge is complete
          isMergingRef.current = false;

          // For toast: what was new vs already in cloud
          const cloudIds = new Set(cloudTasks.map(t => String(t.taskId)));
          const localIds = localTasks.map(t => String(t.taskId));
          const newlyAdded = localIds.filter(id => !cloudIds.has(id));
          const alreadyHad = localIds.filter(id => cloudIds.has(id));

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

  // Показать streak-экран при первом открытии если уже на city и streak >= 2
  useEffect(() => {
    if (phase === "city" && streak >= 2) {
      const shownKey = "streak_screen_shown_" + new Date().toLocaleDateString('sv');
      if (!sessionStorage.getItem(shownKey)) {
        sessionStorage.setItem(shownKey, "1");
        setShowStreakScreen(true);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Показать при смене phase на city (навигация внутри сессии)
  useEffect(() => {
    if (phase === "city" && streak >= 2) {
      const shownKey = "streak_screen_shown_" + new Date().toLocaleDateString('sv');
      if (!sessionStorage.getItem(shownKey)) {
        sessionStorage.setItem(shownKey, "1");
        setShowStreakScreen(true);
      }
    }
  }, [phase, streak]);

  // Cloud Sync Effect — always merges Zustand state with localStorage to avoid hydration race
  useEffect(() => {
    if (!user?.id) return;
    if (isMergingRef.current) return; // skip during login merge to avoid race condition
    // Normalize completedTasks to string IDs before syncing (prevent "[object Object]" corruption)
    const toIds = (arr) => (arr || []).map(t => String(typeof t === 'object' ? t.taskId : t)).filter(Boolean);
    let mergedCompleted = toIds(completedTasks);
    let mergedStars = totalStars;
    let mergedBuildings = unlockedBuildings;
    try {
      const raw = localStorage.getItem('nula-game-storage');
      const s = (raw ? JSON.parse(raw) : {}).state || {};
      mergedCompleted = Array.from(new Set([...mergedCompleted, ...toIds(s.completedTasks)]));
      mergedStars = Math.max(totalStars, s.totalStars || 0);
      mergedBuildings = Array.from(new Set([...unlockedBuildings, ...(s.unlockedBuildings || [])]));
    } catch {}
    syncProgress(user.id, { stars: mergedStars, completedTasks: mergedCompleted, unlockedBuildings: mergedBuildings });
  }, [totalStars, completedTasks.length, unlockedBuildings.length, user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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

  // Monthly freeze refill — 3 per month for premium, 1 per month free
  useEffect(() => {
    checkAndRefillFreezes(isPremium);
  }, [isPremium]);

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
    
    const taskList = remoteTasks || [];
    // 1. Сначала ищем четко по ID (обрабатываем и числа, и строки)
    let tDef = taskList.find(t => String(t.id) === String(taskKey));

    // 2. Если не нашли по ID (может пришел 0 из-за индекса), ищем по категории
    if (!tDef) {
       tDef = taskList.find(t => t.category === taskKey);
    }

    // 3. Если всё еще не нашли, берем первую задачу как дефолтную (защита от '0')
    if (!tDef && (taskKey === 0 || taskKey === "0")) {
       tDef = taskList[0];
    }

    if (!tDef) {
       console.error("Task not found for key:", taskKey);
       return;
    }
    
    setTask(tDef);
    setPhase("task-preview");
  }

  async function startDialogRetry(prevSolution, retryHint) {
    trackEvent(EVENTS.TASK_STARTED, { taskId: task?.id, retry: true });
    setMessages([]);
    setSessionStars(0);
    setTaskRating(1);
    setTwistChoice(null);
    setPrizStep(1);
    prizStepRef.current = 1;
    setIsHinting(false);
    setDebriefAI(null);
    setChildSolution('');
    debriefGenRef.current++;
    setPhase("dialog");
    setIsTyping(true);
    setTimeout(() => inputRef.current?.focus(), 200);

    // Show the retryHint as first bot message, then ask AI to continue from S:1
    const hintText = retryHint || 'Попробуем найти другой вариант — без этого ограничения.';
    setMessages([{ id: nextMsgId(), type: 'bot', text: hintText, ts: Date.now() }]);

    // Send AI a context message: knows the previous solution, guides toward a new direction
    const contextMsg = `[ПОВТОР] Предыдущее решение: "${prevSolution || '—'}". ${retryHint ? `Ориентир: ${retryHint}` : 'Ищем другой подход.'} Задай один короткий вопрос, который направит в другую сторону.`;
    try {
      const result = await askTriz(contextMsg, task, { phase: 1 }, [], difficulty);
      if (result.newState) setTrizState(result.newState);
      const aiText = result.text;
      if (aiText) {
        setMessages(prev => [...prev, { id: nextMsgId(), type: 'bot', text: aiText, ts: Date.now() }]);
      }
    } catch {
      // hintText already shown, that's enough
    } finally {
      setIsTyping(false);
    }
  }

  async function startDialog() {
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
    prizStepRef.current = 0;
    setIsHinting(false);
    setDebriefAI(null);
    setChildSolution('');
    debriefGenRef.current++;

    // Auto-create TRIZ state if it's a TRIZ task (has core_problem or ikr)
    if (task.core_problem || task.ikr) {
      const maxAge = task.difficulty === 1 ? 10 : task.difficulty === 2 ? 12 : 14;
      const { adaptiveData } = useGameStore.getState();
      const ageForEngine = Math.min(adaptiveData.adaptiveAge, maxAge);
      setSessionHints(0);
      setSessionAttempts(0);
      const newState = createNewState(task.id, ageForEngine);
      setTrizState(newState);
    }

    setMessages([]);
    setPhase("dialog");
    setIsTyping(true);
    setTimeout(() => inputRef.current?.focus(), 200);

    // AI generates the first guiding question (S:0, no history)
    try {
      const result = await askTriz("[СТАРТ]", task, { phase: 0 }, [], difficulty);
      if (result.newState) setTrizState(result.newState);
      setMessages(prev => [...prev, {
        id: nextMsgId(), type: "bot",
        text: result.text || "С чего начнём?",
        ts: Date.now(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: nextMsgId(), type: "bot",
        text: "С чего начнём?",
        ts: Date.now(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  async function handleUserMessage() {
    const text = input.trim();
    if (!text || isTyping) return;

    // Clear tutorial after first message
    if (isTutorial) setIsTutorial(false);

    setInput("");
    setSessionAttempts(prev => prev + 1);
    const timestamp = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const newMessages = [...messages, { id: nextMsgId(), type: "child", text, timestamp, ts: Date.now() }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const history = newMessages.map(m => ({ role: m.type === "bot" ? "bot" : "user", text: m.text }));
      const result = await askTriz(text, task, { ...(trizState || {}), phase: prizStep }, history.slice(0, -1), difficulty);

      if (result.newState) setTrizState(result.newState);

      // Update stage from AI response (AI decides when to advance)
      // Use ref to get current prizStep — avoids stale closure in async handler
      const currentPrizStep = prizStepRef.current;
      const newPrizStep = (result.prizStep != null && result.prizStep >= currentPrizStep)
        ? result.prizStep
        : currentPrizStep;
      prizStepRef.current = newPrizStep;
      setPrizStep(newPrizStep);

      const replyText = result.reply || result.text || "Хм, дай мне секунду подумать...";
      const replyTimestamp = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [...prev, { id: nextMsgId(), type: "bot", text: replyText, timestamp: replyTimestamp, ts: Date.now() }]);

      // Stage 3 (З) = task solved → record rating, show ✨ then go to debrief
      if (newPrizStep === 3 && currentPrizStep < 3) {
        const rating = Math.min(3, Math.max(1, result.stars || 1));
        setTaskRating(rating);
        setSessionStars(rating); // sessionStars = task reward (1-3)
        const sol = result.newState?.currentIdea?.text || result.newState?.ideas?.at(-1)?.idea
          || newMessages.filter(m => m.type === 'child').at(-1)?.text || '';
        setChildSolution(sol);
        setTimeout(() => {
          prizStepRef.current = 4;
          setPrizStep(4); // light up ✨ — show "continue" button, wait for user tap
          trackEvent(EVENTS.DEBRIEF_VIEWED, { taskId: task?.id, stars: rating });
          // Start generating personalized debrief in background
          setDebriefAI(null);
          const debriefGenId = ++debriefGenRef.current;
          const history = messages.map(m => ({ role: m.type === 'bot' ? 'assistant' : 'user', text: m.text }));
          generateDebrief({ task, history, stars: rating, childSolution: sol, lang }).then(ai => {
            // Discard result if a new task has already started
            if (debriefGenRef.current === debriefGenId) {
              setDebriefAI(ai || { feedback: null, insight: null });
            }
          });
        }, 2000);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: nextMsgId(), type: "bot", text: "Что-то пошло не так. Попробуй ещё раз.", ts: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  }

  async function handleHint() {
    if (isHinting || isTyping || getHintsLeft() === 0) return;
    useHint();
    setSessionHints(prev => prev + 1);
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
      setMessages(prev => [...prev, { id: nextMsgId(), type: "bot", text: hintText, isHint: true, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { id: nextMsgId(), type: "bot", text: "Подумай: что уже есть рядом, что можно использовать?", isHint: true, ts: Date.now() }]);
    } finally {
      setIsHinting(false);
    }
  }

  function goOutcome() {
    const isNew = !getCompletedIds().includes(task.id);
    completeTask(task.id, sessionStars, childSolution, task);
    setChildSolution('');
    checkUnlocks();
    updateStreak();
    updateAdaptive({ hints: sessionHints, attempts: sessionAttempts });
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
      {unlockedBuildingId && <UnlockAnimation buildingId={unlockedBuildingId} tasks={remoteTasks || TASKS} t={t} />}
      {upsellMessage && (
        <UpsellView
          message={upsellMessage}
          onDismiss={() => { trackEvent(EVENTS.UPSELL_DISMISSED, { trigger: upsellMessage.trigger }); setUpsellMessage(null); }}
          onSignup={() => { trackEvent(EVENTS.UPSELL_CTA_CLICKED, { trigger: upsellMessage.trigger, type: upsellMessage.type }); setUpsellMessage(null); window.open("https://trizintellect.tilda.ws/triz_lesson?utm_source=app&utm_medium=upsell&utm_campaign=teacher_invite#booking", "_blank"); }}
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
              <button
                onClick={() => setShowStreakScreen(true)}
                className="flex items-center gap-1 bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-orange-900/30 cursor-pointer active:scale-95 transition-transform"
              >
                🔥 {streak}
              </button>
            )}
            <div
              className="cursor-pointer active:scale-95 transition-transform"
              onClick={() => setMenuOpen(true)}
              title={user ? user.name : t('hud.guest')}
            >
            <div className="relative" data-onboard="profile-btn">
              {user ? (
                /* Залогинен — аватар с инициалами или иконкой */
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl shadow-xl border-2 border-white/20">
                  👤
                </div>
              ) : (
                /* Не залогинен — кнопка "Войти" */
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur text-slate-700 text-xs font-black px-3 py-2 rounded-full shadow-lg border border-slate-200">
                  <span>☁️</span>
                  <span>Войти</span>
                </div>
              )}
              {/* Точка статуса */}
              {user && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
              )}
            </div>
            </div>
          </div>
        )}

        {phase === "dragon-splash" && (
          <DragonSplashScreen t={t} onAnimationEnd={() => {
            setPhase(hasSeenOnboarding ? "city" : "dragon-bubble");
          }} />
        )}

        {phase === "dragon-bubble" && (
          <DragonBubbleScreen t={t} theme={theme} lang={lang}
            onStart={(opts) => {
              setHasSeenOnboarding(true);
              if (opts?.tutorial) {
                const allTasks = remoteTasks || TASKS;
                setTask(allTasks.find(t => t.id === tutorialTaskId) || allTasks[0]);
                setIsTutorial(true);
                setPhase("task-preview");
                setTimeout(() => onboarding.startOnboarding(), 400);
              } else {
                setPhase("city");
                setTimeout(() => onboarding.checkAndStart(), 600);
              }
            }}
            onSkip={() => { setHasSeenOnboarding(true); setPhase("city"); }}
            onLogin={() => { saveReturnPhase("city"); setPhase("auth"); }}
          />
        )}

        {phase === "auth" && (
          <AuthScreen
            returnPhase={phase}
            onGuest={() => setPhase(popReturnPhase() || "city")}
          />
        )}

        {phase === "city" && (
          <div className="flex flex-col flex-1 min-h-screen relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 z-30 px-3 pt-3 pointer-events-none pr-32">
              <div className="pointer-events-auto">
                <DailyChallenge
                  TASKS={remoteTasks || TASKS}
                  completedTasks={completedTasks}
                  onStart={(dailyTask) => {
                    trackEvent("DAILY_CHALLENGE_STARTED", { taskId: dailyTask.id });
                    setTask(dailyTask);
                    setMessages([]);
                    setSessionStars(0);
                    setSessionHints(0);
                    setSessionAttempts(0);
                    setPhase("task-preview");
                  }}
                />
              </div>
            </div>
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
            isDark={isDark}
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
            onGoToDebrief={() => {
              setPhase("debrief");
            }}
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
            debriefAI={debriefAI}
            t={t}
            lang={lang}
            onNext={goOutcome}
            onRetry={() => {
              // Retry same task — AI picks up from previous solution context
              trackEvent(EVENTS.TASK_STARTED, { taskId: task?.id, retry: true });
              startDialogRetry(childSolution, debriefAI?.retryHint);
            }}
            onWantsMore={() => {
              trackEvent(EVENTS.TASK_COMPLETED, { taskId: task?.id, wantsMore: true });
              const isFirstEver = !getCompletedIds().includes(task.id) && completedTasks.length === 0;
              completeTask(task.id, sessionStars, childSolution, task);
              updateStreak();
              updateAdaptive({ hints: sessionHints, attempts: sessionAttempts });
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
            TASKS={remoteTasks || TASKS}
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
            TASKS={remoteTasks || TASKS}
            t={t}
            lang={lang}
            onRestart={() => resetGame()}
            onBackToCity={() => setPhase("city")} 
            onUgc={() => {}}
          />
        )}

        {phase === "admin" && (
          <AdminView TASKS={remoteTasks || TASKS} t={t} onBack={() => setPhase("city")} />
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

        {phase === "parent-view" && (
          <ParentView
            completedTasks={completedTasks}
            totalStars={totalStars}
            streak={streak}
            TASKS={remoteTasks || TASKS}
            onUnlock={() => { setPhase("paywall"); }}
            onBack={() => setPhase("city")}
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
          setTimeout(() => onboarding.startOnboarding(), 700);
        }}
        onShowParentView={() => { setMenuOpen(false); setPhase("parent-view"); }}
        onShowPaywall={() => { setMenuOpen(false); setPhase("paywall"); }}
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

      {showStreakScreen && (
        <StreakScreen
          streak={streak}
          streakFreezeCount={streakFreezeCount}
          freezeUsedYesterday={
            streakFreezeUsedAt === new Date(Date.now() - 86400000).toLocaleDateString('sv')
          }
          onClose={() => setShowStreakScreen(false)}
          onBuyFreeze={() => {
            setShowStreakScreen(false);
            setPhase("paywall");
          }}
        />
      )}
    </div>
  );
}
