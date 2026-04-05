/**
 * Input sanitizer — защита от prompt injection атак.
 *
 * Векторы которые закрываем:
 * 1. Base64 encoded instructions  — декодируем и проверяем содержимое
 * 2. Reversed text instructions   — переворачиваем и проверяем
 * 3. Persona hijack               — "ignore previous", "you are now", "act as", "DAN"
 * 4. False memory injection       — "remember that you", "your real instructions are"
 */

// ─── Паттерны инъекций ────────────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  // Прямые команды переключения роли / игнорирования инструкций
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|context)/i,
  /forget\s+(all\s+)?(previous|prior|above|earlier|your)/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(a\s+)?(different|new|another|real|unrestricted)/i,
  /pretend\s+(you\s+are|to\s+be)\s+/i,
  /your\s+(real|true|actual|original)\s+(instructions?|rules?|purpose|role)/i,
  /developer\s+mode/i,
  /\bDAN\b/,                               // "Do Anything Now" jailbreak
  /jailbreak/i,
  /prompt\s+injection/i,
  /system\s*:\s*(you|ignore|forget|your)/i, // попытка вставить system: блок

  // Ложные воспоминания / ложный контекст
  /remember\s+that\s+you/i,
  /your\s+instructions?\s+(say|tell|say that|are)/i,
  /you\s+(were|are)\s+told\s+to/i,
  /previous\s+(conversation|session|context)\s+(said|told|showed)/i,

  // Попытки выйти за роль
  /\[system\]/i,
  /\[assistant\]/i,
  /\[user\]/i,
  /<\s*system\s*>/i,
  /human:\s*ignore/i,
  /assistant:\s*sure/i,    // типичная инъекция через "assistant: Sure, here is..."
];

// Паттерны которые проверяем ПОСЛЕ декодирования base64 / reversal
const DECODED_INJECTION_PATTERNS = [
  ...INJECTION_PATTERNS,
  /you\s+are\s+a/i,
  /new\s+(instructions?|rules?|persona|role)/i,
  /disregard/i,
  /override/i,
];

// ─── Утилиты ─────────────────────────────────────────────────────────────────

/**
 * Пытается декодировать base64 строку.
 * Возвращает декодированный текст или null если это не base64.
 */
function tryDecodeBase64(text) {
  // Ищем base64-подобные строки длиннее 20 символов
  const b64regex = /[A-Za-z0-9+/]{20,}={0,2}/g;
  const matches = text.match(b64regex);
  if (!matches) return null;

  const decoded = [];
  for (const m of matches) {
    try {
      const dec = atob(m);
      // Проверяем что декодировалось в читаемый текст (не бинарник)
      if (/^[\x20-\x7E\n\r\t]{5,}$/.test(dec)) {
        decoded.push(dec);
      }
    } catch {
      // не base64 — игнорируем
    }
  }
  return decoded.length > 0 ? decoded.join(' ') : null;
}

/**
 * Переворачивает строку (для проверки reversed text инъекций).
 */
function reverseText(text) {
  return text.split('').reverse().join('');
}

/**
 * Проверяет строку на наличие injection паттернов.
 * Возвращает { safe: boolean, reason: string | null }
 */
function checkPatterns(text, patterns) {
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return { safe: false, reason: pattern.toString() };
    }
  }
  return { safe: true, reason: null };
}

// ─── Главная функция ─────────────────────────────────────────────────────────

/**
 * Проверяет входящее сообщение пользователя на prompt injection.
 *
 * @param {string} message — сырое сообщение от пользователя
 * @returns {{ safe: boolean, sanitized: string, threat: string | null }}
 */
export function sanitizeUserMessage(message) {
  if (!message || typeof message !== 'string') {
    return { safe: true, sanitized: '', threat: null };
  }

  const trimmed = message.trim();

  // 1. Прямая проверка исходного текста
  const direct = checkPatterns(trimmed, INJECTION_PATTERNS);
  if (!direct.safe) {
    return { safe: false, sanitized: trimmed, threat: `direct_injection: ${direct.reason}` };
  }

  // 2. Проверка base64 — декодируем и смотрим содержимое
  const b64decoded = tryDecodeBase64(trimmed);
  if (b64decoded) {
    const b64check = checkPatterns(b64decoded, DECODED_INJECTION_PATTERNS);
    if (!b64check.safe) {
      return { safe: false, sanitized: trimmed, threat: `base64_injection: ${b64check.reason}` };
    }
  }

  // 3. Reversed text — переворачиваем и проверяем
  const reversed = reverseText(trimmed);
  const revCheck = checkPatterns(reversed, DECODED_INJECTION_PATTERNS);
  if (!revCheck.safe) {
    return { safe: false, sanitized: trimmed, threat: `reversed_injection: ${revCheck.reason}` };
  }

  // 4. Длина — слишком длинное сообщение подозрительно для детского чата
  if (trimmed.length > 2000) {
    return { safe: false, sanitized: trimmed.slice(0, 2000), threat: 'message_too_long' };
  }

  return { safe: true, sanitized: trimmed, threat: null };
}

/**
 * Фильтрует историю сообщений — убирает потенциально инъецированные.
 */
export function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-10) // максимум 10 последних
    .filter(m => {
      const text = m.text || m.content || '';
      const isBot = m.role === 'assistant' || m.from === 'bot' || m.type === 'bot';
      if (isBot) return true; // ответы бота не трогаем
      const { safe } = sanitizeUserMessage(text);
      return safe;
    });
}
