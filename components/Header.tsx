
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-600/20">
            <i className="fa-solid fa-wave-square text-white text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">VOCAL MASTERMIND AI</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Signal Deconstruction Engine</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            FAST ENGINE ACTIVE
          </span>
          <a href="https://ai.google.dev" target="_blank" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">GEMINI FLASH V3</a>
        </div>
      </div>
    </header>
  );
};

export default Header;
