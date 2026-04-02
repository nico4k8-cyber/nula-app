import { useState, useRef, useEffect } from 'react';

const AUDIO_STORAGE_KEY = 'razgadai_audio_enabled';
const TRACK_INDEX_KEY = 'razgadai_track_index';

// Глобальный Audio объект - создается один раз
let globalAudioRef = null;
function getGlobalAudio() {
  if (!globalAudioRef) {
    globalAudioRef = new Audio();
    globalAudioRef.loop = true;
    globalAudioRef.volume = 0.05;
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

  // Initialize music and handle track changes (don't change on isEnabled)
  useEffect(() => {
    // Stop music completely if no tracks (e.g., during splash screen)
    if (tracks.length === 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      return;
    }

    // Auto-play music for current track
    if (tracks.length > 0 && audioRef.current) {
      // Safety: if index out of bounds (e.g. from old session with more tracks), reset to 0
      const safeIndex = currentTrackIndex >= tracks.length ? 0 : currentTrackIndex;
      const track = tracks[safeIndex];
      
      if (track && !audioRef.current.src) {
        audioRef.current.src = track.path;
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentTrackIndex, tracks]);

  // Handle enable/disable toggle (save preference only, don't interrupt music)
  useEffect(() => {
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(isEnabled));
    } catch {}
  }, [isEnabled]);

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
      // Browser expands relative paths to absolute URLs in .src
      const absolutePath = new URL(track.path, window.location.origin).href;
      
      // Only change track if it's actually different from the currently playing one
      if (audioRef.current.src !== absolutePath) {
        const wasPlaying = !audioRef.current.paused;
        const currentTime = audioRef.current.currentTime;
        audioRef.current.src = track.path;
        // Restore position if track was playing
        if (wasPlaying && isEnabled) {
          audioRef.current.currentTime = Math.min(currentTime, 10); 
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
