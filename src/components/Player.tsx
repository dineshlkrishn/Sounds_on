import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Maximize2, ListMusic, Heart, Plus, MonitorSmartphone } from 'lucide-react';
import { Track } from '../types';
import { FullPlayer } from './FullPlayer';
import { FALLBACK_MUSIC_IMAGE } from '../constants';

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  playlistId: number | null;
  setIsAuthModalOpen: (isOpen: boolean) => void;
}

export const Player: React.FC<PlayerProps> = ({ currentTrack, isPlaying, onTogglePlay, onSkipNext, onSkipPrev, setIsAuthModalOpen, playlistId }) => {
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [sleepTimerEnd, setSleepTimerEnd] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sleepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleStopPlayback = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (isPlaying) onTogglePlay();
      }
    };

    const handleSetSleepTimer = (e: any) => {
      // Clear existing timeout if any
      if (sleepTimeoutRef.current) {
        clearTimeout(sleepTimeoutRef.current);
        sleepTimeoutRef.current = null;
      }
      setSleepTimerEnd(false);

      if (e.detail?.type === 'end') {
        setSleepTimerEnd(true);
      } else if (e.detail?.type === 'time') {
        sleepTimeoutRef.current = setTimeout(() => {
          handleStopPlayback();
        }, e.detail.value * 1000);
      } else if (e.detail?.type === 'off') {
        // Already cleared above
      }
    };

    window.addEventListener('stopPlayback', handleStopPlayback);
    window.addEventListener('setSleepTimer', (handleSetSleepTimer as any));
    return () => {
      window.removeEventListener('stopPlayback', handleStopPlayback);
      window.removeEventListener('setSleepTimer', (handleSetSleepTimer as any));
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    };
  }, [onTogglePlay, isPlaying]);

  useEffect(() => {
    const checkLiked = async () => {
      if (currentTrack && localStorage.getItem('token')) {
        const response = await fetch(`/api/tracks/${currentTrack.id}/is-liked`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setIsLiked(data.liked);
      }
    };
    checkLiked();
  }, [currentTrack]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localStorage.getItem('token')) {
      setIsAuthModalOpen(true);
      return;
    }
    const response = await fetch(`/api/tracks/${currentTrack?.id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      const data = await response.json();
      setIsLiked(!data.unliked);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name === 'AbortError') {
              // Ignore AbortError as it's often caused by rapid track changes or source updates
              return;
            }
            console.error("Playback failed", error);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (isFinite(duration) && duration > 0) {
        setProgress((current / duration) * 100);
      } else {
        setProgress(0);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const duration = audioRef.current.duration;
    if (!isFinite(duration) || duration === 0) return;

    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return 'Live';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <>
        <FullPlayer
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onSkipNext={onSkipNext}
          onSkipPrev={onSkipPrev}
          progress={progress}
          onSeek={handleSeek}
          formatTime={formatTime}
          currentTime={audioRef.current?.currentTime || 0}
          duration={audioRef.current?.duration || 0}
          playlistId={playlistId}
          isLiked={isLiked}
          setIsLiked={setIsLiked}
        />
      
      <div className="h-16 sm:h-20 bg-[#7a0d0d] border-t border-white/10 px-3 sm:px-6 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.2)] z-30 relative group text-white">
        <audio 
          ref={audioRef} 
          src={currentTrack.audioUrl} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            if (sleepTimerEnd) {
              setSleepTimerEnd(false);
              if (isPlaying) onTogglePlay();
            } else {
              onSkipNext();
            }
          }}
          onError={(e) => {
            const error = (e.target as HTMLAudioElement).error;
            console.error("Audio element error:", error);
            // If it's a loading error, we could try to skip or just show a message
            if (error?.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
              console.error("Source not supported or not found:", currentTrack.audioUrl);
            }
          }}
        />
        
        {/* Progress Line at Bottom */}
        <div className="mini-progress" style={{ width: `${progress}%` }} />
        
        {/* Track Info */}
        <div 
          className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <img 
            src={currentTrack.coverUrl || FALLBACK_MUSIC_IMAGE} 
            alt={currentTrack.title} 
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg shadow-md flex-shrink-0 object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
            }}
          />
          <div className="flex flex-col min-w-0 overflow-hidden">
            <div className="flex items-center gap-1">
              {isPlaying && (
                <div className="sound-wave flex-shrink-0 scale-[0.6]">
                  <div className="!bg-white" />
                  <div className="!bg-white" />
                  <div className="!bg-white" />
                  <div className="!bg-white" />
                </div>
              )}
              <div className="marquee-container !mask-none max-w-[50%]">
                <div className="animate-marquee-single">
                  <span className={`text-[11px] sm:text-sm font-bold pr-12`}>
                    {currentTrack.title}
                  </span>
                  <span className={`text-[11px] sm:text-sm font-bold pr-12`}>
                    {currentTrack.title}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[8px] sm:text-xs text-white/60 truncate font-medium">{currentTrack.artist}</span>
          </div>
        </div>

        {/* Mini Player Controls */}
        <div className="flex items-center gap-1 sm:gap-4 ml-2">
          <button 
            className={`p-1 transition-colors ${isLiked ? 'text-brand-red' : 'text-white/60 hover:text-white'}`}
            onClick={toggleLike}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} strokeWidth={2} />
          </button>

          <button 
            className="p-1 text-white/60 hover:text-white transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Added to queue!' } }));
            }}
            title="Add to queue"
          >
            <ListMusic size={20} />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
            className="p-1 text-white hover:scale-110 transition-transform"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
        </div>

        {/* Desktop Only Extra Controls */}
        <div className="hidden md:flex items-center justify-end gap-3 ml-4">
          <div className="flex items-center gap-2 w-20 lg:w-28">
            <Volume2 size={16} className="text-white/60" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
          <button 
            className="text-white/60 hover:text-white transition-colors"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

