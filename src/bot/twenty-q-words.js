export const TWENTY_Q_WORDS = [
  // Животные лёгкие
  { id: 'cat',        word: 'Кот',              emoji: '🐱', category: 'animal',    difficulty: 1 },
  { id: 'dog',        word: 'Собака',           emoji: '🐶', category: 'animal',    difficulty: 1 },
  { id: 'elephant',   word: 'Слон',             emoji: '🐘', category: 'animal',    difficulty: 1 },
  { id: 'fish',       word: 'Рыба',             emoji: '🐟', category: 'animal',    difficulty: 1 },
  { id: 'butterfly',  word: 'Бабочка',          emoji: '🦋', category: 'animal',    difficulty: 1 },
  // Животные средние
  { id: 'shark',      word: 'Акула',            emoji: '🦈', category: 'animal',    difficulty: 2 },
  { id: 'octopus',    word: 'Осьминог',         emoji: '🐙', category: 'animal',    difficulty: 2 },
  { id: 'penguin',    word: 'Пингвин',          emoji: '🐧', category: 'animal',    difficulty: 2 },
  { id: 'snail',      word: 'Улитка',           emoji: '🐌', category: 'animal',    difficulty: 2 },
  { id: 'bat',        word: 'Летучая мышь',     emoji: '🦇', category: 'animal',    difficulty: 2 },
  // Предметы средние
  { id: 'umbrella',   word: 'Зонтик',           emoji: '☂️', category: 'object',    difficulty: 2 },
  { id: 'piano',      word: 'Пианино',          emoji: '🎹', category: 'object',    difficulty: 2 },
  { id: 'compass',    word: 'Компас',           emoji: '🧭', category: 'object',    difficulty: 2 },
  { id: 'telescope',  word: 'Телескоп',         emoji: '🔭', category: 'object',    difficulty: 3 },
  { id: 'submarine',  word: 'Подводная лодка',  emoji: '🤿', category: 'object',    difficulty: 3 },
  { id: 'lighthouse', word: 'Маяк',             emoji: '🏛️', category: 'object',    difficulty: 2 },
  { id: 'parachute',  word: 'Парашют',          emoji: '🪂', category: 'object',    difficulty: 3 },
  // Природа
  { id: 'volcano',    word: 'Вулкан',           emoji: '🌋', category: 'nature',    difficulty: 2 },
  { id: 'rainbow',    word: 'Радуга',           emoji: '🌈', category: 'phenomenon', difficulty: 3 },
  { id: 'iceberg',    word: 'Айсберг',          emoji: '🧊', category: 'nature',    difficulty: 3 },
  // Явления (сложные)
  { id: 'echo',       word: 'Эхо',              emoji: '📣', category: 'phenomenon', difficulty: 4 },
  { id: 'shadow',     word: 'Тень',             emoji: '🌑', category: 'phenomenon', difficulty: 4 },
  { id: 'lightning',  word: 'Молния',           emoji: '⚡', category: 'phenomenon', difficulty: 3 },
  { id: 'mirage',     word: 'Мираж',            emoji: '🏜️', category: 'phenomenon', difficulty: 4 },
];

export function pickWord(usedIds = []) {
  const available = TWENTY_Q_WORDS.filter(w => !usedIds.includes(w.id));
  const pool = available.length > 0 ? available : TWENTY_Q_WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Простые локальные ответы как fallback без AI
export function localAnswer(question, word) {
  const q = question.toLowerCase();
  const isAnimal = word.category === 'animal';
  const isPhenomenon = word.category === 'phenomenon';
  const isObject = word.category === 'object';
  const isNature = word.category === 'nature';

  if (q.includes('живо') || q.includes('живое') || q.includes('живёт')) return isAnimal ? 'Да' : 'Нет';
  if (q.includes('животн')) return isAnimal ? 'Да' : 'Нет';
  if (q.includes('предмет') || q.includes('вещь')) return isObject ? 'Да' : 'Нет';
  if (q.includes('природ') || q.includes('явлен')) return (isPhenomenon || isNature) ? 'Да' : 'Нет';
  if (q.includes('больш') && (q.includes('человек') || q.includes('людей'))) {
    return ['elephant', 'shark', 'volcano', 'submarine', 'iceberg', 'lighthouse', 'piano'].includes(word.id) ? 'Да' : 'Нет';
  }
  if (q.includes('летает') || q.includes('умеет летать')) {
    return ['butterfly', 'bat', 'parachute', 'lightning'].includes(word.id) ? 'Да' : 'Нет';
  }
  if (q.includes('вод') || q.includes('море') || q.includes('плавает')) {
    return ['shark', 'octopus', 'fish', 'submarine', 'iceberg', 'penguin'].includes(word.id) ? 'Да' : 'Нет';
  }
  if (q.includes('можно потрогать') || q.includes('можно взять') || q.includes('есть дома')) {
    return (isObject) ? 'Да' : 'Нет';
  }
  return null; // не знаю — нужен AI
}
