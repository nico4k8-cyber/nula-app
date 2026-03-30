// Простая система звуковых эффектов для MVP через Web Audio API
// Звуки генерируются прямо в браузере (не требуют mp3 файлов).

let audioCtx = null;

function isAudioEnabled() {
  try {
    const saved = localStorage.getItem('razgadai_audio_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  } catch {
    return true;
  }
}

function initAudio() {
  if (!isAudioEnabled()) return false;
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return true;
}

// Утилита для создания звука типа oscillator
function playTone(freq, type, duration, vol) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
  // Легкий щелчок интерфейса
  click: () => {
    if (!initAudio()) return;
    playTone(600, 'sine', 0.05, 0.02);
  },
  
  // Успешный патент или победа (вжух-колокольчик)
  solve: () => {
    if (!initAudio()) return;
    playTone(523.25, 'sine', 0.2, 0.05); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.3, 0.05), 100); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.5, 0.05), 200); // G5
  },
  
  // Отказ / Идея слабая
  error: () => {
    if (!initAudio()) return;
    playTone(300, 'sawtooth', 0.2, 0.03);
    setTimeout(() => playTone(250, 'sawtooth', 0.3, 0.03), 150);
  },
  
  // Открытие здания или большой успех (фанфары)
  unlock: () => {
    if (!initAudio()) return;
    playTone(440, 'square', 0.2, 0.04);
    setTimeout(() => playTone(440, 'square', 0.2, 0.04), 150);
    setTimeout(() => playTone(660, 'square', 0.5, 0.04), 300);
  }
};

export default sfx;
