
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="border-b border-white/10 bg-[#0f1218]/90 backdrop-blur-md sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black border border-cyan-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/10 group overflow-hidden relative">
            <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/20 transition-all"></div>
            <i className="fa-solid fa-wave-square text-cyan-400 text-2xl relative z-10"></i>
          </div>
          <div>
            <h1 className="font-black text-lg tracking-[0.2em] text-white uppercase digital">VOCAL MASTERMIND</h1>
            <p className="text-[9px] text-cyan-500/60 font-black uppercase tracking-[0.4em] digital">Advanced Signal Deconstruction</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5">
               <div className="w-2 h-2 rounded-full bg-emerald-500 led-green"></div>
               <div className="w-2 h-2 rounded-full bg-emerald-500 led-green opacity-40"></div>
               <div className="w-2 h-2 rounded-full bg-emerald-500 led-green opacity-20"></div>
             </div>
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest digital">Engine Core Active</span>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <a href="https://ai.google.dev" target="_blank" className="text-[9px] font-black text-slate-500 hover:text-cyan-400 transition-all uppercase tracking-widest digital border border-white/5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 shadow-inner">
            Hardware Rev. 3.6
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
