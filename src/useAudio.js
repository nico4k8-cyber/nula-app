import { useState, useRef, useEffect } from 'react';

const AUDIO_STORAGE_KEY = 'razgadai_audio_enabled';
const TRACK_INDEX_KEY = 'razgadai_track_index';

// Глобальный Audio объект - создается один раз
let globalAudioRef = null;
function getGlobalAudio() {
  if (!globalAudioRef) {
    globalAudioRef = new Audio();
    globalAudioRef.loop = true;
    globalAudioRef.volume = 0.2;
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
      return saved !== null ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
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

  // Handle audio enable/disable without stopping playback
  useEffect(() => {
    // Save preference
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(isEnabled));
    } catch {}

    // Stop music completely if no tracks (e.g., during splash screen)
    if (tracks.length === 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      return;
    }

    // Auto-play if enabled, don't stop if disabled (just mute it)
    if (isEnabled && tracks.length > 0) {
      if (audioRef.current && !audioRef.current.src) {
        playTrack(currentTrackIndex);
      } else if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    } else if (!isEnabled && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isEnabled, currentTrackIndex, tracks]);

  // Pause music when tab is not focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - pause music
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      } else {
        // Tab is visible - resume music if enabled
        if (isEnabled && audioRef.current && audioRef.current.paused && audioRef.current.src) {
          audioRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled]);

  // Update track source when index changes (but keep playing smoothly)
  useEffect(() => {
    if (tracks.length > 0 && audioRef.current) {
      const track = tracks[currentTrackIndex];
      // Only change track if it's different
      if (audioRef.current.src !== track.path) {
        const wasPlaying = !audioRef.current.paused;
        audioRef.current.src = track.path;
        if (wasPlaying && isEnabled) {
          audioRef.current.play().catch(() => {});
        }
      }
    }
    // Save track preference
    try {
      localStorage.setItem(TRACK_INDEX_KEY, currentTrackIndex.toString());
    } catch {}
  }, [currentTrackIndex, tracks, isEnabled]);

  const playTrack = (index) => {
    if (index < 0 || index >= tracks.length) return;
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = tracks[index].path;
      audioRef.current.play().catch(() => {});
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
