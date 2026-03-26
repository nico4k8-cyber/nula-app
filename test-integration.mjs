#!/usr/bin/env node
/**
 * Integration test: simulate full TRIZ flow through the app
 * Makes HTTP requests like the browser would
 */

import { createNewState, TASKS } from "./src/bot/engine.js";

async function testFlow() {
  console.log("🌐 Integration Test: TRIZ Flow via API\n");

  const baseUrl = "http://localhost:4173";
  const taskId = "solomon-hall";

  // Step 1: Get the task from tasks.js (simulating app load)
  console.log("Step 1: Load task");
  console.log(`  taskId: ${taskId}`);

  const task = TASKS.find(t => t.id === taskId);
  if (!task) {
    console.error("❌ Task not found");
    return;
  }

  console.log(`  ✅ Task loaded: "${task.title}"`);
  console.log(`     Icon: ${task.icon}, Difficulty: ${task.difficulty}`);
  console.log(`     isTriz: core_problem=${!!task.core_problem}, ikr=${!!task.ikr}, resources=${!!task.resources}`);

  if (!task.core_problem || !task.ikr || !task.resources) {
    console.error("❌ Task missing TRIZ fields!");
    return;
  }

  console.log(`     Resources: ${task.resources.map(r => r.id).join(", ")}\n`);

  // Step 2: Initialize TRIZ state (app does this when task is selected)
  console.log("Step 2: Initialize TRIZ state");
  const initialState = createNewState(taskId);
  console.log(`  ✅ Initial state created`);
  console.log(`     phase: ${initialState.phase}`);
  console.log(`     currentIdea: ${initialState.currentIdea}`);
  console.log(`     resources: ${initialState.resources?.length ?? 0} items\n`);

  // Step 3: Send Phase 0 message (propose idea)
  console.log("Step 3: User proposes idea (Phase 0)");
  const userMessage1 = "давай пойдём осторожно";
  console.log(`  👦 User: "${userMessage1}"`);

  try {
    const res = await fetch(`${baseUrl}/api/engine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage: userMessage1,
        task: task,
        state: initialState,
        history: []
      })
    });

    if (!res.ok) {
      console.error(`❌ API error: ${res.status} ${res.statusText}`);
      const errBody = await res.text();
      console.error(`   Response: ${errBody.substring(0, 200)}`);
      return;
    }

    const result1 = await res.json();
    console.log(`  🐉 Bot: "${result1.reply}"`);
    console.log(`     newPhase: ${result1.newState?.phase}`);
    console.log(`     subPhase: ${result1.newState?.subPhase}\n`);

    if (result1.newState?.phase !== 1) {
      console.error("❌ Expected phase 1 after idea proposal");
      return;
    }

    const state2 = result1.newState;

    // Step 4: Phase 1a - Answer "что хорошего?"
    console.log("Step 4: Phase 1a - What's good?");
    const userMessage2 = "ты не упадёшь если быть внимательнее";
    console.log(`  👦 User: "${userMessage2}"`);

    const res2 = await fetch(`${baseUrl}/api/engine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage: userMessage2,
        task: task,
        state: state2,
        history: [
          { role: "user", text: userMessage1 },
          { role: "bot", text: result1.reply }
        ]
      })
    });

    if (!res2.ok) {
      console.error(`❌ API error: ${res2.status}`);
      return;
    }

    const result2 = await res2.json();
    console.log(`  🐉 Bot: "${result2.reply.substring(0, 100)}..."`);
    console.log(`     newPhase: ${result2.newState?.phase}`);
    console.log(`     subPhase: ${result2.newState?.subPhase}\n`);

    console.log("✅ Integration test passed!");
    console.log(`   Phase progression: 0 → 1 → ${result2.newState?.phase}`);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.message.includes("Cannot GET")) {
      console.error("   (API endpoint may not be available in preview mode)");
    }
  }
}

testFlow();
