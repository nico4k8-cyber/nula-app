import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create(
  persist(
    (set, get) => ({
      totalStars: 0,
      unlockedBuildings: ['city-hall', 'library', 'nature-reserve', 'workshop'], // Default unlocked
      completedTasks: [], // Array of task IDs
      currentTask: null,
      difficulty: 1, // 1: 6-9, 2: 10-11, 3: 12+

      // ---- AUTH & PREMIUM ----
      user: null, // { id, email, name, provider, country }
      isPremium: false,
      dailyTasksCount: 0,
      lastTaskReset: null, // ISO string

      // ---- STREAK ----
      streak: 0,
      lastPlayDate: null, // YYYY-MM-DD

      // ---- UPSELL ----
      upsellShownAt: [], // массив completedTasks.length при которых показывали

      // ---- СТРУКТУРА ДЛЯ РЕЖИМА WORLD MAP (АРХИПЕЛАГИ) ----
      islands: {
        'main': { solved: 0, total: 17, stars: 0, status: 'active' }, // library(6) + city-hall(6) + nature-reserve(5)
        'craft': { solved: 0, total: 13, stars: 0, status: 'locked' }, // workshop(7) + farm(6)
        'science': { solved: 0, total: 0, stars: 0, status: 'fog' },
        'summit': { solved: 0, total: 0, stars: 0, status: 'fog' },
      },

      unlockRequirements: {
        'craft': { type: 'tasks', count: 3 },
        'science': { type: 'tasks', count: 9 },
        'summit': { type: 'tasks', count: 18 },
      },

      checkUnlocks: () => set((state) => {
        let newIslands = { ...state.islands };
        const totalSolved = state.completedTasks.length;
        const totalStars = state.totalStars;
        let changed = false;

        Object.keys(state.unlockRequirements).forEach((id) => {
          const req = state.unlockRequirements[id];
          const island = newIslands[id];
          if (!island) return;
          
          let canUnlock = false;
          if (req.type === 'tasks' && totalSolved >= req.count) canUnlock = true;
          if (req.type === 'stars' && totalStars >= req.count) canUnlock = true;

          if (canUnlock && (island.status === 'locked' || island.status === 'fog')) {
            newIslands[id] = { ...island, status: 'active' };
            changed = true;
          }
        });

        // Unlock buildings belonging to newly active islands
        const islandBuildings = {
          'craft': ['farm'],
          'science': ['laboratory', 'bredo'],
          'summit': ['tsar'],
        };
        let newUnlockedBuildings = [...state.unlockedBuildings];
        Object.keys(islandBuildings).forEach((islandId) => {
          if (newIslands[islandId]?.status === 'active') {
            islandBuildings[islandId].forEach((bId) => {
              if (!newUnlockedBuildings.includes(bId)) {
                newUnlockedBuildings.push(bId);
                changed = true;
              }
            });
          }
        });

        // Locked vs Fog transition
        let foundFirstLocked = false;
        const keys = ['main', 'craft', 'science', 'summit'];
        
        keys.forEach(k => {
          const island = newIslands[k];
          if (island.status === 'active') {
            // ok
          } else if (island.status === 'locked' || island.status === 'fog') {
             if (!foundFirstLocked) {
               newIslands[k].status = 'locked';
               foundFirstLocked = true;
             } else {
               newIslands[k].status = 'fog';
             }
          }
        });

        return changed ? { islands: newIslands, unlockedBuildings: newUnlockedBuildings } : {};
      }),
      // ----------------------------------------------------

      updateStreak: () => set((state) => {
        const today = new Date().toISOString().slice(0, 10);
        if (state.lastPlayDate === today) return {}; // уже сегодня играли
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = state.lastPlayDate === yesterday ? state.streak + 1 : 1;
        return { streak: newStreak, lastPlayDate: today };
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

      completeTask: (taskId, starsEarned) => set((state) => {
        if (state.completedTasks.includes(taskId)) {
          return state;
        }
        
        const nextTasks = [...state.completedTasks, taskId];
        const nextStars = state.totalStars + starsEarned;
        
        // Also increment daily count
        const nextDailyCount = state.dailyTasksCount + 1;
        const lastReset = state.lastTaskReset || new Date().toISOString();

        return {
          completedTasks: nextTasks,
          totalStars: nextStars,
          dailyTasksCount: nextDailyCount,
          lastTaskReset: lastReset
        };
      }),

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
        if (!state.lastTaskReset) return {};
        const last = new Date(state.lastTaskReset);
        const now = new Date();
        // Check if 24 hours passed
        if (now - last > 24 * 60 * 60 * 1000) {
          return { dailyTasksCount: 0, lastTaskReset: now.toISOString() };
        }
        return {};
      }),
      
      resetGame: () => set({
        totalStars: 0,
        unlockedBuildings: ['city-hall', 'library', 'nature-reserve', 'workshop'],
        completedTasks: [],
        currentTask: null,
        difficulty: 1,
        streak: 0,
        lastPlayDate: null,
        upsellShownAt: [],
        // Reset world map
        islands: {
          'main': { solved: 0, total: 17, stars: 0, status: 'active' },
          'craft': { solved: 0, total: 13, stars: 0, status: 'locked' },
          'science': { solved: 0, total: 0, stars: 0, status: 'fog' },
          'summit': { solved: 0, total: 0, stars: 0, status: 'fog' },
        }
      }),
    }),
    {
      name: 'nula-game-storage',
      version: 2,
    }
  )
);
