export const TASKS = [
  /* --- УРОВЕНЬ 1: "Азбука ТРИЗ" (1-15) --- */
  // БИБЛИОТЕКА (Сказки)
  {
    id: 1,
    category: "library",
    title: "Башня Рапунцель",
    title_en: "Rapunzel's Tower",
    icon: "🏰",
    teaser: "Как принцу забраться наверх без лестниц?",
    teaser_en: "How can a prince climb up without ladders?",
    difficulty: 1,
    core_problem: { need: "забраться на вершину башни", obstacle: "нет дверей, лестниц и выступов" },
    ikr: "Принц сам оказывается наверху, используя то, что уже есть в башне",
    resources: [{ id: "волосы", properties: "очень длинные, крепкие" }],
    trick: { name: "Посредник", animal: "👱‍♀️", animalName: "Коса" },
    customer: { name: "Принц", emoji: "🤴" },
    idea_analysis: {
      "волос": {
        good_hints: ["Волосы Рапунцель очень длинные и крепкие, как настоящая лестница!"],
        bad_hints: ["Если Рапунцель не будет держать волосы, принц упадет"],
        consequence_push: ["Как принцу объяснить Рапунцель, что ей нужно сделать?"]
      },
      "канат": {
        good_hints: ["Хорошая мысль! Канат помог бы. Но где его взять в лесу?"],
        bad_hints: ["Стены башни слишком гладкие, канат не за что зацепить"],
        consequence_push: ["Может быть, в башне уже есть что-то длинное и прочное?"]
      }
    },
    traps: {
      markers: ["помощь", "кричать", "стража", "дверь", "проломить"],
      reaction: "В башне нет дверей, а стены слишком крепкие. Нужно найти способ подняться, используя то, что есть у Рапунцель!"
    },
    puzzle: { 
      emoji: "👱‍♀️", 
      question: "У башни нет дверей. Как принцу попасть к Рапунцель?",
      answer: "Использовать длинные волосы Рапунцель как канат."
    }
  },
  {
    id: 2,
    category: "library",
    title: "Темный лабиринт",
    title_en: "Dark labyrinth",
    icon: "🧭",
    teaser: "Тесей ищет выход из логова Минотавра",
    teaser_en: "Theseus is looking for a way out of the Minotaur's lair",
    difficulty: 1,
    core_problem: { need: "найти дорогу обратно", obstacle: "в лабиринте много поворотов и полная темнота" },
    ikr: "Дорога сама ведет Тесея к выходу",
    resources: [{ id: "нитка", properties: "длинная, тонкая, тянется бесконечно" }],
    trick: { name: "Нить Ариадны", animal: "🧶", animalName: "Клубок" },
    customer: { name: "Тесей", emoji: "⚔️" },
    idea_analysis: {
      "нитк": {
        good_hints: ["Нить — это самый простой способ пометить путь и не потеряться!"],
        bad_hints: ["Если нить порвется, Тесей останется в ловушке"],
        consequence_push: ["За что Тесей должен завязать кончик нити перед входом?"]
      },
      "фонар": {
        good_hints: ["Свет помог бы увидеть дорогу, но лабиринт слишком огромный."],
        bad_hints: ["Масло в фонаре или батарейки могут закончиться"],
        consequence_push: ["Как найти путь назад, даже если у тебя завязаны глаза?"]
      }
    },
    traps: {
      markers: ["карта", "запомнить", "сердце", "чутье", "стены"],
      reaction: "В лабиринте слишком много поворотов, их все не запомнить. Нужно оставить физический след!"
    },
    puzzle: { 
      emoji: "🧶", 
      question: "Как не заблудиться в лабиринте, если карты нет?",
      answer: "Разматывать клубок ниток по пути туда и возвращаться по нему."
    }
  },
  {
    id: 3,
    category: "library",
    title: "Шипы терновника",
    title_en: "thorns",
    icon: "🌿",
    teaser: "Как пройти сквозь колючки Спящей красавицы?",
    teaser_en: "How to get through the thorns of Sleeping Beauty?",
    difficulty: 1,
    core_problem: { need: "пробраться в замок", obstacle: "лес из терновника рвет одежду и не пускает" },
    ikr: "Терновник сам расступается или перестает мешать",
    resources: [
      { id: "огонь", properties: "горячий, сжигает ветки" }, 
      { id: "доски", properties: "твердые, можно идти сверху" },
      { id: "металл", properties: "прочный, не боится шипов" }
    ],
    trick: { name: "Изменение свойств", animal: "🧚‍♀️", animalName: "Фея" },
    customer: { name: "Король", emoji: "👑" },
    idea_analysis: {
      "огонь": {
        good_hints: ["Огонь быстро расчистит путь, превратив кусты в пепел!"],
        bad_hints: ["Огонь может перекинуться на замок"],
        consequence_push: ["Как потушить огонь после того, как путь будет расчищен?"]
      },
      "доск": {
        good_hints: ["Положить настил поверх колючек — это очень безопасно!"],
        bad_hints: ["Понадобится очень много досок для всего леса"],
        consequence_push: ["Что еще можно использовать как настил, если досок не хватит?"]
      }
    },
    traps: {
      markers: ["пробежать", "быстро", "ножницы", "рубить", "топор"],
      reaction: "Кусты растут слишком быстро, их не перерубить. Нужно либо уничтожить их, либо обойти сверху!"
    },
    puzzle: { 
      emoji: "🧚‍♀️", 
      question: "Колючий лес преградил путь. Как пройти сквозь него?",
      answer: "Сжечь кусты или проложить мост поверх колючек."
    }
  },

  // ЗАПОВЕДНИК (Природа)
  {
    id: 4,
    category: "nature-reserve",
    title: "Узкий кувшин",
    title_en: "Narrow jug",
    icon: "🏺",
    teaser: "Жажда в лесу: как попить из глубокого сосуда?",
    teaser_en: "Thirst in the forest: how to drink from a deep vessel?",
    difficulty: 1,
    core_problem: { need: "достать воду со дна", obstacle: "голова не пролезает в узкое горлышко" },
    ikr: "Вода сама поднимается к клюву",
    resources: [{ id: "камни", properties: "тяжелые, вытесняют объем" }],
    trick: { name: "Вытеснение", animal: "🐦", animalName: "Ворона" },
    customer: { name: "Ворона", emoji: "🐦" },
    puzzle: { 
      emoji: "🐦", 
      question: "Вода на дне кувшина. Как птице попить, не разбивая сосуд?",
      answer: "Бросать камни внутрь — они вытеснят воду вверх."
    }
  },
  {
    id: 5,
    category: "nature-reserve",
    title: "Лесной холодильник",
    title_en: "Forest refrigerator",
    icon: "❄️",
    teaser: "Как сохранить еду в жару без электричества?",
    teaser_en: "How to preserve food in hot weather without electricity?",
    difficulty: 1,
    core_problem: { need: "охладить продукты", obstacle: "вокруг только лес и жаркое солнце" },
    ikr: "Природа сама держит еду в холоде",
    resources: [
      { id: "ручей", properties: "вода холодная, течет постоянно" }, 
      { id: "земля", properties: "глубоко внизу всегда прохладно" },
      { id: "песок", properties: "влажный песок охлаждает при испарении" }
    ],
    trick: { name: "Локальный ресурс", animal: "🐻", animalName: "Медведь" },
    customer: { name: "Медведь", emoji: "🐻" },
    idea_analysis: {
      "ручей": {
        good_hints: ["Вода в ручье ледяная даже летом — это отличный холод!"],
        bad_hints: ["Продукты могут уплыть, если их не закрепить"],
        consequence_push: ["Как сделать так, чтобы ручей не унес твой обед?"]
      },
      "яма": {
        good_hints: ["Глубоко в земле всегда прохладно, как в погребе!"],
        bad_hints: ["Звери могут учуять запах и выкопать еду"],
        consequence_push: ["Чем накрыть яму, чтобы холод не выходил, а звери не нашли?"]
      }
    },
    traps: {
      markers: ["холодильник", "лед", "морозилка", "электричество", "батарейка"],
      reaction: "В лесу нет розеток и льда. Посмотри вокруг: что само по себе холодное?"
    },
    puzzle: { 
      emoji: "🍎", 
      question: "В лесу жарко. Как спасти продукты от пропадания?",
      answer: "Опустить в холодный ручей или закопать глубоко в яму."
    }
  },
  {
    id: 6,
    category: "nature-reserve",
    title: "Следы воришки",
    title_en: "Traces of a thief",
    icon: "🐾",
    teaser: "Кто ворует припасы по ночам?",
    teaser_en: "Who steals supplies at night?",
    difficulty: 1,
    core_problem: { need: "увидеть вора", obstacle: "он приходит ночью, когда все спят" },
    ikr: "Вор сам оставляет подсказку о себе",
    resources: [
      { id: "песок", properties: "мягкий, на нем легко рисовать" }, 
      { id: "зола", properties: "черная, сильно пачкает лапы" },
      { id: "мука", properties: "белая, видна в темноте" }
    ],
    trick: { name: "Следы на песке", animal: "🦊", animalName: "Лис" },
    customer: { name: "Лис", emoji: "🦊" },
    idea_analysis: {
      "песок": {
        good_hints: ["Мягкий песок — отличная ловушка для отпечатков!"],
        bad_hints: ["Ветер может сдуть следы утром"],
        consequence_push: ["Как сделать песок ровным, чтобы каждый шаг был виден?"]
      },
      "мука": {
        good_hints: ["Белая мука на воре — его будет видно издалека!"],
        bad_hints: ["Вор может её съесть!"],
        consequence_push: ["А достаточно ли у нас муки, чтобы посыпать всё вокруг?"]
      }
    },
    traps: {
      markers: ["камера", "фонарик", "фото", "сигнализация", "не спать"],
      reaction: "Ночью вор очень тихий и осторожный. Нужно что-то, что сработает само, пока ты спишь!"
    },
    puzzle: { 
      emoji: "🐾", 
      question: "Как узнать, кто портит еду в лагере ночью?",
      answer: "Рассыпать муку, пепел или песок вокруг — вор оставит следы."
    }
  },

  // МЭРИЯ (Социум / Быт)
  {
    id: 7,
    category: "city-hall",
    title: "Тонкий лед",
    title_en: "Thin Ice",
    icon: "🧊",
    teaser: "Спасение на реке: как не провалиться самому?",
    teaser_en: "Rescue on the river: how not to fail yourself?",
    difficulty: 1,
    core_problem: { need: "вытащить человека", obstacle: "лед очень тонкий, близко подходить нельзя" },
    ikr: "Тяжесть спасателя распределяется по большой площади",
    resources: [
      { id: "доска", properties: "длинная, плоская" }, 
      { id: "одежда", properties: "можно связать в канат" },
      { id: "лестница", properties: "жесткая, длинная" }
    ],
    trick: { name: "Распределение веса", animal: "👮", animalName: "Пожарный" },
    customer: { name: "Мэр", emoji: "🏛️" },
    idea_analysis: {
      "доск": {
        good_hints: ["Доска распределяет вес — так лед под тобой не треснет!"],
        bad_hints: ["Доску нужно толкать очень осторожно"],
        consequence_push: ["Как лечь на доску, чтобы еще сильнее уменьшить давление на лед?"]
      },
      "одежд": {
        good_hints: ["Связать куртки — отличный способ сделать спасательный канат!"],
        bad_hints: ["Узлы могут развязаться"],
        consequence_push: ["Сколько вещей нам понадобится, чтобы достать до полыньи?"]
      }
    },
    traps: {
      markers: ["бежать", "быстро", "прыгнуть", "подплыть", "лодка"],
      reaction: "Лед слишком тонкий, он проломится под любым шагом. Нужно найти способ дотянуться, оставаясь на безопасном расстоянии или лежа!"
    },
    puzzle: { 
      emoji: "🆘", 
      question: "Лед трещит. Продвигаться к человеку опасно. Что делать?",
      answer: "Ползти по длинной доске или бросить связанную одежду."
    }
  },
  {
    id: 8,
    category: "city-hall",
    title: "Горячий каштан",
    title_en: "Hot chestnut",
    icon: "🔥",
    teaser: "Как достать вещь из костра без ожогов?",
    teaser_en: "How to get something out of a fire without getting burned?",
    difficulty: 1,
    core_problem: { need: "вытащить предмет", obstacle: "угли очень горячие, руки обжигает" },
    ikr: "Руки остаются защищенными от жара",
    resources: [
      { id: "палки", properties: "длинные, как щипцы" }, 
      { id: "земля", properties: "холодная, тушит жар" },
      { id: "вода", properties: "тушит огонь, но может пойти пар" }
    ],
    trick: { name: "Посредник", animal: "🧤", animalName: "Рукавица" },
    customer: { name: "Кулинар", emoji: "👨‍🍳" },
    idea_analysis: {
      "палк": {
        good_hints: ["Две палки — это идеальные щипцы, чтобы достать каштан!"],
        bad_hints: ["Палка может загореться, если держать долго"],
        consequence_push: ["Как держать палки, чтобы каштан не выскользнул обратно?"]
      },
      "земл": {
        good_hints: ["Засыпать угли землей — самый быстрый способ остудить их!"],
        bad_hints: ["Каштан станет грязным"],
        consequence_push: ["Сможем ли мы найти каштан под слоем земли?"]
      }
    },
    traps: {
      markers: ["рука", "быстро", "схватить", "прыгнуть", "перчатки"],
      reaction: "Угли светятся красным — жар мгновенный. Руки не защитят даже перчатки. Нужно использовать то, что лежит вокруг костра!"
    },
    puzzle: { 
      emoji: "🌰", 
      question: "Ключик упал в огонь. Как его достать прямо сейчас?",
      answer: "Использовать две палки как щипцы или присыпать место землей."
    }
  },
  {
    id: 9,
    category: "city-hall",
    title: "Вода в решете",
    title_en: "Water in a sieve",
    icon: "🥣",
    teaser: "Спор двух Иванов: как носить воду в дырках?",
    teaser_en: "Dispute between two Ivans: how to carry water in holes?",
    difficulty: 1,
    core_problem: { need: "удержать воду", obstacle: "в решете много мелких дырок" },
    ikr: "Вода сама не выливается из дырок",
    resources: [
      { id: "мороз", properties: "сильный, зимний, замораживает все вокруг" }, 
      { id: "воск", properties: "липкий, может заклеить дырки" }
    ],
    trick: { name: "Фазовый переход", animal: "❄️", animalName: "Снежинка" },
    customer: { name: "Иван", emoji: "🧔" },
    idea_analysis: {
      "мороз": {
        good_hints: ["Лед не провалится в дырки — это блестящее решение!"],
        bad_hints: ["Нужно долго ждать, пока вода замерзнет"],
        consequence_push: ["Как мы будем использовать это решето со льдом потом?"]
      },
      "воск": {
        good_hints: ["Заклеить дырки — это хитро. Но останется ли это решетом?"],
        bad_hints: ["Воды может быть слишком много для воска"],
        consequence_push: ["Что если вода будет горячей и воск расплавится?"]
      }
    },
    traps: {
      markers: ["клей", "скотч", "пальцы", "заткнуть", "быстро"],
      reaction: "Дырок слишком много, пальцев не хватит! Нужно изменить саму воду, чтобы она перестала быть жидкой."
    },
    puzzle: { 
      emoji: "🥣", 
      question: "Можно ли принести воду в решете? Как это сделать?",
      answer: "Заморозить воду — лед не провалится сквозь дырки."
    }
  },

  // ФЕРМА (Агро)
  {
    id: 10,
    category: "farm",
    title: "Атака птиц",
    title_en: "Bird attack",
    icon: "🕊️",
    teaser: "Как спасти вишню от налета пернатых?",
    teaser_en: "How to save cherries from bird attacks?",
    difficulty: 1,
    core_problem: { need: "отпугнуть птиц", obstacle: "чучела они уже не боятся" },
    ikr: "Дерево само пугает птиц звуком или блеском",
    resources: [
      { id: "CD-диски", properties: "очень сильно блестят на солнце" }, 
      { id: "фольга", properties: "шуршит и сверкает" },
      { id: "ветер", properties: "двигает предметы" }
    ],
    trick: { name: "Визуальный эффект", animal: "🍒", animalName: "Вишенка" },
    customer: { name: "Садовник", emoji: "👨‍🌾" },
    idea_analysis: {
      "диск": {
        good_hints: ["Блеск дисков пугает птиц, потому что они принимают его за глаза хищника!"],
        bad_hints: ["Птицы могут привыкнуть, если диски не будут шевелиться"],
        consequence_push: ["Как сделать так, чтобы диски на дереве постоянно крутились?"]
      },
      "фольг": {
        good_hints: ["Фольга и шуршит, и блестит — двойная защита!"],
        bad_hints: ["Дождь может прибить фольгу к веткам"],
        consequence_push: ["Как закрепить фольгу, чтобы она развевалась на ветру?"]
      }
    },
    traps: {
      markers: ["сетка", "убить", "ружье", "собака", "кошка", "яд"],
      reaction: "Птиц очень много, а мы хотим спасти урожай мирно. Нужно что-то, что будет пугать их само по себе, без участия человека или животных!"
    },
    puzzle: { 
      emoji: "🍒", 
      question: "Птицы клюют весь урожай. Как их прогнать без вреда?",
      answer: "Повесить блестящие предметы или шуршащие пакеты."
    }
  },
  {
    id: 11,
    category: "farm",
    title: "Полив на склоне",
    title_en: "Watering on a slope",
    icon: "🚜",
    teaser: "Насос сломался, как достать воду из реки?",
    teaser_en: "The pump is broken, how to get water from the river?",
    difficulty: 1,
    core_problem: { need: "направить воду на поле", obstacle: "насоса нет, а вода внизу" },
    ikr: "Вода сама течет на поле сверху",
    resources: [
      { id: "гравитация", properties: "тянет воду вниз, если есть наклон" },
      { id: "река", properties: "течет быстро, можно отвести часть" }
    ],
    trick: { name: "Гравитационный насос", animal: "🚜", animalName: "Трактор" },
    customer: { name: "Фермер", emoji: "👨‍🌾" },
    idea_analysis: {
      "канал": {
        good_hints: ["Если начать копать канал выше по течению, вода сама потечет к полю!"],
        bad_hints: ["Нужно очень много копать"],
        consequence_push: ["Как сделать канал крепким, чтобы вода не уходила в землю?"]
      },
      "ведро": {
        good_hints: ["Носить ведрами можно, но поле слишком большое. Ты быстро устанешь."],
        bad_hints: ["Склон крутой, можно поскользнуться"],
        consequence_push: ["Как заставить саму реку поднять воду наверх?"]
      }
    },
    traps: {
      markers: ["ведро", "руки", "таскать", "ждать дождь", "бутылка"],
      reaction: "Поле огромное, а человек маленький. Нужно придумать способ, чтобы вода бежала сама!"
    },
    puzzle: { 
      emoji: "💧", 
      question: "Поле выше реки. Как полить его без техники?",
      answer: "Прокопать канал от места выше по течению реки — вода придет сама."
    }
  },
  {
    id: 12,
    category: "farm",
    title: "Сортировка зерна",
    title_en: "Grain sorting",
    icon: "🌾",
    teaser: "Как отделить зерна от плевел без рук?",
    teaser_en: "How to separate the wheat from the chaff without hands?",
    difficulty: 1,
    core_problem: { need: "разделить смесь", obstacle: "руками перебирать слишком долго" },
    ikr: "Силы природы разделяют легкое и тяжелое",
    resources: [{ id: "ветер", properties: "сдувает легкое" }],
    puzzle: { 
      emoji: "🌬️", 
      question: "Шелуха перемешалась с зерном. Как быстро очистить урожай?",
      answer: "Подкидывать смесь на ветру — он сдует легкую шелуху."
    }
  },

  // МАСТЕРСКАЯ / СВАЛКА
  {
    id: 13,
    category: "workshop",
    title: "Пропажа в трубе",
    title_en: "Lost in the Tube",
    icon: "🔩",
    teaser: "Винтик упал в глубокую трубу. Как достать?",
    teaser_en: "A screw fell into a deep tube. How to get it back?",
    difficulty: 1,
    core_problem: { need: "вытащить металл", obstacle: "рука не лезет, труба изогнута" },
    ikr: "Винтик сам притягивается к инструменту",
    resources: [
      { id: "магнит", properties: "сильно притягивает любое железо" }, 
      { id: "нитка", properties: "гибкая, длинная, пролезет везде" },
      { id: "пластилин", properties: "липкий, может зацепить вещь" }
    ],
    trick: { name: "Магнитное поле", name_en: "Magnetic Field", animal: "🧲", animalName: "Магнит" },
    customer: { name: "Мастер", emoji: "🛠️" },
    idea_analysis: {
      "магнит": {
        good_hints: ["Магнит на нитке — это как длинная металлическая рука!"],
        bad_hints: ["Магнит может зацепиться за саму железную трубу"],
        consequence_push: ["Как опустить магнит так, чтобы он не прилип к стенкам?"]
      },
      "пластилин": {
        good_hints: ["Пластилин на палке — отличная ловушка для винтика!"],
        bad_hints: ["Пластилин может отклеиться и остаться в трубе"],
        consequence_push: ["А если винтик лежит слишком глубоко для палки?"]
      }
    },
    traps: {
        markers: ["рука", "пальцы", "ломать", "труба", "вода"],
        reaction: "Труба слишком узкая и глубокая. Нужно что-то, что 'само' схватит винтик!"
    },
    puzzle: { 
      emoji: "🧲", 
      question_ru: "Железный болт упал в трубу. Что поможет его достать?",
      question_en: "An iron bolt fell into a pipe. What will help to get it out?",
      answer_ru: "Опустить магнит на нитке.",
      answer_en: "Lower a magnet on a string."
    }
  },
  {
    id: 14,
    category: "workshop",
    title: "Ржавая гайка",
    title_en: "Rusty Nut",
    icon: "🔧",
    teaser: "Гайка прикипела, а ключа нет",
    teaser_en: "The nut is stuck, and there's no wrench",
    difficulty: 1,
    core_problem: { need: "открутить гайку", obstacle: "она заржавела и не двигается" },
    ikr: "Металл гайки расширяется и отходит сам",
    resources: [
      { id: "тепло", properties: "расширяет металл, делая его больше" },
      { id: "масло", properties: "делает поверхность скользкой" }
    ],
    trick: { name: "Тепловое расширение", name_en: "Thermal Expansion", animal: "🔥", animalName: "Огонёк" },
    customer: { name: "Кузнец", emoji: "⚒️" },
    idea_analysis: {
      "тепло": {
        good_hints: ["От огня гайка расширится и связь со ржавчиной лопнет!"],
        bad_hints: ["Можно обжечься горячим металлом"],
        consequence_push: ["Чем мы будем нагревать гайку прямо на месте?"]
      },
      "масло": {
        good_hints: ["Масло просочится в щели и поможет гайке провернуться."],
        bad_hints: ["Масло может не пройти сквозь слой ржавчины"],
        consequence_push: ["Как помочь маслу попасть внутрь еще быстрее?"]
      }
    },
    traps: {
        markers: ["сила", "крутить", "зубы", "камни", "ломать"],
        reaction: "Гайка сидит слишком крепко. Силой её не взять — сломаешь! Нужно изменить саму гайку."
    },
    puzzle: { 
      emoji: "🔥", 
      question_ru: "Как заставить ржавую гайку ослабнуть без инструментов?",
      question_en: "How to make a rusty nut loosen without tools?",
      answer_ru: "Нагреть её — от тепла металл расширится и связь лопнет.",
      answer_en: "Heat it up — the metal will expand and break the bond."
    }
  },
  {
    id: 15,
    category: "workshop",
    title: "Ремонт вазы",
    title_en: "Vase repair",
    icon: "🏺",
    teaser: "Куски вазы разваливаются при склейке. Что делать?",
    teaser_en: "The vase pieces fall apart when glued together. What to do?",
    difficulty: 1,
    core_problem: { need: "удержать форму вазы", obstacle: "пока клей сохнет, куски падают" },
    ikr: "Среда сама держит все куски на своих местах",
    resources: [{ id: "песок", properties: "сохраняет форму" }],
    puzzle: { 
      emoji: "🏜️", 
      question: "Как склеить сложную вазу, чтобы она не рухнула в процессе?",
      answer: "Погрузить её в песок — он поддержит все детали сразу."
    }
  },

  /* --- УРОВЕНЬ 2: Введение ИКР (16-25) --- */
  {
    id: 16,
    category: "nature-reserve",
    title: "Взвесить сокола",
    title_en: "Weigh the falcon",
    icon: "🦅",
    teaser: "Как взвесить летящую птицу, не ловя её?",
    teaser_en: "How to weigh a flying bird without catching it?",
    difficulty: 2,
    ikr: "Птица САМА садится на весы, желая этого",
    puzzle: { 
      emoji: "⚖️", 
      question: "Нужно узнать вес дикой птицы. Ловить нельзя — улетит. Твой секрет?",
      answer: "Положить корм на чашу весов — птица сядет сама."
    }
  },
  {
    id: 17,
    category: "farm",
    title: "Хитрые яблоки",
    title_en: "Tricky Apples",
    icon: "🍎",
    teaser: "Горы урожая: как разделить крупные и мелкие?",
    teaser_en: "Горы урожая: как разделить крупные и мелкие?",
    difficulty: 2,
    ikr: "Яблоки САМИ сортируются при движении",
    puzzle: { 
      emoji: "📦", 
      question: "Как быстро отделить мелкие яблоки от крупных в саду?",
      answer: "Использовать решетку (сито) с отверстиями нужного размера."
    }
  },
  {
    id: 18,
    category: "farm",
    title: "Полив лентяя",
    title_en: "Watering a lazy person",
    icon: "🪴",
    teaser: "Цветы хотят пить, а хозяин в отпуске",
    teaser_en: "The flowers are thirsty, but the owner is on vacation",
    difficulty: 2,
    ikr: "Вода САМА идет к корням, когда земля подсыхает",
    puzzle: { 
      emoji: "🧶", 
      question: "Как поливать цветы целый месяц без сложной техники?",
      answer: "Использовать фитильный полив (шерстяная нить от ведра к горшку)."
    }
  },
  {
    id: 19,
    category: "workshop",
    title: "Металл и пластик",
    title_en: "Metal and plastic",
    icon: "♻️",
    teaser: "Как разделить гору мусора за секунду?",
    teaser_en: "How to separate a mountain of garbage in a second?",
    difficulty: 2,
    ikr: "Железо САМО улетает в сторону от пластика",
    puzzle: { 
      emoji: "🏗️", 
      question: "На свалке перемешались ведра и пакеты. Как быстро их разделить?",
      answer: "Пропустить под мощным магнитом — железо прилипнет к нему."
    }
  },
  {
    id: 20,
    category: "city-hall",
    title: "Гонщики у школы",
    title_en: "Racers at school",
    icon: "🏎️",
    teaser: "Как снизить скорость машин без светофора?",
    teaser_en: "How to reduce the speed of cars without a traffic light?",
    difficulty: 2,
    ikr: "Водитель САМ решает притормозить, видя опасность",
    puzzle: { 
      emoji: "🚧", 
      question: "Машины ездят быстро. Как заставить их притормозить без штрафов?",
      answer: "Сделать «лежачего полицейского» или 3D-рисунок ямы."
    }
  },
  {
    id: 21,
    category: "city-hall",
    title: "Жирные трубы",
    title_en: "Fat pipes",
    icon: "🧼",
    teaser: "Трос не лезет, как прочистить засор?",
    teaser_en: "The cable does not fit, how to clear the blockage?",
    difficulty: 2,
    ikr: "Очиститель САМ съедает засор изнутри",
    puzzle: { 
      emoji: "🧪", 
      question: "Труба забилась жиром. Трос бессилен. Что делать?",
      answer: "Залить химикат или бактерии, которые растворяют жир."
    }
  },
  {
    id: 22,
    category: "library",
    title: "Золушка",
    title_en: "Cinderella",
    icon: "👑",
    teaser: "Мачеха смешала просо с маком. Как успеть к балу?",
    teaser_en: "The stepmother mixed millet with poppy seeds. How to be on time for the ball?",
    difficulty: 2,
    ikr: "Зерна САМИ разделяются по размеру или с чужой помощью",
    puzzle: { 
      emoji: "🕊️", 
      question: "Как разобрать огромную кучу крупы за один час?",
      answer: "Позвать голубей (ресурс) или использовать сито."
    }
  },
  {
    id: 23,
    category: "library",
    title: "Гензель и Гретель",
    title_en: "Hansel and Gretel",
    icon: "🍭",
    teaser: "Птицы склевали крошки-метки. Что использовать?",
    teaser_en: "The birds pecked off the crumb marks. What to use?",
    difficulty: 2,
    ikr: "Метки САМИ остаются на месте и их никто не ест",
    puzzle: { 
      emoji: "💎", 
      question: "Чем пометить путь в лесу, чтобы его не уничтожили звери?",
      answer: "Кидать белые камешки (ресурс), они светятся в тени и несъедобны."
    }
  },
  {
    id: 24,
    category: "workshop",
    title: "Идеальная покраска",
    title_en: "Perfect paint job",
    icon: "🎨",
    teaser: "Как покрасить деталь со всех сторон за миг?",
    teaser_en: "How to paint a part from all sides in an instant?",
    difficulty: 2,
    ikr: "Краска САМА покрывает деталь целиком",
    puzzle: { 
      emoji: "🚿", 
      question: "Нужно покрасить сложную деталь без пробелов. Твой способ?",
      answer: "Окунуть её в ванну с краской целиком (принцип Посредника)."
    }
  },
  {
    id: 25,
    category: "workshop",
    title: "Хрупкий груз",
    title_en: "Fragile cargo",
    icon: "📦",
    teaser: "Как довезти лампочки по ямам без поролона?",
    teaser_en: "How to transport light bulbs through pits without foam rubber?",
    difficulty: 2,
    ikr: "Упаковка САМА амортизирует каждый удар",
    puzzle: { 
      emoji: "🌬️", 
      question: "Как защитить стекло в коробке, если нет мягкой бумаги?",
      answer: "Накачать пакеты воздухом или засыпать опилками/песком."
    }
  },

  /* --- УРОВЕНЬ 3: Противоречия (26-30) --- */
  {
    id: 26,
    category: "nature-reserve",
    title: "Зубастый тигр",
    title_en: "Toothed tiger",
    icon: "🐅",
    teaser: "Клетка должна быть закрытой и открытой одновременно",
    teaser_en: "The cage must be closed and open at the same time",
    difficulty: 3,
    core_problem: { need: "фото без решеток", obstacle: "решетка нужна для безопасности" },
    puzzle: { 
      emoji: "📸", 
      question: "Фотограф хочет снять тигра без прутьев, но выходить из клетки опасно. Как быть?",
      answer: "Заменить решетку рвом с водой или бронестеклом."
    }
  },
  {
    id: 27,
    category: "city-hall",
    title: "Скользкая краска",
    title_en: "Slippery paint",
    icon: "🛣️",
    teaser: "Зебра должна быть яркой и не скользкой",
    teaser_en: "Zebra should be bright and not slippery",
    difficulty: 3,
    puzzle: { 
      emoji: "🎨", 
      question: "Краска на дороге скользит в дождь. Как оставить её яркой, но сделать шершавой?",
      answer: "Добавить в краску песок (принцип Объединения)."
    }
  },
  {
    id: 28,
    category: "farm",
    title: "Зимняя теплица",
    title_en: "Winter greenhouse",
    icon: "🥦",
    teaser: "Стены должны пускать свет и не выпускать тепло",
    teaser_en: "Walls should let in light and not let out heat",
    difficulty: 3,
    puzzle: { 
      emoji: "☀️", 
      question: "Как сделать теплицу жаркой зимой без огромных затрат на дрова?",
      answer: "Двойные стены с воздухом или закрывать темным экраном на ночь."
    }
  },
  {
    id: 29,
    category: "workshop",
    title: "Умная свая",
    title_en: "Smart pile",
    icon: "🏗️",
    teaser: "Свая должна быть острой для входа и широкой для опоры",
    teaser_en: "The pile must be sharp for entry and wide for support",
    difficulty: 3,
    puzzle: { 
      emoji: "🔨", 
      question: "Как забить столб легко, но чтобы он не провалился в болото потом?",
      answer: "Свая с раскрывающимися лепестками (как зонтик) внизу."
    }
  },
  {
    id: 30,
    category: "library",
    title: "Зонт Мэри Поппинс",
    title_en: "Mary Poppins Umbrella",
    icon: "☂️",
    teaser: "Должен быть большим под дождем и маленьким в сумке",
    teaser_en: "Should be big in the rain and small in the bag",
    difficulty: 3,
    puzzle: { 
      emoji: "👜", 
      question: "Как сделать огромный зонт, который не мешает в кармане?",
      answer: "Складной зонт (изменение свойств во времени)."
    }
  }
];

export default TASKS;
