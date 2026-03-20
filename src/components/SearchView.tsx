import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Play, Plus, ListMusic, Disc, User as UserIcon, Check, MoreHorizontal } from 'lucide-react';
import { Track } from '../types';
import { useAuth } from '../context/AuthContext';
import { AccountMenu } from './AccountMenu';
import { FALLBACK_MUSIC_IMAGE } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface SearchViewProps {
  onTrackSelect: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

export const SearchView: React.FC<SearchViewProps> = ({ onTrackSelect, currentTrack, isPlaying }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<{ id: number; name: string }[]>([]);
  const { isAuthenticated } = useAuth();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: any; type: 'track' } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const startLongPress = (e: React.MouseEvent | React.TouchEvent, item: any, type: 'track') => {
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;

    longPressTimer.current = setTimeout(() => {
      setContextMenu({ x, y, item, type });
      if ('vibrate' in navigator) navigator.vibrate(50);
    }, 500);
  };

  const stopLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data);
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/playlists', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(setPlaylists);
    }
  }, [isAuthenticated]);

  const addToPlaylist = async (playlistId: number, trackId: string) => {
    const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ trackId })
    });
    if (response.ok) {
      alert('Added to playlist!');
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to add');
    }
  };

  return (
    <div className="flex-1 bg-brand-off-white overflow-hidden sm:overflow-y-auto p-4 sm:p-8 flex flex-col relative">
      <div className="max-w-md mb-6 sm:mb-8 pt-12">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray" size={18} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="w-full bg-white py-2.5 sm:py-3 pl-11 sm:pl-12 pr-4 rounded-full outline-none border border-brand-light-gray focus:border-brand-red transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto sm:overflow-visible">
        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {results.map((track) => (
              <div 
                key={track.id}
                onMouseDown={(e) => startLongPress(e, track, 'track')}
                onMouseUp={stopLongPress}
                onMouseLeave={stopLongPress}
                onTouchStart={(e) => startLongPress(e, track, 'track')}
                onTouchEnd={stopLongPress}
                onContextMenu={(e) => e.preventDefault()}
                className="bg-white p-3 sm:p-4 rounded-xl hover:shadow-md transition-all group cursor-pointer relative border border-brand-light-gray"
                onClick={() => onTrackSelect(track)}
              >
                <div className="relative mb-3 sm:mb-4 aspect-square">
                  <img 
                    src={track.coverUrl || FALLBACK_MUSIC_IMAGE} 
                    alt={track.title} 
                    className="w-full h-full object-cover rounded-lg shadow-sm"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
                    }}
                  />
                  <button 
                    className="absolute bottom-2 right-2 w-10 h-10 sm:w-12 sm:h-12 bg-brand-red rounded-full flex items-center justify-center text-white shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
                  >
                    <Play size={20} sm:size={24} fill="white" className="ml-1" />
                  </button>
                </div>
                <h3 className="font-bold truncate text-slate-900 text-xs sm:text-base">{track.title}</h3>
                <p className="text-[10px] sm:text-sm text-brand-gray truncate">{track.artist}</p>
                
                {isAuthenticated && playlists.length > 0 && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-brand-light-gray">
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-brand-gray mb-2">Add to Playlist</p>
                    <div className="flex flex-wrap gap-1">
                      {playlists.map(p => (
                        <button 
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToPlaylist(p.id, track.id);
                          }}
                          className="text-[9px] sm:text-[10px] bg-brand-off-white hover:bg-brand-red hover:text-white px-2 py-1 rounded transition-colors border border-brand-light-gray"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : query ? (
          <p className="text-brand-gray text-sm">No results found for "{query}"</p>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-brand-gray">
            <SearchIcon size={48} sm:size={64} className="mb-4 opacity-10" />
            <p className="text-lg sm:text-xl font-bold text-slate-400">Search for your favorite music</p>
            <p className="text-xs sm:text-sm text-slate-400 text-center">Find songs, artists, and albums</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {contextMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setContextMenu(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[150]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{ 
                left: Math.min(contextMenu.x, window.innerWidth - 250), 
                top: Math.min(contextMenu.y, window.innerHeight - 300) 
              }}
              className="fixed w-60 bg-white rounded-2xl shadow-2xl z-[160] py-2 overflow-hidden border border-slate-100"
            >
              <div className="px-4 py-3 border-b border-slate-100 mb-2">
                <p className="font-black text-slate-900 truncate">{contextMenu.item.title}</p>
                <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">{contextMenu.type}</p>
              </div>
              <div className="flex flex-col">
                <ContextButton 
                  icon={<Play size={16} />} 
                  label="Play Now" 
                  onClick={() => {
                    onTrackSelect(contextMenu.item);
                    setContextMenu(null);
                  }} 
                />
                <ContextButton 
                  icon={<Plus size={16} />} 
                  label="Add to playlist" 
                  onClick={() => {
                    setSuccessMessage('Added to playlist');
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 2000);
                    setContextMenu(null);
                  }} 
                />
                <ContextButton 
                  icon={<ListMusic size={16} />} 
                  label="Add to queue" 
                  onClick={() => {
                    setSuccessMessage('Added to queue');
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 2000);
                    setContextMenu(null);
                  }} 
                />
                {contextMenu.item.album && (
                  <ContextButton 
                    icon={<Disc size={16} />} 
                    label="Go to album" 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('changeView', { 
                        detail: { view: 'album', album: contextMenu.item.album, artist: contextMenu.item.artist } 
                      }));
                      setContextMenu(null);
                    }} 
                  />
                )}
                <ContextButton 
                  icon={<UserIcon size={16} />} 
                  label="Go to artist" 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('changeView', { 
                      detail: { view: 'artist', artist: contextMenu.item.artist } 
                    }));
                    setContextMenu(null);
                  }} 
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl z-[200] flex items-center gap-2"
          >
            <Check size={20} className="text-green-400" /> {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContextButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
  >
    <span className="text-brand-gray">{icon}</span>
    <span className="text-sm font-bold text-slate-700">{label}</span>
  </button>
);
