import React, { useState, useEffect } from 'react';
import { Home, Search, Library, Plus, LogIn, LogOut, ListMusic, Radio, Mic, Code } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { motion } from 'motion/react';

interface BottomNavProps {
  onHomeClick: () => void;
  onSearchClick: () => void;
  onPlaylistClick: (id: number) => void;
  onRadioClick: () => void;
  onPodcastsClick: () => void;
  onLibraryClick: () => void;
  onDevClick: () => void;
  activeView: string;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  onHomeClick, 
  onSearchClick, 
  onPlaylistClick, 
  onRadioClick,
  onPodcastsClick,
  onLibraryClick,
  onDevClick,
  activeView,
  isAuthModalOpen,
  setIsAuthModalOpen
}) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [playlists, setPlaylists] = useState<{ id: number; name: string }[]>([]);
  const [showPlaylists, setShowPlaylists] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
    }
  }, [isAuthenticated]);

  const fetchPlaylists = async () => {
    const response = await fetch('/api/playlists', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      const data = await response.json();
      setPlaylists(data);
    }
  };

  const NavButton = ({ onClick, active, icon: Icon, label, id }: { onClick: () => void, active: boolean, icon: any, label: string, id: string }) => {
    return (
      <motion.button 
        whileTap={{ scale: 0.8, rotate: [0, -10, 10, 0] }}
        onClick={onClick}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors flex-1 text-white`}
      >
        <Icon 
          size={24} 
          fill={active ? "currentColor" : "none"} 
          strokeWidth={active ? 3.5 : 2.5} 
          className={active ? 'text-white' : 'text-white/70'} 
        />
        <span className={`text-[10px] font-bold mt-1 ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
      </motion.button>
    );
  };

  return (
    <div className="bg-brand-red w-full px-4 py-2 flex flex-col gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.5)] z-20 border-t border-white/5">
      {showPlaylists && isAuthenticated && (
        <div className="absolute bottom-full left-0 w-full bg-white border-t border-brand-light-gray p-4 max-h-48 overflow-y-auto animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-bold uppercase text-brand-gray">Your Playlists</span>
            <button onClick={() => setShowPlaylists(false)} className="text-brand-red text-xs font-bold">Close</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {playlists.map(p => (
              <button 
                key={p.id}
                onClick={() => {
                  onPlaylistClick(p.id);
                  setShowPlaylists(false);
                }}
                className="text-sm text-left p-2 rounded hover:bg-brand-off-white truncate"
              >
                {p.name}
              </button>
            ))}
            {playlists.length === 0 && <p className="text-xs text-brand-gray p-2">No playlists yet</p>}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between max-w-5xl mx-auto w-full px-2 sm:px-6">
        <div className="flex items-center justify-between w-full">
          <NavButton onClick={onHomeClick} active={activeView === 'home'} icon={Home} label="Home" id="home" />
          <NavButton onClick={onSearchClick} active={activeView === 'search'} icon={Search} label="Search" id="search" />
          <NavButton onClick={onRadioClick} active={activeView === 'radio'} icon={Radio} label="Radio" id="radio" />
          <NavButton onClick={onPodcastsClick} active={activeView === 'podcasts'} icon={Mic} label="Podcasts" id="podcasts" />
          <NavButton onClick={() => isAuthenticated ? onLibraryClick() : setIsAuthModalOpen(true)} active={activeView === 'library' || activeView === 'playlist'} icon={ListMusic} label="Library" id="library" />
          <NavButton onClick={onDevClick} active={activeView === 'dev'} icon={Code} label="Dev" id="dev" />
        </div>
      </div>
    </div>
  );
};
