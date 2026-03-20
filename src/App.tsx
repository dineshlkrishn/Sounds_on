import React, { useState, useEffect } from 'react';
import { MainContent } from './components/MainContent';
import { Player } from './components/Player';
import { SearchView } from './components/SearchView';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { Track } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const SoundsOnApp: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'search' | 'playlist' | 'radio' | 'podcasts' | 'library' | 'album' | 'artist' | 'dev'>('home');
  const [activePlaylistId, setActivePlaylistId] = useState<number | null>(null);
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [activeArtist, setActiveArtist] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleShowToast = (e: any) => {
      setToast({ message: e.detail.message, visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    window.addEventListener('showToast', handleShowToast);
    return () => window.removeEventListener('showToast', handleShowToast);
  }, []);

  useEffect(() => {
    const handleChangeView = (e: any) => {
      const { view, album, artist } = e.detail;
      setActiveView(view);
      setActiveAlbum(album || null);
      setActiveArtist(artist || null);
    };
    window.addEventListener('changeView', handleChangeView);
    return () => window.removeEventListener('changeView', handleChangeView);
  }, []);

  const handleTrackSelect = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipNext = () => {
    // Basic skip next logic could be implemented here if we had a queue
    console.log('Skip next');
  };

  const handleSkipPrev = () => {
    console.log('Skip prev');
  };

  const handlePlaylistClick = (id: number) => {
    setActivePlaylistId(id);
    setActiveView('playlist');
  };

  return (
    <div className="flex flex-col h-screen bg-brand-off-white overflow-hidden font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] bg-brand-red text-white px-6 py-3 rounded-full shadow-lg font-medium"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {activeView === 'search' ? (
            <motion.div 
              key="search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <SearchView 
                onTrackSelect={handleTrackSelect}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <MainContent 
                tracks={[]} // This is handled internally by MainContent based on view
                onTrackSelect={handleTrackSelect}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                playlistId={activePlaylistId}
                view={activeView}
                albumName={activeAlbum}
                artistName={activeArtist}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="flex flex-col z-50">
        <Player 
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onSkipNext={handleSkipNext}
          onSkipPrev={handleSkipPrev}
          playlistId={activePlaylistId}
          setIsAuthModalOpen={setIsAuthModalOpen}
        />
        <BottomNav 
          onHomeClick={() => setActiveView('home')}
          onSearchClick={() => setActiveView('search')}
          onPlaylistClick={handlePlaylistClick}
          onRadioClick={() => setActiveView('radio')}
          onPodcastsClick={() => setActiveView('podcasts')}
          onLibraryClick={() => setActiveView('library')}
          onDevClick={() => setActiveView('dev')}
          activeView={activeView}
          isAuthModalOpen={isAuthModalOpen}
          setIsAuthModalOpen={setIsAuthModalOpen}
        />
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SoundsOnApp />
    </AuthProvider>
  );
};

export default App;

