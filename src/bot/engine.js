/**
 * ПРИЗ Engine V3 — Adaptive TRIZ Problem-Solving System
 *
 * Supports 3 age-adaptive versions of ПРИЗ methodology:
 *
 * 1. ПРИЗ-базовый (ages 6-8): 3 phases
 *    П (Prepare): Propose idea
 *    Р (Research): Good/Bad analysis
 *    И (Ideas) + З (Validate): Resources → finish
 *    ✨ (Insight): Implicit
 *
 * 2. ПРИЗ-стандарт (ages 8-13): 5 steps across 7 phases (current v2)
 *    П: Propose idea
 *    Р: Good/Bad + Contradiction
 *    И: Resources (show + test)
 *    З: IKR + Improve
 *    ✨: Cycle or end
 *
 * 3. ПРИЗ-про (ages 13+): 7 phases with contradiction analysis
 *    Same as стандарт, but phase 2 detects:
 *    - Technical contradictions (need X but obstacle Y)
 *    - Physical contradictions (param should be X but also Y)
 *    Used to guide solution principles selection
 *
 * Version: 3 (adaptive ПРИЗ + contradiction analysis)
 * Backward-compatible with v2 state files
 */

import { isSafe } from "./safety.js";
import TASKS_DATA from "../tasks.js";
import { generateUgolokResponse } from "./ai.js";

export const TASKS = TASKS_DATA.default || TASKS_DATA;

export const normalize = (s) => {
  let n = s.toLowerCase().replace(/ё/g, "е").trim().replace(/\s+/g, " ");
  return n.slice(0, 500);
};

export const PICK = (a) => a[Math.floor(Math.random() * a.length)];

/**
 * Determine ПРИЗ version based on age group
 * @param {number} age - Child's age
 * @returns {'base'|'standard'|'pro'} ПРИЗ version
 */
export function getPRIZVersion(age) {
  if (age < 8) return "base"; // ПРИЗ-базовый
  if (age < 13) return "standard"; // ПРИЗ-стандарт
  return "pro"; // ПРИЗ-про (с противоречиями)
}

/**
 * New state structure for adaptive ПРИЗ engine
 * Supports ПРИЗ-базовый (3 steps), ПРИЗ-стандарт (5 steps), ПРИЗ-про (7 steps + contradictions)
 */
export function createNewState(taskId, age = 10) {
  const prizVersion = getPRIZVersion(age);

  return {
    phase: 0, // phase numbering depends on ПРИЗ version
    subPhase: null, // 'ask_good' | 'ask_bad' for phase 1

    currentIdea: null, // { text, normalized }
    goodPoints: [], // collected "what's good"
    badPoints: [], // collected "what's bad"
    contradiction: null, // { need, but, type: 'technical'|'physical'|'admin' } — added for ПРИЗ-про
    physicalContradiction: null, // { param, shouldBe, butMust } — for ПРИЗ-3

    resourceQueue: [], // resources to check
    currentResource: null,
    resourceIdeas: {}, // { "стол": "перевернуть и ехать", ... }

    ideas: [], // all analyzed ideas in session
    cycleCount: 0,

    goodAttempts: 0,
    badAttempts: 0,
    streak: 0, // unrecognized messages in a row
    messageCount: 0,

    taskId,
    version: 3, // V3 supports adaptive ПРИЗ
    age,
    prizVersion, // 'base'|'standard'|'pro'
  };
}

/**
 * Phase 0: Child proposes ANY idea
 */
async function handleProposeIdea(txt, task, state, history, onError, generateResponse) {
  const normalized = normalize(txt);

  // Reject traps
  if (task.traps) {
    const trapMatch = task.traps.markers.some((m) =>
      normalized.includes(normalize(m))
    );
    if (trapMatch) {
      return {
        reply: task.traps.reaction,
        newState: state,
        stars: 0,
        prizStep: 0,
      };
    }
  }

  // Move to Phase 1
  const newState = {
    ...state,
    phase: 1,
    subPhase: "ask_good",
    currentIdea: { text: txt, normalized },
    goodAttempts: 0,
    badAttempts: 0,
  };

  const { text: aiReply, tokensUsed, inputTokens, outputTokens, model } =
    await generateResponse(txt, history, task, onError, state.phase);

  return {
    reply: aiReply,
    tokensUsed,
    inputTokens,
    outputTokens,
    model,
    newState,
    stars: 0,
    prizStep: 1, // moving to Р (exploration)
  };
}

/**
 * Phase 1: Good/Bad analysis (split into 1a and 1b)
 */
