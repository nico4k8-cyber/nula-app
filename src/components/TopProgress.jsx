export default function TopProgress({ completedTasks, current, TASKS }) {
  return (
    <div className="flex justify-center gap-2 py-3 px-4 overflow-x-auto no-scrollbar">
      {TASKS.map((t, i) => {
        const done = completedTasks.includes(t.id);
        const active = current === i;
        const emoji = t.puzzle?.emoji || (t.icon || "🔹");
        return (
          <div key={t.id}
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
