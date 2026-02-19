
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import { analyzeVocalAudio } from './services/geminiService';
import { AnalysisReport, LoadingPhase } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(LoadingPhase.IDLE);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLink('');
      setReport(null);
      setError(null);
      const url = URL.createObjectURL(selectedFile);
      setAudioUrl(url);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });
  };

  const runAnalysis = async () => {
    if (!file && !link.trim()) return;

    try {
      setLoadingPhase(LoadingPhase.UPLOADING);
      setReport(null);
      setError(null);
      
      let analysisResult: AnalysisReport;

      if (file) {
        const base64 = await fileToBase64(file);
        analysisResult = await analyzeVocalAudio({ base64, mimeType: file.type });
      } else {
        analysisResult = await analyzeVocalAudio({ link });
      }

      setReport(analysisResult);
      setLoadingPhase(LoadingPhase.IDLE);
    } catch (err) {
      console.error(err);
      setError("Hệ thống giải mã tín hiệu thất bại. Hãy thử lại với tệp âm thanh rõ ràng hoặc liên kết hợp lệ hơn.");
      setLoadingPhase(LoadingPhase.IDLE);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFF] selection:bg-cyan-100 selection:text-cyan-900">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: INPUT AREA */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-7 shadow-2xl shadow-slate-200/50 sticky top-24 border-t-4 border-t-cyan-500">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <i className="fa-solid fa-compact-disc text-cyan-500 animate-spin-slow"></i>
                  Signal Input
                </h2>
                <span className="text-[9px] font-black bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded border border-cyan-100 uppercase tracking-tighter shadow-sm">AI Rack Pro</span>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Paste Music Link</label>
                  <input 
                    type="text"
                    placeholder="YouTube, SoundCloud, Spotify..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-slate-900 placeholder:text-slate-300 shadow-inner"
                    value={link}
                    onChange={(e) => { setLink(e.target.value); setFile(null); setAudioUrl(null); }}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-grow h-px bg-slate-100"></div>
                  <span className="text-[9px] font-black text-slate-300 uppercase">OR</span>
                  <div className="flex-grow h-px bg-slate-100"></div>
                </div>

                <div 
                  className={`group border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden
                    ${file ? 'border-cyan-500 bg-cyan-50/30' : 'border-slate-200 hover:border-cyan-300 bg-slate-50/50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 transition-all duration-500 ${file ? 'bg-cyan-500 text-white shadow-xl shadow-cyan-500/30 scale-110' : 'bg-white border border-slate-200 text-slate-300 group-hover:text-cyan-500 group-hover:border-cyan-500 shadow-sm'}`}>
                    <i className={`fa-solid ${file ? 'fa-music' : 'fa-microphone-lines'} text-2xl`}></i>
                  </div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{file ? file.name : "Tải lên Vocal File"}</p>
                  {!file && <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">MP3, WAV, M4A | Lossless preferred</p>}
                </div>

                {audioUrl && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl shadow-cyan-500/5 ring-1 ring-cyan-500/10">
                    <p className="text-[9px] font-black text-cyan-600 uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                       <i className="fa-solid fa-wave-square"></i> Source Review
                    </p>
                    <div className="audio-player-container">
                      <audio controls src={audioUrl} className="w-full h-10 custom-audio" />
                    </div>
                  </div>
                )}

                <button 
                  onClick={runAnalysis}
                  disabled={loadingPhase !== LoadingPhase.IDLE || (!file && !link.trim())}
                  className="w-full py-5 bg-slate-900 hover:bg-black disabled:opacity-30 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95 group"
                >
                  {loadingPhase !== LoadingPhase.IDLE ? (
                    <>
                      <i className="fa-solid fa-compact-disc animate-spin"></i>
                      Processing Signal...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles group-hover:rotate-12 transition-transform"></i>
                      Analyze & Reverse Engineer
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase text-center flex flex-col items-center gap-3 animate-bounce-slow">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                    <i className="fa-solid fa-triangle-exclamation text-sm"></i>
                  </div>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: RESULTS AREA */}
          <div className="lg:col-span-8">
            {report ? (
              <div className="space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-40">
                
                {/* 1. DIAGNOSIS HUB */}
                <section>
                  <div className="flex items-center gap-4 mb-10">
                     <span className="w-10 h-1 bg-cyan-500 rounded-full"></span>
                     <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.4em]">
                        [01. Vocal Recon Diagnosis]
                     </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white border border-slate-100 p-12 rounded-[3.5rem] shadow-xl shadow-slate-200/30 relative overflow-hidden group hover:ring-2 hover:ring-cyan-500/20 transition-all">
                      <div className="absolute -top-10 -right-10 p-20 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700">
                         <i className="fa-solid fa-magnifying-glass-chart text-9xl"></i>
                      </div>
                      <span className="text-[10px] font-black text-cyan-600 uppercase block mb-5 tracking-widest border-l-2 border-cyan-500 pl-4">Texture Profile</span>
                      <p className="text-slate-700 text-sm leading-relaxed italic font-semibold">"{report.vocal_diagnosis.texture}"</p>
                    </div>
                    <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl shadow-slate-900/40 border border-white/10 group">
                      <span className="text-[10px] font-black text-cyan-400 uppercase block mb-5 tracking-widest border-l-2 border-cyan-400 pl-4">Engineering Strategy</span>
                      <p className="text-slate-300 text-sm leading-relaxed opacity-95 group-hover:text-white transition-colors">{report.vocal_diagnosis.pitch_saturation}</p>
                    </div>
                  </div>
                </section>

                {/* 2. FREQUENCY MAPPING */}
                <section className="bg-white border border-slate-100 rounded-[4rem] p-14 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,_#f8fafc_0%,_transparent_100%)] opacity-50"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-12">
                       <span className="w-10 h-1 bg-purple-500 rounded-full"></span>
                       <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.4em]">
                          [02. Frequency Spectrum Map]
                       </h3>
                    </div>
                    <div 
                      className="w-full bg-slate-900/5 rounded-[3rem] p-12 border border-slate-100 shadow-inner flex items-center justify-center svg-container overflow-hidden backdrop-blur-sm"
                      dangerouslySetInnerHTML={{ __html: report.visual_mapping.eq_curve_svg }}
                    />
                    <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
                       {report.visual_data.eq_points.map((p, i) => (
                         <div key={i} className="px-7 py-5 bg-white border border-slate-100 rounded-[1.5rem] text-[10px] font-black shadow-lg shadow-slate-200/20 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-purple-500/10 hover:border-purple-200 transition-all cursor-default group">
                           <span className="text-slate-400 uppercase tracking-[0.2em] text-[8px] group-hover:text-purple-500 transition-colors">{p.type}</span>
                           <span className="text-slate-900 font-mono text-xs">{p.freq}Hz</span>
                           <span className={p.gain >= 0 ? 'text-emerald-500 font-mono' : 'text-rose-500 font-mono'}>{p.gain > 0 ? '+' : ''}{p.gain}dB</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </section>

                {/* 3. PLUGIN CHAIN RACK */}
                <section className="space-y-16">
                  <div className="flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                       <span className="w-10 h-1 bg-emerald-500 rounded-full"></span>
                       <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.4em]">
                          [03. High-End Signal Rack]
                       </h3>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">8 Engine Cores Ready</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-14">
                    {report.plugin_chain.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-[4.5rem] overflow-hidden flex flex-col shadow-3xl hover:shadow-cyan-500/10 hover:border-cyan-400 transition-all duration-700 group ring-1 ring-slate-100">
                        
                        {/* Rack Unit Header */}
                        <div className="bg-[#121418] px-14 py-8 flex items-center justify-between border-b border-white/5 relative">
                           <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                           <div className="flex items-center gap-10 relative z-10">
                              <div className="w-16 h-16 rounded-[2rem] bg-slate-800 flex items-center justify-center text-sm font-black text-cyan-400 shadow-2xl ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="text-base font-black text-white uppercase tracking-[0.3em] mb-1 group-hover:text-cyan-400 transition-colors">{item.plugin}</h4>
                                <div className="flex items-center gap-3">
                                   <div className="flex gap-1">
                                      {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-cyan-500/50"></div>)}
                                   </div>
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Signal Processing Unit v3.0</p>
                                </div>
                              </div>
                           </div>
                           <div className="flex gap-3 relative z-10">
                              <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] shadow-lg shadow-rose-500/40 ring-1 ring-white/10"></div>
                              <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] shadow-lg shadow-amber-500/40 ring-1 ring-white/10"></div>
                              <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F] shadow-lg shadow-emerald-500/40 ring-1 ring-white/10"></div>
                           </div>
                        </div>

                        <div className="flex flex-col xl:flex-row">
                          {/* Hardware Visualization */}
                          <div className="xl:w-7/12 bg-[#F8FAFC] p-12 flex items-center justify-center svg-container-highres relative overflow-hidden border-b xl:border-b-0 xl:border-r border-slate-100 shadow-inner">
                            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '40px 40px'}}></div>
                            <div dangerouslySetInnerHTML={{ __html: item.visual_demo_svg }} className="w-full drop-shadow-[0_50px_60px_rgba(0,0,0,0.18)] transform group-hover:scale-[1.05] transition-transform duration-1000" />
                          </div>
                          
                          {/* Expert Insights Panel */}
                          <div className="xl:w-5/12 p-16 flex flex-col justify-center bg-white space-y-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] -rotate-12">
                               <i className="fa-solid fa-file-audio text-[10rem]"></i>
                            </div>
                            
                            <div className="space-y-6 relative z-10">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-[1rem] bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                  <i className="fa-solid fa-eye text-sm"></i>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Hardware Profile</span>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed font-medium pl-8 border-l-2 border-slate-100 italic">
                                "{item.ui_description}"
                              </p>
                            </div>

                            <div className="space-y-6 relative z-10">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-[1rem] bg-purple-50 flex items-center justify-center text-purple-400 border border-purple-100">
                                  <i className="fa-solid fa-microchip text-sm"></i>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Engineering Logic</span>
                              </div>
                              <p className="text-sm text-slate-900 leading-relaxed font-black pl-8 border-l-2 border-purple-500/30">
                                {item.mixing_mindset}
                              </p>
                            </div>
                            
                            <div className="bg-[#0F172A] rounded-[3rem] p-12 flex items-start gap-8 shadow-3xl shadow-slate-900/50 transform group-hover:-translate-y-4 transition-all duration-700 border border-white/10 relative overflow-hidden group/knob">
                              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover/knob:opacity-100 transition-opacity duration-1000"></div>
                              <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-600 flex items-center justify-center text-white shrink-0 shadow-2xl shadow-cyan-600/40 relative z-10">
                                 <i className="fa-solid fa-sliders text-2xl"></i>
                              </div>
                              <div className="space-y-2 relative z-10">
                                <p className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.5em] mb-2">Control Settings</p>
                                <div className="text-[15px] text-white font-black leading-loose font-mono tracking-tight drop-shadow-sm">
                                  {item.knob_instruction}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* FINAL MASTERING SECTION */}
                  <div className="mt-28 p-24 bg-[#0F172A] rounded-[6rem] shadow-[0_80px_100px_-30px_rgba(0,0,0,0.6)] relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 p-20 opacity-[0.02] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-1000">
                      <i className="fa-solid fa-wand-magic-sparkles text-[20rem] text-white"></i>
                    </div>
                    <div className="relative z-10 max-w-4xl">
                      <div className="flex items-center gap-8 mb-12">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
                           <i className="fa-solid fa-gem text-xl"></i>
                        </div>
                        <h5 className="text-[14px] font-black text-cyan-400 uppercase tracking-[0.7em]">Legendary Mastering Blueprint</h5>
                      </div>
                      <p className="text-xl text-slate-200 leading-[1.8] font-medium italic opacity-95 pl-16 border-l-4 border-cyan-500/40 drop-shadow-lg">
                        {report.mastering_advice}
                      </p>
                    </div>
                  </div>
                </section>

              </div>
            ) : (
              <div className="h-full min-h-[800px] border-2 border-dashed border-slate-200 rounded-[6rem] flex flex-col items-center justify-center text-center p-24 bg-white/40 relative overflow-hidden group shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#eff6ff_2px,_transparent_2px)] bg-[size:48px_48px] opacity-60"></div>
                
                <div className="relative mb-28 transition-all duration-1000 group-hover:scale-105">
                   <div className="absolute inset-0 bg-cyan-100 blur-[180px] rounded-full scale-150 animate-pulse-slow"></div>
                   <div className="w-52 h-52 rounded-[5rem] bg-white border border-slate-100 flex items-center justify-center text-[10rem] relative z-10 shadow-[0_60px_120px_-25px_rgba(0,0,0,0.12)] text-slate-100/40 ring-1 ring-slate-100">
                      <i className="fa-solid fa-tower-broadcast animate-pulse"></i>
                   </div>
                </div>

                <h3 className="text-6xl font-black text-slate-900 mb-8 tracking-tighter uppercase relative z-10 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600">Pro Vocal Analysis</h3>
                <p className="max-w-2xl mx-auto text-xl font-medium text-slate-400 leading-relaxed italic relative z-10 px-8">
                  "Hệ thống phân tích 8 bước mô phỏng chính xác giao diện phần cứng và tư duy kỹ thuật của các chuyên gia hàng đầu."
                </p>
                
                <div className="mt-32 flex flex-wrap justify-center gap-12 relative z-10">
                  <Badge label="PHOTOREALISTIC UI" />
                  <Badge label="8-STEP RECON" />
                  <Badge label="ANALOG MINDSET" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.6em]">
           <div className="flex items-center gap-10">
             <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-3xl shadow-slate-900/30 group cursor-pointer hover:bg-black transition-all duration-500">
                <i className="fa-solid fa-bolt text-cyan-400 text-2xl group-hover:scale-125 transition-transform duration-500"></i>
             </div>
             <div className="text-left">
               <p className="text-slate-900 mb-1 tracking-[0.4em]">VOCAL MASTERMIND AI</p>
               <p className="opacity-40 tracking-widest text-[9px]">Professional Audio Reconnaissance Engine v3.2</p>
             </div>
           </div>
           <div className="flex flex-wrap justify-center gap-16 mt-16 lg:mt-0">
             <span className="hover:text-cyan-600 transition-all cursor-pointer border-b-2 border-transparent hover:border-cyan-600 pb-2">Space Unit</span>
             <span className="hover:text-cyan-600 transition-all cursor-pointer border-b-2 border-transparent hover:border-cyan-600 pb-2">Dynamics Lab</span>
             <span className="hover:text-cyan-600 transition-all cursor-pointer border-b-2 border-transparent hover:border-cyan-600 pb-2">Rack Unit</span>
           </div>
        </div>
      </footer>

      <style>{`
        .svg-container svg { max-height: 550px; width: 100%; transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .svg-container-highres svg { max-height: 650px; width: 100%; filter: drop-shadow(0 50px 70px rgb(0 0 0 / 0.22)); }
        
        /* Custom Lighter Audio Player */
        .audio-player-container {
          background: #F8FAFC;
          border-radius: 1rem;
          padding: 0.25rem;
        }
        .custom-audio::-webkit-media-controls-panel {
          background-color: #FFFFFF;
          border-radius: 1rem;
        }
        .custom-audio::-webkit-media-controls-play-button {
          background-color: #06B6D4;
          border-radius: 50%;
        }
        .custom-audio::-webkit-media-controls-current-time-display,
        .custom-audio::-webkit-media-controls-time-remaining-display {
          color: #334155;
          font-weight: 800;
          font-size: 10px;
        }
        
        @keyframes fade-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        
        @keyframes pulse-slow { 0%, 100% { opacity: 0.5; transform: scale(1.5); } 50% { opacity: 0.8; transform: scale(1.7); } }
        .animate-pulse-slow { animation: pulse-slow 5s ease-in-out infinite; }
        
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-16 py-7 bg-white border border-slate-200 rounded-full text-[13px] font-black uppercase text-slate-400 shadow-xl hover:border-cyan-400 hover:text-cyan-600 hover:shadow-cyan-100 hover:-translate-y-1 transition-all cursor-default tracking-[0.2em] active:scale-95 ring-1 ring-slate-50">
    {label}
  </span>
);

export default App;
