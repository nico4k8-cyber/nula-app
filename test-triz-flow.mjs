#!/usr/bin/env node
/**
 * Test TRIZ 7-phase engine flow
 * Simulates user interactions without browser
 */

import { processUserMessage, createNewState, TASKS } from "./src/bot/engine.js";

async function test() {
  console.log("🧪 Testing TRIZ 7-Phase Engine\n");

  // Get solomon-hall task
  const taskId = "solomon-hall";
  const task = TASKS.find(t => t.id === taskId);

  if (!task) {
    console.error(`❌ Task "${taskId}" not found in TASKS`);
    console.log("Available tasks:", TASKS.map(t => t.id));
    process.exit(1);
  }

  console.log(`✅ Found task: ${task.title}`);
  console.log(`   Core problem: ${task.core_problem?.need}\n`);

  // Initialize state
  let state = createNewState(taskId);
  console.log(`📍 Phase 0 (Propose Idea): state.phase = ${state.phase}`);
  console.log(`   subPhase = ${state.subPhase}\n`);

  // Phase 0: Propose idea
  console.log("👦 User: давай попробуем идти осторожно");
  let result = await processUserMessage(
    "давай попробуем идти осторожно",
    task,
    state,
    []
  );
  console.log(`🐉 Bot: ${result.reply || "(no reply)"}`);
  console.log(`   newPhase = ${result.newState?.phase}`);
  console.log(`   subPhase = ${result.newState?.subPhase}\n`);
  state = result.newState;

  // Phase 1a: Ask good
  if (state.phase === 1 && state.subPhase === "ask_good") {
    console.log(`📍 Phase 1a (Ask Good): phase = ${state.phase}, subPhase = "${state.subPhase}"`);
    console.log("👦 User: ну, так ты не упадёшь если быть аккуратнее");
    result = await processUserMessage(
      "ну, так ты не упадёшь если быть аккуратнее",
      task,
      state,
      [{ role: "user", text: "давай попробуем идти осторожно" }]
    );
    console.log(`🐉 Bot: ${result.reply || "(no reply)"}`);
    console.log(`   newPhase = ${result.newState?.phase}`);
    console.log(`   subPhase = ${result.newState?.subPhase}\n`);
    state = result.newState;
  }

  // Phase 1b: Ask bad
  if (state.phase === 1 && state.subPhase === "ask_bad") {
    console.log(`📍 Phase 1b (Ask Bad): phase = ${state.phase}, subPhase = "${state.subPhase}"`);
    console.log("👦 User: да но масло очень скользкое, можно упасть");
    result = await processUserMessage(
      "да но масло очень скользкое, можно упасть",
      task,
      state,
      [
        { role: "user", text: "давай попробуем идти осторожно" },
        { role: "bot", text: "что-то хорошее в этой идее?" }
      ]
    );
    console.log(`🐉 Bot: ${result.reply || "(no reply)"}`);
    console.log(`   newPhase = ${result.newState?.phase}`);
    console.log(`   subPhase = ${result.newState?.subPhase}\n`);
    state = result.newState;
  }

  // Phase 2: Contradiction
  if (state.phase === 2) {
    console.log(`📍 Phase 2 (Contradiction): phase = ${state.phase}`);
    console.log(`   Contradiction: ${state.contradiction?.need} => ${state.contradiction?.but}\n`);
  }

  // Phase 3: Resources
  if (state.phase === 3) {
    console.log(`📍 Phase 3 (Resources): phase = ${state.phase}`);
    console.log(`   Available resources: ${task.resources?.map(r => r.id).join(", ")}\n`);
    console.log("👦 User: окей, вижу");
    result = await processUserMessage(
      "окей, вижу",
      task,
      state,
      []
    );
    console.log(`🐉 Bot: ${result.reply || "(no reply)"}`);
    console.log(`   newPhase = ${result.newState?.phase}\n`);
    state = result.newState;
  }

  // Phase 4: Test resources
  if (state.phase === 4) {
    console.log(`📍 Phase 4 (Test Resources): phase = ${state.phase}`);
    console.log(`   currentResource = ${state.currentResource}`);
    console.log("👦 User: ковры можно положить и идти по ним");
    result = await processUserMessage(
      "ковры можно положить и идти по ним",
      task,
      state,
      []
    );
    console.log(`🐉 Bot: ${result.reply || "(no reply)"}`);
    console.log(`   newPhase = ${result.newState?.phase}\n`);
    state = result.newState;
  }

  console.log("✅ Test completed successfully!");
}

test().catch(err => {
  console.error("❌ Test failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
