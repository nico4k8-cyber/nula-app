/* ═══ Game Constants & Utils ═══ */

export const STORAGE_KEY = "razgadai_v1";
export const TRIZ_STATE_KEY = "razgadai_triz_state";
export const USER_KEY = "razgadai_user_id";
export const SESSION_KEY = "razgadai_session_id";

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function thinkingType(stars, lang = 'ru') {
  const labels = {
    ru: [
      { min: 28, label: "Гений природы",    emoji: "🧠" },
      { min: 16, label: "Мастер решений",   emoji: "⚡" },
      { min: 7,  label: "Юный детектив",    emoji: "🔍" },
      { min: 0,  label: "Любознайка",          emoji: "🌱" }
    ],
    en: [
      { min: 28, label: "Nature Genius",    emoji: "🧠" },
      { min: 16, label: "Solution Master",   emoji: "⚡" },
      { min: 7,  label: "Young Detective",    emoji: "🔍" },
      { min: 0,  label: "Curious Mind",          emoji: "🌱" }
    ]
  };
  const list = labels[lang] || labels['ru'];
  return list.find(l => stars >= l.min) || list[list.length-1];
}

export function methodDescription(methodName, lang = 'ru') {
  const descriptions = {
    ru: {
      "Наоборот": "Ты узнал, что иногда нужно противоположное решение. Переверни проблему — и ответ станет очевидным.",
      "Дробление": "Ты открыл, как природа использует части для решения. Маленькие кусочки работают лучше, чем целое.",
      "Посредник": "Ты увидел, как промежуточный помощник решает конфликт. Добавь посредника — и противоречие исчезнет.",
      "Фазовый переход": "Ты заметил, как смена состояния (жидкое ↔ твёрдое) решает задачу. Фаза вещества — мощный инструмент.",
      "Эхо": "Ты услышал отражение и повтор. Когда система сама себе помогает, проблема решается элегантно.",
      "Слои": "Ты разглядел скрытые слои и оболочки. Природа кладёт решение слой за слоем."
    },
    en: {
      "Наоборот": "You learned that sometimes the opposite solution is needed. Flip the problem — and the answer becomes obvious.",
      "Дробление": "You discovered how nature uses parts to solve problems. Small pieces often work better than a whole.",
      "Посредник": "You saw how an intermediate helper resolves a conflict. Add a mediator — and the contradiction disappears.",
      "Фазовый переход": "You noticed how a change of state (liquid ↔ solid) solves a task. The phase of matter is a powerful tool.",
      "Эхо": "You heard reflection and repetition. When a system helps itself, the problem is solved elegantly.",
      "Слои": "You spotted hidden layers and shells. Nature builds solutions layer by layer."
    }
  };
  return descriptions[lang]?.[methodName] || descriptions['ru'][methodName] || "";
}

export const ISLAND_MAPPING = {
  main: {
    name: "Главный остров",
    imgUrl: "/assets/webm/main_island.webm",
    buildings: [
      { id: 'library', name: 'Библиотека', icon: '📚', color: 'bg-amber-600' },
      { id: 'city-hall', name: 'Мэрия', icon: '🏛️', color: 'bg-blue-600' },
      { id: 'nature-reserve', name: 'Заповедник', icon: '🏞️', color: 'bg-teal-500' }
    ]
  },
  craft: {
    name: "Заповедник",
    imgUrl: "/assets/webm/island_zapovednik.webm",
    buildings: [
      { id: 'workshop', name: 'Мастерская', icon: '🔧', color: 'bg-slate-600' },
      { id: 'farm', name: 'Ферма', icon: '🚜', color: 'bg-emerald-600' }
    ]
  },
  science: {
    name: "Остров Науки",
    imgUrl: "/assets/webm/island_laboratory.webm",
    buildings: [
      { id: 'laboratory', name: 'Лаборатория', icon: '🧪', color: 'bg-indigo-600' },
      { id: 'bredo', name: 'Бредогенератор', icon: '⚙️', color: 'bg-rose-600' }
    ]
  },
  summit: {
    name: "Пик Изобретателей",
    imgUrl: "/assets/webm/island_tsar.webm",
    buildings: [
      { id: 'tsar', name: 'Царь-гора', icon: '🏔️', color: 'bg-violet-600' }
    ]
  }
};

export const AUDIO_TRACKS = [
  { name: "Главная тема", path: "/audio/magical-&-calm.mp3" },
];
