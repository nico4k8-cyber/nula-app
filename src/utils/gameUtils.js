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

export function thinkingType(stars) {
  if (stars >= 28) return { label: "Гений природы",    emoji: "🧠" };
  if (stars >= 16) return { label: "Мастер решений",   emoji: "⚡" };
  if (stars >= 7)  return { label: "Юный детектив",    emoji: "🔍" };
  return               { label: "Любознайка",          emoji: "🌱" };
}

export function methodDescription(methodName) {
  const descriptions = {
    "Наоборот": "Ты узнал, что иногда нужно противоположное решение. Переверни проблему — и ответ станет очевидным.",
    "Дробление": "Ты открыл, как природа использует части для решения. Маленькие кусочки работают лучше, чем целое.",
    "Посредник": "Ты увидел, как промежуточный помощник решает конфликт. Добавь посредника — и противоречие исчезнет.",
    "Фазовый переход": "Ты заметил, как смена состояния (жидкое ↔ твёрдое) решает задачу. Фаза вещества — мощный инструмент.",
    "Эхо": "Ты услышал отражение и повтор. Когда система сама себе помогает, проблема решается элегантно.",
    "Слои": "Ты разглядел скрытые слои и оболочки. Природа кладёт решение слой за слоем."
  };
  return descriptions[methodName] || "";
}

export const ISLAND_MAPPING = {
  main: {
    name: "Главный остров",
    imgUrl: "/assets/main_island.png",
    buildings: [
      { id: 'library', name: 'Библиотека', icon: '📚', color: 'bg-amber-600' },
      { id: 'city-hall', name: 'Мэрия', icon: '🏛️', color: 'bg-blue-600' },
      { id: 'nature-reserve', name: 'Заповедник', icon: '🏞️', color: 'bg-teal-500' }
    ]
  },
  craft: {
    name: "Заповедник",
    imgUrl: "/assets/island_zapovednik.png",
    buildings: [
      { id: 'workshop', name: 'Мастерская', icon: '🔧', color: 'bg-slate-600' },
      { id: 'farm', name: 'Ферма', icon: '🚜', color: 'bg-emerald-600' }
    ]
  },
  science: {
    name: "Остров Науки",
    imgUrl: "/assets/island_laboratory.png",
    buildings: [
      { id: 'laboratory', name: 'Лаборатория', icon: '🧪', color: 'bg-indigo-600' },
      { id: 'bredo', name: 'Бредогенератор', icon: '⚙️', color: 'bg-rose-600' }
    ]
  },
  summit: {
    name: "Пик Изобретателей",
    imgUrl: "/assets/island_tsar.png",
    buildings: [
      { id: 'tsar', name: 'Царь-гора', icon: '🏔️', color: 'bg-violet-600' }
    ]
  }
};

export const AUDIO_TRACKS = [
  { name: "Главная тема", path: "/audio/magical-&-calm.mp3" },
];
