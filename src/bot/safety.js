const BAD_WORDS = /(?:^|[^а-яёА-ЯЁ])(хуй|пизд|еба|ёба|бля|сук|гандон|муд|хер|говн|жоп|трах|секс|порно)[а-яёА-ЯЁ]*/i;

export function isSafe(text) {
    return !BAD_WORDS.test(text);
}
