
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
      setError("Hệ thống giải mã tín hiệu thất bại. Hãy đảm bảo file âm thanh chất lượng cao để AI có thể phân tích chính xác.");
      setLoadingPhase(LoadingPhase.IDLE);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0C10] text-slate-300 selection:bg-cyan-500/30 selection:text-white font-sans">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: STUDIO CONTROL CENTER */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#161B22] border border-white/5 rounded-[3rem] p-8 shadow-2xl sticky top-24 ring-1 ring-white/10">
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-[11px] font-black text-cyan-500 uppercase tracking-[0.3em] flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                  Studio Console
                </h2>
                <span className="text-[9px] font-black bg-white/5 text-slate-400 px-3 py-1 rounded-full border border-white/10 uppercase tracking-tighter">Engine v3.5</span>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block ml-2">Audio Link (YouTube/Spotify)</label>
                  <input 
                    type="text"
                    placeholder="Dán liên kết nguồn..."
                    className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-sm focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-white placeholder:text-slate-700 shadow-inner"
                    value={link}
                    onChange={(e) => { setLink(e.target.value); setFile(null); setAudioUrl(null); }}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex-grow h-px bg-white/5"></div>
                  <span className="text-[9px] font-black text-slate-600 uppercase">Input Choice</span>
                  <div className="flex-grow h-px bg-white/5"></div>
                </div>

                <div 
                  className={`group border-2 border-dashed rounded-[2rem] p-10 transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden
                    ${file ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-500/50 bg-[#0D1117]'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 transition-all duration-700 ${file ? 'bg-cyan-500 text-white shadow-2xl shadow-cyan-500/50 scale-110' : 'bg-white/5 border border-white/10 text-slate-500 group-hover:text-cyan-400 shadow-sm'}`}>
                    <i className={`fa-solid ${file ? 'fa-music' : 'fa-microphone-lines'} text-3xl`}></i>
                  </div>
                  <p className="text-sm font-black text-slate-300 uppercase tracking-widest">{file ? file.name : "Tải lên File Vocal"}</p>
                  {!file && <p className="text-[10px] font-bold text-slate-600 mt-3 uppercase tracking-widest">WAV / MP3 / AIFF</p>}
                </div>

                {audioUrl && (
                  <div className="bg-black/40 border border-white/10 rounded-3xl p-6 animate-in fade-in slide-in-from-top-6 duration-500 shadow-2xl">
                    <p className="text-[10px] font-black text-cyan-500 uppercase mb-4 tracking-[0.3em] flex items-center gap-3">
                       <i className="fa-solid fa-volume-high"></i> Monitoring Input
                    </p>
                    <audio controls src={audioUrl} className="w-full h-10 custom-audio invert" />
                  </div>
                )}

                <button 
                  onClick={runAnalysis}
                  disabled={loadingPhase !== LoadingPhase.IDLE || (!file && !link.trim())}
                  className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white font-black text-[12px] uppercase tracking-[0.4em] rounded-[1.5rem] transition-all shadow-2xl shadow-cyan-600/20 flex items-center justify-center gap-4 active:scale-95 group"
                >
                  {loadingPhase !== LoadingPhase.IDLE ? (
                    <>
                      <i className="fa-solid fa-sync animate-spin"></i>
                      Reconstructing...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-microchip group-hover:rotate-180 transition-transform duration-1000"></i>
                      Deep Analysis
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[11px] font-black uppercase text-center leading-relaxed flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <i className="fa-solid fa-exclamation-triangle"></i>
                  </div>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: PROFESSIONAL BLUEPRINT */}
          <div className="lg:col-span-8">
            {report ? (
              <div className="space-y-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-40">
                
                {/* 1. VOCAL RECON HUB */}
                <section className="space-y-10">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-1 bg-cyan-600 rounded-full"></div>
                     <h3 className="text-[14px] font-black text-white uppercase tracking-[0.6em]">
                        [01. Vocal Reconnaissance]
                     </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#161B22] border border-white/5 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute -top-12 -right-12 p-24 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-1000">
                         <i className="fa-solid fa-dna text-[12rem]"></i>
                      </div>
                      <span className="text-[10px] font-black text-cyan-500 uppercase block mb-6 tracking-[0.4em] border-l-2 border-cyan-500 pl-6">Texture Analysis</span>
                      <p className="text-slate-200 text-base leading-relaxed italic font-medium">"{report.vocal_diagnosis.texture}"</p>
                    </div>
                    <div className="bg-[#0D1117] p-12 rounded-[4rem] shadow-3xl border border-white/10 group ring-1 ring-cyan-500/10">
                      <span className="text-[10px] font-black text-purple-400 uppercase block mb-6 tracking-[0.4em] border-l-2 border-purple-400 pl-6">Artist Blueprint</span>
                      <p className="text-slate-300 text-base leading-relaxed opacity-90 group-hover:text-white transition-colors">{report.vocal_diagnosis.pitch_saturation}</p>
                    </div>
                  </div>
                </section>

                {/* 2. FREQUENCY SPECTRUM */}
                <section className="bg-[#161B22] border border-white/5 rounded-[5rem] p-16 shadow-3xl relative overflow-hidden ring-1 ring-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-16">
                       <div className="w-12 h-1 bg-purple-500 rounded-full"></div>
                       <h3 className="text-[14px] font-black text-white uppercase tracking-[0.6em]">
                          [02. Frequency Geometry]
                       </h3>
                    </div>
                    <div 
                      className="w-full bg-black/40 rounded-[3.5rem] p-12 border border-white/10 shadow-inner flex items-center justify-center svg-container overflow-hidden backdrop-blur-md"
                      dangerouslySetInnerHTML={{ __html: report.visual_mapping.eq_curve_svg }}
                    />
                    <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
                       {report.visual_data.eq_points.map((p, i) => (
                         <div key={i} className="px-8 py-6 bg-black/20 border border-white/5 rounded-[2rem] text-[11px] font-black shadow-2xl flex flex-col items-center gap-3 hover:-translate-y-2 hover:border-purple-500/30 transition-all cursor-default group">
                           <span className="text-slate-500 uppercase tracking-[0.3em] text-[9px] group-hover:text-purple-400 transition-colors">{p.type}</span>
                           <span className="text-white font-mono text-sm">{p.freq}Hz</span>
                           <span className={p.gain >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>{p.gain > 0 ? '+' : ''}{p.gain}dB</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </section>

                {/* 3. PRO STUDIO RACK */}
                <section className="space-y-20">
                  <div className="flex items-center justify-between px-10">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-1 bg-emerald-500 rounded-full"></div>
                       <h3 className="text-[14px] font-black text-white uppercase tracking-[0.6em]">
                          [03. High-End Signal Chain]
                       </h3>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">8 Stage Reconstruction</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-20">
                    {report.plugin_chain.map((item, idx) => (
                      <div key={idx} className="bg-[#161B22] border border-white/5 rounded-[5rem] overflow-hidden flex flex-col shadow-3xl hover:shadow-cyan-500/5 hover:border-cyan-500/20 transition-all duration-1000 group ring-1 ring-white/10">
                        
                        {/* Rack Header */}
                        <div className="bg-black/40 px-16 py-10 flex items-center justify-between border-b border-white/5 relative">
                           <div className="flex items-center gap-12 relative z-10">
                              <div className="w-20 h-20 rounded-[2.5rem] bg-[#0D1117] flex items-center justify-center text-lg font-black text-cyan-500 shadow-3xl ring-1 ring-white/10 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-700">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="text-xl font-black text-white uppercase tracking-[0.4em] mb-2 group-hover:text-cyan-500 transition-colors">{item.plugin}</h4>
                                <div className="flex items-center gap-4">
                                   <div className="flex gap-1.5">
                                      {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500/30"></div>)}
                                   </div>
                                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Hardware Signal Processor</p>
                                </div>
                              </div>
                           </div>
                           <div className="flex gap-4 relative z-10">
                              <div className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]"></div>
                              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                              <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                           </div>
                        </div>

                        <div className="flex flex-col xl:flex-row">
                          {/* Hardware Visualization */}
                          <div className="xl:w-1/2 bg-[#0D1117] p-16 flex items-center justify-center svg-container-highres relative overflow-hidden border-b xl:border-b-0 xl:border-r border-white/5 shadow-inner">
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '40px 40px'}}></div>
                            <div dangerouslySetInnerHTML={{ __html: item.visual_demo_svg }} className="w-full drop-shadow-[0_60px_80px_rgba(0,0,0,0.5)] transform group-hover:scale-[1.08] transition-transform duration-1000" />
                          </div>
                          
                          {/* Professional Insights */}
                          <div className="xl:w-1/2 p-20 flex flex-col justify-center bg-transparent space-y-12">
                            <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/10">
                                  <i className="fa-solid fa-brain text-xs"></i>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Mixing Mindset</span>
                              </div>
                              <p className="text-sm text-slate-200 leading-relaxed font-bold pl-10 border-l-2 border-cyan-500/30 italic">
                                "{item.mixing_mindset}"
                              </p>
                            </div>

                            <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                  <i className="fa-solid fa-star text-xs"></i>
                                </div>
                                <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.4em]">Studio Secret (Bí mật nhà nghề)</span>
                              </div>
                              <p className="text-sm text-amber-100/80 leading-relaxed font-medium pl-10 border-l-2 border-amber-500/30">
                                {item.studio_secret}
                              </p>
                            </div>
                            
                            <div className="bg-[#0D1117] rounded-[3.5rem] p-12 flex items-start gap-10 shadow-3xl transform group-hover:-translate-y-4 transition-all duration-700 border border-white/10 ring-1 ring-white/5">
                              <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-600 flex items-center justify-center text-white shrink-0 shadow-2xl shadow-cyan-600/30">
                                 <i className="fa-solid fa-sliders text-2xl"></i>
                              </div>
                              <div className="space-y-3">
                                <p className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.5em] mb-2">Technical Knobs</p>
                                <div className="text-[16px] text-white font-black leading-loose font-mono tracking-tight bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
                                  {item.knob_instruction}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* MASTERING BLUEPRINT */}
                  <div className="mt-32 p-32 bg-[#161B22] rounded-[6rem] shadow-4xl relative overflow-hidden group border border-white/5 ring-1 ring-white/10">
                    <div className="absolute top-0 right-0 p-32 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-1000">
                      <i className="fa-solid fa-crown text-[25rem] text-white"></i>
                    </div>
                    <div className="relative z-10 max-w-5xl">
                      <div className="flex items-center gap-10 mb-16">
                        <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-4xl shadow-cyan-500/10">
                           <i className="fa-solid fa-gem text-3xl"></i>
                        </div>
                        <h5 className="text-[16px] font-black text-white uppercase tracking-[0.8em]">Legendary Mastering Blueprint</h5>
                      </div>
                      <p className="text-2xl text-slate-200 leading-[2] font-medium italic opacity-95 pl-20 border-l-4 border-cyan-500/40 drop-shadow-2xl">
                        {report.mastering_advice}
                      </p>
                    </div>
                  </div>
                </section>

              </div>
            ) : (
              <div className="h-full min-h-[900px] border-2 border-dashed border-white/5 rounded-[7rem] flex flex-col items-center justify-center text-center p-32 bg-[#0D1117] relative overflow-hidden group shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#161B22_3px,_transparent_3px)] bg-[size:64px_64px] opacity-60"></div>
                
                <div className="relative mb-32 transition-all duration-1000 group-hover:scale-110">
                   <div className="absolute inset-0 bg-cyan-500/20 blur-[200px] rounded-full scale-150 animate-pulse"></div>
                   <div className="w-64 h-64 rounded-[6rem] bg-[#161B22] border border-white/10 flex items-center justify-center text-[12rem] relative z-10 shadow-4xl text-slate-800/40 ring-1 ring-white/10">
                      <i className="fa-solid fa-microphone-lines animate-pulse"></i>
                   </div>
                </div>

                <h3 className="text-7xl font-black text-white mb-10 tracking-tighter uppercase relative z-10 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-600">Pro Vocal Master</h3>
                <p className="max-w-3xl mx-auto text-2xl font-medium text-slate-500 leading-relaxed italic relative z-10 px-12">
                  "Giải mã chuỗi tín hiệu triệu đô. Mang tư duy và kỹ thuật của những Sound Engineer hàng đầu thế giới vào giọng hát của bạn."
                </p>
                
                <div className="mt-40 flex flex-wrap justify-center gap-16 relative z-10">
                  <Badge label="ANALOG 3D MOCKUPS" />
                  <Badge label="SINGER GRADE QUALITY" />
                  <Badge label="STUDIO SECRETS" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-40 bg-[#0A0C10] relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between text-[11px] font-black text-slate-600 uppercase tracking-[0.8em]">
           <div className="flex items-center gap-12">
             <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center shadow-4xl border border-white/10 group cursor-pointer hover:bg-cyan-500 hover:text-white transition-all duration-700">
                <i className="fa-solid fa-bolt text-3xl group-hover:scale-125 transition-transform duration-500"></i>
             </div>
             <div className="text-left">
               <p className="text-white mb-2 tracking-[0.5em]">VOCAL MASTERMIND AI</p>
               <p className="opacity-40 tracking-widest text-[9px]">Professional Audio Reconnaissance Engine v3.5</p>
             </div>
           </div>
           <div className="flex flex-wrap justify-center gap-20 mt-20 lg:mt-0 opacity-60 hover:opacity-100 transition-opacity">
             <span className="hover:text-cyan-500 transition-all cursor-pointer border-b-2 border-transparent hover:border-cyan-500 pb-3">Acoustic Space</span>
             <span className="hover:text-cyan-500 transition-all cursor-pointer border-b-2 border-transparent hover:border-cyan-500 pb-3">Dynamic Lab</span>
             <span className="hover:text-cyan-500 transition-all cursor-pointer border-b-2 border-transparent hover:border-cyan-500 pb-3">Hardware Rack</span>
           </div>
        </div>
      </footer>

      <style>{`
        .svg-container svg { max-height: 600px; width: 100%; transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); filter: drop-shadow(0 40px 60px rgba(0,0,0,0.5)); }
        .svg-container-highres svg { max-height: 700px; width: 100%; }
        
        .custom-audio::-webkit-media-controls-panel {
          background-color: transparent;
        }
        .custom-audio::-webkit-media-controls-play-button {
          background-color: #06B6D4;
          border-radius: 50%;
        }
        
        @keyframes fade-in { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-20 py-8 bg-[#161B22] border border-white/10 rounded-full text-[14px] font-black uppercase text-slate-500 shadow-3xl hover:border-cyan-500 hover:text-cyan-400 hover:shadow-cyan-500/10 hover:-translate-y-2 transition-all cursor-default tracking-[0.3em] active:scale-95 ring-1 ring-white/5">
    {label}
  </span>
);

export default App;
