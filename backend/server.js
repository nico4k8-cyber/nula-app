const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import all tasks from existing structure
const TASKS_DATA = [
  {
    id: 1,
    trick: {
      name: "Наоборот",
      animal: "🐟",
      animalName: "Рыба-брызгун",
      motto: "Переверни — и невозможное станет возможным",
      color: "#ff6b35",
      difficulty: 1,
      building: "🏛️",
      buildingName: "Дворец Инверсии",
    },
    puzzle: {
      emoji: "🍅",
      question: "Почему кетчуп не вытекает из бутылки — а потом вываливается ВЕСЬ?",
      hookSenior: "Трясёшь минуту — ни капли. Ударяешь по дну один раз — льётся. Что меняет один удар?",
      hookJunior: "Трясёшь минуту — ни капли. Бьёшь по дну — льётся. Что происходит внутри?",
      witnesses: [
        { name: "Бутылка", avatar: "🍶", fact: "Кетчуп цепляется за мои стенки и стоит как стена!" },
        { name: "Кетчуп",  avatar: "🟥", fact: "Я густой пока меня не трясут. А когда трясят — становлюсь жидким!" },
      ],
      answer: "Кетчуп — неньютоновская жидкость: густой в покое, мгновенно жидкий от удара. Это называется тиксотропия — свойство менять вязкость под нагрузкой.",
      bonusFact: "Краска для стен работает так же: под кистью течёт легко, а на стене не стекает. Зубная паста, шоколадная глазурь — всё это неньютоновские жидкости.",
    },
    contradiction: {
      intro: "Подожди... тут что-то не сходится 🤔",
      fact1: "Кетчуп должен быть густым — иначе невкусный",
      fact2: "Кетчуп должен легко вытекать — иначе бесит",
      buddyQuestion: "Густой И жидкий одновременно? Природа решила — как бы ты решил? 🤔",
      options: [
        { text: "Перевернуть бутылку! Крышка снизу — гравитация сама вытянет", icon: "💡", temp: "bingo" },
        { text: "Сделать бутылку мягкой — сжал и полилось",                    icon: "🤔", temp: "warm"  },
        { text: "Добавить воды, чтоб пожиже",                                   icon: "🤔", temp: "cold"  },
      ],
      realSolution: "Heinz просто перевернул бутылку крышкой вниз. Кетчуп густой — но гравитация всегда работает. Не надо менять кетчуп — переверни бутылку. Сегодня так устроено большинство бутылок с соусами.",
    },
  },
  {
    id: 2,
    trick: {
      name: "Дробление",
      animal: "🦎",
      animalName: "Ящерица",
      motto: "Отдай часть — сохрани целое",
      color: "#2ec4b6",
      difficulty: 1,
      building: "🏢",
      buildingName: "Башня Осколков",
    },
    puzzle: {
      emoji: "🦎",
      question: "Почему хвост ящерицы дёргается ещё 10 минут после того, как она его отбросила?",
      hookSenior: "Хвост отлетел и двигается сам — без мозга, без тела. Не рефлекс: это запрограммированная стратегия.",
      hookJunior: "Лиса схватила ящерицу за хвост. Ящерица убежала. Хвост остался и дёргался сам ещё 10 минут. Это не случайность.",
      witnesses: [
        { name: "Ящерица", avatar: "🦎", fact: "Хвост дёргается сам — враг смотрит на него, а я в это время убегаю. Хвост вырастет заново!" },
        { name: "Хвост",   avatar: "✂️", fact: "Во мне есть специальные «линии разлома» — как перфорация на билете. Отламываюсь легко и точно в нужном месте." },
      ],
      answer: "В хвосте ящерицы есть встроенные «линии разлома» — специальные хрупкие зоны. Хвост отлетает, продолжает дёргаться (хищник отвлекается), а ящерица уходит. Через несколько недель хвост вырастает снова.",
      bonusFact: "Второй хвост вырастает из хряща, а не из кости. В нём нет позвонков — только хрящевая трубка. И он уже никогда не оторвётся так же легко.",
    },
    contradiction: {
      intro: "Ящерица жертвует частью — и выживает. Инженеры решили ту же задачу. Но тур не сходится 🚀",
      fact1: "Ракета должна брать много топлива — иначе не долетит",
      fact2: "Ракета должна быть лёгкой — иначе не взлетит",
      buddyQuestion: "Тяжёлая И лёгкая? А если она сама себя облегчит по дороге — как? 🤔",
      options: [
        { text: "Сделать ракету из суперлёгкого материала",              icon: "🤔", temp: "warm"  },
        { text: "Сбрасывать пустые баки — стала легче, летит дальше!", icon: "💡", temp: "bingo" },
        { text: "Залить больше топлива и надеяться",                     icon: "🤔", temp: "cold"  },
      ],
      realSolution: "Ракеты сбрасывают пустые ступени по дороге — точь-в-точь как ящерица хвост. Сожгли топливо — сбросили бак. Стала легче → полетела дальше. Так устроены все ракеты с 1957 года.",
    },
  },
  {
    id: 3,
    trick: {
      name: "Посредник",
      animal: "🐠",
      animalName: "Рыба-клоун",
      motto: "Нужен третий — и враги станут союзниками",
      color: "#f4a261",
      difficulty: 2,
      building: "🏰",
      buildingName: "Замок Союза",
    },
    puzzle: {
      emoji: "🪸",
      question: "Как рыба-клоун живёт в смертоносных щупальцах морской анемоны — и не погибает?",
      hookSenior: "Анемона убивает любое животное, которого касается. Кроме одного.",
      hookJunior: "Один укол щупальца — и рыба мертва. Но не эта рыба. Почему?",
      witnesses: [
        { name: "Анемона",    avatar: "🪸", fact: "Я жалю всё, что касается меня. Но рыбка покрыта слизью — и эта слизь похожа на мою собственную. Я принимаю её за часть себя!" },
        { name: "Рыба-клоун", avatar: "🐠", fact: "Я трусь о щупальца по чуть-чуть, снова и снова. Анемона привыкает — и перестаёт жалить. Это занимает несколько дней." },
      ],
      answer: "Рыба-клоун медленно трётся о щупальца анемоны, постепенно покрываясь её собственной слизью. Анемона «считает» рыбку частью себя и перестаёт жалить. Слизь — это пропуск.",
      bonusFact: "Это взаимовыгодно: рыбка прячется и откладывает икру. Взамен она прогоняет рыбу-бабочку, которая поедает щупальца анемоны. Союз двух смертельных врагов.",
    },
    contradiction: {
      intro: "Рыбка стала «своей» через посредника. Инженеры сделали то же с клеем. Но тут не сходится 🗒️",
      fact1: "Клей должен крепко держать — иначе бесполезен",
      fact2: "Клей должен легко отпускать — иначе не переклеить",
      buddyQuestion: "Крепкий И отпускающий одновременно? Как бы ты решил? 🤔",
      options: [
        { text: "Клей с растворителем — нагрел и отклеил",                       icon: "🤔", temp: "warm"  },
        { text: "Просто сделать клей слабее",                                     icon: "🤔", temp: "cold"  },
        { text: "Клей цепляется к поверхности слабо, но надёжно — как стикер!", icon: "💡", temp: "bingo" },
      ],
      realSolution: "Так появились стикеры Post-it. Случайно: химик Спенсер Силвер сделал «слишком слабый» клей. Пять лет он пылился в ящике — пока коллега не использовал его для закладок. Клей-посредник между бумагой и поверхностью.",
    },
  },
  {
    id: 4,
    trick: {
      name: "Фазовый переход",
      animal: "🪲",
      animalName: "Жук-бомбардир",
      motto: "Измени состояние вещества — и обычное станет оружием",
      color: "#8338ec",
      difficulty: 2,
      building: "🏭",
      buildingName: "Завод Превращений",
    },
    puzzle: {
      emoji: "💥",
      question: "Почему жук-бомбардир буквально взрывается изнутри — но сам не погибает?",
      hookSenior: "Внутри жука температура 100°C и давление как в паровом котле. Он делает это специально.",
      hookJunior: "Жук взрывается внутри себя, чтобы отстреливаться от врагов. Как он не сваривается?",
      witnesses: [
        { name: "Жук",   avatar: "🪲", fact: "В моём брюшке две отдельные камеры: в одной — перекись водорода, в другой — фермент. Смешиваются только когда мне угрожают!" },
        { name: "Химик", avatar: "🧪", fact: "При смешивании — мгновенная реакция: температура 100°C. Жидкость превращается в пар и вылетает как из пушки — со скоростью 10 метров в секунду." },
      ],
      answer: "В жуке две камеры с разными веществами. При опасности они смешиваются — реакция мгновенно даёт 100°C. Жидкость превращается в пар и вылетает как выстрел. Жук управляет углом и направлением.",
      bonusFact: "Жук-бомбардир поворачивает «дуло» почти в любую сторону, включая назад. Скорость струи — около 10 метров в секунду. Именно эту химическую «пушку» изучают для создания новых распылителей.",
    },
    contradiction: {
      intro: "Жук смешивает два вещества в нужный момент. Пожарные придумали то же. Но тур не сходится 🔥",
      fact1: "Пожарный шланг должен быть тонким — чтобы добросить воду далеко",
      fact2: "Пожарный шланг должен быть широким — чтобы воды хватало",
      buddyQuestion: "Тонкий И широкий по ситуации? Как жук меняет выстрел — так и тур? 🤔",
      options: [
        { text: "Два разных шланга — выбирай нужный",                            icon: "🤔", temp: "warm"  },
        { text: "Насадка! Меняешь форму струи — тонкая или широкая по ситуации", icon: "💡", temp: "bingo" },
        { text: "Сделать шланг средним — и так, и так",                          icon: "🤔", temp: "cold"  },
      ],
      realSolution: "Насадки на пожарный шланг — точно как у жука! Узкая струя — бьёт далеко и точно. Широкий веер — накрывает близкое пространство. Один шланг, разные режимы. Жук решил это 300 миллионов лет назад.",
    },
  },
  {
    id: 5,
    trick: {
      name: "Эхо",
      animal: "🦇",
      animalName: "Летучая мышь",
      motto: "Отправь сигнал — и мир сам расскажет о себе",
      color: "#0ea5e9",
      difficulty: 3,
      building: "🏫",
      buildingName: "Школа Отклика",
    },
    puzzle: {
      emoji: "🦇",
      question: "Как летучая мышь летит на скорости 50 км/ч в полной темноте — и ни разу не врезается?",
      hookSenior: "В пещере нет ни луча света. Мышь ориентируется с точностью до сантиметра. Не глазами.",
      hookJunior: "Абсолютная темнота. Мышь летит быстрее велосипедиста. И не врезается. Как?",
      witnesses: [
        { name: "Летучая мышь", avatar: "🦇", fact: "Я кричу ультразвуком — вы его не слышите. И слушаю эхо. По задержке — знаю расстояние до любого предмета!" },
        { name: "Физик",        avatar: "🔬", fact: "Звук летит 340 м/с. Эхо от стены в 1 метре вернётся через 6 миллисекунд. Мозг мыши различает задержки в одну миллисекунду!" },
      ],
      answer: "Летучая мышь постоянно кричит ультразвуком и слушает эхо. Чем дольше звук возвращается — тем дальше объект. Мозг мыши строит карту пространства по звуку точнее, чем большинство камер по свету.",
      bonusFact: "Первый военный сонар для подводных лодок создали в годы Первой мировой войны — прямо скопировав принцип летучей мыши. Сегодня так же работает УЗИ и парктроник в машине.",
    },
    contradiction: {
      intro: "Мышь «видит» звуком. Подводные лодки взяли это себе. Но тур не сходится 🌊",
      fact1: "Подводная лодка должна быть невидимой — нельзя включать свет",
      fact2: "Подводная лодка должна знать где препятствия — иначе врежется",
      buddyQuestion: "Невидимая И видящая? Мышь умеет — как? 🤔",
      options: [
        { text: "Использовать тепловую камеру — тепло видно в темноте",  icon: "🤔", temp: "warm"  },
        { text: "Плыть медленно и аккуратно на ощупь",                   icon: "🤔", temp: "cold"  },
        { text: "Послать звуковой импульс и слушать эхо — как мышь!", icon: "💡", temp: "bingo" },
      ],
      realSolution: "Сонар — точная копия летучей мыши. Посылает звуковой импульс — слушает эхо. По задержке и направлению — рисует карту дна и препятствий. Мышь изобрела это 52 миллиона лет назад. Люди — в Первую мировую.",
    },
  },
  {
    id: 6,
    trick: {
      name: "Слои",
      animal: "🐦",
      animalName: "Дятел",
      motto: "Раздели удар на части — и каждая часть переживёт его",
      color: "#16a34a",
      difficulty: 3,
      building: "🏗️",
      buildingName: "Укрепление Слоёв",
    },
    puzzle: {
      emoji: "🐦",
      question: "Почему дятел долбит дерево 20 раз в секунду — и никогда не получает сотрясение мозга?",
      hookSenior: "Каждый удар — перегрузка в 1000g. Человек теряет сознание при 5g. Дятел делает это всю жизнь.",
      hookJunior: "20 ударов в секунду. Всю жизнь. Ни одного сотрясения. Что у него в голове?",
      witnesses: [
        { name: "Дятел",    avatar: "🐦", fact: "Мой череп — как матрёшка. Несколько слоёв разной плотности. Каждый слой поглощает часть удара — ни один не перегружается!" },
        { name: "Инженер",  avatar: "🛡️", fact: "Пенопласт работает так же: тысячи воздушных ячеек, каждая принимает крошечный удар. Вместе — полностью безопасно. Это называется демпфирование." },
      ],
      answer: "Череп дятла — несколько слоёв разной плотности. Каждый слой поглощает свою часть энергии удара. Плюс: длинный язык обматывает черепную коробку снаружи, как ремень безопасности. Никакой слой не перегружается.",
      bonusFact: "Структуру черепа дятла изучают для создания лучших велосипедных и военных шлемов. Несколько слоёв разной жёсткости поглощают удар эффективнее, чем один толстый слой.",
    },
    contradiction: {
      intro: "Дятел научил инженеров. Шлем велосипедиста — та же задача. Но тур не сходится ⛑️",
      fact1: "Шлем должен быть твёрдым снаружи — иначе острый предмет пробьёт",
      fact2: "Шлем должен быть мягким внутри — иначе удар не поглотится",
      buddyQuestion: "Твёрдый И мягкий? Как череп дятла — снаружи и внутри разные? 🤔",
      options: [
        { text: "Сделать шлем очень толстым из одного материала",            icon: "🤔", temp: "warm"  },
        { text: "Слои! Твёрдый пластик снаружи + мягкий пенопласт внутри", icon: "💡", temp: "bingo" },
        { text: "Надуть воздушную подушку внутри",                           icon: "🤔", temp: "cold"  },
      ],
      realSolution: "Все шлемы мира устроены как череп дятла: твёрдый пластик снаружи + пенопласт внутри. Пенопласт — тысячи ячеек, каждая поглощает крошечную часть удара. Дятел изобрёл это 25 миллионов лет назад.",
    },
  },

  {
    id: 7,
    trick: {
      name: "Тонущая деревня",
      animal: "🐉",
      animalName: "Мудрый дракон",
      motto: "Много способов — выбери самый красивый",
      color: "#0ea5e9",
      difficulty: 2,
      building: "🏘️",
      buildingName: "Деревня у озера",
    },
    puzzle: {
      emoji: "🌊",
      question: "Деревня затапливается! Вода поднимается каждый сезон. Как спасти мои дома?",
      hookSenior: "Вода не прошу уходить — она вернётся. Дождик идёт каждый год. Какое решение работает ПОТОМ, когда дождь идёт снова?",
      hookJunior: "Вода всегда возвращается. Дождик пойдёт ещё. Нужно что-то, что работает БЕЗ повторений.",
      witnesses: [
        { name: "Вода", avatar: "💧", fact: "Я приду снова и снова. Каждый сезон дождей я поднимаюсь. Нужно решение, которое работает всегда." },
        { name: "Старик деревни", avatar: "👴", fact: "40 лет живу здесь. Видел много решений. Одни трудоёмкие, другие просто красивые. Природа сама решает задачу." },
      ],
      answer: "Есть 10 разных способов спасти деревню. Некоторые требуют много работы, но срочно. Другие кажутся магией — природа сама их делает. Самое красивое — когда вода сама уходит, не требуя повторений.",
      bonusFact: "По всему миру люди спасают города от наводнений. Каждый способ — это один из 10 классов: откачивание, дренаж, испарение, впитывание, поднять город, нагреть, разделить, барьер, использовать воду, подготовиться заранее.",
    },
    contradiction: {
      intro: "Вода затапливает — но её нельзя запретить приходить 🌊",
      fact1: "Вода повторяется каждый сезон — задача не одноразовая",
      fact2: "Нам нужно решение, которое работает ВЕЧНО или само по себе",
      buddyQuestion: "Какое из 10 способов самое красивое? Вот это задача! Давай вместе найдём 🤔",
      options: [
        { text: "Откачивание вверх — берём ведро/насос и откачиваем", icon: "🪣", temp: "cold", class_id: "pump_out", principles: [4, 2], elegance: "⭐", problem: "⚠️ Дождик идёт снова → нужно повторять" },
        { text: "Дренаж в землю — выкопать яму и подземные трубы", icon: "⛏️", temp: "warm", class_id: "drainage", principles: [28, 7, 21], elegance: "⭐⭐", problem: "⚠️ При сильном дожде дренаж переполняется" },
        { text: "Испарение в облака — вода становится паром и улетает сама!", icon: "☁️", temp: "bingo", class_id: "evaporation", principles: [15, 35, 26], elegance: "⭐⭐⭐", advantage: "✨ Работает вечно без повторений!" },
        { text: "Впитывание губкой — положить песок/щебень, они впитают", icon: "🧽", temp: "warm", class_id: "absorption", principles: [31, 24], elegance: "⭐⭐", problem: "⚠️ Материал потом нужно сушить" },
        { text: "Поднять деревню выше — построить дома на холме или сваях", icon: "🏔️", temp: "cold", class_id: "raise_village", principles: [8, 13], elegance: "⭐", problem: "⚠️ Дорогое и трудоёмкое строительство" },
        { text: "Локальный нагрев — солнце или костёр чтобы вода испарилась", icon: "🔥", temp: "warm", class_id: "local_heat", principles: [3, 15], elegance: "⭐⭐", problem: "⚠️ Нижние слои остаются" },
        { text: "Разделение воды — выкопать каналы чтоб вода разошлась ручейками", icon: "🌊", temp: "warm", class_id: "separation", principles: [1, 2], elegance: "⭐⭐", problem: "⚠️ Каждый ручей всё ещё нужно отводить" },
        { text: "Барьер — построить дамбу или стену чтоб вода не прошла", icon: "🚧", temp: "warm", class_id: "barrier", principles: [1, 11], elegance: "⭐⭐", problem: "⚠️ Вода давит на барьер — нужна инженерия" },
        { text: "Использовать воду — создать пруд для рыбы или орошения!", icon: "🐟", temp: "bingo", class_id: "use_water", principles: [20, 26], elegance: "⭐⭐⭐", advantage: "✨ Противоречие снято! Вода нужна и не вредит!" },
        { text: "Подготовка заранее — поднять дома на сваи ДО сезона дождей", icon: "📋", temp: "bingo", class_id: "preparation", principles: [10, 11], elegance: "⭐⭐⭐", advantage: "✨ Когда вода придёт, защита уже есть!" },
      ],
      realSolution: "Все 10 способов — валидные! Разные города выбирают разные решения. Венеция использовала барьеры и каналы. Нидерланды — дренаж и подготовку. Природные озёра работают через испарение и впитывание. Твой выбор сейчас — какое решение тебе нравится? Красивое или срочное?",
    },
  },
];

