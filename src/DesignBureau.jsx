import { useState, useRef, useEffect } from "react";

const ITEMS = [
  { id: "tire", name: "Старая автомобильная покрышка", emoji: "🛞" },
  { id: "umbrella", name: "Сломанный зонт (ткань целая, спицы погнуты)", emoji: "☂️" },
  { id: "bottle", name: "Пластиковая бутылка 2 литра", emoji: "🍾" },
  { id: "cd", name: "Поцарапанный CD-диск", emoji: "💿" },
  { id: "keyboard", name: "Сломанная клавиатура (кнопки нажимаются)", emoji: "⌨️" },
  { id: "paper-cup", name: "Использованный бумажный стаканчик", emoji: "🥤" },
  { id: "shoebox", name: "Картонная коробка из-под обуви", emoji: "📦" },
];

export default function DesignBureau({ onBack, totalStars, onAddStars, savedInventions, onSaveInvention }) {
  const [tab, setTab] = useState("invent"); // "invent" or "patents"
  const [activeItem, setActiveItem] = useState(null);
  
  const [input, setInput] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null); // { text, approved }
  const [justApproved, setJustApproved] = useState(false);
  
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!activeItem) pickRandomItem();
  }, [activeItem]);

  function pickRandomItem() {
    const random = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    setActiveItem(random);
    setFeedback(null);
    setInput("");
    setJustApproved(false);
  }

  async function handleEvaluate() {
    if (!input.trim() || isEvaluating) return;
    
    setIsEvaluating(true);
    setFeedback(null);
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "design-bureau",
          item: activeItem.name,
          userMessage: input,
        }),
      });
      const data = await res.json();
      
      setFeedback(data);
      if (data.approved) {
        setJustApproved(true);
        onAddStars(3); // 3 stars for a successful invention
        onSaveInvention({
          id: Date.now(),
          item: activeItem,
          idea: input,
          comment: data.text,
          date: new Date().toISOString(),
        });
      }
    } catch (err) {
      setFeedback({ text: "Главный Инженер ушел пить кофе. Попробуй позже!", approved: false });
    } finally {
      setIsEvaluating(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-slate-50 font-sans min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          >
            ←
          </button>
          <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
            <span>⚙️</span> КБ
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
          <span className="text-yellow-500 text-lg">⭐</span>
          <span className="font-bold text-yellow-700">{totalStars}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2 bg-white border-b border-gray-100 flex-shrink-0">
        <button 
          onClick={() => setTab("invent")}
          className={`flex-1 py-2 text-[14px] font-bold rounded-[12px] transition-all border-2 ${tab === 'invent' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-transparent text-gray-400 hover:bg-gray-50'}`}
        >
          Изобретать
        </button>
        <button 
          onClick={() => setTab("patents")}
          className={`flex-1 py-2 text-[14px] font-bold rounded-[12px] transition-all border-2 ${tab === 'patents' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-transparent text-gray-400 hover:bg-gray-50'}`}
        >
          Патенты ({savedInventions?.length || 0})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {tab === "invent" && activeItem && (
          <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
            <div className="bg-white rounded-[24px] p-6 border-2 border-indigo-100 shadow-sm text-center">
              <div className="text-6xl mb-4">{activeItem.emoji}</div>
              <p className="text-gray-500 text-[13px] font-bold uppercase tracking-wider mb-2">На складе завалялось:</p>
              <h3 className="text-[20px] font-bold text-gray-900 leading-tight">{activeItem.name}</h3>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
              <label className="block text-gray-700 font-bold mb-3">Придумай ему вторую жизнь!</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Как это использовать не по назначению?"
                className="w-full bg-gray-50 rounded-[16px] px-4 py-3 text-[15px] outline-none min-h-[100px] border border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                disabled={isEvaluating || justApproved}
              />
              
              {!justApproved ? (
                <button
                  onClick={handleEvaluate}
                  disabled={!input.trim() || isEvaluating}
                  className="w-full mt-4 py-4 rounded-[16px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-[16px] transition-all disabled:opacity-50 active:scale-95"
                >
                  {isEvaluating ? "Главный Инженер думает..." : "Отправить на проверку"}
                </button>
              ) : (
                <button
                  onClick={pickRandomItem}
                  className="w-full mt-4 py-4 rounded-[16px] bg-green-500 hover:bg-green-600 text-white font-bold text-[16px] transition-all active:scale-95"
                >
                  Следующий предмет →
                </button>
              )}
            </div>

            {feedback && (
              <div ref={bottomRef} className={`rounded-[20px] p-5 border-2 animate-fade-in flex gap-4 ${feedback.approved ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                <div className="text-4xl flex-shrink-0">
                  {feedback.approved ? "🏆" : "🤔"}
                </div>
                <div>
                  <h4 className={`font-bold text-[15px] mb-1 ${feedback.approved ? "text-green-800" : "text-orange-800"}`}>
                    {feedback.approved ? "Патент Одобрен! (+3 ⭐)" : "Надо доработать"}
                  </h4>
                  <p className="text-[14px] text-gray-700 leading-relaxed">
                    {feedback.text}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "patents" && (
          <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
            {(!savedInventions || savedInventions.length === 0) ? (
              <div className="text-center py-20 opacity-50">
                <div className="text-5xl grayscale mb-4">📜</div>
                <p className="font-medium text-gray-600">Здесь пока пусто. Придумай свое первое изобретение!</p>
              </div>
            ) : (
              savedInventions.map((inv) => (
                <div key={inv.id} className="bg-white rounded-[20px] p-5 border border-green-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-bl-[12px]">ПАТЕНТ</div>
                  <div className="flex gap-3 mb-3 mt-1">
                    <div className="text-3xl">{inv.item.emoji}</div>
                    <div>
                      <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{inv.item.name}</div>
                      <div className="font-bold text-gray-900 text-[15px] leading-tight mt-0.5">{inv.idea}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-[12px] px-3 py-2 text-[12px] text-gray-600 italic border border-gray-100">
                    "{inv.comment}"
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
