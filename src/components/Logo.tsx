import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`${className} relative flex items-center justify-center group`}>
    <div className="absolute inset-0 bg-gradient-to-tr from-brand-red to-rose-400 rounded-xl rotate-12 opacity-20 group-hover:rotate-45 transition-transform duration-500 blur-sm" />
    <div className="absolute inset-0 bg-gradient-to-tr from-brand-red to-rose-500 rounded-xl -rotate-6 group-hover:-rotate-12 transition-transform duration-500 shadow-lg" />
    <div className="relative z-10 flex items-end gap-0.5 h-4">
      <div className="w-1 bg-white rounded-full animate-[bounce_1s_infinite] h-2" />
      <div className="w-1 bg-white rounded-full animate-[bounce_1.2s_infinite] h-4" />
      <div className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite] h-3" />
    </div>
  </div>
);
