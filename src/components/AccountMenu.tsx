import React, { useState } from 'react';
import { User, LogOut, Settings, X, Edit2, Save, ListMusic, ChevronLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';

export const AccountMenu: React.FC = () => {
  const { user, logout, login, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'settings' | 'profile'>('main');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');
  const [playlists, setPlaylists] = useState<{ id: number; name: string }[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  const fetchPlaylists = async () => {
    const response = await fetch('/api/playlists', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.ok) {
      const data = await response.json();
      setPlaylists(data);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, email })
      });
      const data = await response.json();
      if (response.ok) {
        login(localStorage.getItem('token')!, data.user);
        setIsEditing(false);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handlePlaylistClick = (id: number) => {
    window.dispatchEvent(new CustomEvent('changeView', { detail: { view: 'playlist', id } }));
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Simulate a vibrant loading effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    logout();
    setIsLoggingOut(false);
    setShowLogoutSuccess(true);
    setIsOpen(false);
    setTimeout(() => setShowLogoutSuccess(false), 3000);
  };

  if (!isAuthenticated && !showLogoutSuccess) return null;

  return (
    <div className="absolute top-4 left-4 z-40">
      <button 
        onClick={() => {
          setIsOpen(true);
          setActiveTab('main');
        }}
        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border border-brand-light-gray group overflow-hidden"
      >
        {user?.name ? (
          <div className="w-full h-full bg-gradient-to-tr from-brand-red to-rose-400 flex items-center justify-center text-white font-black text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <User size={20} className="text-slate-900 group-hover:text-brand-red transition-colors" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-[80] flex flex-col overflow-hidden ${activeTab === 'main' ? 'w-[75%] max-w-[400px]' : 'w-full'}`}
            >
              {activeTab === 'main' && (
                <div className="flex flex-col h-full">
                  <div className="p-6 flex items-center justify-between border-b border-brand-light-gray">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-tr from-brand-red to-rose-400 rounded-full flex items-center justify-center text-white text-xl font-black shadow-md">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-lg font-black text-slate-900 leading-tight">{user?.name}</h3>
                        <button 
                          onClick={() => {
                            setActiveTab('profile');
                            fetchPlaylists();
                          }}
                          className="text-xs font-bold text-brand-gray hover:text-brand-red transition-colors text-left"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-brand-off-white rounded-full transition-colors">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 p-4 space-y-2">
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-brand-off-white transition-all text-slate-900 font-bold group"
                    >
                      <Settings size={22} className="text-brand-gray group-hover:text-brand-red transition-colors" />
                      Settings
                    </button>
                  </div>

                  <div className="p-6 border-t border-brand-light-gray">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-50 transition-all text-brand-red font-black group"
                    >
                      <LogOut size={22} className="group-hover:scale-110 transition-transform" />
                      Logout
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="flex flex-col h-full bg-brand-off-white">
                  <div className="p-6 bg-white flex items-center gap-4 border-b border-brand-light-gray">
                    <button onClick={() => setActiveTab('main')} className="p-2 hover:bg-brand-off-white rounded-full transition-colors">
                      <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-xl font-black text-slate-900">Settings</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-brand-gray">Account Details</h3>
                        <button 
                          onClick={() => setIsEditing(!isEditing)}
                          className="p-2 text-brand-red hover:bg-rose-50 rounded-full transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>

                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-light-gray space-y-4">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-bold uppercase text-brand-gray ml-1 tracking-widest">Name</label>
                              <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-brand-off-white p-3 rounded-xl outline-none border border-brand-light-gray focus:border-brand-red text-sm font-medium"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase text-brand-gray ml-1 tracking-widest">Email</label>
                              <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-brand-off-white p-3 rounded-xl outline-none border border-brand-light-gray focus:border-brand-red text-sm font-medium"
                              />
                            </div>
                            {error && <p className="text-xs text-brand-red font-bold">{error}</p>}
                            <button 
                              onClick={handleUpdate}
                              className="w-full bg-brand-red text-white py-3 rounded-xl font-bold text-sm shadow-lg"
                            >
                              Save Changes
                            </button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <p className="text-[10px] font-bold uppercase text-brand-gray tracking-widest">Name</p>
                              <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase text-brand-gray tracking-widest">Email</p>
                              <p className="text-sm font-bold text-slate-900">{user?.email}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <button className="w-full bg-white p-4 rounded-2xl border border-brand-light-gray text-left text-sm font-bold text-slate-900 hover:bg-brand-off-white transition-colors">
                        Change Password
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full bg-white p-4 rounded-2xl border border-brand-light-gray text-left text-sm font-bold text-brand-red hover:bg-rose-50 transition-colors"
                      >
                        Logout
                      </button>
                    </section>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="flex flex-col h-full bg-brand-off-white">
                  <div className="p-6 bg-white flex items-center gap-4 border-b border-brand-light-gray">
                    <button onClick={() => setActiveTab('main')} className="p-2 hover:bg-brand-off-white rounded-full transition-colors">
                      <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-xl font-black text-slate-900">Profile</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="p-8 bg-white flex flex-col items-center border-b border-brand-light-gray">
                      <div className="w-24 h-24 bg-gradient-to-tr from-brand-red to-rose-400 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-xl mb-4">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">{user?.name}</h3>
                    </div>

                    <div className="p-6">
                      <h4 className="text-xs font-black uppercase tracking-widest text-brand-gray mb-4">Your Playlists</h4>
                      <div className="space-y-2">
                        {playlists.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => handlePlaylistClick(p.id)}
                            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-brand-light-gray hover:border-brand-red transition-all group"
                          >
                            <div className="w-10 h-10 bg-brand-off-white rounded-lg flex items-center justify-center text-brand-red">
                              <ListMusic size={20} />
                            </div>
                            <span className="font-bold text-slate-900 group-hover:text-brand-red transition-colors">{p.name}</span>
                          </button>
                        ))}
                        {playlists.length === 0 && (
                          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-brand-light-gray">
                            <p className="text-sm text-brand-gray font-medium">No playlists created yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoggingOut && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-red z-[1000] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Vibrant Background Effect */}
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1],
                rotate: [0, 90, 0],
                borderRadius: ["20%", "50%", "20%"]
              }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="absolute w-[150%] h-[150%] bg-gradient-to-tr from-rose-500 via-brand-red to-orange-500 opacity-50 blur-3xl"
            />
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 flex flex-col items-center gap-8"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                <Logo className="w-16 h-16" />
              </div>
              <div className="flex flex-col items-center">
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ 
                        height: [8, 32, 8],
                        backgroundColor: ["#ffffff", "#ff4b4b", "#ffffff"]
                      }} 
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} 
                      className="w-2 bg-white rounded-full shadow-lg" 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-full font-black shadow-2xl z-[1001] flex items-center gap-3 border border-white/10"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold">Logged out successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
