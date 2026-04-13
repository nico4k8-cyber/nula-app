import React, { useState, useEffect } from 'react';
import {
  loadTsarWords, saveTsarWord, deleteTsarWord,
  loadBredomakerItems, saveBredomakerItem, deleteBredomakerItem,
  getTokenStats, getPlayerAlerts, getPlayerStats,
  loadAppConfig, saveAppConfig,
} from '../lib/supabase';
import { TWENTY_Q_WORDS } from '../bot/twenty-q-words';
import { BREDO_ITEMS } from '../bot/bredo-items';

// ── Вкладка: Задачи ───────────────────────────────────────────────────────────
function TabTasks({ TASKS, onBack }) {
  const [editingTask, setEditingTask] = useState(null);
  const [localTasks, setLocalTasks] = useState(TASKS);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tutorialTaskId, setTutorialTaskId] = useState(null);
  const [isSavingTutorial, setIsSavingTutorial] = useState(false);

  useEffect(() => {
    loadAppConfig('tutorial_task_id').then(val => {
      setTutorialTaskId(val ? Number(val) : 2);
    }).catch(() => setTutorialTaskId(2));
  }, []);

  const saveTutorialTask = async (id) => {
    setIsSavingTutorial(true);
    try {
      await saveAppConfig('tutorial_task_id', String(id));
      setTutorialTaskId(id);
    } catch(e) { alert('Ошибка: ' + e.message); }
    finally { setIsSavingTutorial(false); }
  };

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

  // Island → locations mapping
  const ISLANDS = [
    { id: 'main',    label: '🏝 Главный остров', locations: ['library', 'city-hall', 'nature-reserve'] },
    { id: 'craft',   label: '🌿 Заповедник',          locations: ['workshop', 'farm'] },
    { id: 'science', label: '🔬 Остров Науки',       locations: ['laboratory'] },
    { id: 'summit',  label: '🏔 Пик Изобретателей',  locations: ['tsar'] },
  ];
  const LOCATION_LABELS = {
    'library': '📚 Библиотека', 'city-hall': '🏛 Ратуша', 'nature-reserve': '🏞 Заповедник',
    'workshop': '🔧 Мастерская', 'farm': '🚜 Ферма', 'laboratory': '🔬 Лаборатория', 'tsar': '👑 Царь-гора',
  };

  // Check if task has content (not just template)
  const isIncomplete = (task) => {
    const hasTeaser = task.teaser && task.teaser.length > 5 && !task.teaser.includes('TODO') && !task.teaser.includes('...');
    const hasCondition = task.condition || task.core_problem?.need || task.puzzle?.question || task.puzzle?.question_ru;
    return !hasTeaser || !hasCondition;
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Список — по островам и локациям */}
      <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-3 flex flex-col gap-1">
        {/* Первая задача после онбординга */}
        <div className="bg-amber-900/30 border border-amber-600/40 rounded-xl p-3 mb-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">🎯 Первая задача (после онбординга)</div>
          <select
            value={tutorialTaskId || 2}
            onChange={e => saveTutorialTask(Number(e.target.value))}
            disabled={isSavingTutorial}
            className="w-full bg-slate-800 text-white text-[11px] rounded-lg px-2 py-1.5 border border-slate-600"
          >
            {localTasks.map(task => (
              <option key={task.id} value={task.id}>
                #{task.id} {task.icon} {task.title}
              </option>
            ))}
          </select>
          {isSavingTutorial && <div className="text-[10px] text-amber-400 mt-1">Сохраняю...</div>}
        </div>
        <button onClick={addNewTask} className="w-full py-2.5 rounded-xl bg-indigo-700 text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all mb-2">+ Добавить задачу</button>

        {ISLANDS.map(island => {
          const islandTasks = localTasks.filter(t => island.locations.includes(t.category));
          if (islandTasks.length === 0) return null;
          return (
            <div key={island.id} className="mb-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 py-1 mb-1">{island.label}</div>
              {island.locations.map(loc => {
                const locTasks = islandTasks.filter(t => t.category === loc);
                if (locTasks.length === 0) return null;
                return (
                  <div key={loc} className="mb-2">
                    <div className="text-[10px] font-bold text-slate-600 px-3 py-0.5 bg-slate-800/50 rounded-lg mb-1">
                      {LOCATION_LABELS[loc] || loc} · {locTasks.length} задач
                    </div>
                    {locTasks.map(task => {
                      const incomplete = isIncomplete(task);
                      return (
                        <button key={task.id} onClick={() => setEditingTask(task)}
                          className={`w-full p-3 rounded-xl text-left border transition-all mb-0.5 ${editingTask?.id === task.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900/60 border-transparent hover:border-slate-700'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg flex-shrink-0">{task.icon || '❓'}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-black truncate">{task.title}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px] text-slate-500">★{task.difficulty}</span>
                                {incomplete && <span className="text-[9px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded font-black">⚠ нет текста</span>}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Tasks without known location */}
        {(() => {
          const allKnown = ISLANDS.flatMap(i => i.locations);
          const orphans = localTasks.filter(t => !allKnown.includes(t.category));
          if (!orphans.length) return null;
          return (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-red-500 px-2 py-1 mb-1">⚠ Без локации</div>
              {orphans.map(task => (
                <button key={task.id} onClick={() => setEditingTask(task)}
                  className={`w-full p-3 rounded-xl text-left border transition-all mb-0.5 ${editingTask?.id === task.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-red-900/20 border-red-900/40 hover:border-red-700'}`}>
                  <span className="text-[12px] font-black">{task.icon} {task.title}</span>
                  <span className="text-[9px] text-red-400 ml-2">{task.category}</span>
                </button>
              ))}
            </div>
          );
        })()}
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
                  <label className="text-[10px] uppercase text-slate-500 font-black block mb-1">Локация / Остров</label>
                  <select value={editingTask.category} onChange={e => updateTask(editingTask.id, 'category', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none">
                    <optgroup label="🏝 Главный остров">
                      <option value="library">📚 Библиотека</option>
                      <option value="city-hall">🏛 Ратуша</option>
                      <option value="nature-reserve">🏞 Заповедник</option>
                    </optgroup>
                    <optgroup label="🌿 Заповедник (остров)">
                      <option value="workshop">🔧 Мастерская</option>
                      <option value="farm">🚜 Ферма</option>
                    </optgroup>
                    <optgroup label="🔬 Остров Науки">
                      <option value="laboratory">🔬 Лаборатория</option>
                    </optgroup>
                    <optgroup label="🏔 Пик Изобретателей">
                      <option value="tsar">👑 Царь-гора</option>
                    </optgroup>
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
  const [playerStats, setPlayerStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);

  const refresh = async (days) => {
    setLoading(true);
    const [tokenData, alertData, pStats] = await Promise.all([
      getTokenStats(days),
      getPlayerAlerts(TWENTY_Q_WORDS.length),
      getPlayerStats(),
    ]);
    setStats(tokenData);
    setAlerts(alertData || []);
    setPlayerStats(pStats);
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
    <div className="absolute inset-0 overflow-y-auto p-8 space-y-8">
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

      {/* Игроки и задачи */}
      {playerStats && (
        <section className="grid grid-cols-3 gap-4">
          {[
            { label: 'Игроков', value: playerStats.totalPlayers, icon: '👤', color: 'text-sky-300' },
            { label: 'Задач решено', value: playerStats.totalTasksSolved, icon: '✅', color: 'text-emerald-300' },
            { label: 'Звёзд заработано', value: playerStats.totalStars, icon: '⭐', color: 'text-amber-300' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-slate-800/60 rounded-2xl p-5 text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-slate-500 text-[10px] uppercase font-black mt-1">{label}</p>
            </div>
          ))}
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
                { label: 'Стоимость', value: `${(totalCost * 90).toFixed(2)} ₽`, color: 'text-emerald-300' },
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
              <p className="text-[10px] uppercase text-slate-500 font-black mb-3">Стоимость по дням (₽)</p>
              <BarChart data={byDay.map(d => ({ ...d, costRub: d.cost * 90 }))} valueKey="costRub" labelKey="label" color="#10b981" height={100} />
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

// ── Вкладка: Острова ─────────────────────────────────────────────────────────
const ISLAND_DEFS = [
  { id: 'main',    emoji: '🏝', label: 'Главный остров', locations: [
    { id: 'library',       emoji: '📚', label: 'Библиотека' },
    { id: 'city-hall',     emoji: '🏛', label: 'Ратуша' },
    { id: 'nature-reserve',emoji: '🏞', label: 'Заповедник' },
  ]},
  { id: 'craft',   emoji: '🌿', label: 'Заповедник',         locations: [
    { id: 'workshop', emoji: '🔧', label: 'Мастерская' },
    { id: 'farm',     emoji: '🚜', label: 'Ферма' },
  ]},
  { id: 'science', emoji: '🔬', label: 'Остров Науки',      locations: [
    { id: 'laboratory', emoji: '🔬', label: 'Лаборатория' },
  ]},
  { id: 'summit',  emoji: '🏔', label: 'Пик Изобретателей', locations: [
    { id: 'tsar', emoji: '👑', label: 'Царь-гора' },
  ]},
];

function TabIslands({ TASKS }) {
  const [selectedIsland, setSelectedIsland] = useState(ISLAND_DEFS[0].id);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [localTasks, setLocalTasks] = useState(TASKS);
  const [isSaving, setIsSaving] = useState(false);
  // Редактируемый маппинг островов
  const [islandDefs, setIslandDefs] = useState(ISLAND_DEFS);
  const [movingLocId, setMovingLocId] = useState(null); // id локации в режиме перемещения

  useEffect(() => {
    loadAppConfig('island_mapping').then(saved => {
      if (saved && Array.isArray(saved)) setIslandDefs(saved);
    });
  }, []);

  const island = islandDefs.find(i => i.id === selectedIsland);

  const isIncomplete = (task) => {
    const hasTeaser = task.teaser && task.teaser.length > 5;
    const hasCondition = task.condition || task.core_problem?.need || task.puzzle?.question || task.puzzle?.question_ru;
    return !hasTeaser || !hasCondition;
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:3001/api/save-tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: localTasks }),
      });
      if (response.ok) alert("✅ Задачи сохранены!");
      else alert("❌ Запусти dev-api-server.mjs");
    } catch (e) { alert("❌ Нет dev-сервера"); }
    finally { setIsSaving(false); }
  };

  // Переместить локацию на другой остров
  const moveLocation = async (locId, targetIslandId) => {
    const loc = islandDefs.flatMap(i => i.locations).find(l => l.id === locId);
    if (!loc) return;
    const newDefs = islandDefs.map(isl => ({
      ...isl,
      locations: isl.id === targetIslandId
        ? [...isl.locations.filter(l => l.id !== locId), loc]
        : isl.locations.filter(l => l.id !== locId)
    }));
    setIslandDefs(newDefs);
    setMovingLocId(null);
    // Собрать ISLAND_MAPPING для gameUtils.js
    const LOCATION_META = {
      'library':        { name: 'Библиотека',   icon: '📚', color: 'bg-amber-600' },
      'city-hall':      { name: 'Мэрия',         icon: '🏛️', color: 'bg-blue-600' },
      'nature-reserve': { name: 'Заповедник',    icon: '🏞️', color: 'bg-teal-500' },
      'workshop':       { name: 'Мастерская',    icon: '🔧', color: 'bg-slate-600' },
      'farm':           { name: 'Ферма',         icon: '🚜', color: 'bg-emerald-600' },
      'laboratory':     { name: 'Лаборатория',   icon: '🧪', color: 'bg-indigo-600' },
      'bredo':          { name: 'Генератор идей', icon: '⚙️', color: 'bg-rose-600' },
      'tsar':           { name: 'Царь-гора',     icon: '🏔️', color: 'bg-violet-600' },
    };
    const ISLAND_IMG = { main: '/assets/webp/main_island.webp', craft: '/assets/webp/island_zapovednik.webp', science: '/assets/webp/island_laboratory.webp', summit: '/assets/webp/island_tsar.webp' };
    const mapping = {};
    newDefs.forEach(isl => {
      mapping[isl.id] = {
        name: isl.label,
        imgUrl: ISLAND_IMG[isl.id] || '',
        buildings: isl.locations.map(l => ({ id: l.id, ...(LOCATION_META[l.id] || { name: l.label, icon: l.emoji, color: 'bg-slate-600' }) }))
      };
    });
    const ok = await saveAppConfig('island_mapping', newDefs);
    if (ok) alert(`✅ Локация "${loc.label}" перемещена на ${newDefs.find(i=>i.id===targetIslandId)?.label}!\nИзменения применятся после перезагрузки.`);
    else alert("❌ Ошибка сохранения — проверь Supabase");
  };

  const moveTask = (taskId, newCategory) => {
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, category: newCategory } : t));
  };

  const locTasks = selectedLocation
    ? localTasks.filter(t => t.category === selectedLocation)
    : [];

  const unassigned = localTasks.filter(t =>
    !islandDefs.flatMap(i => i.locations.map(l => l.id)).includes(t.category)
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Колонка 1: Острова */}
      <div className="w-[160px] border-r border-slate-800 flex flex-col">
        <div className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">Острова</div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {ISLAND_DEFS.map(isl => (
            <button key={isl.id}
              onClick={() => { setSelectedIsland(isl.id); setSelectedLocation(null); setEditingTask(null); }}
              className={`w-full text-left px-3 py-3 rounded-xl text-[12px] font-black transition-all ${selectedIsland === isl.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {isl.emoji} {isl.label}
              <div className="text-[10px] font-normal opacity-60 mt-0.5">
                {localTasks.filter(t => isl.locations.map(l=>l.id).includes(t.category)).length} задач
              </div>
            </button>
          ))}
          {unassigned.length > 0 && (
            <button onClick={() => { setSelectedIsland('_orphan'); setSelectedLocation(null); }}
              className={`w-full text-left px-3 py-3 rounded-xl text-[12px] font-black transition-all ${selectedIsland === '_orphan' ? 'bg-red-700 text-white' : 'text-red-400 hover:bg-slate-800'}`}>
              ⚠ Без острова
              <div className="text-[10px] opacity-60 mt-0.5">{unassigned.length} задач</div>
            </button>
          )}
        </div>
      </div>

      {/* Колонка 2: Локации острова */}
      <div className="w-[180px] border-r border-slate-800 flex flex-col">
        <div className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">Локации</div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {selectedIsland === '_orphan' ? (
            <div className="px-3 py-2 text-[11px] text-red-400">Задачи без категории</div>
          ) : island?.locations.map(loc => {
            const count = localTasks.filter(t => t.category === loc.id).length;
            const incomplete = localTasks.filter(t => t.category === loc.id && isIncomplete(t)).length;
            const isMoving = movingLocId === loc.id;
            return (
              <div key={loc.id} className="flex flex-col gap-1">
                <div className={`w-full text-left px-3 py-2.5 rounded-xl text-[12px] font-black transition-all flex items-start gap-1 ${selectedLocation === loc.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <button className="flex-1 text-left" onClick={() => { setSelectedLocation(loc.id); setEditingTask(null); setMovingLocId(null); }}>
                    {loc.emoji} {loc.label}
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] opacity-60">{count} задач</span>
                      {incomplete > 0 && <span className="text-[10px] text-red-400">⚠{incomplete}</span>}
                    </div>
                  </button>
                  <button
                    title="Переместить на другой остров"
                    onClick={() => setMovingLocId(isMoving ? null : loc.id)}
                    className={`text-[14px] px-1 rounded transition-all ${isMoving ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'}`}>
                    ↗
                  </button>
                </div>
                {isMoving && (
                  <div className="bg-slate-800 rounded-xl p-2 flex flex-col gap-1">
                    <p className="text-[9px] text-amber-400 font-black uppercase px-1 mb-1">Переместить на:</p>
                    {islandDefs.filter(isl => isl.id !== selectedIsland).map(isl => (
                      <button key={isl.id}
                        onClick={() => moveLocation(loc.id, isl.id)}
                        className="text-left text-[11px] px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-indigo-700 text-slate-300 font-bold transition-all">
                        {isl.emoji} {isl.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Колонка 3: Задачи локации */}
      <div className="w-[200px] border-r border-slate-800 flex flex-col">
        <div className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 flex items-center justify-between">
          <span>Задачи</span>
          {isSaving
            ? <span className="text-[9px] text-slate-500">Сохранение...</span>
            : <button onClick={handleSaveAll} className="text-[9px] bg-emerald-700 text-white px-2 py-1 rounded-lg font-black hover:bg-emerald-600">💾 Сохранить</button>
          }
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {(selectedIsland === '_orphan' ? unassigned : locTasks).map(task => {
            const incomplete = isIncomplete(task);
            return (
              <button key={task.id}
                onClick={() => setEditingTask(task)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-black transition-all border ${editingTask?.id === task.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : `bg-slate-900/60 border-transparent hover:border-slate-700 ${incomplete ? 'text-red-300' : 'text-slate-300'}`}`}>
                <div className="flex items-center gap-1.5">
                  <span>{task.icon || '❓'}</span>
                  <span className="truncate">{task.title}</span>
                </div>
                <div className="flex gap-1 mt-0.5">
                  <span className="text-[9px] opacity-50">★{task.difficulty}</span>
                  {incomplete && <span className="text-[9px] text-red-400">⚠ нет текста</span>}
                </div>
              </button>
            );
          })}
          {(selectedIsland !== '_orphan' && !selectedLocation) && (
            <div className="text-slate-600 text-[11px] text-center py-8">← Выбери локацию</div>
          )}
        </div>
      </div>

      {/* Колонка 4: Редактор задачи */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900/20">
        {editingTask ? (
          <div className="max-w-xl space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{editingTask.icon}</span>
              <div>
                <h3 className="text-lg font-black text-white">{editingTask.title}</h3>
                <p className="text-[11px] text-slate-500 uppercase">ID: {editingTask.id} · ★{editingTask.difficulty}</p>
              </div>
            </div>

            {/* Переназначить в другую локацию */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-black block mb-2">Локация</label>
              <select
                value={editingTask.category}
                onChange={e => {
                  const newCat = e.target.value;
                  moveTask(editingTask.id, newCat);
                  setEditingTask(prev => ({ ...prev, category: newCat }));
                }}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none text-sm">
                {ISLAND_DEFS.flatMap(isl => isl.locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{isl.emoji} {isl.label} → {loc.emoji} {loc.label}</option>
                )))}
              </select>
            </div>

            {/* Teaser */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-black block mb-2">
                Тизер (вопрос задачи)
                {(!editingTask.teaser || editingTask.teaser.length < 5) && <span className="text-red-400 ml-2">⚠ пусто</span>}
              </label>
              <textarea rows={3} value={editingTask.teaser || ''}
                onChange={e => {
                  const v = e.target.value;
                  setLocalTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, teaser: v } : t));
                  setEditingTask(prev => ({ ...prev, teaser: v }));
                }}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none text-sm resize-none"
                placeholder="Как принцу забраться наверх без лестниц?" />
            </div>

            {/* Condition */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-black block mb-2">
                Условие задачи (полное)
                {!editingTask.condition && <span className="text-amber-400 ml-2">⚠ нет</span>}
              </label>
              <textarea rows={4} value={editingTask.condition || ''}
                onChange={e => {
                  const v = e.target.value;
                  setLocalTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, condition: v } : t));
                  setEditingTask(prev => ({ ...prev, condition: v }));
                }}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none text-sm resize-none"
                placeholder="Принцесса заперта в башне. Принц хочет к ней попасть..." />
            </div>

            <button onClick={handleSaveAll} disabled={isSaving}
              className={`w-full py-3 rounded-xl text-sm font-black uppercase ${isSaving ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-500'} transition-all`}>
              {isSaving ? 'Сохранение...' : '💾 Сохранить все изменения'}
            </button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center flex-col gap-3 text-slate-600">
            <div className="text-6xl opacity-20">🏝</div>
            <p className="text-xs font-black uppercase tracking-widest">Выбери задачу для редактирования</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Вкладка: Расписание задач дня ─────────────────────────────────────────────
function TabDailySchedule({ TASKS }) {
  const [schedule, setSchedule] = useState({}); // { "YYYY-MM-DD": taskId }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAppConfig('daily_schedule').then(val => {
      try { setSchedule(val ? JSON.parse(val) : {}); } catch { setSchedule({}); }
      setLoading(false);
    });
  }, []);

  const saveSchedule = async (newSchedule) => {
    setSaving(true);
    setSaved(false);
    await saveAppConfig('daily_schedule', JSON.stringify(newSchedule));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const assignTask = (date, taskId) => {
    const next = { ...schedule };
    if (taskId === null) { delete next[date]; } else { next[date] = taskId; }
    setSchedule(next);
    saveSchedule(next);
  };

  // Календарь
  const { year, month } = viewDate;
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleString('ru', { month: 'long', year: 'numeric' });

  const todayStr = new Date().toLocaleDateString('sv');

  const dateKey = (d) => {
    const dt = new Date(year, month, d);
    return dt.toLocaleDateString('sv');
  };

  const taskById = (id) => TASKS?.find(t => t.id === id || t.id === Number(id));

  // fallback hash (как в DailyChallenge)
  const hashTask = (dateStr) => {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
    return TASKS?.[hash % TASKS.length];
  };

  const filteredTasks = TASKS?.filter(t =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search)
  ) || [];

  if (loading) return <div className="flex-1 flex items-center justify-center text-slate-400">Загрузка...</div>;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Левая панель: календарь */}
      <div className="w-72 flex-shrink-0 border-r border-slate-800 overflow-y-auto p-4">
        {/* Навигация месяца */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setViewDate(v => { const d = new Date(v.year, v.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-sm"
          >←</button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-300 capitalize">{monthName}</span>
          <button
            onClick={() => setViewDate(v => { const d = new Date(v.year, v.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-sm"
          >→</button>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 mb-1">
          {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
            <div key={d} className="text-center text-[9px] text-slate-500 font-bold py-1">{d}</div>
          ))}
        </div>

        {/* Ячейки */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Пустые ячейки (Mon=1, но firstDay=0=Sun) */}
          {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => <div key={'e'+i} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const key = dateKey(d);
            const isToday = key === todayStr;
            const isSelected = key === selectedDate;
            const scheduled = schedule[key];
            const task = scheduled ? taskById(scheduled) : null;
            const auto = hashTask(key);

            return (
              <button
                key={d}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                className={`relative aspect-square rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all
                  ${isSelected ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : isToday ? 'bg-slate-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}
                `}
              >
                <span>{d}</span>
                {task ? (
                  <span className="text-[10px] leading-none">{task.icon || '📌'}</span>
                ) : (
                  <span className="text-[8px] opacity-30">{auto?.icon || '·'}</span>
                )}
                {scheduled && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Легенда */}
        <div className="mt-3 space-y-1 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" /> задача назначена</div>
          <div className="flex items-center gap-1.5"><span className="opacity-30">·</span> авто (по хэшу даты)</div>
        </div>

        {saving && <p className="mt-3 text-xs text-amber-400">Сохранение...</p>}
        {saved  && <p className="mt-3 text-xs text-emerald-400">✓ Сохранено</p>}
      </div>

      {/* Правая панель: выбор задачи для даты */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <span className="text-3xl">📅</span>
            <p className="text-sm">Выбери день в календаре</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Задача дня на</p>
                <p className="text-base font-black text-white">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {schedule[selectedDate] && (
                <button
                  onClick={() => assignTask(selectedDate, null)}
                  className="px-3 py-1.5 text-xs bg-red-900/40 hover:bg-red-900/70 text-red-300 rounded-lg font-bold transition-all"
                >
                  Сбросить на авто
                </button>
              )}
            </div>

            {/* Текущая задача */}
            {schedule[selectedDate] ? (
              <div className="mb-4 p-3 rounded-xl bg-emerald-900/30 border border-emerald-700/40">
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">Назначена</p>
                {(() => { const t = taskById(schedule[selectedDate]); return t ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{t.title}</p>
                      <p className="text-[10px] text-slate-400">ID: {t.id} · {t.category}</p>
                    </div>
                  </div>
                ) : <p className="text-xs text-slate-400">Задача #{schedule[selectedDate]} не найдена</p>; })()}
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Авто (хэш даты)</p>
                {(() => { const t = hashTask(selectedDate); return t ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-300">{t.title}</p>
                      <p className="text-[10px] text-slate-500">ID: {t.id} · {t.category}</p>
                    </div>
                  </div>
                ) : null; })()}
              </div>
            )}

            {/* Поиск */}
            <input
              type="text"
              placeholder="Поиск задачи..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full mb-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />

            {/* Список задач */}
            <div className="space-y-1.5">
              {filteredTasks.map(t => {
                const isChosen = schedule[selectedDate] === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => assignTask(selectedDate, t.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                      ${isChosen ? 'bg-indigo-600 border border-indigo-400' : 'bg-slate-800 hover:bg-slate-700 border border-transparent'}
                    `}
                  >
                    <span className="text-xl flex-shrink-0">{t.icon || '❓'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400">{t.category} · ID {t.id}</p>
                    </div>
                    {isChosen && <span className="text-xs text-indigo-200 font-black">✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Главный AdminView ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'tasks',     icon: '📋', label: 'Задачи' },
  { id: 'islands',   icon: '🏝', label: 'Острова' },
  { id: 'schedule',  icon: '📅', label: 'Расписание' },
  { id: 'tsar',      icon: '🏔️', label: 'Царь-гора' },
  { id: 'bredo',     icon: '⚙️', label: 'Бредо' },
  { id: 'analytics', icon: '📊', label: 'Аналитика' },
];

export default function AdminView({ TASKS, onBack, t }) {
  const [tab, setTab] = useState('tasks');
  const current = TABS.find(t => t.id === tab);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Шапка — компактная */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-slate-900 border-b border-slate-800 z-20 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-base transition-colors flex-shrink-0"
        >←</button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold leading-none mb-0.5">Управление</p>
          <h1 className="text-[15px] font-black text-white truncate">{current?.icon} {current?.label}</h1>
        </div>
        <div className="text-[10px] text-slate-600 font-mono">{TASKS?.length} задач</div>
      </div>

      {/* Контент */}
      <div className="flex flex-1 overflow-hidden relative">
        {tab === 'islands'   && <TabIslands TASKS={TASKS} />}
        {tab === 'tasks'     && <TabTasks TASKS={TASKS} onBack={onBack} />}
        {tab === 'schedule'  && <TabDailySchedule TASKS={TASKS} />}
        {tab === 'tsar'      && <TabTsarWords />}
        {tab === 'bredo'     && <TabBredomaker />}
        {tab === 'analytics' && <TabAnalytics />}
      </div>

      {/* Нижняя навигация */}
      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 pb-safe">
        <div className="flex">
          {TABS.map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all active:scale-95 ${active ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className={`text-[9px] font-black uppercase tracking-wide leading-none ${active ? 'text-indigo-400' : 'text-slate-600'}`}>
                  {item.label}
                </span>
                {active && <span className="w-4 h-0.5 bg-indigo-400 rounded-full mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
