import React, { useState, useEffect } from 'react';
import { Play, Clock, Trash2, Plus, X, Edit2, Check, Search, MoreHorizontal, ListMusic, Heart, MinusCircle, Music, Radio as RadioIcon, Mic, Disc, User as UserIcon, Share2 } from 'lucide-react';
import { Track } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { AccountMenu } from './AccountMenu';
import { Logo } from './Logo';
import { FALLBACK_MUSIC_IMAGE, FALLBACK_RADIO_IMAGE, FALLBACK_PODCAST_IMAGE } from '../constants';
import { DevView } from './DevView';

interface MainContentProps {
  tracks: Track[];
  onTrackSelect: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  playlistId: number | null;
  view: 'home' | 'playlist' | 'radio' | 'podcasts' | 'library' | 'album' | 'artist' | 'dev';
  albumName?: string | null;
  artistName?: string | null;
}

export const MainContent: React.FC<MainContentProps> = ({ tracks, onTrackSelect, currentTrack, isPlaying, playlistId, view, albumName, artistName }) => {
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [isAlbumLoading, setIsAlbumLoading] = useState(false);
  const [isArtistLoading, setIsArtistLoading] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState<{ id: number; name: string; description: string } | null>(null);
  const [newTracks, setNewTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [radioStations, setRadioStations] = useState<any[]>([]);
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const { isAuthenticated, user } = useAuth();

  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [suggestions, setSuggestions] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: any; type: 'track' | 'radio' | 'podcast' } | null>(null);

  useEffect(() => {
    if (view === 'home') {
      fetchHomeData();
    } else if (view === 'playlist' && playlistId && isAuthenticated) {
      fetchPlaylistData();
    } else if (view === 'radio') {
      fetchRadioData();
    } else if (view === 'podcasts') {
      fetchPodcastsData();
    } else if (view === 'library') {
      fetchLibraryData();
    } else if (view === 'album' && albumName) {
      fetchAlbumData();
    } else if (view === 'artist' && artistName) {
      fetchArtistData();
    }
  }, [view, playlistId, isAuthenticated, albumName, artistName]);

  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);

  const fetchAlbumData = async () => {
    setIsAlbumLoading(true);
    try {
      const res = await fetch(`/api/tracks/album?name=${encodeURIComponent(albumName!)}&artist=${encodeURIComponent(artistName || '')}`);
      if (res.ok) setAlbumTracks(await res.json());
    } finally {
      setTimeout(() => setIsAlbumLoading(false), 800);
    }
  };

  const fetchArtistData = async () => {
    setIsArtistLoading(true);
    try {
      const res = await fetch(`/api/tracks/artist?name=${encodeURIComponent(artistName!)}`);
      if (res.ok) setArtistTracks(await res.json());
    } finally {
      setTimeout(() => setIsArtistLoading(false), 800);
    }
  };

  const fetchLibraryData = async () => {
    if (!isAuthenticated) return;
    setIsLibraryLoading(true);
    try {
      const res = await fetch('/api/playlists', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setUserPlaylists(await res.json());
    } finally {
      setTimeout(() => setIsLibraryLoading(false), 800);
    }
  };

  const fetchSuggestions = async () => {
    const response = await fetch('/api/tracks/suggestions');
    if (response.ok) {
      const data = await response.json();
      setSuggestions(data);
    }
  };

  const handleUpdatePlaylistName = async () => {
    if (!playlistInfo || !newName.trim()) return;
    const response = await fetch(`/api/playlists/${playlistInfo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name: newName })
    });
    if (response.ok) {
      setPlaylistInfo({ ...playlistInfo, name: newName });
      setIsEditingName(false);
      fetchLibraryData();
    }
  };

  const handleAddTrackToPlaylist = async (trackId: string) => {
    if (!playlistId) return;
    setIsLoading(true);
    const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ trackId })
    });
    setIsLoading(false);
    if (response.ok) {
      setSuccessMessage('Added to playlist');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      fetchPlaylistData();
    }
  };

  const handleRemoveTrackFromPlaylist = async (trackId: string) => {
    if (!playlistId) return;
    const response = await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (response.ok) {
      setSuccessMessage('Removed from playlist');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      fetchPlaylistData();
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const response = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ name: newPlaylistName, description: '' })
    });
    if (response.ok) {
      setNewPlaylistName('');
      setIsCreateModalOpen(false);
      fetchLibraryData();
    }
  };

  const fetchHomeData = async () => {
    const [newRes, recRes] = await Promise.all([
      fetch('/api/tracks/new'),
      fetch('/api/tracks/recommended')
    ]);
    if (newRes.ok) setNewTracks(await newRes.json());
    if (recRes.ok) setRecommendedTracks(await recRes.json());
    
    if (isAuthenticated) {
      const recentRes = await fetch('/api/tracks/recent', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (recentRes.ok) setRecentTracks(await recentRes.json());
    }
  };

  const fetchRadioData = async () => {
    const res = await fetch('/api/radio');
    if (res.ok) setRadioStations(await res.json());
  };

  const fetchPodcastsData = async () => {
    const res = await fetch('/api/podcasts');
    if (res.ok) setPodcasts(await res.json());
  };

  const handleLongPress = (e: React.MouseEvent | React.TouchEvent, item: any, type: 'track' | 'radio' | 'podcast') => {
    e.preventDefault();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setContextMenu({ x, y, item, type });
  };

  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const startLongPress = (e: React.MouseEvent | React.TouchEvent, item: any, type: 'track' | 'radio' | 'podcast') => {
    longPressTimerRef.current = setTimeout(() => {
      handleLongPress(e, item, type);
    }, 500);
  };

  const stopLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };
  const fetchPlaylistData = async () => {
    const [tracksRes, playlistsRes] = await Promise.all([
      fetch(`/api/playlists/${playlistId}/tracks`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }),
      fetch('/api/playlists', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
    ]);

    if (tracksRes.ok && playlistsRes.ok) {
      const tracksData = await tracksRes.json();
      const playlistsData = await playlistsRes.json();
      const currentPlaylist = playlistsData.find((p: any) => p.id === playlistId);
      setPlaylistTracks(tracksData);
      setPlaylistInfo(currentPlaylist);
    }
  };

  if (view === 'home') {
    return (
      <div className="flex-1 bg-brand-off-white overflow-y-auto p-4 sm:p-8 pb-32 radiant-bg relative">
        <AccountMenu />
        <header className="mb-8 pt-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 mb-2">Welcome back</h1>
            <p className="text-brand-gray font-medium">Here's what we've found for you today.</p>
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <HomeSection title="Newly Added" tracks={newTracks} onTrackSelect={onTrackSelect} startLongPress={startLongPress} stopLongPress={stopLongPress} />
        </motion.div>

        {isAuthenticated && recentTracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <HomeSection title="Recently Played" tracks={recentTracks} onTrackSelect={onTrackSelect} startLongPress={startLongPress} stopLongPress={stopLongPress} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <HomeSection title="Recommended for You" tracks={recommendedTracks} onTrackSelect={onTrackSelect} startLongPress={startLongPress} stopLongPress={stopLongPress} />
        </motion.div>
      </div>
    );
  }

  if (view === 'radio') {
    return (
      <div className="flex-1 bg-brand-off-white overflow-y-auto p-4 sm:p-8 pb-32 radiant-bg relative">
        <header className="mb-8 pt-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 mb-2">FM Radio</h1>
            <p className="text-brand-gray font-medium">Listen to live stations from around the world.</p>
          </motion.div>
        </header>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {radioStations.map((station, i) => (
            <motion.div 
              key={station.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onMouseDown={(e) => startLongPress(e, station, 'radio')}
              onMouseUp={stopLongPress}
              onMouseLeave={stopLongPress}
              onTouchStart={(e) => startLongPress(e, station, 'radio')}
              onTouchEnd={stopLongPress}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => onTrackSelect({
                id: station.id,
                title: station.name,
                artist: station.frequency,
                album: station.genre,
                duration: Infinity,
                coverUrl: station.coverUrl,
                audioUrl: station.streamUrl
              })}
              className="flex flex-col group cursor-pointer"
            >
              <div className="relative aspect-square mb-4 overflow-hidden rounded-3xl shadow-sm">
                <img 
                  src={station.coverUrl || FALLBACK_RADIO_IMAGE} 
                  alt={station.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_RADIO_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play size={24} fill="white" className="ml-1" />
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 truncate">{station.name}</h3>
              <p className="text-xs text-brand-red font-bold uppercase tracking-widest">{station.frequency}</p>
              <p className="text-xs text-brand-gray font-medium truncate">{station.genre}</p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'podcasts') {
    return (
      <div className="flex-1 bg-brand-off-white overflow-y-auto p-4 sm:p-8 pb-32 radiant-bg relative">
        <header className="mb-8 pt-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 mb-2">Podcasts</h1>
            <p className="text-brand-gray font-medium">Explore featured stories and ongoing series.</p>
          </motion.div>
        </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast, i) => (
            <motion.div 
              key={podcast.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onMouseDown={(e) => startLongPress(e, podcast, 'podcast')}
              onMouseUp={stopLongPress}
              onMouseLeave={stopLongPress}
              onTouchStart={(e) => startLongPress(e, podcast, 'podcast')}
              onTouchEnd={stopLongPress}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => onTrackSelect({
                id: podcast.id,
                title: podcast.title,
                artist: podcast.host,
                album: 'Podcast',
                duration: 0,
                coverUrl: podcast.coverUrl,
                audioUrl: podcast.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
              })}
              className="flex gap-6 cursor-pointer group"
            >
              <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-2xl shadow-md">
                <img 
                  src={podcast.coverUrl || FALLBACK_PODCAST_IMAGE} 
                  alt={podcast.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_PODCAST_IMAGE;
                  }}
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-brand-red transition-colors truncate">{podcast.title}</h3>
                <p className="text-sm font-bold text-brand-gray mb-2 truncate">{podcast.host}</p>
                <p className="text-xs text-brand-gray line-clamp-2 font-medium">{podcast.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'playlist') {
    if (!playlistInfo) return null;

    return (
      <div className="flex-1 bg-gradient-to-b from-rose-100 to-brand-off-white overflow-y-auto p-4 sm:p-8 pb-32 relative">
        <header className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-32 h-32 sm:w-60 sm:h-60 shadow-xl"
          >
            <img 
              src={playlistTracks.length > 0 ? playlistTracks[0].coverUrl : `https://picsum.photos/seed/playlist-${playlistId}/600/600`} 
              alt="Playlist Cover" 
              className="w-full h-full object-cover rounded-xl border-2 sm:border-4 border-white shadow-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
              }}
            />
          </motion.div>
          <div className="flex flex-col items-center sm:items-start gap-1 sm:gap-2 text-center sm:text-left flex-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-brand-red">Playlist</span>
            <div className="flex items-center gap-2 group w-full justify-center sm:justify-start">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white/50 border border-brand-red/20 rounded px-2 py-1 text-2xl sm:text-6xl font-black tracking-tighter focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleUpdatePlaylistName} className="p-2 bg-brand-red text-white rounded-full">
                    <Check size={20} />
                  </button>
                  <button onClick={() => setIsEditingName(false)} className="p-2 bg-slate-200 rounded-full">
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-8xl font-black tracking-tighter text-slate-900 truncate max-w-full">
                    {playlistInfo.name}
                  </h1>
                  <button 
                    onClick={() => { setNewName(playlistInfo.name); setIsEditingName(true); }}
                    className="p-2 opacity-60 hover:opacity-100 transition-opacity hover:bg-white/50 rounded-full"
                  >
                    <Edit2 size={24} className="text-brand-red" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-gray">
              <span className="hover:underline cursor-pointer text-slate-900">{user?.name}</span>
              <span>•</span>
              <span>{playlistTracks.length} songs</span>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-4 mb-8 justify-center sm:justify-start">
          <button 
            onClick={() => playlistTracks.length > 0 && onTrackSelect(playlistTracks[0])}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-red rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg"
          >
            <Play size={24} fill="white" className="ml-1" />
          </button>
          <button 
            onClick={() => { setIsAddingToPlaylist(!isAddingToPlaylist); if(!isAddingToPlaylist) fetchSuggestions(); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${isAddingToPlaylist ? 'bg-brand-red text-white' : 'bg-white text-brand-red border border-brand-red/20'}`}
          >
            <Plus size={20} /> Add
          </button>
          <button 
            onClick={() => setIsEditingPlaylist(!isEditingPlaylist)}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${isEditingPlaylist ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}
          >
            {isEditingPlaylist ? 'Done' : 'Edit'}
          </button>
        </div>

        {isAddingToPlaylist && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white/50 rounded-3xl p-6 backdrop-blur-sm border border-white"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-black text-slate-900">Recommended for this playlist</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" size={18} />
                <input 
                  type="text" 
                  placeholder="Search songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-brand-light-gray rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-red transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {suggestions
                .filter(t => !playlistTracks.some(pt => pt.id === t.id))
                .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((track) => (
                <div 
                  key={track.id} 
                  onMouseDown={(e) => startLongPress(e, track, 'track')}
                  onMouseUp={stopLongPress}
                  onMouseLeave={stopLongPress}
                  onTouchStart={(e) => startLongPress(e, track, 'track')}
                  onTouchEnd={stopLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  className="flex items-center justify-between p-2 hover:bg-white rounded-xl group transition-all cursor-pointer"
                  onClick={() => onTrackSelect(track)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={track.coverUrl || FALLBACK_MUSIC_IMAGE} 
                      alt="" 
                      className="w-10 h-10 rounded shadow-sm object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{track.title}</p>
                      <p className="text-xs text-brand-gray truncate">{track.artist}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAddTrackToPlaylist(track.id)}
                    className="p-2 bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white rounded-full transition-all"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="w-full">
          <div className="grid grid-cols-[40px_1fr_100px] sm:grid-cols-[40px_1fr_1fr_1fr_100px] gap-4 px-4 py-2 text-brand-gray text-[10px] font-bold uppercase border-b border-brand-light-gray mb-4">
            <span>#</span>
            <span>Title</span>
            <span className="hidden sm:block">Album</span>
            <span className="hidden md:block">Date Added</span>
            <span className="flex justify-end"><Clock size={16} /></span>
          </div>

          <div className="flex flex-col gap-1">
            {playlistTracks.map((track, index) => (
              <div 
                key={track.id} 
                onMouseDown={(e) => startLongPress(e, track, 'track')}
                onMouseUp={stopLongPress}
                onMouseLeave={stopLongPress}
                onTouchStart={(e) => startLongPress(e, track, 'track')}
                onTouchEnd={stopLongPress}
                onContextMenu={(e) => e.preventDefault()}
                className="grid grid-cols-[40px_1fr_100px] sm:grid-cols-[40px_1fr_1fr_1fr_100px] gap-4 px-4 py-3 rounded-xl hover:bg-white group cursor-pointer transition-all items-center border border-transparent hover:shadow-sm"
                onClick={() => onTrackSelect(track)}
              >
                <div className="text-brand-gray text-sm">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3 w-3">
                      <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0.1s' }} />
                    </div>
                  ) : (
                    <span className={currentTrack?.id === track.id ? 'text-brand-red' : ''}>{index + 1}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={track.coverUrl || FALLBACK_MUSIC_IMAGE} 
                    alt="" 
                    className="w-10 h-10 rounded shadow-sm object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
                    }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold truncate ${currentTrack?.id === track.id ? 'text-brand-red' : 'text-slate-900'}`}>
                      {track.title}
                    </span>
                    <span className="text-xs text-brand-gray truncate">{track.artist}</span>
                  </div>
                </div>
                <span className="text-xs text-brand-gray truncate hidden sm:block">{track.album}</span>
                <span className="text-xs text-brand-gray truncate hidden md:block">Just now</span>
                <div className="flex items-center justify-end gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* Toggle like logic could go here */ }}
                    className="opacity-0 group-hover:opacity-100 text-brand-gray hover:text-brand-red transition-all"
                  >
                    <Heart size={16} />
                  </button>
                  {isEditingPlaylist ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemoveTrackFromPlaylist(track.id); }}
                      className="p-2 text-brand-red hover:bg-brand-red/10 rounded-full transition-all"
                    >
                      <MinusCircle size={20} strokeWidth={3} />
                    </button>
                  ) : (
                    <span className="text-xs text-brand-gray font-mono">
                      {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-[200]">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
          </div>
        )}

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
                  <p className="font-black text-slate-900 truncate">{contextMenu.item.title || contextMenu.item.name}</p>
                  <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">{contextMenu.type}</p>
                </div>
                <div className="flex flex-col">
                  <ContextButton 
                    icon={<Play size={16} />} 
                    label="Play Now" 
                    onClick={() => {
                      if (contextMenu.type === 'track') onTrackSelect(contextMenu.item);
                      else if (contextMenu.type === 'radio') onTrackSelect({
                        id: contextMenu.item.id,
                        title: contextMenu.item.name,
                        artist: contextMenu.item.frequency,
                        album: contextMenu.item.genre,
                        duration: Infinity,
                        coverUrl: contextMenu.item.coverUrl,
                        audioUrl: contextMenu.item.streamUrl
                      });
                      setContextMenu(null);
                    }} 
                  />
                  {contextMenu.type === 'track' && (
                    <>
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
                      <ContextButton 
                        icon={<Share2 size={16} />} 
                        label="Share" 
                        onClick={() => {
                          const trackLink = `${window.location.origin}/track/${contextMenu.item.id}`;
                          navigator.clipboard.writeText(trackLink).then(() => {
                            setSuccessMessage('Link copied to clipboard');
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 2000);
                            setContextMenu(null);
                          });
                        }} 
                      />
                    </>
                  )}
                  {contextMenu.type === 'radio' && (
                    <ContextButton 
                      icon={<RadioIcon size={16} />} 
                      label="Go to radio page" 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('changeView', { detail: { view: 'radio' } }));
                        setContextMenu(null);
                      }} 
                    />
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && successMessage && (
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
  }

  if (view === 'album') {
    if (isAlbumLoading) {
      return (
        <div className="flex-1 bg-brand-off-white flex items-center justify-center radiant-bg">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <Logo className="w-16 h-16" />
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ height: [4, 24, 4] }} 
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} 
                  className="w-1 bg-brand-red rounded-full" 
                />
              ))}
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-gradient-to-b from-slate-200 to-brand-off-white overflow-y-auto p-4 sm:p-8 pb-32 relative">
        <header className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-32 h-32 sm:w-60 sm:h-60 shadow-xl"
          >
            <img 
              src={albumTracks.length > 0 ? albumTracks[0].coverUrl : FALLBACK_MUSIC_IMAGE} 
              alt="Album Cover" 
              className="w-full h-full object-cover rounded-xl border-2 sm:border-4 border-white shadow-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
              }}
            />
          </motion.div>
          <div className="flex flex-col items-center sm:items-start gap-1 sm:gap-2 text-center sm:text-left flex-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-brand-red">Album</span>
            <h1 className="text-3xl sm:text-8xl font-black tracking-tighter text-slate-900 truncate max-w-full">
              {albumName}
            </h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-gray">
              <span className="hover:underline cursor-pointer text-slate-900">{artistName}</span>
              <span>•</span>
              <span>{albumTracks.length} songs</span>
            </div>
          </div>
        </header>

        <div className="flex items-center gap-4 mb-8 justify-center sm:justify-start">
          <button 
            onClick={() => albumTracks.length > 0 && onTrackSelect(albumTracks[0])}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-red rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg"
          >
            <Play size={24} fill="white" className="ml-1" />
          </button>
          <button className="p-3 border border-slate-200 rounded-full hover:bg-white transition-colors">
            <Heart size={24} />
          </button>
          <button className="p-3 border border-slate-200 rounded-full hover:bg-white transition-colors">
            <MoreHorizontal size={24} />
          </button>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-[40px_1fr_100px] sm:grid-cols-[40px_1fr_1fr_100px] gap-4 px-4 py-2 text-brand-gray text-[10px] font-bold uppercase border-b border-brand-light-gray mb-4">
            <span>#</span>
            <span>Title</span>
            <span className="hidden sm:block">Artist</span>
            <span className="flex justify-end"><Clock size={16} /></span>
          </div>

          <div className="flex flex-col gap-1">
            {albumTracks.map((track, index) => (
              <div 
                key={track.id} 
                onMouseDown={(e) => startLongPress(e, track, 'track')}
                onMouseUp={stopLongPress}
                onMouseLeave={stopLongPress}
                onTouchStart={(e) => startLongPress(e, track, 'track')}
                onTouchEnd={stopLongPress}
                onContextMenu={(e) => e.preventDefault()}
                className="grid grid-cols-[40px_1fr_100px] sm:grid-cols-[40px_1fr_1fr_100px] gap-4 px-4 py-3 rounded-xl hover:bg-white group cursor-pointer transition-all items-center border border-transparent hover:shadow-sm"
                onClick={() => onTrackSelect(track)}
              >
                <div className="text-brand-gray text-sm">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3 w-3">
                      <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0.1s' }} />
                    </div>
                  ) : (
                    <span className={currentTrack?.id === track.id ? 'text-brand-red' : ''}>{index + 1}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-bold truncate ${currentTrack?.id === track.id ? 'text-brand-red' : 'text-slate-900'}`}>
                    {track.title}
                  </span>
                  <span className="text-xs text-brand-gray truncate sm:hidden">{track.artist}</span>
                </div>
                <span className="text-xs text-brand-gray truncate hidden sm:block">{track.artist}</span>
                <div className="flex items-center justify-end gap-4">
                  <button className="opacity-0 group-hover:opacity-100 text-brand-gray hover:text-brand-red transition-all">
                    <Heart size={16} />
                  </button>
                  <span className="text-xs text-brand-gray font-mono">
                    {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'artist') {
    if (isArtistLoading) {
      return (
        <div className="flex-1 bg-brand-off-white flex items-center justify-center radiant-bg">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <Logo className="w-16 h-16" />
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ height: [4, 24, 4] }} 
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} 
                  className="w-1 bg-brand-red rounded-full" 
                />
              ))}
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-gradient-to-b from-brand-red/10 to-brand-off-white overflow-y-auto p-4 sm:p-8 pb-32 relative">
        <header className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-32 h-32 sm:w-60 sm:h-60 shadow-xl"
          >
            <img 
              src={artistTracks.length > 0 ? artistTracks[0].coverUrl : FALLBACK_MUSIC_IMAGE} 
              alt="Artist" 
              className="w-full h-full object-cover rounded-full border-2 sm:border-4 border-white shadow-lg"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
              }}
            />
          </motion.div>
          <div className="flex flex-col items-center sm:items-start gap-1 sm:gap-2 text-center sm:text-left flex-1">
            <div className="flex items-center gap-2">
              <Check size={16} className="bg-blue-500 text-white rounded-full p-0.5" />
              <span className="text-[10px] sm:text-xs font-bold uppercase text-brand-red">Verified Artist</span>
            </div>
            <h1 className="text-4xl sm:text-8xl font-black tracking-tighter text-slate-900 truncate max-w-full">
              {artistName}
            </h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-gray">
              <span>{artistTracks.length} monthly listeners</span>
            </div>
          </div>
        </header>

        <div className="flex items-center gap-4 mb-8 justify-center sm:justify-start">
          <button 
            onClick={() => artistTracks.length > 0 && onTrackSelect(artistTracks[0])}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-red rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg"
          >
            <Play size={24} fill="white" className="ml-1" />
          </button>
          <button className="px-6 py-2 border-2 border-slate-900 rounded-full font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all">
            Follow
          </button>
          <button className="p-3 border border-slate-200 rounded-full hover:bg-white transition-colors">
            <MoreHorizontal size={24} />
          </button>
        </div>

        <div className="w-full">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Popular</h2>
          <div className="flex flex-col gap-1">
            {artistTracks.map((track, index) => (
              <div 
                key={track.id} 
                onMouseDown={(e) => startLongPress(e, track, 'track')}
                onMouseUp={stopLongPress}
                onMouseLeave={stopLongPress}
                onTouchStart={(e) => startLongPress(e, track, 'track')}
                onTouchEnd={stopLongPress}
                onContextMenu={(e) => e.preventDefault()}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white group cursor-pointer transition-all border border-transparent hover:shadow-sm"
                onClick={() => onTrackSelect(track)}
              >
                <div className="w-8 text-brand-gray text-sm font-bold">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3 w-3">
                      <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0.1s' }} />
                    </div>
                  ) : (
                    <span className={currentTrack?.id === track.id ? 'text-brand-red' : ''}>{index + 1}</span>
                  )}
                </div>
                <img 
                  src={track.coverUrl || FALLBACK_MUSIC_IMAGE} 
                  alt="" 
                  className="w-10 h-10 rounded shadow-sm object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${currentTrack?.id === track.id ? 'text-brand-red' : 'text-slate-900'}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-brand-gray truncate">{track.album}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button className="opacity-0 group-hover:opacity-100 text-brand-gray hover:text-brand-red transition-all">
                    <Heart size={16} />
                  </button>
                  <span className="text-xs text-brand-gray font-mono">
                    {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'library') {
    if (isLibraryLoading) {
      return (
        <div className="flex-1 bg-brand-off-white flex items-center justify-center radiant-bg">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <Logo className="w-16 h-16" />
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ height: [4, 24, 4] }} 
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} 
                  className="w-1 bg-brand-red rounded-full" 
                />
              ))}
            </div>
          </motion.div>
        </div>
      );
    }
    return (
      <div className="flex-1 bg-brand-off-white overflow-y-auto p-4 sm:p-8 pb-32 radiant-bg relative">
        <header className="mb-8 pt-12 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 mb-2">Your Library</h1>
            <p className="text-brand-gray font-medium">Everything you love, all in one place.</p>
          </motion.div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-12 h-12 bg-brand-red text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-xl flex flex-col justify-end aspect-square cursor-pointer group"
          >
            <h3 className="text-2xl font-black text-white mb-1">Liked Songs</h3>
            <p className="text-white/80 text-sm font-bold uppercase tracking-widest">{userPlaylists.find(p => p.name === 'Liked Songs')?.trackCount || 0} songs</p>
          </motion.div>

          {userPlaylists.filter(p => p.name !== 'Liked Songs').map((playlist, i) => (
            <motion.div 
              key={playlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('changeView', { detail: { view: 'playlist', id: playlist.id } }));
              }}
              className="flex flex-col group cursor-pointer"
            >
              <div className="aspect-square mb-4 relative overflow-hidden rounded-3xl shadow-sm">
                <img 
                  src={`https://picsum.photos/seed/playlist-${playlist.id}/300/300`} 
                  alt={playlist.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play size={24} fill="white" className="ml-1" />
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 truncate">{playlist.name}</h3>
              <p className="text-xs text-brand-gray font-medium">Playlist • {user?.name}</p>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {isCreateModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreateModalOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[32px] p-8 shadow-2xl z-[110]"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">New Playlist</h2>
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-brand-off-white rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-brand-gray ml-1 tracking-widest">Playlist Name</label>
                    <input 
                      type="text" 
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="My Awesome Mix"
                      className="w-full bg-brand-off-white p-4 rounded-2xl outline-none border border-brand-light-gray focus:border-brand-red text-sm font-medium transition-all"
                    />
                  </div>
                  <button 
                    onClick={handleCreatePlaylist}
                    className="w-full bg-brand-red text-white py-4 rounded-2xl font-black shadow-lg hover:bg-brand-dark-red transition-colors active:scale-95"
                  >
                    Create Playlist
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (view === 'dev') {
    return <DevView />;
  }

  return null;
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

const TrackRow: React.FC<{ 
  track: Track; 
  index: number; 
  onSelect: () => void;
  isActive: boolean;
  isPlaying: boolean;
  onRemove?: (e: React.MouseEvent) => void;
}> = ({ track, index, onSelect, isActive, isPlaying, onRemove }) => (
  <div 
    onClick={onSelect}
    className="grid grid-cols-[40px_1fr_1fr_100px] gap-4 px-4 py-2 rounded-xl hover:bg-white group cursor-pointer transition-all items-center border border-transparent hover:shadow-sm"
  >
    <div className="text-brand-gray text-sm flex items-center">
      {isActive && isPlaying ? (
        <div className="flex items-end gap-0.5 h-3 w-3">
          <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-0.5 bg-brand-red animate-bounce" style={{ animationDelay: '0.1s' }} />
        </div>
      ) : (
        <span className={`${isActive ? 'text-brand-red' : ''}`}>{index}</span>
      )}
    </div>
    <div className="flex items-center gap-3">
      <img 
        src={track.coverUrl} 
        alt={track.title} 
        className="w-10 h-10 rounded shadow-sm"
        referrerPolicy="no-referrer"
      />
      <div className="flex flex-col">
        <span className={`text-sm font-medium truncate ${isActive ? 'text-brand-red' : 'text-slate-900'}`}>
          {track.title}
        </span>
        <span className="text-xs text-brand-gray group-hover:text-slate-600 transition-colors truncate">
          {track.artist}
        </span>
      </div>
    </div>
    <span className="text-xs text-brand-gray truncate group-hover:text-slate-600 transition-colors">
      {track.album}
    </span>
    <div className="flex items-center justify-end gap-4">
      {onRemove && (
        <button 
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-brand-gray hover:text-brand-dark-red transition-all"
        >
          <Trash2 size={16} />
        </button>
      )}
      <span className="text-xs text-brand-gray">
        {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
      </span>
    </div>
  </div>
);

const HomeSection: React.FC<{ 
  title: string; 
  tracks: Track[]; 
  onTrackSelect: (track: Track) => void;
  startLongPress: (e: React.MouseEvent | React.TouchEvent, item: any, type: 'track' | 'radio' | 'podcast') => void;
  stopLongPress: () => void;
}> = ({ title, tracks, onTrackSelect, startLongPress, stopLongPress }) => {
  const [showAll, setShowAll] = useState(false);
  const displayTracks = showAll ? tracks : tracks.slice(0, 5);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
        {tracks.length > 5 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold text-brand-red uppercase tracking-widest hover:underline"
          >
            {showAll ? 'Show less' : 'Show all'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {displayTracks.map(track => (
          <motion.div 
            key={track.id} 
            whileHover={{ y: -5 }}
            onMouseDown={(e) => startLongPress(e, track, 'track')}
            onMouseUp={stopLongPress}
            onMouseLeave={stopLongPress}
            onTouchStart={(e) => startLongPress(e, track, 'track')}
            onTouchEnd={stopLongPress}
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => onTrackSelect(track)}
            className="flex flex-col group cursor-pointer"
          >
            <div className="relative aspect-square mb-3 sm:mb-4 overflow-hidden rounded-2xl shadow-sm">
              <img 
                src={track.coverUrl || FALLBACK_MUSIC_IMAGE} 
                alt={track.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_MUSIC_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                  <Play size={24} fill="white" className="ml-1" />
                </div>
              </div>
            </div>
            <h3 className="font-bold text-slate-900 truncate text-sm sm:text-base mb-0.5">{track.title}</h3>
            <p className="text-xs text-brand-gray truncate font-medium">{track.artist}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