async function handleGoodBadAnalysis(txt, task, state, history, onError, generateResponse) {
  const subPhase = state.subPhase || "ask_good";

  // Track attempts
  const isGood = subPhase === "ask_good";
  const attemptCount = isGood ? state.goodAttempts : state.badAttempts;

  if (attemptCount >= 3) {
    // 3 strikes — move to next subphase
    const newState = {
      ...state,
      subPhase: isGood ? "ask_bad" : "ready_for_contradiction",
    };

    const { text: aiReply, model } = await generateResponse(
      txt,
      history,
      task,
      onError,
      state.phase
    );

    return {
      reply: aiReply,
      model,
      newState,
      stars: 0,
      prizStep: 1,
    };
  }

  // Increment attempts
  const newState = {
    ...state,
    [isGood ? "goodAttempts" : "badAttempts"]:
      (isGood ? state.goodAttempts : state.badAttempts) + 1,
  };

  // AI evaluates if answer is relevant
  const { text: aiReply, model } = await generateResponse(
    txt,
    history,
    task,
    onError,
    state.phase
  );

  // If child moved to next subphase naturally
  if (txt.toLowerCase().includes("дальше") || txt.toLowerCase().includes("ok")) {
    newState.subPhase = isGood ? "ask_bad" : "ready_for_contradiction";
  }

  return {
    reply: aiReply,
    model,
    newState,
    stars: 0,
    prizStep: 1,
  };
}

/**
 * Phase 2: Formulate contradiction (ПРИЗ-стандарт/про) OR test resources (ПРИЗ-базовый)
 * For ПРИЗ-базовый: Show resources and collect answers
 * For ПРИЗ-стандарт: Formulate contradiction
 * For ПРИЗ-про: Formulate contradiction + detect type (technical/physical)
 */
async function handleContradiction(txt, task, state, history, onError, generateResponse) {
  // ПРИЗ-базовый at phase 2: This is resources phase
  if (state.prizVersion === "base") {
    const resourceIds = task.resources?.map((r) => r.id) || [];
    const resourceQueue = resourceIds.slice(0, 2);
    const currentResource = state.currentResource || resourceQueue[0];

    // If no resources yet, show them
    if (!state.currentResource) {
      const newState = {
        ...state,
        phase: 2,
        resourceQueue,
        currentResource,
      };

      const { text: aiReply, model } = await generateResponse(
        txt,
        history,
        task,
        onError,
        2
      );

      return {
        reply: aiReply,
        model,
        newState,
        stars: 0,
        prizStep: 2,
      };
    }

    // Test current resource
    const remaining = resourceQueue.filter((r) => r !== currentResource);
    if (remaining.length > 0) {
      // More resources to test
      const newState = {
        ...state,
        phase: 2,
        currentResource: remaining[0],
        resourceIdeas: {
          ...state.resourceIdeas,
          [currentResource]: txt,
        },
      };

      const { text: aiReply, model } = await generateResponse(
        txt,
        history,
        task,
        onError,
        2
      );

      return {
        reply: aiReply,
        model,
        newState,
        stars: 0,
        prizStep: 2,
      };
    } else {
      // All resources tested, finish
      const newState = {
        ...state,
        phase: 3, // Move to cycle_or_end
        resourceIdeas: {
          ...state.resourceIdeas,
          [currentResource]: txt,
        },
      };

      const { text: aiReply, model } = await generateResponse(
        txt,
        history,
        task,
        onError,
        2
      );

      return {
        reply: aiReply,
        model,
        newState,
        stars: 2, // базовый gets 2 stars by default
        prizStep: 2,
      };
    }
  }

  // ПРИЗ-стандарт/про: Normal contradiction handling
  const newState = {
    ...state,
    phase: 2,
    contradiction: {
      need: task.core_problem?.need || "найти решение",
      but: task.core_problem?.obstacle || "есть препятствие",
      type: "technical", // technical|physical|admin — for ПРИЗ-про
    },
  };

  // ПРИЗ-про (13+): Add contradiction type detection
  if (state.prizVersion === "pro") {
    // Detect if it's a physical contradiction (param should be X but also Y)
    const hasPhysical = txt.toLowerCase().includes("одновременно") ||
                        txt.toLowerCase().includes("и") ||
                        txt.toLowerCase().includes("противор");

    if (hasPhysical) {
      newState.contradiction.type = "physical";
      newState.physicalContradiction = {
        param: task.core_problem?.param || "параметр",
        shouldBe: "одна величина",
        butMust: "другая величина",
      };
    }
  }

  const { text: aiReply, model } = await generateResponse(
    txt,
    history,
    task,
    onError,
    state.phase
  );

  return {
    reply: aiReply,
    model,
    newState,
    stars: 0,
    prizStep: 2, // И (ideas)
  };
}