// Dynamically generate tasks 8-40 (placeholders with proper structure)
const taskLoader = require('./load-tasks');
const generatedTasks = taskLoader.generatePlaceholderTasks(8, 40);
TASKS_DATA.push(...generatedTasks);

// Weight mapping for scoring
const SCORE_WEIGHTS = {
  'bingo': 3,
  'warm': 2,
  'cold': 1,
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/tasks/:taskId
app.get('/api/tasks/:taskId', (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const task = TASKS_DATA.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Return task without revealing answer options weights (those are for scoring)
  const safeTask = {
    id: task.id,
    trick: task.trick,
    puzzle: task.puzzle,
    contradiction: {
      intro: task.contradiction.intro,
      fact1: task.contradiction.fact1,
      fact2: task.contradiction.fact2,
      buddyQuestion: task.contradiction.buddyQuestion,
      options: task.contradiction.options.map(opt => ({
        text: opt.text,
        icon: opt.icon,
        // temp/weight not exposed to client
      })),
      // realSolution only revealed after scoring
    },
  };

  res.json(safeTask);
});

// POST /api/tasks/:taskId/validate-answer
// Expected body: { answer, userId, sessionId, source (optional) }
app.post('/api/tasks/:taskId/validate-answer', (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const { answer, userId, sessionId, source } = req.body;

  const task = TASKS_DATA.find(t => t.id === taskId);
  if (!task || !task.contradiction || !task.contradiction.options) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Score answer against options using substring matching (tolerant)
  let bestScore = 0;
  let chosenOption = null;
  const answerLower = answer.toLowerCase().trim();

  task.contradiction.options.forEach(option => {
    const optionLower = option.text.toLowerCase();

    // Simple substring matching (TODO: improve with Levenshtein distance + NLU)
    if (optionLower.includes(answerLower) || answerLower.includes(optionLower)) {
      const weight = SCORE_WEIGHTS[option.temp] || 0;
      if (weight > bestScore) {
        bestScore = weight;
        chosenOption = option;
      }
    }
  });

  // Even if no exact match, check for keyword overlap (TODO: NLU)
  if (bestScore === 0) {
    // Try to match partial concepts
    const answerWords = answerLower.split(/\s+/);
    task.contradiction.options.forEach(option => {
      const optionWords = option.text.toLowerCase().split(/\s+/);
      const overlap = answerWords.filter(w => optionWords.some(ow => ow.includes(w) || w.includes(ow))).length;
      if (overlap > 0) {
        const weight = SCORE_WEIGHTS[option.temp] || 0;
        if (weight > bestScore) {
          bestScore = weight;
          chosenOption = option;
        }
      }
    });
  }

  const earnsCrystal = bestScore >= 2;

  res.json({
    isCorrect: bestScore >= 2,
    score: bestScore,
    earnsCrystal,
    feedback: bestScore === 3
      ? '✓ Отлично! Идеальное решение!'
      : bestScore === 2
        ? '✓ Хорошо! Это рабочее решение.'
        : '◐ Интересно, но есть получше. Подумай ещё.',
    chosenOption: chosenOption ? {
      text: chosenOption.text,
      temp: chosenOption.temp,
    } : null,
    realSolution: task.contradiction.realSolution,
    trizInsight: `Принцип: ${task.trick.name} — ${task.trick.motto}`,
    puzzleAnswer: task.puzzle.answer,
    bonusFact: task.puzzle.bonusFact,
    source,
    userId,
    sessionId,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/log-answer — for analytics (later: PostgreSQL)
app.post('/api/log-answer', (req, res) => {
  const { userId, taskId, score, source } = req.body;
  const timestamp = new Date().toISOString();

  // TODO: Store in PostgreSQL
  console.log(`[${timestamp}] Analytics: User=${userId}, Task=${taskId}, Score=${score}, Source=${source}`);

  res.json({
    logged: true,
    timestamp,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ SHARIEL Backend запущен на http://localhost:${PORT}`);
  console.log(`\n📋 API Routes:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/tasks/:taskId`);
  console.log(`   POST /api/tasks/:taskId/validate-answer`);
  console.log(`   POST /api/log-answer\n`);
  console.log(`📊 Loaded ${TASKS_DATA.length} tasks`);
  console.log(`📝 Ready for Phase 1.5 development\n`);
});
