export const BREDO_ITEMS = [
  // SQL seed items (consistency with bredo_items table)
  { id: 'spoon',        name: 'Ложка',            emoji: '🥄', hint: 'зачерпывает и переносит' },
  { id: 'pencil',       name: 'Карандаш',         emoji: '✏️', hint: 'оставляет след на бумаге' },
  { id: 'button',       name: 'Пуговица',         emoji: '🔘', hint: 'скрепляет ткань' },
  { id: 'chalk',        name: 'Мел',              emoji: '🪨', hint: 'пишет на доске' },
  { id: 'foil',         name: 'Фольга',           emoji: '✨', hint: 'отражает тепло и свет' },
  { id: 'fork',         name: 'Вилка',            emoji: '🍴', hint: 'накалывает и удерживает' },
  { id: 'nail',         name: 'Гвоздь',           emoji: '🔩', hint: 'скрепляет твёрдые материалы' },
  { id: 'key',          name: 'Ключ',             emoji: '🔑', hint: 'открывает и закрывает замки' },
  { id: 'ruler',        name: 'Линейка',          emoji: '📏', hint: 'измеряет длину, проводит прямые' },
  { id: 'glass_water',  name: 'Стакан воды',      emoji: '🥛', hint: 'содержит жидкость' },
  // Extended items
  { id: 'magnet',       name: 'Магнит',           emoji: '🧲', hint: 'притягивает металл' },
  { id: 'straw',        name: 'Соломинка',         emoji: '🥤', hint: 'через неё можно дуть' },
  { id: 'rubber_band',  name: 'Резинка',           emoji: '🔴', hint: 'растягивается и сжимается' },
  { id: 'paperclip',   name: 'Скрепка',           emoji: '📎', hint: 'держит бумаги вместе' },
  { id: 'mirror',       name: 'Зеркало',           emoji: '🪞', hint: 'отражает свет' },
  { id: 'sponge',       name: 'Губка',             emoji: '🧽', hint: 'впитывает воду' },
  { id: 'spring',       name: 'Пружина',           emoji: '🌀', hint: 'сжимается и разжимается' },
  { id: 'balloon',      name: 'Воздушный шарик',  emoji: '🎈', hint: 'надувается воздухом' },
  { id: 'ice',          name: 'Лёд',               emoji: '🧊', hint: 'холодный, тает при нагреве' },
  { id: 'coin',         name: 'Монета',            emoji: '🪙', hint: 'плоская, металлическая' },
  { id: 'rope',         name: 'Верёвка',           emoji: '🪢', hint: 'гибкая, прочная' },
  { id: 'lens',         name: 'Лупа',              emoji: '🔍', hint: 'увеличивает предметы' },
  { id: 'feather',      name: 'Перо',              emoji: '🪶', hint: 'лёгкое, мягкое' },
  { id: 'candle',       name: 'Свеча',             emoji: '🕯️', hint: 'горит и нагревает' },
  { id: 'wheel',        name: 'Колесо',            emoji: '⚙️', hint: 'крутится вокруг оси' },
  { id: 'bucket',       name: 'Ведро',             emoji: '🪣', hint: 'хранит и переносит жидкость' },
  { id: 'needle',       name: 'Иголка',            emoji: '🪡', hint: 'острая, тонкая' },
  { id: 'funnel',       name: 'Воронка',           emoji: '🔻', hint: 'направляет поток' },
  { id: 'shadow',       name: 'Тень',              emoji: '🌑', hint: 'форма без вещества' },
  { id: 'echo',         name: 'Эхо',               emoji: '📣', hint: 'звук, который возвращается' },
  { id: 'umbrella',     name: 'Зонтик',            emoji: '☂️', hint: 'раскрывается и закрывается' },
  { id: 'paperclip2',  name: 'Булавка',           emoji: '📌', hint: 'острая, держит ткань' },
  { id: 'soap',         name: 'Мыло',              emoji: '🧼', hint: 'скользкое, пенится в воде' },
  { id: 'toothpick',   name: 'Зубочистка',        emoji: '🦷', hint: 'тонкая деревянная палочка' },
];

export function pickItem(usedIds = []) {
  const available = BREDO_ITEMS.filter(i => !usedIds.includes(i.id));
  const pool = available.length > 0 ? available : BREDO_ITEMS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Deterministic daily item — same item for all users on a given day
export function getDailyItem(items = BREDO_ITEMS) {
  const now = new Date();
  const dayIndex = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  return items[dayIndex % items.length];
}