/**
 * Phase 3: Show resources (ПРИЗ-стандарт/про only)
 * ПРИЗ-базовый handles resources inline in handleContradiction
 */
async function handleResources(txt, task, state, history, onError, generateResponse) {
  const resourceIds = task.resources?.map((r) => r.id) || [];
  const resourceQueue = resourceIds.slice(0, 3); // стандарт/про have 3 resources

  const newState = {
    ...state,
    phase: 3,
    resourceQueue,
    currentResource: resourceQueue[0] || null,
  };

  const { text: aiReply, model } = await generateResponse(
    txt,
    history,
    task,
    onError,
    state.phase
  );

  return {
    reply: aiReply,
    model,
    newState,
    stars: 0,
    prizStep: 2,
  };
}

/**
 * Phase 4: Test each resource — can you use it? (ПРИЗ-стандарт/про only)
 * ПРИЗ-базовый handles resource testing inline in handleContradiction
 */
async function handleTestResources(txt, task, state, history, onError, generateResponse) {
  const currentResource = state.currentResource;
  const resourceQueue = state.resourceQueue || [];
  const remaining = resourceQueue.filter((r) => r !== currentResource);

  if (remaining.length > 0) {
    // Next resource
    const newState = {
      ...state,
      phase: 4,
      currentResource: remaining[0],
      resourceIdeas: {
        ...state.resourceIdeas,
        [currentResource]: txt,
      },
    };

    const { text: aiReply, model } = await generateResponse(
      txt,
      history,
      task,
      onError,
      state.phase
    );

    return {
      reply: aiReply,
      model,
      newState,
      stars: 0,
      prizStep: 2,
    };
  } else {
    // Move to Phase 5: IKR
    const newState = {
      ...state,
      phase: 5,
      resourceIdeas: {
        ...state.resourceIdeas,
        [currentResource]: txt,
      },
    };

    const { text: aiReply, model } = await generateResponse(
      txt,
      history,
      task,
      onError,
      state.phase
    );

    return {
      reply: aiReply,
      model,
      newState,
      stars: 0,
      prizStep: 3, // З (validation)
    };
  }
}

/**
 * Phase 5: Show ideal final result (IKR)
 */
async function handleIKR(txt, task, state, history, onError, generateResponse) {
  const newState = {
    ...state,
    phase: 6,
  };

  const { text: aiReply, model } = await generateResponse(
    txt,
    history,
    task,
    onError,
    state.phase
  );

  return {
    reply: aiReply,
    model,
    newState,
    stars: 0,
    prizStep: 3,
  };
}

/**
 * Phase 6: Improve the idea
 */
async function handleImprove(txt, task, state, history, onError, generateResponse) {
  const newState = {
    ...state,
    phase: 7,
  };

  const { text: aiReply, model, stars } = await generateResponse(
    txt,
    history,
    task,
    onError,
    state.phase
  );

  return {
    reply: aiReply,
    model,
    newState,
    stars: stars || 2,
    prizStep: 4, // ✨ (insight)
  };
}

/**
 * Phase 7: Try another idea or finish
 */
async function handleCycleOrEnd(txt, task, state, history, onError, generateResponse) {
  const normalized = normalize(txt);
  const wantMore = [
    "да",
    "ещё",
    "еще",
    "давай",
    "хочу",
    "попробую",
    "новую",
  ].some((w) => normalized.includes(w));
  const wantStop = [
    "нет",
    "хватит",
    "хватит",
    "стоп",
    "всё",
    "все",
    "конец",
  ].some((w) => normalized.includes(w));

  if (wantMore) {
    // New cycle
    const newState = {
      ...state,
      phase: 0,
      cycleCount: state.cycleCount + 1,
      ideas: [
        ...state.ideas,
        {
          idea: state.currentIdea?.text,
          goodPoints: state.goodPoints,
          badPoints: state.badPoints,
          resources: state.resourceIdeas,
        },
      ],
      currentIdea: null,
      goodPoints: [],
      badPoints: [],
      contradiction: null,
      resourceQueue: [],
      currentResource: null,
      resourceIdeas: {},
    };

    const { text: aiReply, model } = await generateResponse(
      txt,
      history,
      task,
      onError,
      0 // back to phase 0
    );

    return {
      reply: aiReply,
      model,
      newState,
      stars: 0,
      prizStep: 0,
    };
  } else {
    // Session complete
    const { text: aiReply, model } = await generateResponse(
      txt,
      history,
      task,
      onError,
      4
    );

    return {
      reply: aiReply,
      model,
      newState: state,
      stars: 3,
      prizStep: 4,
      resultType: "session_complete",
    };
  }
}

