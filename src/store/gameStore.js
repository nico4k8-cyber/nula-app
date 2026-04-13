import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create(
  persist(
    (set, get) => ({
      totalStars: 0,
      unlockedBuildings: ['city-hall', 'library', 'nature-reserve', 'workshop'], // Default unlocked
      completedTasks: [], // Array of { taskId, stars, foundPrinciple, solvedAt }
      currentTask: null,
      difficulty: 1, // 1: 6-9, 2: 10-11, 3: 12+
      adaptiveData: {
        adaptiveAge: 10,        // current ageForEngine override (10/12/14)
        consecutiveClean: 0,    // tasks solved without hints in a row
        recentStruggle: 0,      // tasks where hints>=2 in last 3
      },

      // ---- AUTH & PREMIUM ----
      user: null, // { id, email, name, provider, country }
      isPremium: false,
      dailyTasksCount: 0,
      lastTaskReset: null, // ISO string

      // ---- STREAK ----
      streak: 0,
      lastPlayDate: null, // YYYY-MM-DD
      streakFreezeCount: 0,
      streakFreezeUsedAt: null, // ISO date string YYYY-MM-DD
      streakFreezeRefillMonth: null, // YYYY-MM of last refill

      // ---- UPSELL ----
      upsellShownAt: [], // массив completedTasks.length при которых показывали

      // ---- СТРУКТУРА ДЛЯ РЕЖИМА WORLD MAP (АРХИПЕЛАГИ) ----
      islands: {
        'main': { solved: 0, total: 17, stars: 0, status: 'locked' }, // unlocked after first task
        'craft': { solved: 0, total: 13, stars: 0, status: 'locked' }, // workshop(7) + farm(6)
        'science': { solved: 0, total: 0, stars: 0, status: 'fog' },
        'summit': { solved: 0, total: 0, stars: 0, status: 'fog' },
      },

      unlockRequirements: {
        'craft':       { type: 'tasks', count: 3 },
        'tsar':        { type: 'tasks', count: 3 },
        'bredo':       { type: 'tasks', count: 6 },
        'laboratory':  { type: 'tasks', count: 9 },
      },

      updateAdaptive: (sessionData) => set((state) => {
        // sessionData: { hints: number, attempts: number }
        const ad = { ...state.adaptiveData };

        // D-10: solved without hints + few attempts = clean
        if (sessionData.hints === 0 && sessionData.attempts <= 3) {
          ad.consecutiveClean += 1;
          ad.recentStruggle = Math.max(0, ad.recentStruggle - 1);
        } else if (sessionData.hints >= 2) {
          // D-09: many hints = struggle
          ad.recentStruggle += 1;
          ad.consecutiveClean = 0;
        } else {
          ad.consecutiveClean = 0; // reset streak but no struggle
        }

        // D-05: raise after 3 clean in a row
        if (ad.consecutiveClean >= 3 && ad.adaptiveAge < 14) {
          ad.adaptiveAge = Math.min(14, ad.adaptiveAge + 2);
          ad.consecutiveClean = 0;
        }
        // D-06: lower after 2 struggles in recent tasks
        if (ad.recentStruggle >= 2 && ad.adaptiveAge > 10) {
          ad.adaptiveAge = Math.max(10, ad.adaptiveAge - 2);
          ad.recentStruggle = 0;
        }

        return { adaptiveData: ad };
      }),

      checkUnlocks: () => set((state) => {
        const totalSolved = state.completedTasks.length;
        let newUnlockedBuildings = [...state.unlockedBuildings];
        let newIslands = { ...state.islands,
          'main':    { ...state.islands['main'] },
          'craft':   { ...state.islands['craft'] },
          'science': { ...state.islands['science'] },
          'summit':  { ...state.islands['summit'] },
        };
        let changed = false;

        // Unlock individual buildings when thresholds reached
        Object.keys(state.unlockRequirements).forEach((id) => {
          const req = state.unlockRequirements[id];
          if (req.type === 'tasks' && totalSolved >= req.count) {
            // 'craft' is an island, handle separately below
            if (id !== 'craft' && !newUnlockedBuildings.includes(id)) {
              newUnlockedBuildings.push(id);
              changed = true;
            }
          }
        });

        // Unlock main island after first task
        if (totalSolved >= 1 && (newIslands['main'].status === 'locked' || newIslands['main'].status === 'fog')) {
          newIslands['main'] = { ...newIslands['main'], status: 'active' };
          changed = true;
        }

        // Unlock craft island when craft threshold reached
        const craftReq = state.unlockRequirements['craft'];
        if (craftReq && totalSolved >= craftReq.count) {
          if (newIslands['craft'].status === 'locked' || newIslands['craft'].status === 'fog') {
            newIslands['craft'] = { ...newIslands['craft'], status: 'active' };
            // Unlock farm building
            if (!newUnlockedBuildings.includes('farm')) {
              newUnlockedBuildings.push('farm');
            }
            changed = true;
          }
        }

        // Activate science island when bredo or laboratory is unlocked
        const scienceBuildings = ['bredo', 'laboratory'];
        if (scienceBuildings.some(b => newUnlockedBuildings.includes(b))) {
          if (newIslands['science'].status !== 'active') {
            newIslands['science'] = { ...newIslands['science'], status: 'active' };
            changed = true;
          }
        }

        // Activate summit island when tsar is unlocked
        if (newUnlockedBuildings.includes('tsar')) {
          if (newIslands['summit'].status !== 'active') {
            newIslands['summit'] = { ...newIslands['summit'], status: 'active' };
            changed = true;
          }
        }

        // Locked vs Fog transition for non-active islands
        let foundFirstLocked = false;
        const keys = ['main', 'craft', 'science', 'summit'];
        keys.forEach(k => {
          const island = newIslands[k];
          if (island.status === 'active') {
            // ok
          } else if (island.status === 'locked' || island.status === 'fog') {
            if (!foundFirstLocked) {
              newIslands[k] = { ...island, status: 'locked' };
              foundFirstLocked = true;
            } else {
              newIslands[k] = { ...island, status: 'fog' };
            }
          }
        });

        return changed ? { islands: newIslands, unlockedBuildings: newUnlockedBuildings } : {};
      }),
      // ----------------------------------------------------

      updateStreak: () => set((state) => {
        const today = new Date().toLocaleDateString('sv');
        if (state.lastPlayDate === today) return {};
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv');

        // Сегодня = следующий день после вчера → нормальный инкремент
        if (state.lastPlayDate === yesterday) {
          return { streak: state.streak + 1, lastPlayDate: today };
        }

        // Пропущен 1 день — проверяем freeze
        const twoDaysAgo = new Date(Date.now() - 172800000).toLocaleDateString('sv');
        if (
          state.lastPlayDate === twoDaysAgo &&
          state.streakFreezeCount > 0 &&
          state.streakFreezeUsedAt !== yesterday  // не использовали заморозку вчера
        ) {
          return {
            streak: state.streak + 1,
            lastPlayDate: today,
            streakFreezeCount: state.streakFreezeCount - 1,
            streakFreezeUsedAt: yesterday,
          };
        }

        // Сброс
        return { streak: 1, lastPlayDate: today };
      }),

      addStreakFreeze: (count = 1) => set((state) => ({
        streakFreezeCount: state.streakFreezeCount + count,
      })),

      // Call on app load and on premium change — refills freezes once per month
      checkAndRefillFreezes: (isPremium) => set((state) => {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        if (state.streakFreezeRefillMonth === currentMonth) return {}; // already refilled this month
        const monthlyAllotment = isPremium ? 3 : 1;
        const newCount = Math.min(state.streakFreezeCount + monthlyAllotment, monthlyAllotment);
        return {
          streakFreezeCount: newCount,
          streakFreezeRefillMonth: currentMonth,
        };
      }),

      markUpsellShown: (count) => set((state) => ({
        upsellShownAt: [...state.upsellShownAt, count],
      })),

      setTotalStars: (stars) => set({ totalStars: stars }),
      addStars: (amount) => set((state) => {
        const nextStars = state.totalStars + amount;
        return { totalStars: nextStars };
      }),
      
      unlockBuilding: (buildingId) => set((state) => {
        if (state.unlockedBuildings.includes(buildingId)) return state;
        return { unlockedBuildings: [...state.unlockedBuildings, buildingId] };
      }),

      completeTask: (taskId, starsEarned, foundPrinciple = '') => set((state) => {
        const existingIdx = state.completedTasks.findIndex(t => (typeof t === 'object' ? t.taskId : t) === taskId);

        if (existingIdx >= 0) {
          // Retry: append new solution if different, update stars to max
          const existing = state.completedTasks[existingIdx];
          const prevSolutions = existing.solutions || (existing.foundPrinciple ? [existing.foundPrinciple] : []);
          const newSolutions = foundPrinciple && !prevSolutions.includes(foundPrinciple)
            ? [...prevSolutions, foundPrinciple]
            : prevSolutions;
          const updated = {
            ...existing,
            stars: Math.max(existing.stars || 1, starsEarned),
            solutions: newSolutions,
            foundPrinciple: newSolutions[newSolutions.length - 1] || existing.foundPrinciple,
            solvedAt: new Date().toISOString(),
          };
          const nextTasks = [...state.completedTasks];
          nextTasks[existingIdx] = updated;
          return { completedTasks: nextTasks };
        }

        const taskEntry = {
          taskId,
          stars: starsEarned,
          foundPrinciple,
          solutions: foundPrinciple ? [foundPrinciple] : [],
          solvedAt: new Date().toISOString(),
        };
        const nextTasks = [...state.completedTasks, taskEntry];
        const nextStars = state.totalStars + starsEarned;
        const nextDailyCount = state.dailyTasksCount + 1;
        const lastReset = state.lastTaskReset || new Date().toISOString();

        return {
          completedTasks: nextTasks,
          totalStars: nextStars,
          dailyTasksCount: nextDailyCount,
          lastTaskReset: lastReset
        };
      }),

      // Helper: get flat array of taskIds for backwards compatibility (.includes(id))
      getCompletedIds: () => get().completedTasks.map(t => typeof t === 'object' ? t.taskId : t),

      setCurrentTask: (task) => set({ currentTask: task }),
      setDifficulty: (level) => set({ difficulty: level }),
      
      // ---- HINTS ----
      // Free users: 3 hints per day. Premium: unlimited.
      hintsUsedToday: 0,
      lastHintReset: null, // ISO date string

      useHint: () => set((state) => {
        const today = new Date().toISOString().slice(0, 10);
        const lastReset = state.lastHintReset;
        const hintsUsed = lastReset === today ? state.hintsUsedToday : 0;
        return { hintsUsedToday: hintsUsed + 1, lastHintReset: today };
      }),

      getHintsLeft: () => {
        const state = get();
        if (state.isPremium) return Infinity;
        const FREE_HINTS_PER_DAY = 3;
        const today = new Date().toISOString().slice(0, 10);
        const used = state.lastHintReset === today ? state.hintsUsedToday : 0;
        return Math.max(0, FREE_HINTS_PER_DAY - used);
      },

      // ---- AUTH ACTIONS ----
      setUser: (user) => set({ user }),
      setPremium: (isPremium) => set({ isPremium }),
      
      incrementDailyCount: () => set((state) => ({ 
        dailyTasksCount: state.dailyTasksCount + 1,
        lastTaskReset: state.lastTaskReset || new Date().toISOString() 
      })),

      resetDailyCountIfNeeded: () => set((state) => {
        const today = new Date().toISOString().slice(0, 10);
        const lastDay = state.lastTaskReset ? state.lastTaskReset.slice(0, 10) : null;
        // Reset by calendar day (midnight), not 24h window
        if (lastDay !== today && state.dailyTasksCount > 0) {
          return { dailyTasksCount: 0, lastTaskReset: new Date().toISOString() };
        }
        return {};
      }),

      // D-06: completedTasks содержит только задачи со статусом "solved".
      // Задачи пропущенные (skip) или прочитанные без решения НЕ попадают в completedTasks.
      canPlayTask: () => {
        const state = get();
        if (state.isPremium) return true;
        const FREE_TASKS_PER_DAY = 3;
        const today = new Date().toISOString().slice(0, 10);
        const countToday = state.lastTaskReset && state.lastTaskReset.slice(0, 10) === today
          ? state.dailyTasksCount
          : 0;
        return countToday < FREE_TASKS_PER_DAY;
      },
      
      resetGame: () => set({
        totalStars: 0,
        unlockedBuildings: ['city-hall', 'library', 'nature-reserve', 'workshop'],
        completedTasks: [],
        currentTask: null,
        difficulty: 1,
        adaptiveData: { adaptiveAge: 10, consecutiveClean: 0, recentStruggle: 0 },
        streak: 0,
        lastPlayDate: null,
        upsellShownAt: [],
        dailyTasksCount: 0,
        lastTaskReset: null,
        // Reset world map: craft starts locked, science/summit in fog
        islands: {
          'main':    { solved: 0, total: 17, stars: 0, status: 'active' },
          'craft':   { solved: 0, total: 13, stars: 0, status: 'locked' },
          'science': { solved: 0, total: 0,  stars: 0, status: 'fog' },
          'summit':  { solved: 0, total: 0,  stars: 0, status: 'fog' },
        }
      }),
    }),
    {
      name: 'nula-game-storage',
      version: 5,
      migrate: (state, version) => {
        if (version < 4) {
          state = {
            ...state,
            adaptiveData: { adaptiveAge: 10, consecutiveClean: 0, recentStruggle: 0 },
            streak: state.streak ?? 0,
            lastPlayDate: state.lastPlayDate ?? null,
            islands: state.islands ?? {
              'main':    { solved: 0, total: 17, stars: 0, status: 'active' },
              'craft':   { solved: 0, total: 13, stars: 0, status: 'locked' },
              'science': { solved: 0, total: 0,  stars: 0, status: 'fog' },
              'summit':  { solved: 0, total: 0,  stars: 0, status: 'fog' },
            },
          };
        }
        if (version < 5) {
          const oldTasks = state.completedTasks || [];
          state = {
            ...state,
            completedTasks: oldTasks.map(t =>
              typeof t === 'object' ? t : { taskId: t, stars: 0, foundPrinciple: '', solvedAt: '' }
            ),
          };
        }
        return state;
      },
    }
  )
);
