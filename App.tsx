
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
      setError("Hệ thống giải mã tín hiệu thất bại. Hãy đảm bảo tín hiệu âm thanh rõ ràng và định dạng tệp chuẩn Studio (WAV/MP3).");
      setLoadingPhase(LoadingPhase.IDLE);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#06080A] text-slate-300 selection:bg-cyan-500/30 selection:text-white font-sans">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: STUDIO CONTROL CENTER */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#101419] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl sticky top-24 ring-1 ring-white/10 z-20">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                  Master Console
                </h2>
                <span className="text-[9px] font-black bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-md border border-cyan-500/20 uppercase tracking-widest">Live v3.6</span>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] block ml-2">Reference Source (URL)</label>
                  <input 
                    type="text"
                    placeholder="YouTube, SoundCloud, Spotify link..."
                    className="w-full bg-[#080B0F] border border-white/10 rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all text-white placeholder:text-slate-800 shadow-inner"
                    value={link}
                    onChange={(e) => { setLink(e.target.value); setFile(null); setAudioUrl(null); }}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-grow h-px bg-white/5"></div>
                  <span className="text-[8px] font-black text-slate-700 uppercase">Input Node</span>
                  <div className="flex-grow h-px bg-white/5"></div>
                </div>

                <div 
                  className={`group border-2 border-dashed rounded-[1.5rem] p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden
                    ${file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/5 hover:border-cyan-500/30 bg-[#080B0F]'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                  <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center mb-4 transition-all duration-500 ${file ? 'bg-cyan-500 text-white shadow-2xl shadow-cyan-500/40 scale-105' : 'bg-white/5 border border-white/10 text-slate-600 group-hover:text-cyan-400 group-hover:border-cyan-500/40 shadow-sm'}`}>
                    <i className={`fa-solid ${file ? 'fa-music' : 'fa-microphone-lines'} text-2xl`}></i>
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">{file ? file.name : "Tải lên Vocal Stem"}</p>
                </div>

                {audioUrl && (
                  <div className="bg-white rounded-2xl p-5 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl border border-cyan-100 ring-4 ring-cyan-500/5">
                    <p className="text-[10px] font-black text-cyan-600 uppercase mb-4 tracking-[0.3em] flex items-center justify-between">
                       <span className="flex items-center gap-2">
                         <i className="fa-solid fa-headphones"></i> Monitor Output
                       </span>
                       <span className="text-[8px] opacity-60">Source Ready</span>
                    </p>
                    <div className="p-1 bg-slate-50 rounded-xl">
                      <audio controls src={audioUrl} className="w-full h-10 custom-audio-pro" />
                    </div>
                  </div>
                )}

                <button 
                  onClick={runAnalysis}
                  disabled={loadingPhase !== LoadingPhase.IDLE || (!file && !link.trim())}
                  className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white font-black text-[12px] uppercase tracking-[0.5em] rounded-xl transition-all shadow-2xl shadow-cyan-600/20 flex items-center justify-center gap-3 active:scale-95 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {loadingPhase !== LoadingPhase.IDLE ? (
                    <>
                      <i className="fa-solid fa-spinner-third animate-spin"></i>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-bolt-lightning group-hover:scale-125 transition-transform"></i>
                      Run Analysis
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-bold uppercase text-center leading-relaxed flex flex-col items-center gap-3 animate-pulse">
                  <i className="fa-solid fa-triangle-exclamation text-lg"></i>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: PROFESSIONAL BLUEPRINT */}
          <div className="lg:col-span-8">
            {report ? (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-40">
                
                {/* PERSISTENT MONITOR DOCK */}
                {audioUrl && (
                  <div className="sticky top-24 z-30 bg-white/95 backdrop-blur-xl border border-cyan-200 rounded-[2rem] p-6 shadow-[0_25px_50px_-12px_rgba(6,182,212,0.2)] flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-10 duration-700">
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-lg">
                        <i className="fa-solid fa-play"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">Studio Monitoring</p>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{file?.name || "Audio Link"}</p>
                      </div>
                    </div>
                    <div className="flex-grow w-full">
                       <audio controls src={audioUrl} className="w-full h-10 custom-audio-pro" />
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">HD Audio Stream</span>
                    </div>
                  </div>
                )}

                {/* 1. VOCAL RECON HUB */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-1 bg-cyan-500 rounded-full"></div>
                     <h3 className="text-[12px] font-black text-white uppercase tracking-[0.5em]">
                        [01. Studio Reconnaissance]
                     </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#101419] border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group hover:border-cyan-500/20 transition-all">
                      <div className="absolute -top-10 -right-10 p-20 opacity-[0.02] group-hover:opacity-[0.06] transition-all duration-1000">
                         <i className="fa-solid fa-chart-line text-[10rem]"></i>
                      </div>
                      <span className="text-[9px] font-black text-cyan-400 uppercase block mb-5 tracking-[0.4em] border-l-2 border-cyan-500 pl-4">Engine Diagnosis</span>
                      <p className="text-slate-200 text-sm leading-relaxed italic font-medium opacity-90">"{report.vocal_diagnosis.texture}"</p>
                    </div>
                    <div className="bg-[#101419] p-10 rounded-[3rem] shadow-2xl border border-white/5 group hover:border-purple-500/20 transition-all ring-1 ring-purple-500/5">
                      <span className="text-[9px] font-black text-purple-400 uppercase block mb-5 tracking-[0.4em] border-l-2 border-purple-400 pl-4">Artist Strategy</span>
                      <p className="text-slate-300 text-sm leading-relaxed opacity-80 group-hover:text-white transition-colors">{report.vocal_diagnosis.pitch_saturation}</p>
                    </div>
                  </div>
                </section>

                {/* 2. FREQUENCY GEOMETRY */}
                <section className="bg-[#101419] border border-white/5 rounded-[4rem] p-12 shadow-3xl relative overflow-hidden ring-1 ring-white/10 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-40"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-1 bg-purple-500 rounded-full"></div>
                          <h3 className="text-[12px] font-black text-white uppercase tracking-[0.5em]">
                             [02. Frequency Spectrum Map]
                          </h3>
                       </div>
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full">FFT Visualizer</span>
                    </div>
                    <div 
                      className="w-full bg-black/50 rounded-[2.5rem] p-10 border border-white/5 shadow-inner flex items-center justify-center svg-container-monitor overflow-hidden backdrop-blur-md group-hover:scale-[1.01] transition-transform duration-700"
                      dangerouslySetInnerHTML={{ __html: report.visual_mapping.eq_curve_svg }}
                    />
                    <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
                       {report.visual_data.eq_points.map((p, i) => (
                         <div key={i} className="px-6 py-5 bg-white/5 border border-white/5 rounded-[1.5rem] text-[10px] font-black shadow-xl flex flex-col items-center gap-2 hover:bg-white/10 hover:-translate-y-1 transition-all cursor-default group/point">
                           <span className="text-slate-500 uppercase tracking-[0.3em] text-[8px] group-hover/point:text-purple-400 transition-colors">{p.type}</span>
                           <span className="text-white font-mono text-xs">{p.freq}Hz</span>
                           <span className={p.gain >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>{p.gain > 0 ? '+' : ''}{p.gain}dB</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </section>

                {/* 3. STUDIO RACK UNITS */}
                <section className="space-y-16">
                  <div className="flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-1 bg-emerald-500 rounded-full"></div>
                       <h3 className="text-[12px] font-black text-white uppercase tracking-[0.5em]">
                          [03. High-End Plugin Rack]
                       </h3>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">8 Units Active</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-16">
                    {report.plugin_chain.map((item, idx) => (
                      <div key={idx} className="bg-[#101419] border border-white/5 rounded-[4rem] overflow-hidden flex flex-col shadow-3xl hover:border-cyan-500/20 transition-all duration-1000 group ring-1 ring-white/10">
                        
                        {/* Unit Rack Bar */}
                        <div className="bg-black/60 px-12 py-8 flex items-center justify-between border-b border-white/5 relative">
                           <div className="flex items-center gap-8 relative z-10">
                              <div className="w-16 h-16 rounded-[1.8rem] bg-[#080B0F] flex items-center justify-center text-md font-black text-cyan-500 shadow-2xl ring-1 ring-white/10 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-500">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-white uppercase tracking-[0.3em] mb-1 group-hover:text-cyan-400 transition-colors">{item.plugin}</h4>
                                <div className="flex items-center gap-3">
                                   <div className="flex gap-1">
                                      {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-cyan-500/20"></div>)}
                                   </div>
                                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Signal Precision Unit</p>
                                </div>
                              </div>
                           </div>
                           <div className="flex gap-3 relative z-10">
                              <div className="w-3.5 h-3.5 rounded-full bg-rose-600 shadow-lg shadow-rose-600/30"></div>
                              <div className="w-3.5 h-3.5 rounded-full bg-amber-600"></div>
                              <div className="w-3.5 h-3.5 rounded-full bg-emerald-600"></div>
                           </div>
                        </div>

                        <div className="flex flex-col xl:flex-row">
                          {/* Hardware Simulation */}
                          <div className="xl:w-[45%] bg-[#080B0F] p-12 flex items-center justify-center svg-container-3d relative overflow-hidden border-b xl:border-b-0 xl:border-r border-white/5 shadow-inner">
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '30px 30px'}}></div>
                            <div dangerouslySetInnerHTML={{ __html: item.visual_demo_svg }} className="w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)] transform group-hover:scale-[1.05] transition-transform duration-1000" />
                          </div>
                          
                          {/* Engineering Panel */}
                          <div className="xl:w-[55%] p-14 flex flex-col justify-center bg-transparent space-y-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                               <i className="fa-solid fa-compact-disc text-[12rem]"></i>
                            </div>
                            
                            <div className="space-y-5 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/10">
                                  <i className="fa-solid fa-sliders-simple text-[10px]"></i>
                                </div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Engineering Logic</span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed font-bold pl-8 border-l-2 border-cyan-500/40 italic">
                                "{item.mixing_mindset}"
                              </p>
                            </div>

                            <div className="space-y-5 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                  <i className="fa-solid fa-sparkles text-[10px]"></i>
                                </div>
                                <span className="text-[9px] font-black text-amber-500/70 uppercase tracking-[0.3em]">Studio Secret</span>
                              </div>
                              <p className="text-[13px] text-amber-100/70 leading-relaxed font-medium pl-8 border-l-2 border-amber-500/30">
                                {item.studio_secret}
                              </p>
                            </div>
                            
                            <div className="bg-[#080B0F] rounded-[2.5rem] p-10 flex items-start gap-8 shadow-inner border border-white/10 group/knob hover:border-cyan-500/30 transition-all duration-500">
                              <div className="w-14 h-14 rounded-2xl bg-cyan-600/10 flex items-center justify-center text-cyan-500 shrink-0 shadow-2xl border border-cyan-500/20 group-hover/knob:bg-cyan-500 group-hover/knob:text-white transition-all">
                                 <i className="fa-solid fa-dial text-xl"></i>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-cyan-400/60 uppercase tracking-[0.4em] mb-1">Target Settings</p>
                                <div className="text-[14px] text-white font-black leading-relaxed font-mono tracking-tight bg-white/5 px-5 py-3 rounded-xl border border-white/5 shadow-inner">
                                  {item.knob_instruction}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* MASTERING SECTION */}
                  <div className="mt-24 p-24 bg-[#101419] rounded-[5rem] shadow-4xl relative overflow-hidden group border border-white/5 ring-1 ring-white/10">
                    <div className="absolute top-0 right-0 p-24 opacity-[0.02] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-1000">
                      <i className="fa-solid fa-waveform-lines text-[20rem] text-white"></i>
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-8 mb-12">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-4xl">
                           <i className="fa-solid fa-vial text-2xl"></i>
                        </div>
                        <h5 className="text-[14px] font-black text-white uppercase tracking-[0.6em]">Legendary Mastering Blueprint</h5>
                      </div>
                      <p className="text-xl text-slate-200 leading-[1.8] font-medium italic opacity-90 pl-16 border-l-4 border-cyan-500/30 drop-shadow-xl">
                        {report.mastering_advice}
                      </p>
                    </div>
                  </div>
                </section>

              </div>
            ) : (
              <div className="h-full min-h-[850px] border-2 border-dashed border-white/5 rounded-[6rem] flex flex-col items-center justify-center text-center p-24 bg-[#080B0F] relative overflow-hidden group shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#101419_2.5px,_transparent_2.5px)] bg-[size:50px_50px] opacity-40"></div>
                
                <div className="relative mb-28 transition-all duration-1000 group-hover:scale-105">
                   <div className="absolute inset-0 bg-cyan-500/10 blur-[150px] rounded-full scale-150 animate-pulse"></div>
                   <div className="w-56 h-56 rounded-[5rem] bg-[#101419] border border-white/10 flex items-center justify-center text-[10rem] relative z-10 shadow-4xl text-slate-900/40 ring-1 ring-white/10">
                      <i className="fa-solid fa-waveform animate-pulse"></i>
                   </div>
                </div>

                <h3 className="text-6xl font-black text-white mb-8 tracking-tighter uppercase relative z-10 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-700">Studio Analytics</h3>
                <p className="max-w-2xl mx-auto text-xl font-medium text-slate-500 leading-relaxed italic relative z-10 px-8">
                  "Hệ thống phân tích 8 bước mô phỏng chính xác tư duy kỹ thuật của những Sound Engineer hàng đầu thế giới."
                </p>
                
                <div className="mt-32 flex flex-wrap justify-center gap-12 relative z-10">
                  <Badge label="ANALOG RECON" />
                  <Badge label="STUDIO MONITORING" />
                  <Badge label="MASTER BLUEPRINT" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-32 bg-[#06080A] relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between text-[11px] font-black text-slate-600 uppercase tracking-[0.6em]">
           <div className="flex items-center gap-10">
             <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center shadow-4xl border border-white/10 group cursor-pointer hover:bg-cyan-600 hover:text-white transition-all duration-500">
                <i className="fa-solid fa-microphone-stand text-2xl group-hover:scale-110 transition-transform"></i>
             </div>
             <div className="text-left">
               <p className="text-white mb-1 tracking-[0.4em]">VOCAL MASTERMIND AI</p>
               <p className="opacity-30 tracking-widest text-[9px]">Professional Audio Reconnaissance Engine v3.6</p>
             </div>
           </div>
           <div className="flex flex-wrap justify-center gap-16 mt-16 lg:mt-0 opacity-50 hover:opacity-100 transition-opacity">
             <span className="hover:text-cyan-500 transition-all cursor-pointer">Dynamic Unit</span>
             <span className="hover:text-cyan-500 transition-all cursor-pointer">Harmonic Lab</span>
             <span className="hover:text-cyan-500 transition-all cursor-pointer">Spectral Rack</span>
           </div>
        </div>
      </footer>

      <style>{`
        .svg-container-monitor svg { max-height: 500px; width: 100%; filter: drop-shadow(0 30px 50px rgba(0,0,0,0.5)); }
        .svg-container-3d svg { max-height: 600px; width: 100%; }
        
        /* Custom Pro Audio Player - Light Version for High Contrast */
        .custom-audio-pro {
          filter: none !important;
        }
        .custom-audio-pro::-webkit-media-controls-panel {
          background-color: #FFFFFF !important;
          border-radius: 12px;
        }
        .custom-audio-pro::-webkit-media-controls-play-button {
          background-color: #0891B2 !important;
          border-radius: 50%;
          color: white !important;
          transform: scale(0.9);
        }
        .custom-audio-pro::-webkit-media-controls-current-time-display,
        .custom-audio-pro::-webkit-media-controls-time-remaining-display {
          color: #0F172A !important;
          font-weight: 900;
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
        }
        
        @keyframes fade-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-14 py-6 bg-[#101419] border border-white/5 rounded-full text-[12px] font-black uppercase text-slate-600 shadow-3xl hover:border-cyan-500 hover:text-cyan-400 hover:-translate-y-1 transition-all cursor-default tracking-[0.2em] ring-1 ring-white/5">
    {label}
  </span>
);

export default App;