/**
 * Router function for adaptive ПРИЗ phases
 * Maps phase numbers to handlers based on ПРИЗ version
 */
function mapPhaseToHandler(state) {
  const { phase, prizVersion } = state;

  // ПРИЗ-базовый (4-phase): 0 → 1 → 2 (contradiction skipped, goes to resources) → 3 (cycle/end)
  if (prizVersion === "base") {
    if (phase === 0) return "propose";
    if (phase === 1) return "good_bad";
    if (phase === 2) return "contradiction"; // This will skip contradiction and show resources instead
    if (phase === 3) return "cycle_or_end"; // Finish
    return "cycle_or_end";
  }

  // ПРИЗ-стандарт & ПРИЗ-про (7-phase): 0→1→2→3→4→5→6→7
  if (phase === 0) return "propose";
  if (phase === 1) return "good_bad";
  if (phase === 2) return "contradiction";
  if (phase === 3) return "resources";
  if (phase === 4) return "test_resources";
  if (phase === 5) return "ikr";
  if (phase === 6) return "improve";
  if (phase === 7) return "cycle_or_end";

  return "cycle_or_end";
}

/**
 * Main dispatcher — routes to appropriate phase handler based on ПРИЗ version
 *
 * @param {string} txt - User's message
 * @param {object} task - Task definition (from tasks.json)
 * @param {object} state - Current session state
 * @param {array} history - Conversation history
 * @param {function} onError - Error callback
 * @param {number} age - User's age (determines ПРИЗ version: <8→base, 8-13→standard, 13+→pro)
 * @returns {object} Result with reply, newState, stars, and metadata
 */
export async function processUserMessage(
  txt,
  task,
  state,
  history = [],
  onError = null,
  age = 10,
  aiFunction = null
) {
  // Use provided AI function or global one
  const generateResponse = aiFunction || generateUgolokResponse;
  // Safety check
  if (!isSafe(txt)) {
    return {
      reply: "🐉 Ой! Это звучит как-то не очень по-доброму. Давай лучше искать решение, которое всем поможет!",
      newState: state,
      resultType: "harmful",
    };
  }

  // Ensure state is initialized
  if (!state || (state.version && state.version < 3)) {
    state = createNewState(task?.id, age);
  }

  // Verify/update age-based version
  if (age && (!state.age || state.age !== age)) {
    state = { ...state, age, prizVersion: getPRIZVersion(age) };
  }

  let result;

  try {
    const handler = mapPhaseToHandler(state);

    switch (handler) {
      case "propose":
        result = await handleProposeIdea(txt, task, state, history, onError, generateResponse);
        break;
      case "good_bad":
        result = await handleGoodBadAnalysis(
          txt,
          task,
          state,
          history,
          onError,
          generateResponse
        );
        break;
      case "contradiction":
        result = await handleContradiction(txt, task, state, history, onError, generateResponse);
        break;
      case "resources":
        result = await handleResources(txt, task, state, history, onError, generateResponse);
        break;
      case "test_resources":
        result = await handleTestResources(txt, task, state, history, onError, generateResponse);
        break;
      case "ikr":
        result = await handleIKR(txt, task, state, history, onError, generateResponse);
        break;
      case "improve":
        result = await handleImprove(txt, task, state, history, onError, generateResponse);
        break;
      case "cycle_or_end":
        result = await handleCycleOrEnd(txt, task, state, history, onError, generateResponse);
        break;
      default:
        result = {
          reply: "Что-то пошло не так. Давай начнём заново!",
          newState: createNewState(task?.id, age),
          stars: 0,
        };
    }
  } catch (err) {
    console.error(`Engine error (phase ${state.phase}, version ${state.prizVersion}):`, err);
    if (onError) onError(err);
    result = {
      reply: "Ошибка в обработке. Попробуем ещё раз?",
      newState: state,
      stars: 0,
    };
  }

  // Ensure result has required fields
  return {
    tokensUsed: result.tokensUsed || 0,
    inputTokens: result.inputTokens || 0,
    outputTokens: result.outputTokens || 0,
    model: result.model || "claude-haiku",
    ...result,
  };
}
