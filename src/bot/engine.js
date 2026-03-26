import { isSafe } from "./safety.js";
import TASKS_DATA from "./tasks.js";
import { generateUgolokResponse } from "./ai.js";

export const TASKS = TASKS_DATA.default || TASKS_DATA;

export const normalize = (s) => {
  let n = s.toLowerCase().replace(/ё/g, "е").trim().replace(/\s+/g, " ");
  return n.slice(0, 500);
};

export const PICK = (a) => a[Math.floor(Math.random() * a.length)];

/**
 * New state structure for 7-phase engine
 * Replaces old guessing model with open-ended idea analysis
 */
export function createNewState(taskId) {
  return {
    phase: 0, // 0-7
    subPhase: null, // 'ask_good' | 'ask_bad' for phase 1

    currentIdea: null, // { text, normalized }
    goodPoints: [], // collected "what's good"
    badPoints: [], // collected "what's bad"
    contradiction: null, // { need, but }

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
    version: 2,
  };
}

/**
 * Phase 0: Child proposes ANY idea
 */
async function handleProposeIdea(txt, task, state, history, onError) {
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
    await generateUgolokResponse(txt, history, task, onError, state.phase);

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
async function handleGoodBadAnalysis(txt, task, state, history, onError) {
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

    const { text: aiReply, model } = await generateUgolokResponse(
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
  const { text: aiReply, model } = await generateUgolokResponse(
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
 * Phase 2: Formulate contradiction
 */
async function handleContradiction(txt, task, state, history, onError) {
  const newState = {
    ...state,
    phase: 2,
    contradiction: {
      need: task.core_problem?.need || "найти решение",
      but: task.core_problem?.obstacle || "есть препятствие",
    },
  };

  const { text: aiReply, model } = await generateUgolokResponse(
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
 * Phase 3: Show resources
 */
async function handleResources(txt, task, state, history, onError) {
  const resourceIds = task.resources?.map((r) => r.id) || [];
  const resourceQueue = resourceIds.slice(0, 3); // Pick first 3 for testing

  const newState = {
    ...state,
    phase: 3,
    resourceQueue,
    currentResource: resourceQueue[0] || null,
  };

  const { text: aiReply, model } = await generateUgolokResponse(
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
 * Phase 4: Test each resource — can you use it?
 */
async function handleTestResources(txt, task, state, history, onError) {
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

    const { text: aiReply, model } = await generateUgolokResponse(
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

    const { text: aiReply, model } = await generateUgolokResponse(
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
async function handleIKR(txt, task, state, history, onError) {
  const newState = {
    ...state,
    phase: 6,
  };

  const { text: aiReply, model } = await generateUgolokResponse(
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
async function handleImprove(txt, task, state, history, onError) {
  const newState = {
    ...state,
    phase: 7,
  };

  const { text: aiReply, model, stars } = await generateUgolokResponse(
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
async function handleCycleOrEnd(txt, task, state, history, onError) {
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

    const { text: aiReply, model } = await generateUgolokResponse(
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
    const { text: aiReply, model } = await generateUgolokResponse(
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
 * Main dispatcher — routes to appropriate phase handler
 */
export async function processUserMessage(
  txt,
  task,
  state,
  history = [],
  onError = null
) {
  // Safety check
  if (!isSafe(txt)) {
    return {
      reply: "🐉 Ой! Это звучит как-то не очень по-доброму. Давай лучше искать решение, которое всем поможет!",
      newState: state,
      resultType: "harmful",
    };
  }

  // Ensure state is initialized
  if (!state || state.version !== 2) {
    state = createNewState(task?.id);
  }

  let result;

  try {
    switch (state.phase) {
      case 0:
        result = await handleProposeIdea(txt, task, state, history, onError);
        break;
      case 1:
        result = await handleGoodBadAnalysis(
          txt,
          task,
          state,
          history,
          onError
        );
        break;
      case 2:
        result = await handleContradiction(txt, task, state, history, onError);
        break;
      case 3:
        result = await handleResources(txt, task, state, history, onError);
        break;
      case 4:
        result = await handleTestResources(txt, task, state, history, onError);
        break;
      case 5:
        result = await handleIKR(txt, task, state, history, onError);
        break;
      case 6:
        result = await handleImprove(txt, task, state, history, onError);
        break;
      case 7:
        result = await handleCycleOrEnd(txt, task, state, history, onError);
        break;
      default:
        result = {
          reply: "Что-то пошло не так. Давай начнём заново!",
          newState: createNewState(task?.id),
          stars: 0,
        };
    }
  } catch (err) {
    console.error(`Engine error (phase ${state.phase}):`, err);
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
