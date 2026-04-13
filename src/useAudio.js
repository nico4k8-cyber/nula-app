import { useState, useRef, useEffect } from 'react';

const AUDIO_STORAGE_KEY = 'razgadai_audio_enabled';
const TRACK_INDEX_KEY = 'razgadai_track_index';

// Глобальный Audio объект - создается один раз
let globalAudioRef = null;
function getGlobalAudio() {
  if (!globalAudioRef) {
    globalAudioRef = new Audio();
    globalAudioRef.loop = true;
    globalAudioRef.volume = 0.02;
  }
  return globalAudioRef;
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
