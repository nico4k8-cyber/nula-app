import React from "react";
import TopProgress from "./TopProgress";

export default function TwistView({
  task,
  completedTasks,
  taskIdx,
  TASKS,
  twistChoice,
  setTwistChoice,
  onNext,
  t,
  lang
}) {
  return (
    <div className="flex flex-col flex-1 px-6 pb-12 animate-fade-in-up">
      <TopProgress completedTasks={completedTasks} current={taskIdx} TASKS={TASKS} t={t} />
      
      <div className="flex flex-col flex-1 justify-center gap-6 mt-6 max-w-[500px] mx-auto">
        <div className="text-center group">
          <div className="text-7xl mb-4 animate-float drop-shadow-2xl">{task.trick.animal}</div>
          <p className="text-[16px] text-slate-500 font-bold uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full inline-block border border-slate-100">
            {task.contradiction.intro}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-rose-50 border-2 border-rose-100 rounded-[22px] px-6 py-4 text-[15px] text-rose-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-3xl font-black">✗</div>
            <p className="font-medium text-lg leading-snug">{task.contradiction.fact1}</p>
          </div>
          <div className="bg-rose-50 border-2 border-rose-100 rounded-[22px] px-6 py-4 text-[15px] text-rose-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-3xl font-black">✗</div>
            <p className="font-medium text-lg leading-snug">{task.contradiction.fact2}</p>
          </div>
        </div>

        <div className="text-center py-2 px-4">
          <p className="text-[17px] text-slate-700 font-black uppercase tracking-tighter leading-tight bg-yellow-400 text-slate-900 px-6 py-3 rounded-2xl shadow-lg border-2 border-slate-900 -rotate-1 inline-block">
            {task.contradiction.buddyQuestion}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {task.contradiction.options.map((opt, i) => {
            const chosen = twistChoice === i;
            const revealed = twistChoice !== null;
            const isBingo = opt.temp === "bingo";
            return (
              <button key={i}
                onClick={() => { if (!revealed) setTwistChoice(i); }}
                disabled={revealed}
                className={`w-full py-4 px-6 rounded-[24px] border-4 text-left text-[15px] flex items-center gap-4 transition-all duration-300 shadow-sm
                  ${!revealed ? "border-slate-100 bg-white hover:border-orange-300 hover:shadow-orange-100 active:scale-[0.98]" :
                    isBingo ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-black scale-105 shadow-xl z-10" :
                    chosen  ? "border-slate-100 bg-slate-50 text-slate-400 opacity-60" :
                              "border-slate-50 bg-slate-100 text-slate-300 opacity-40"}`}
              >
                <span className="text-3xl filter saturate-[1.2]">{opt.icon}</span>
                <span className="flex-1 font-bold leading-tight">{opt.text}</span>
                {revealed && isBingo && (
                  <div className="bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg animate-bounce duration-500">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {twistChoice !== null && (
          <div className="bg-indigo-600 rounded-[28px] px-8 py-6 text-[16px] text-white shadow-2xl animate-fade-in-up border-4 border-indigo-400 font-medium leading-relaxed mt-4 relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
            <span className="block font-black text-xs uppercase tracking-widest text-indigo-200 mb-3 ml-1">✓ {t('twist.engineering_solution')}</span>
            {task.contradiction.realSolution}
          </div>
        )}

        {twistChoice !== null && (
          <button onClick={onNext}
            className="w-full py-5 rounded-[24px] font-black text-[18px] active:scale-[0.97] transition-all text-white shadow-xl hover:brightness-110 border-b-6 mt-4 uppercase tracking-tighter"
            style={{ backgroundColor: task.trick.color, borderBottomColor: 'rgba(0,0,0,0.2)' }}
          >
            {t('twist.accept_wisdom')}
          </button>
        )}
      </div>
    </div>
  );
}
