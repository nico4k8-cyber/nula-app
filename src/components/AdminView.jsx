import React, { useState } from 'react';

export default function AdminView({ TASKS, onBack, t }) {
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
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > max_size) {
            height *= max_size / width;
            width = max_size;
          } else if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to WebP
          const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
          const filename = `task_${editingTask.id}_${Date.now()}.webp`;
          
          // Send to dev-api-server
          const response = await fetch('http://localhost:3001/api/save-image', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ filename, base64: webpDataUrl })
          });
          
          if (response.ok) {
             const data = await response.json();
             updateTask(editingTask.id, 'image_url', data.url);
          } else {
             alert('❌ Ошибка сохранения картинки');
          }
          setIsUploading(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch(err) {
      alert("Ошибка: " + err.message);
      setIsUploading(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:3001/api/save-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: localTasks })
      });
      if (response.ok) alert("✅ Задачи успешно сохранены в файл src/tasks.js!");
      else alert("❌ Ошибка сохранения. Убедись, что запущен dev-api-server.mjs");
    } catch (e) {
      alert("❌ Ошибка соединения с сервером: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTask = (id, field, value) => {
    setLocalTasks(prev => prev.map(task => task.id === id ? { ...task, [field]: value } : task));
    if (editingTask && editingTask.id === id) {
       setEditingTask(prev => ({ ...prev, [field]: value }));
    }
  };

  const addNewTask = () => {
    const newId = Math.max(...localTasks.map(t => t.id), 0) + 1;
    const newTask = {
      id: newId,
      category: 'library',
      title: 'Новая задача',
      title_en: 'New Task',
      icon: '❓',
      teaser: 'Описание...',
      teaser_en: 'Short teaser...',
      difficulty: 1,
      core_problem: { need: '', obstacle: '' },
      ikr: '',
      resources: [],
      puzzle: { question_ru: '', question_en: '', answer_ru: '', answer_en: '' },
      image_url: ''
    };
    setLocalTasks([...localTasks, newTask]);
    setEditingTask(newTask);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="p-6 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl hover:bg-slate-700 transition-colors">
            ←
          </button>
          <div>
             <h1 className="text-xl font-black uppercase tracking-tight text-white">Админка Задач</h1>
             <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Управление контентом TRIZ-Архипелага</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={addNewTask}
            className="px-6 py-2 rounded-full bg-indigo-600 text-[12px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
          >
            + Добавить
          </button>
          <button 
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`px-6 py-2 rounded-full ${isSaving ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-500'} text-[12px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95`}
          >
            {isSaving ? 'Сохранение...' : '💾 СОХРАНИТЬ ВСЁ'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-3 h-full custom-scrollbar">
          {localTasks.map(task => (
            <button 
              key={task.id}
              onClick={() => setEditingTask(task)}
              className={`p-4 rounded-2xl text-left border-2 transition-all ${editingTask?.id === task.id ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-900 border-transparent hover:border-slate-700'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{task.icon || '❓'}</span>
                <div className="min-w-0">
                  <p className="text-[14px] font-black leading-tight truncate">{task.title}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">{task.category}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-8 h-full custom-scrollbar bg-slate-900/20">
          {editingTask ? (
            <div className="max-w-2xl mx-auto space-y-8 pb-32">
              <section className="space-y-4">
                <h2 className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">Основные поля</h2>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] uppercase text-slate-500 font-black">Категория (ID острова)</label>
                      <select 
                        value={editingTask.category} 
                        onChange={(e) => updateTask(editingTask.id, 'category', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl focus:border-indigo-500 outline-none"
                      >
                         <option value="library">Library (Библиотека)</option>
                         <option value="nature-reserve">Nature Reserve (Заповедник)</option>
                         <option value="city-hall">City Hall (Мэрия)</option>
                         <option value="farm">Farm (Ферма)</option>
                         <option value="workshop">Workshop (Мастерская)</option>
                         <option value="laboratory">Laboratory (Лаборатория)</option>
                         <option value="bureau">Bureau (Бюро)</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] uppercase text-slate-500 font-black">Сложность (1-3 звезды)</label>
                      <input 
                        type="number" min="1" max="3"
                        value={editingTask.difficulty || 1}
                        onChange={(e) => updateTask(editingTask.id, 'difficulty', parseInt(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl focus:border-indigo-500 outline-none font-bold"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-slate-500 font-black">Название (RU)</label>
                  <input 
                    className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl focus:border-indigo-500 outline-none font-bold text-lg"
                    value={editingTask.title}
                    onChange={(e) => updateTask(editingTask.id, 'title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-slate-500 font-black">Название (EN)</label>
                  <input 
                    className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl focus:border-indigo-500 outline-none"
                    value={editingTask.title_en || ''}
                    onChange={(e) => updateTask(editingTask.id, 'title_en', e.target.value)}
                  />
                </div>
                <div className="space-y-4 pt-4">
                   <h2 className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">Изображение</h2>
                   
                   {editingTask.image_url && (
                      <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative group">
                        <img src={editingTask.image_url} alt="Task" className="h-full object-cover" />
                        <button onClick={() => updateTask(editingTask.id, 'image_url', '')} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      </div>
                   )}
                   
                   <div>
                     <label className="text-[10px] uppercase text-slate-500 font-black mb-2 block">Загрузить или вставить URL</label>
                     <div className="flex gap-2">
                       <input 
                         className="flex-1 bg-slate-800 border border-slate-700 p-3 rounded-xl focus:border-indigo-500 outline-none text-sm"
                         placeholder="URL картинки..."
                         value={editingTask.image_url || ''}
                         onChange={(e) => updateTask(editingTask.id, 'image_url', e.target.value)}
                       />
                       <label className="bg-slate-700 hover:bg-slate-600 transition-colors px-4 rounded-xl flex items-center justify-center cursor-pointer cursor-allowed opacity-100">
                          {isUploading ? '⏳' : '📁 Файл (WebP)'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                       </label>
                     </div>
                   </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">ТРИЗ-Метаданные (Для ИИ)</h2>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-slate-500 font-black">Идеальный Конечный Результат (ИКР)</label>
                  <textarea 
                    className="w-full h-24 bg-slate-800 border border-slate-700 p-4 rounded-xl focus:border-indigo-500 outline-none resize-none"
                    value={editingTask.ikr || ''}
                    onChange={(e) => updateTask(editingTask.id, 'ikr', e.target.value)}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">Загадка</h2>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-slate-500 font-black">Вопрос (RU)</label>
                  <textarea 
                    className="w-full h-24 bg-slate-800 border border-slate-700 p-4 rounded-xl focus:border-indigo-500 outline-none resize-none"
                    value={editingTask.puzzle?.question_ru || editingTask.puzzle?.question || ''}
                    onChange={(e) => updateTask(editingTask.id, 'puzzle', { ...editingTask.puzzle, question_ru: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-slate-500 font-black">Ответ (RU)</label>
                  <textarea 
                    className="w-full h-24 bg-teal-900/20 border border-teal-800/20 p-4 rounded-xl focus:border-teal-500 outline-none resize-none text-teal-200"
                    value={editingTask.puzzle?.answer_ru || editingTask.puzzle?.answer || ''}
                    onChange={(e) => updateTask(editingTask.id, 'puzzle', { ...editingTask.puzzle, answer_ru: e.target.value })}
                  />
                </div>
              </section>

              <div className="pt-8">
                 <button 
                   onClick={() => {
                     if(confirm("Удалить эту задачу?")) {
                       setLocalTasks(prev => prev.filter(t => t.id !== editingTask.id));
                       setEditingTask(null);
                     }
                   }}
                   className="text-red-500 text-xs font-black uppercase tracking-widest hover:underline"
                 >
                   🗑️ Удалить задачу #{editingTask.id}
                 </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-4">
               <div className="text-6xl grayscale opacity-20">⚙️</div>
               <p className="font-bold uppercase tracking-widest text-xs">Выбери задачу для начала редактирования</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
