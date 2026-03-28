// Dynamic task loader for backend
// Generates all 40 tasks with proper structure

function generateBaseTasks() {
  // Tasks 1-7 with full structure (these would be imported or hardcoded)
  const baseTasks = [
    // Task 1-7 would go here (or be imported)
    // For now, we'll focus on the dynamic generation for tasks 10-40
  ];
  
  return baseTasks;
}

function generatePlaceholderTasks(startId = 9, endId = 40) {
  const tasks = [];
  
  for (let i = startId; i <= endId; i++) {
    tasks.push({
      id: i,
      trick: {
        name: `Задача ${i}`,
        animal: "🐉",
        animalName: "Помощник",
        motto: "Много способов — выбери самый красивый",
        color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
        difficulty: Math.ceil(i / 14),
        building: "🏛️",
        buildingName: `Задача ${i}`
      },
      puzzle: {
        emoji: "❓",
        question: `Найди решение для задачи ${i}`,
        hookSenior: `Задача ${i}: что здесь противоречит?`,
        hookJunior: `Задача ${i}: попробуй найти способ`,
        witnesses: [],
        dialog: [],
        answer: `Ответ к задаче ${i}`,
        bonusFact: `Интересный факт о задаче ${i}`
      },
      contradiction: {
        intro: `Задача ${i}: противоречие`,
        fact1: `Требование 1 для задачи ${i}`,
        fact2: `Требование 2 для задачи ${i}`,
        buddyQuestion: "Какое решение кажется тебе лучше всего?",
        options: Array.from({ length: 10 }, (_, j) => {
          const temps = ["cold", "warm", "bingo"];
          const temp = temps[j % 3];
          const hasAdvantage = j % 3 !== 0;
          
          return {
            text: `Способ ${j+1} для задачи ${i}`,
            icon: j < 10 ? `${j+1}️⃣` : "🔟",
            temp,
            class_id: `t${i}_s${j+1}`,
            principles: [(j % 40) + 1],
            elegance: j % 3 === 0 ? "⭐" : (j % 3 === 1 ? "⭐⭐" : "⭐⭐⭐"),
            ...(hasAdvantage 
              ? { advantage: "✨ Хорошее решение!" }
              : { problem: "⚠️ Есть минусы" }
            )
          };
        }),
        realSolution: `Все способы решения задачи ${i} могут быть валидными. Выбери тот, что подходит лучше всего в твоей ситуации.`
      }
    });
  }
  
  return tasks;
}

module.exports = {
  generateBaseTasks,
  generatePlaceholderTasks,
  getAllTasks: function(baseTasks = []) {
    // Combine base tasks (1-8) with generated placeholders (9-40)
    const allTasks = [
      ...baseTasks,
      ...generatePlaceholderTasks(Math.max(9, baseTasks.length + 1), 40)
    ];
    return allTasks;
  }
};
