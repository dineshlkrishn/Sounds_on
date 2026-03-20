import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'motion/react';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        // Vibrant success effect delay
        setTimeout(() => {
          login(data.token, data.user);
          onClose();
          setIsLoading(false);
        }, 1500);
      } else {
        setError(data.error || 'Authentication failed');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-[85%] sm:w-full sm:max-w-md rounded-3xl p-6 sm:p-8 relative shadow-2xl border border-brand-light-gray my-auto overflow-hidden"
          >
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-[110] bg-white flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.5, 1],
                      rotate: [0, 180, 360],
                      borderRadius: ["20%", "50%", "20%"]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-20 h-20 bg-gradient-to-tr from-brand-red via-purple-500 to-blue-500 blur-xl opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Logo className="w-10 h-10 animate-bounce" />
                  </div>
                </div>
              </motion.div>
            )}
            <button onClick={onClose} className="absolute top-6 right-6 text-brand-gray hover:text-brand-red transition-colors">
              <X size={24} />
            </button>
            
            <div className="flex flex-col items-center mb-8">
              <Logo className="w-16 h-16 mb-4" />
              <h2 className="text-4xl font-black text-brand-red tracking-tighter text-center bg-white px-4 py-1 rounded-lg shadow-sm">
                SoundsOn
              </h2>
              <p className="text-brand-gray text-xs mt-2 font-bold uppercase tracking-widest">Premium Music Experience</p>
            </div>
            
            {error && <p className="bg-red-50 text-brand-red p-3 rounded-xl mb-6 text-sm border border-red-100 text-center font-medium">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase text-brand-gray">Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="bg-brand-off-white p-3 rounded-lg border border-brand-light-gray focus:border-brand-red outline-none transition-all"
                placeholder="Your Name"
                required
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase text-brand-gray">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="bg-brand-off-white p-3 rounded-lg border border-brand-light-gray focus:border-brand-red outline-none transition-all"
              placeholder="Email"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase text-brand-gray">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="bg-brand-off-white p-3 rounded-lg border border-brand-light-gray focus:border-brand-red outline-none transition-all"
              placeholder="Password"
              required
            />
          </div>
          <button className="bg-brand-red text-white font-bold py-4 rounded-full mt-4 hover:bg-brand-dark-red hover:scale-[1.02] transition-all shadow-lg">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-brand-gray">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-red hover:underline ml-1 font-bold"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
