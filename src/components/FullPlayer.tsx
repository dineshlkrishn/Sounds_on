import React, { useState } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Heart, Share2, MoreVertical, ListMusic, Plus, Timer, MonitorSmartphone, PlusCircle, MinusCircle, ListPlus, Disc, User as UserIcon, Radio, ChevronLeft, Check, X } from 'lucide-react';
import { Track } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { FALLBACK_MUSIC_IMAGE } from '../constants';

interface FullPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  progress: number;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatTime: (seconds: number) => string;
  currentTime: number;
  duration: number;
  playlistId: number | null;
  isLiked: boolean;
  setIsLiked: (isLiked: boolean) => void;
}

export const FullPlayer: React.FC<FullPlayerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onSkipNext,
  onSkipPrev,
  progress,
  onSeek,
  formatTime,
  currentTime,
  duration,
  playlistId,
  isLiked,
  setIsLiked
}) => {
  const [isShuffle, setIsShuffle] = useState(false);
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [activeTimerLabel, setActiveTimerLabel] = useState<string | null>(null);
  const [isArtistExpanded, setIsArtistExpanded] = useState(false);
  const [playlists, setPlaylists] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sleepTimerOptions = [
    { label: '5 minutes', value: 5 * 60 },
    { label: '10 minutes', value: 10 * 60 },
    { label: '15 minutes', value: 15 * 60 },
    { label: '20 minutes', value: 20 * 60 },
    { label: '30 minutes', value: 30 * 60 },
    { label: 'End of track', value: 'end' },
  ];

  const handleSetSleepTimer = (value: number | 'end' | 'off', label: string) => {
    if (value === 'off') {
      setActiveTimerLabel(null);
      setSuccessMessage('Sleep timer disabled');
      window.dispatchEvent(new CustomEvent('setSleepTimer', { detail: { type: 'off' } }));
    } else {
      setActiveTimerLabel(label);
      setSuccessMessage(`Sleep timer set for ${label}`);
      // Logic to stop playback
      if (value === 'end') {
        window.dispatchEvent(new CustomEvent('setSleepTimer', { detail: { type: 'end' } }));
      } else {
        window.dispatchEvent(new CustomEvent('setSleepTimer', { detail: { type: 'time', value: value } }));
      }
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    setShowSleepTimer(false);
  };

  const lyrics = [
    { time: 0, text: "Get out get out of my way..." },
    { time: 5, text: "I'm on a mission today." },
    { time: 10, text: "The rhythm is taking control," },
    { time: 15, text: "Deep down inside of my soul." },
    { time: 20, text: "Enjoy Enjaami, let the beat play," },
    { time: 25, text: "We're dancing the night away!" },
    { time: 30, text: "The stars are shining so bright," },
    { time: 35, text: "Everything's gonna be alright." },
  ];

  const currentLyricIndex = lyrics.findIndex((l, i) => {
    const nextLyric = lyrics[i + 1];
    return currentTime >= l.time && (!nextLyric || currentTime < nextLyric.time);
  });

  const fetchPlaylists = async () => {
    const response = await fetch('/api/playlists', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      const data = await response.json();
      setPlaylists(data);
    }
  };

  const addToPlaylist = async (playlistId: number) => {
    if (!currentTrack) return;
    setIsLoading(true);
    const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ trackId: currentTrack.id })
    });
    setIsLoading(false);
    if (response.ok) {
      setSuccessMessage('Added to playlist');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setShowPlaylistPicker(false);
    } else {
      const data = await response.json();
      setSuccessMessage(data.error || 'Failed to add to playlist');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const removeFromPlaylist = async () => {
    if (!currentTrack || !playlistId) return;
    setIsLoading(true);
    const response = await fetch(`/api/playlists/${playlistId}/tracks/${currentTrack.id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      }
    });
    setIsLoading(false);
    if (response.ok) {
      setSuccessMessage('Removed from playlist');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setShowMoreOptions(false);
      // Optional: trigger a refresh of the playlist view if needed
      window.dispatchEvent(new CustomEvent('changeView', { detail: { view: 'playlist', id: playlistId } }));
    } else {
      setSuccessMessage('Failed to remove from playlist');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const toggleLike = async () => {
    if (!localStorage.getItem('token')) {
      setSuccessMessage('Please login to like songs');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      return;
    }
    const response = await fetch(`/api/tracks/${currentTrack?.id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      const data = await response.json();
      setIsLiked(!data.unliked);
      setSuccessMessage(data.unliked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ scale: 0.9, y: 100, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 bg-[#7a0d0d] flex flex-col px-6 pt-4 pb-8 text-white overflow-y-auto"
        >
          <div className="max-w-md mx-auto w-full flex flex-col min-h-full">
            <header className="flex items-center justify-between mb-6">
              <button onClick={onClose} className="p-2 text-white/80 hover:text-white transition-colors">
                <ChevronDown size={32} />
              </button>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Playing from album</span>
                <span className="text-xs font-bold text-white truncate max-w-[200px]">{currentTrack.album || 'SoundsOn Mix'}</span>
              </div>
              <button className="p-2 text-white/80 hover:text-white transition-colors" onClick={() => setShowMoreOptions(true)}>
                <MoreVertical size={24} />
              </button>
            </header>

            <div className="flex flex-col justify-between pb-4">
              <div className="flex flex-col">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-full aspect-square shadow-2xl rounded-xl overflow-hidden mb-6"
                >
                  <img
                    src={currentTrack.coverUrl || FALLBACK_MUSIC_IMAGE}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
                    }}
                  />
                </motion.div>

                <div className="w-full flex items-center justify-between mb-4">
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="marquee-container max-w-[70%]">
                      <div className="animate-marquee-single">
                        <h2 className="text-2xl font-black text-white pr-12">
                          {currentTrack.title}
                        </h2>
                        <h2 className="text-2xl font-black text-white pr-12">
                          {currentTrack.title}
                        </h2>
                      </div>
                    </div>
                    <p className="text-lg text-white/60 truncate font-medium">{currentTrack.artist}</p>
                  </div>
                  <button 
                    onClick={toggleLike}
                    className={`p-2 transition-colors ${isLiked ? 'text-brand-red' : 'text-white/60 hover:text-white'}`}
                  >
                    <Heart size={28} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="w-full flex flex-col gap-2 mb-6">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={onSeek}
                    style={{ '--progress': `${progress}%` } as React.CSSProperties}
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-white/60">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between px-2 mb-6">
                  <button 
                    className={`transition-colors ${isShuffle ? 'text-white' : 'text-white/40 hover:text-white'}`}
                    onClick={() => setIsShuffle(!isShuffle)}
                  >
                    <Shuffle size={20} />
                  </button>
                  <button onClick={onSkipPrev} className="text-white hover:text-white/80 transition-colors">
                    <SkipBack size={32} fill="currentColor" />
                  </button>
                  <button
                    onClick={onTogglePlay}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black shadow-xl active:scale-95 transition-transform"
                  >
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                  </button>
                  <button onClick={onSkipNext} className="text-white hover:text-white/80 transition-colors">
                    <SkipForward size={32} fill="currentColor" />
                  </button>
                  <button 
                    className={`transition-colors ${activeTimerLabel ? 'text-brand-red' : 'text-white/40 hover:text-white'}`}
                    onClick={() => setShowSleepTimer(true)}
                  >
                    <Timer size={20} />
                  </button>
                </div>

                <div className="flex items-center justify-between px-2 mb-8">
                  <div className="w-5" /> {/* Spacer instead of MonitorSmartphone */}
                  <div className="flex items-center gap-6">
                    <button 
                      className="text-white/60 hover:text-white transition-colors"
                      onClick={() => {
                        const trackLink = `${window.location.origin}/track/${currentTrack.id}`;
                        navigator.clipboard.writeText(trackLink).then(() => {
                          setSuccessMessage('Link copied to clipboard');
                          setTimeout(() => setSuccessMessage(null), 2000);
                        });
                      }}
                    >
                      <Share2 size={20} />
                    </button>
                    <button 
                      className="text-white/60 hover:text-white transition-colors"
                      onClick={() => { fetchPlaylists(); setShowPlaylistPicker(true); }}
                    >
                      <ListMusic size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lyrics Section - Spotify Style */}
            <div className="-mx-6 mb-8">
              <div className="bg-[#ff4b4b] rounded-3xl p-6 mx-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/90">Lyrics</h3>
                  <button 
                    onClick={() => setShowFullLyrics(!showFullLyrics)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors"
                  >
                    {showFullLyrics ? 'Show Less' : 'Full Lyrics'}
                  </button>
                </div>
                <div className={`space-y-4 transition-all duration-500 overflow-hidden ${showFullLyrics ? 'max-h-[1000px]' : 'max-h-32'}`}>
                  {lyrics.map((lyric, index) => (
                    <p 
                      key={index}
                      className={`text-xl sm:text-2xl font-black leading-tight transition-all duration-300 ${
                        index === currentLyricIndex ? 'text-white scale-105 origin-left' : 'text-white/40'
                      } ${!showFullLyrics && index > currentLyricIndex + 1 ? 'hidden' : ''}`}
                    >
                      {lyric.text}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* About Artist - Spotify Style */}
            <div className="mb-8">
              <div 
                className={`bg-white/5 rounded-3xl overflow-hidden border border-white/10 group cursor-pointer hover:bg-white/10 transition-all duration-500 ${isArtistExpanded ? 'max-h-[1000px]' : 'max-h-80'}`}
                onClick={() => setIsArtistExpanded(!isArtistExpanded)}
              >
                <div className="relative h-48 w-full">
                  <img 
                    src={currentTrack.coverUrl || FALLBACK_MUSIC_IMAGE} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/90">About the artist</h3>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <h4 className="text-2xl font-black text-white">{currentTrack.artist}</h4>
                  </div>
                  <button className="absolute top-4 right-4 p-2 bg-black/40 rounded-full">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-[#7a0d0d] bg-white/20 overflow-hidden">
                          <img src={`https://picsum.photos/seed/artist${i}/50/50`} referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-white/60">12,456,789 monthly listeners</p>
                  </div>
                  <p className={`text-sm text-white/70 leading-relaxed font-medium transition-all duration-500 ${isArtistExpanded ? '' : 'line-clamp-3'}`}>
                    {currentTrack.artist} is a visionary artist redefining the boundaries of modern music. With a unique blend of soulful melodies and powerful rhythms, they have become a global phenomenon. 
                    {isArtistExpanded && (
                      <>
                        <br /><br />
                        Born and raised in a vibrant musical environment, they started their journey at a young age, mastering multiple instruments and developing a signature sound that resonates with millions worldwide.
                        <br /><br />
                        Their latest work continues to push creative limits, exploring new sonic landscapes while staying true to the emotional core that fans have come to love.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Album Details - Spotify Style */}
            <div className="mb-12">
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex items-center gap-6 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <img 
                    src={currentTrack.coverUrl || FALLBACK_MUSIC_IMAGE} 
                    className="w-full h-full rounded-xl shadow-2xl object-cover" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
                    }}
                  />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-1">From the album</h3>
                  <h4 className="text-lg font-black text-white truncate mb-1">{currentTrack.album}</h4>
                  <p className="text-xs font-bold text-white/40">© 2024 SoundsOn Records • LP</p>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showMoreOptions && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMoreOptions(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                />
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed bottom-0 left-0 right-0 bg-[#7a0d0d] rounded-t-[32px] z-[70] p-6 pb-12 max-h-[85vh] overflow-y-auto"
                >
                  <div className="flex flex-col items-center mb-8">
                    <img 
                      src={currentTrack.coverUrl || FALLBACK_MUSIC_IMAGE} 
                      className="w-40 h-40 rounded-xl shadow-2xl mb-4" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
                      }}
                    />
                    <h3 className="text-xl font-black text-center">{currentTrack.title}</h3>
                    <p className="text-sm text-white/60 font-bold">{currentTrack.artist}</p>
                  </div>

                  <div className="space-y-1">
                    <OptionButton 
                      icon={<PlusCircle size={20} />} 
                      label="Add to playlist" 
                      onClick={() => { fetchPlaylists(); setShowPlaylistPicker(true); setShowMoreOptions(false); }} 
                    />
                    {playlistId && (
                      <OptionButton 
                        icon={<MinusCircle size={20} />} 
                        label="Remove from this playlist" 
                        onClick={removeFromPlaylist} 
                      />
                    )}
                    <OptionButton 
                      icon={<ListPlus size={20} />} 
                      label="Add to queue" 
                      onClick={() => { 
                        setSuccessMessage('Added to queue');
                        setShowSuccess(true);
                        setTimeout(() => setShowSuccess(false), 2000);
                        setShowMoreOptions(false); 
                      }} 
                    />
                    {currentTrack.album && (
                      <OptionButton 
                        icon={<Disc size={20} />} 
                        label="Go to album" 
                        onClick={() => { 
                          setShowMoreOptions(false);
                          onClose();
                          window.dispatchEvent(new CustomEvent('changeView', { detail: { view: 'album', album: currentTrack.album, artist: currentTrack.artist } }));
                        }} 
                      />
                    )}
                    <OptionButton 
                      icon={<UserIcon size={20} />} 
                      label="Go to artist" 
                      onClick={() => { 
                        setShowMoreOptions(false);
                        onClose();
                        window.dispatchEvent(new CustomEvent('changeView', { detail: { view: 'artist', artist: currentTrack.artist } }));
                      }} 
                    />
                    {duration === Infinity && (
                      <OptionButton 
                        icon={<Radio size={20} />} 
                        label="Go to radio page" 
                        onClick={() => { 
                          setShowMoreOptions(false);
                          onClose();
                          window.dispatchEvent(new CustomEvent('changeView', { detail: { view: 'radio' } }));
                        }} 
                      />
                    )}
                    <OptionButton 
                      icon={<Share2 size={20} />} 
                      label="Share" 
                      onClick={() => { 
                        const trackLink = `${window.location.origin}/track/${currentTrack.id}`;
                        navigator.clipboard.writeText(trackLink).then(() => {
                          setSuccessMessage('Link copied to clipboard');
                          setShowSuccess(true);
                          setTimeout(() => setShowSuccess(false), 2000);
                          setShowMoreOptions(false); 
                        });
                      }} 
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSleepTimer && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSleepTimer(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
                />
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="fixed bottom-0 left-0 right-0 bg-[#7a0d0d] rounded-t-[32px] z-[90] p-6 pb-12"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black">Sleep Timer</h3>
                    <button onClick={() => setShowSleepTimer(false)} className="p-2">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {sleepTimerOptions.map(option => (
                      <button 
                        key={option.label}
                        onClick={() => handleSetSleepTimer(option.value as any, option.label)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${activeTimerLabel === option.label ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
                      >
                        <span className="font-bold">{option.label}</span>
                        {activeTimerLabel === option.label && <Check size={20} />}
                      </button>
                    ))}
                    {activeTimerLabel && (
                      <button 
                        onClick={() => handleSetSleepTimer('off', '')}
                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/10 transition-colors text-brand-red"
                      >
                        <span className="font-bold">Turn off timer</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPlaylistPicker && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPlaylistPicker(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
                />
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="fixed bottom-0 left-0 right-0 bg-[#7a0d0d] rounded-t-[32px] z-[90] p-6 pb-12 max-h-[70vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black">Add to Playlist</h3>
                    <button onClick={() => setShowPlaylistPicker(false)} className="p-2">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {playlists.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => addToPlaylist(p.id)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-colors text-left"
                      >
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                          <ListMusic size={24} />
                        </div>
                        <span className="font-bold">{p.name}</span>
                      </button>
                    ))}
                    {playlists.length === 0 && (
                      <p className="text-center text-white/60 py-8 italic">No playlists found</p>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {isLoading && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-[200]">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <AnimatePresence>
            {showSuccess && successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-white text-[#7a0d0d] px-6 py-3 rounded-full font-bold shadow-2xl z-[200] flex items-center gap-2"
              >
                <Check size={20} className="text-green-600" /> {successMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const OptionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-colors text-left"
  >
    <span className="text-white/60">{icon}</span>
    <span className="text-sm font-bold">{label}</span>
  </button>
);
