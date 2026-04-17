import { useState, useRef, useEffect } from 'react';

const AUDIO_STORAGE_KEY = 'razgadai_audio_enabled';
const TRACK_INDEX_KEY = 'razgadai_track_index';

// iOS Safari ignores audio.volume entirely (read-only).
// We use Web Audio API GainNode as a software volume stage so volume
// control works on all browsers including iOS Safari.
let globalAudioRef = null;
let gainNode = null;
let audioCtx = null;
let mediaSourceNode = null;

// Target gain: ~10% perceived loudness. iOS ignores this anyway,
// so on iOS the hardware volume buttons are the only control.
const TARGET_GAIN = 0.10;

function initAudioContext(audioEl) {
  try {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = TARGET_GAIN;
    mediaSourceNode = audioCtx.createMediaElementSource(audioEl);
    mediaSourceNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
  } catch {
    // Web Audio API not available — fall back silently
  }
}

function getGlobalAudio() {
  if (!globalAudioRef) {
    globalAudioRef = new Audio();
    globalAudioRef.loop = true;
    globalAudioRef.crossOrigin = 'anonymous';
    // Fallback for browsers without Web Audio API
    globalAudioRef.volume = 0.10;
  }
  return globalAudioRef;
}

// Called on first user gesture to unlock AudioContext (required on iOS/Chrome)
let audioUnlocked = false;
function tryUnlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  const audio = getGlobalAudio();
  initAudioContext(audio);
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

export function useAudio(tracks = []) {
  // Используем глобальный audio вместо локального ref
  const audioRef = useRef(getGlobalAudio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(TRACK_INDEX_KEY);
      return saved !== null ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const isEnabledRef = useRef(isEnabled);
  useEffect(() => { isEnabledRef.current = isEnabled; }, [isEnabled]);

  // Unlock AudioContext on first user gesture (required for iOS Safari + Chrome mobile)
  useEffect(() => {
    const unlock = () => {
      // Inline synchronous unlock for iOS Safari: audioCtx.resume() and audio.play()
      // MUST be called directly in the gesture handler to work on iOS
      const audio = getGlobalAudio();

      // Create and resume AudioContext synchronously
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          gainNode = audioCtx.createGain();
          gainNode.gain.value = TARGET_GAIN;
          mediaSourceNode = audioCtx.createMediaElementSource(audio);
          mediaSourceNode.connect(gainNode);
          gainNode.connect(audioCtx.destination);
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
      } catch {
        // Web Audio API not available — fall back silently
      }

      // If music is enabled but was blocked by autoplay policy, start it now
      if (isEnabledRef.current && audio && audio.src && audio.paused) {
        audio.play().catch(() => {});
      }
    };
    document.addEventListener('touchstart', unlock, { once: true, passive: true });
    document.addEventListener('click', unlock, { once: true });
    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize music on first mount (src not yet set)
  useEffect(() => {
    if (tracks.length > 0 && audioRef.current && !audioRef.current.src) {
      const safeIndex = currentTrackIndex >= tracks.length ? 0 : currentTrackIndex;
      const track = tracks[safeIndex];
      if (track) {
        audioRef.current.src = track.path;
        if (isEnabledRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // Handle enable/disable toggle
  useEffect(() => {
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(isEnabled));
    } catch {}

    if (audioRef.current) {
      if (isEnabled && audioRef.current.src) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isEnabled]);

  // Pause music when tab is not focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      } else {
        if (isEnabledRef.current && audioRef.current && audioRef.current.paused && audioRef.current.src) {
          audioRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []); // пустой массив — подписываемся один раз, isEnabled читаем через ref

  // Update track source when index changes (but keep playing smoothly)
  useEffect(() => {
    if (tracks.length > 0 && audioRef.current) {
      const track = tracks[currentTrackIndex];
      const absolutePath = new URL(track.path, window.location.origin).href;

      if (audioRef.current.src !== absolutePath) {
        audioRef.current.src = track.path;
        if (isEnabledRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    }
    try {
      localStorage.setItem(TRACK_INDEX_KEY, currentTrackIndex.toString());
    } catch {}
  // isEnabled intentionally excluded — dedicated effect handles it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex, tracks]);

  const playTrack = (index) => {
    if (index < 0 || index >= tracks.length) return;
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = tracks[index].path;
      if (isEnabled) {
         audioRef.current.play().catch(() => {});
      }
    }
  };

  const stop = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const toggle = () => {
    setIsEnabled(!isEnabled);
  };

  const nextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(nextIndex);
  };

  const prevTrack = () => {
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(prevIndex);
  };

  return {
    isEnabled,
    isPlaying,
    currentTrackIndex,
    currentTrack: tracks[currentTrackIndex] || null,
    toggle,
    nextTrack,
    prevTrack,
    playTrack,
    stop,
    setVolume: (vol) => {
      if (audioRef.current) {
        audioRef.current.volume = Math.max(0, Math.min(1, vol));
      }
    },
  };
}
