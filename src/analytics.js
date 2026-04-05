/**
 * Analytics Event Tracking System
 * Sends events to Yandex Metrica and backend
 */

// Yandex Metrica configuration
const METRICA_ID = import.meta.env.VITE_METRICA_ID || null;

export const EVENTS = {
  // ONBOARDING
  ONBOARDING_SPLASH_VIEWED: "onboarding_splash_viewed",
  ONBOARDING_BUBBLE_VIEWED: "onboarding_bubble_viewed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  AGE_GROUP_SELECTED: "age_group_selected",

  // GAME FLOW
  TASK_STARTED: "task_started",
  TASK_COMPLETED: "task_completed",
  TASK_ABANDONED: "task_abandoned",
  DEBRIEF_VIEWED: "debrief_viewed",
  PUZZLE_SUBMITTED: "puzzle_submitted",
  BUILDING_UNLOCKED: "building_unlocked",
  NEW_DAY_RETURN: "new_day_return",

  // NAVIGATION
  CITY_OPENED: "city_opened",
  CITY_CLOSED: "city_closed",
  MENU_OPENED: "menu_opened",
  MENU_CLOSED: "menu_closed",

  // MENU ACTIONS
  PROGRESS_RESET: "progress_reset",
  AGE_CHANGED: "age_changed",

  // DRAGON INTERACTIONS
  DRAGON_INFO_OPENED: "dragon_info_opened",
  DRAGON_GREETING_CLOSED: "dragon_greeting_closed",

  // PAYWALL FUNNEL
  PAYWALL_SHOWN: "paywall_shown",           // открыл paywall (дневной лимит)
  PAYWALL_PLAN_SELECTED: "paywall_plan_selected", // выбрал тариф
  PAYWALL_CTA_CLICKED: "paywall_cta_clicked",     // нажал "Начать обучение"
  PAYWALL_GATE_SHOWN: "paywall_gate_shown",        // показана проверка для родителей
  PAYWALL_GATE_PASSED: "paywall_gate_passed",      // родитель решил пример
  PAYWALL_REDIRECT: "paywall_redirect",            // редирект на ЮКасса
  PAYWALL_PURCHASE_COMPLETED: "paywall_purchase_completed", // вернулся с payment=success
  PAYWALL_DISMISSED: "paywall_dismissed",          // нажал "Отдохнуть до завтра"
  PAYWALL_DONATE_CLICKED: "paywall_donate_clicked",

  // UPSELL FUNNEL
  UPSELL_SHOWN: "upsell_shown",             // появился upsell после N задач
  UPSELL_CTA_CLICKED: "upsell_cta_clicked", // нажал кнопку в upsell
  UPSELL_DISMISSED: "upsell_dismissed",

  // PROMO OFFER
  PROMO_SHOWN: "promo_shown",               // показан спец-оффер 99₽
  PROMO_CTA_CLICKED: "promo_cta_clicked",

  // DEV
  DEBUG_RESET_TRIGGERED: "debug_reset_triggered",
};

/**
 * Track an event with optional properties
 * @param {string} eventName - Event key from EVENTS
 * @param {object} properties - Additional event data
 */
export function trackEvent(eventName, properties = {}) {
  const timestamp = new Date().toISOString();
  const event = {
    event: eventName,
    timestamp,
    url: window.location.href,
    ...properties,
  };

  // Log to console in development
  if (import.meta.env.MODE === "development") {
    console.log("[Analytics]", event);
  }

  // Send to Yandex Metrica
  if (window.ym && METRICA_ID) {
    try {
      // Format: ym(ID, 'reachGoal', 'eventName', properties)
      window.ym(METRICA_ID, 'reachGoal', eventName, properties);
    } catch (e) {
      console.error("Failed to send event to Yandex Metrica:", e);
    }
  }

  // Send to backend API (when ready)
  // fetch('/api/events', { method: 'POST', body: JSON.stringify(event) });

  // Store in sessionStorage for debugging
  try {
    const events = JSON.parse(sessionStorage.getItem("analytics_events") || "[]");
    events.push(event);
    sessionStorage.setItem("analytics_events", JSON.stringify(events));
  } catch (e) {
    console.error("Failed to store event:", e);
  }
}

/**
 * Get all tracked events from current session
 */
export function getSessionEvents() {
  try {
    return JSON.parse(sessionStorage.getItem("analytics_events") || "[]");
  } catch {
    return [];
  }
}

/**
 * Clear session events
 */
export function clearSessionEvents() {
  sessionStorage.removeItem("analytics_events");
}
