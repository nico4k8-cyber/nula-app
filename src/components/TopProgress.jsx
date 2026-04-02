export default function TopProgress({ completedTasks, current, TASKS, t }) {
  return (
    <div className="flex justify-center gap-2 py-3 px-4 overflow-x-auto no-scrollbar">
      {TASKS.map((taskItem, i) => {
        const done = completedTasks.includes(taskItem.id);
        const active = current === i;
        const emoji = taskItem.puzzle?.emoji || (taskItem.icon || "🔹");
        return (
          <div key={taskItem.id}
            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-bold transition-all border-2
              ${done ? "bg-green-500 border-green-600 text-white shadow-sm" : 
                active ? "bg-orange-500 border-orange-600 text-white shadow-md scale-110" : 
                "bg-white border-gray-100 text-gray-300"}`}
          >
            {done ? "✓" : active ? emoji : i + 1}
          </div>
        );
      })}
    </div>
  );
}
