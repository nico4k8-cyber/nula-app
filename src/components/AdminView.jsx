import React, { useState, useEffect } from 'react';
import {
  loadTsarWords, saveTsarWord, deleteTsarWord,
  loadBredomakerItems, saveBredomakerItem, deleteBredomakerItem,
  getTokenStats, getPlayerAlerts,
} from '../lib/supabase';
import { TWENTY_Q_WORDS } from '../bot/twenty-q-words';
import { BREDO_ITEMS } from '../bot/bredo-items';

// ── Вкладка: Задачи ───────────────────────────────────────────────────────────
function TabTasks({ TASKS, onBack }) {
  const [editingTask, setEditingTask] = useState(null);
  const [localTasks, setLocalTasks] = useState(TASKS);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const max_size = 800;
          let width = img.width, height = img.height;
          if (width > height && width > max_size) { height *= max_size / width; width = max_size; }
          else if (height > max_size) { width *= max_size / height; height = max_size; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
          const filename = `task_${editingTask.id}_${Date.now()}.webp`;
          const response = await fetch('http://localhost:3001/api/save-image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, base64: webpDataUrl }),
          });
          if (response.ok) { const data = await response.json(); updateTask(editingTask.id, 'image_url', data.url); }
          else alert('❌ Ошибка сохранения картинки');
          setIsUploading(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch(err) { alert("Ошибка: " + err.message); setIsUploading(false); }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:3001/api/save-tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: localTasks }),
      });
      if (response.ok) alert("✅ Задачи сохранены в src/tasks.js!");
      else alert("❌ Ошибка. Запусти dev-api-server.mjs");
    } catch (e) { alert("❌ Нет соединения с dev-сервером: " + e.message); }
    finally { setIsSaving(false); }
  };

  const updateTask = (id, field, value) => {
    setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    if (editingTask?.id === id) setEditingTask(prev => ({ ...prev, [field]: value }));
  };

  const addNewTask = () => {
    const newId = Math.max(...localTasks.map(t => t.id), 0) + 1;
    const newTask = { id: newId, category: 'library', title: 'Новая задача', title_en: 'New Task', icon: '❓', teaser: '', teaser_en: '', difficulty: 1, core_problem: { need: '', obstacle: '' }, ikr: '', resources: [], puzzle: { question_ru: '', question_en: '', answer_ru: '', answer_en: '' }, image_url: '' };
    setLocalTasks([...localTasks, newTask]);
    setEditingTask(newTask);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Список */}
      <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-3">
        <button onClick={addNewTask} className="w-full py-3 rounded-xl bg-indigo-700 text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">+ Добавить задачу</button>
        {localTasks.map(task => (
          <button key={task.id} onClick={() => setEditingTask(task)}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${editingTask?.id === task.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900 border-transparent hover:border-slate-700'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{task.icon || '❓'}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-black truncate">{task.title}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black">{task.category} · ★{task.difficulty}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {/* Редактор */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-900/20">
        {editingTask ? (
          <div className="max-w-2xl mx-auto space-y-8 pb-32">
            <div className="flex justify-end gap-3">
              <button onClick={handleSaveAll} disabled={isSaving}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase ${isSaving ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-500'} transition-all`}>
                {isSaving ? 'Сохранение...' : '💾 Сохранить всё'}
              </button>
            </div>
            <section className="space-y-4">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">Основные поля</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">Категория</label>
                  <select value={editingTask.category} onChange={e => updateTask(editingTask.id, 'category', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none">
                    {['library','nature-reserve','city-hall','farm','workshop','laboratory'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">Сложность 1–3</label>
                  <input type="number" min="1" max="3" value={editingTask.difficulty || 1}
                    onChange={e => updateTask(editingTask.id, 'difficulty', parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none font-bold" />
                </div>
              </div>
              <input className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl outline-none font-bold text-lg"
                placeholder="Название (RU)" value={editingTask.title}
                onChange={e => updateTask(editingTask.id, 'title', e.target.value)} />
              <input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none"
                placeholder="Название (EN)" value={editingTask.title_en || ''}
                onChange={e => updateTask(editingTask.id, 'title_en', e.target.value)} />
            </section>
            <section className="space-y-3">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">Изображение</h3>
              {editingTask.image_url && (
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
                  <img src={editingTask.image_url} alt="Task" className="h-full object-cover" />
                  <button onClick={() => updateTask(editingTask.id, 'image_url', '')} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>
              )}
              <div className="flex gap-2">
                <input className="flex-1 bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none text-sm"
                  placeholder="URL картинки..." value={editingTask.image_url || ''}
                  onChange={e => updateTask(editingTask.id, 'image_url', e.target.value)} />
                <label className="bg-slate-700 hover:bg-slate-600 px-4 rounded-xl flex items-center cursor-pointer text-sm">
                  {isUploading ? '⏳' : '📁'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                </label>
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">ИКР</h3>
              <textarea className="w-full h-20 bg-slate-800 border border-slate-700 p-4 rounded-xl outline-none resize-none"
                value={editingTask.ikr || ''} onChange={e => updateTask(editingTask.id, 'ikr', e.target.value)} />
            </section>
            <section className="space-y-3">
              <h3 className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">Загадка</h3>
              <textarea className="w-full h-20 bg-slate-800 border border-slate-700 p-4 rounded-xl outline-none resize-none"
                placeholder="Вопрос (RU)" value={editingTask.puzzle?.question_ru || editingTask.puzzle?.question || ''}
                onChange={e => updateTask(editingTask.id, 'puzzle', { ...editingTask.puzzle, question_ru: e.target.value })} />
              <textarea className="w-full h-20 bg-teal-900/20 border border-teal-800/20 p-4 rounded-xl outline-none resize-none text-teal-200"
                placeholder="Ответ (RU)" value={editingTask.puzzle?.answer_ru || editingTask.puzzle?.answer || ''}
                onChange={e => updateTask(editingTask.id, 'puzzle', { ...editingTask.puzzle, answer_ru: e.target.value })} />
            </section>
            <button onClick={() => { if(confirm("Удалить задачу?")) { setLocalTasks(prev => prev.filter(t => t.id !== editingTask.id)); setEditingTask(null); }}}
              className="text-red-500 text-xs font-black uppercase tracking-widest hover:underline">
              🗑️ Удалить задачу #{editingTask.id}
            </button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-4">
            <div className="text-6xl grayscale opacity-20">⚙️</div>
            <p className="font-bold uppercase tracking-widest text-xs">Выбери задачу для редактирования</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Вкладка: Слова Царь-горы ──────────────────────────────────────────────────
function TabTsarWords() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const BLANK = { id: '', word: '', emoji: '❓', category: 'object', difficulty: 2, active: true };

  useEffect(() => {
    loadTsarWords().then(data => {
      setWords(data?.length ? data : TWENTY_Q_WORDS);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!editing.id.trim() || !editing.word.trim()) return alert('Заполни id и слово');
    setIsSaving(true);
    const ok = await saveTsarWord({ ...editing, active: true });
    if (ok !== false) {
      setWords(prev => {
        const idx = prev.findIndex(w => w.id === editing.id);
        return idx >= 0 ? prev.map(w => w.id === editing.id ? editing : w) : [...prev, editing];
      });
      setEditing(null);
    } else alert('❌ Ошибка Supabase (проверь переменные окружения)');
    setIsSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить слово?')) return;
    await deleteTsarWord(id);
    setWords(prev => prev.filter(w => w.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const CATEGORIES = ['animal', 'object', 'nature', 'phenomenon'];

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-2">
        <button onClick={() => setEditing({ ...BLANK })} className="w-full py-3 rounded-xl bg-violet-700 text-xs font-black uppercase tracking-widest hover:bg-violet-600 mb-2">+ Добавить слово</button>
        <p className="text-[10px] text-slate-500 uppercase font-black px-2">Всего: {words.length} слов</p>
        {loading && <p className="text-slate-500 text-xs text-center py-8">Загрузка...</p>}
        {words.map(w => (
          <button key={w.id} onClick={() => setEditing({ ...w })}
            className={`p-3 rounded-xl text-left border-2 transition-all flex items-center gap-3 ${editing?.id === w.id ? 'bg-violet-600/20 border-violet-500' : 'bg-slate-900 border-transparent hover:border-slate-700'}`}>
            <span className="text-xl">{w.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black truncate">{w.word}</p>
              <p className="text-[10px] text-slate-500">{w.category} · сл.{w.difficulty}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="flex-1 p-8 overflow-y-auto bg-slate-900/20">
        {editing ? (
          <div className="max-w-md space-y-5">
            <h3 className="text-violet-400 text-xs font-black uppercase tracking-widest">
              {editing.id && words.find(w => w.id === editing.id) ? 'Редактировать слово' : 'Новое слово'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">ID (латиница)</label>
                <input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none text-sm"
                  value={editing.id} onChange={e => setEditing(v => ({ ...v, id: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                  placeholder="cat, volcano..." />
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">Эмодзи</label>
                <input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none text-center text-2xl"
                  value={editing.emoji} onChange={e => setEditing(v => ({ ...v, emoji: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">Слово (РУ)</label>
              <input className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl outline-none font-bold text-lg"
                value={editing.word} onChange={e => setEditing(v => ({ ...v, word: e.target.value }))} placeholder="Кот" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">Категория</label>
                <select className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none"
                  value={editing.category} onChange={e => setEditing(v => ({ ...v, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">Сложность 1–4</label>
                <input type="number" min="1" max="4"
                  className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none font-bold"
                  value={editing.difficulty} onChange={e => setEditing(v => ({ ...v, difficulty: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 py-4 rounded-[20px] bg-violet-600 text-white font-black text-sm disabled:opacity-40 hover:bg-violet-500 transition-all">
                {isSaving ? 'Сохраняю...' : '💾 Сохранить'}
              </button>
              <button onClick={() => setEditing(null)} className="px-6 py-4 rounded-[20px] bg-slate-700 text-sm font-black hover:bg-slate-600">Отмена</button>
            </div>
            {words.find(w => w.id === editing.id) && (
              <button onClick={() => handleDelete(editing.id)} className="text-red-500 text-xs font-black uppercase tracking-widest hover:underline">
                🗑️ Удалить слово
              </button>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-3">
            <div className="text-5xl opacity-20">🏔️</div>
            <p className="text-xs font-black uppercase tracking-widest">Выбери или добавь слово</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Вкладка: Предметы Бредо ───────────────────────────────────────────────────
function TabBredomaker() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const BLANK = { id: '', name: '', emoji: '❓', hint: '', active: true };

  useEffect(() => {
    loadBredomakerItems().then(data => {
      setItems(data?.length ? data : BREDO_ITEMS);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!editing.id.trim() || !editing.name.trim()) return alert('Заполни id и название');
    setIsSaving(true);
    const ok = await saveBredomakerItem({ ...editing, active: true });
    if (ok !== false) {
      setItems(prev => {
        const idx = prev.findIndex(i => i.id === editing.id);
        return idx >= 0 ? prev.map(i => i.id === editing.id ? editing : i) : [...prev, editing];
      });
      setEditing(null);
    } else alert('❌ Ошибка Supabase');
    setIsSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить предмет?')) return;
    await deleteBredomakerItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-2">
        <button onClick={() => setEditing({ ...BLANK })} className="w-full py-3 rounded-xl bg-rose-700 text-xs font-black uppercase tracking-widest hover:bg-rose-600 mb-2">+ Добавить предмет</button>
        <p className="text-[10px] text-slate-500 uppercase font-black px-2">Всего: {items.length} предметов</p>
        {loading && <p className="text-slate-500 text-xs text-center py-8">Загрузка...</p>}
        {items.map(item => (
          <button key={item.id} onClick={() => setEditing({ ...item })}
            className={`p-3 rounded-xl text-left border-2 transition-all flex items-center gap-3 ${editing?.id === item.id ? 'bg-rose-600/20 border-rose-500' : 'bg-slate-900 border-transparent hover:border-slate-700'}`}>
            <span className="text-xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black truncate">{item.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{item.hint}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="flex-1 p-8 overflow-y-auto bg-slate-900/20">
        {editing ? (
          <div className="max-w-md space-y-5">
            <h3 className="text-rose-400 text-xs font-black uppercase tracking-widest">
              {editing.id && items.find(i => i.id === editing.id) ? 'Редактировать предмет' : 'Новый предмет'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">ID (латиница)</label>
                <input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none text-sm"
                  value={editing.id} onChange={e => setEditing(v => ({ ...v, id: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                  placeholder="magnet, spring..." />
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">Эмодзи</label>
                <input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none text-center text-2xl"
                  value={editing.emoji} onChange={e => setEditing(v => ({ ...v, emoji: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">Название (РУ)</label>
              <input className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl outline-none font-bold text-lg"
                value={editing.name} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} placeholder="Магнит" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">Подсказка для игрока</label>
              <input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none text-sm"
                value={editing.hint} onChange={e => setEditing(v => ({ ...v, hint: e.target.value }))} placeholder="притягивает металл" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 py-4 rounded-[20px] bg-rose-600 text-white font-black text-sm disabled:opacity-40 hover:bg-rose-500 transition-all">
                {isSaving ? 'Сохраняю...' : '💾 Сохранить'}
              </button>
              <button onClick={() => setEditing(null)} className="px-6 py-4 rounded-[20px] bg-slate-700 text-sm font-black hover:bg-slate-600">Отмена</button>
            </div>
            {items.find(i => i.id === editing.id) && (
              <button onClick={() => handleDelete(editing.id)} className="text-red-500 text-xs font-black uppercase tracking-widest hover:underline">
                🗑️ Удалить предмет
              </button>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-3">
            <div className="text-5xl opacity-20">⚙️</div>
            <p className="text-xs font-black uppercase tracking-widest">Выбери или добавь предмет</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Простая SVG-диаграмма ─────────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color = '#8b5cf6', height = 120 }) {
  if (!data?.length) return <p className="text-slate-500 text-xs text-center py-8">Нет данных</p>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const barW = Math.floor(100 / data.length);
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d[valueKey] / max) * (height - 20);
        const x = i * barW + barW * 0.1;
        const w = barW * 0.8;
        return (
          <g key={i}>
            <rect x={x} y={height - 20 - h} width={w} height={h} fill={color} rx="2" opacity="0.85" />
            <text x={x + w / 2} y={height - 5} textAnchor="middle" fontSize="5" fill="#94a3b8">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Вкладка: Аналитика ────────────────────────────────────────────────────────
function TabAnalytics() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);

  const refresh = async (days) => {
    setLoading(true);
    const [tokenData, alertData] = await Promise.all([
      getTokenStats(days),
      getPlayerAlerts(TWENTY_Q_WORDS.length),
    ]);
    setStats(tokenData);
    setAlerts(alertData || []);
    setLoading(false);
  };

  useEffect(() => { refresh(period); }, []);

  // Группировка по дням
  const byDay = (() => {
    if (!stats?.length) return [];
    const map = {};
    stats.forEach(row => {
      const day = row.created_at.slice(5, 10); // MM-DD
      if (!map[day]) map[day] = { label: day, tokens: 0, cost: 0, calls: 0 };
      map[day].tokens += row.total_tokens;
      map[day].cost += parseFloat(row.cost_usd || 0);
      map[day].calls += 1;
    });
    return Object.values(map).slice(-period);
  })();

  const totalTokens = byDay.reduce((s, d) => s + d.tokens, 0);
  const totalCost = byDay.reduce((s, d) => s + d.cost, 0);
  const totalCalls = byDay.reduce((s, d) => s + d.calls, 0);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      {/* Алерты игроков */}
      {alerts.length > 0 && (
        <section className="bg-amber-900/30 border border-amber-600/40 rounded-2xl p-6">
          <h3 className="text-amber-400 text-xs font-black uppercase tracking-widest mb-4">
            ⚠️ Игроки прошли 80%+ слов Царь-горы ({alerts.length} чел.)
          </h3>
          <div className="space-y-2">
            {alerts.map(p => (
              <div key={p.id} className="flex items-center gap-4 bg-slate-900/50 rounded-xl px-4 py-3">
                <span className="text-2xl">👤</span>
                <div className="flex-1">
                  <p className="font-black text-sm">{p.child_name || 'Аноним'}</p>
                  {p.parent_email && <p className="text-slate-400 text-xs">{p.parent_email}</p>}
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-black">{p.used_tsar_ids?.length} / {TWENTY_Q_WORDS.length}</p>
                  <p className="text-slate-500 text-[10px]">слов угадано</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-amber-500/70 text-xs mt-3">💡 Этим игрокам стоит показать предложение записаться на живые занятия по ТРИЗ</p>
        </section>
      )}

      {/* Токены */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-300 font-black text-sm uppercase tracking-widest">Расход токенов</h3>
          <div className="flex gap-2">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => { setPeriod(d); refresh(d); }}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all ${period === d ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {d}д
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-slate-500 text-xs text-center py-12">Загрузка аналитики...</div>
        ) : (
          <>
            {/* KPI карточки */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Токенов', value: totalTokens.toLocaleString(), color: 'text-violet-300' },
                { label: 'Запросов', value: totalCalls.toLocaleString(), color: 'text-blue-300' },
                { label: 'Стоимость', value: `$${totalCost.toFixed(4)}`, color: 'text-emerald-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-800/60 rounded-2xl p-5 text-center">
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="text-slate-500 text-[10px] uppercase font-black mt-1">{label} за {period}д</p>
                </div>
              ))}
            </div>

            {/* График токенов */}
            <div className="bg-slate-800/40 rounded-2xl p-6">
              <p className="text-[10px] uppercase text-slate-500 font-black mb-3">Токены по дням</p>
              <BarChart data={byDay} valueKey="tokens" labelKey="label" color="#8b5cf6" height={100} />
            </div>

            {/* График стоимости */}
            <div className="bg-slate-800/40 rounded-2xl p-6">
              <p className="text-[10px] uppercase text-slate-500 font-black mb-3">Стоимость по дням (USD)</p>
              <BarChart data={byDay} valueKey="cost" labelKey="label" color="#10b981" height={100} />
            </div>

            {stats === null && (
              <div className="bg-slate-800/30 rounded-2xl p-6 text-center">
                <p className="text-slate-400 text-sm">Supabase не подключён — данные недоступны.</p>
                <p className="text-slate-500 text-xs mt-1">Добавь VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// ── Главный AdminView ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'tasks',     label: '📋 Задачи' },
  { id: 'tsar',      label: '🏔️ Царь-гора' },
  { id: 'bredo',     label: '⚙️ Бредо' },
  { id: 'analytics', label: '📊 Аналитика' },
];

export default function AdminView({ TASKS, onBack, t }) {
  const [tab, setTab] = useState('tasks');

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Шапка */}
      <div className="px-6 pt-16 pb-0 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 z-20">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl hover:bg-slate-700 transition-colors">←</button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">Админка TRIZ</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Управление контентом и аналитика</p>
          </div>
        </div>
        {/* Вкладки */}
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all ${tab === t.id ? 'bg-slate-950 text-white border-t border-x border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Контент */}
      <div className="flex flex-1 overflow-hidden">
        {tab === 'tasks'     && <TabTasks TASKS={TASKS} onBack={onBack} />}
        {tab === 'tsar'      && <TabTsarWords />}
        {tab === 'bredo'     && <TabBredomaker />}
        {tab === 'analytics' && <TabAnalytics />}
      </div>
    </div>
  );
}
