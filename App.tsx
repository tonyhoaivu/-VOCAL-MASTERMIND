
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
      setError("Hệ thống giải mã tín hiệu thất bại. Hãy thử lại với file có chất lượng cao hơn.");
      setLoadingPhase(LoadingPhase.IDLE);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-cyan-100 selection:text-cyan-900">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: INPUT AREA */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 sticky top-24">
              <h2 className="text-xs font-bold mb-6 text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <i className="fa-solid fa-microchip text-cyan-600"></i>
                Mixing Pro Interface
              </h2>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Paste Music Link</label>
                  <input 
                    type="text"
                    placeholder="YouTube, SoundCloud, Spotify..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:border-cyan-500 outline-none transition-all text-slate-900 placeholder:text-slate-300 shadow-inner"
                    value={link}
                    onChange={(e) => { setLink(e.target.value); setFile(null); setAudioUrl(null); }}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-grow h-px bg-slate-100"></div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">OR</span>
                  <div className="flex-grow h-px bg-slate-100"></div>
                </div>

                <div 
                  className={`group border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer 
                    ${file ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                  <i className={`fa-solid ${file ? 'fa-check-double text-cyan-600' : 'fa-wave-square text-slate-300'} text-3xl mb-3`}></i>
                  <p className="text-xs font-bold text-slate-600">{file ? file.name : "Tải lên File Vocal"}</p>
                </div>

                {audioUrl && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Input Monitor</p>
                    <audio controls src={audioUrl} className="w-full h-8" />
                  </div>
                )}

                <button 
                  onClick={runAnalysis}
                  disabled={loadingPhase !== LoadingPhase.IDLE || (!file && !link.trim())}
                  className="w-full py-4 bg-slate-900 hover:bg-black disabled:opacity-30 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                >
                  {loadingPhase !== LoadingPhase.IDLE ? <i className="fa-solid fa-gear animate-spin"></i> : <i className="fa-solid fa-wand-sparkles"></i>}
                  Start Full Studio Analysis
                </button>
              </div>

              {error && <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-bold uppercase text-center">{error}</div>}
            </div>
          </div>

          {/* RIGHT: RESULTS AREA */}
          <div className="lg:col-span-8">
            {report ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
                
                {/* 1. DIAGNOSIS */}
                <section>
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    <span className="w-6 h-1 bg-cyan-600 rounded-full"></span>
                    [Vocal Texture & Pitch Diagnosis]
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                      <span className="text-[9px] font-black text-cyan-600 uppercase block mb-3 tracking-widest">Texture Diagnosis</span>
                      <p className="text-slate-600 text-sm leading-relaxed italic font-medium">"{report.vocal_diagnosis.texture}"</p>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/20">
                      <span className="text-[9px] font-black text-cyan-400 uppercase block mb-3 tracking-widest">Pitch & Tone Strategy</span>
                      <p className="text-slate-300 text-sm leading-relaxed">{report.vocal_diagnosis.pitch_saturation}</p>
                    </div>
                  </div>
                </section>

                {/* 2. FREQUENCY MAPPING */}
                <section className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/30">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                    <span className="w-6 h-1 bg-purple-600 rounded-full"></span>
                    [Frequency (EQ) Analysis]
                  </h3>
                  <div 
                    className="w-full bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 shadow-inner flex items-center justify-center svg-container"
                    dangerouslySetInnerHTML={{ __html: report.visual_mapping.eq_curve_svg }}
                  />
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                     {report.visual_data.eq_points.map((p, i) => (
                       <div key={i} className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold shadow-sm flex items-center justify-between group hover:border-purple-200 transition-colors">
                         <span className="text-slate-400 uppercase">{p.type}</span>
                         <div className="flex items-center gap-3">
                            <span className="text-purple-600 font-mono">{p.freq}Hz</span>
                            <span className={p.gain >= 0 ? 'text-emerald-500 font-mono' : 'text-rose-500 font-mono'}>{p.gain > 0 ? '+' : ''}{p.gain}dB</span>
                         </div>
                       </div>
                     ))}
                  </div>
                </section>

                {/* 3. PLUGIN CHAIN RACK */}
                <section className="space-y-10">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] ml-4 flex items-center gap-3">
                    <span className="w-6 h-1 bg-emerald-500 rounded-full"></span>
                    [Advanced 8-Step Studio Rack]
                  </h3>
                  <div className="grid grid-cols-1 gap-12">
                    {report.plugin_chain.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden flex flex-col shadow-2xl hover:border-cyan-400 transition-all duration-500 group">
                        
                        {/* Plugin Rack Header */}
                        <div className="bg-slate-900 px-10 py-5 flex items-center justify-between border-b border-white/5">
                           <div className="flex items-center gap-6">
                              <span className="text-[10px] font-black text-cyan-400 border border-cyan-400/30 px-4 py-1.5 rounded-lg uppercase tracking-widest shadow-inner shadow-cyan-400/10">Step {idx + 1}</span>
                              <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">{item.plugin}</h4>
                           </div>
                           <div className="flex gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                           </div>
                        </div>

                        <div className="flex flex-col xl:flex-row">
                          {/* Visual Demo (Photorealistic Mockup) */}
                          <div className="xl:w-1/2 bg-slate-100 p-8 flex items-center justify-center svg-container-highres relative overflow-hidden border-b xl:border-b-0 xl:border-r border-slate-200">
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
                            <div dangerouslySetInnerHTML={{ __html: item.visual_demo_svg }} className="w-full drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)] transform group-hover:scale-[1.03] transition-transform duration-1000" />
                          </div>
                          
                          {/* Mixing Expertise Section */}
                          <div className="xl:w-1/2 p-12 flex flex-col justify-center bg-white space-y-8">
                            <div className="space-y-4">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fa-solid fa-eye text-cyan-500"></i> Mô tả thực tế
                              </span>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium pl-5 border-l-2 border-slate-100 italic">
                                "{item.ui_description}"
                              </p>
                            </div>

                            <div className="space-y-4">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fa-solid fa-brain text-purple-500"></i> Cách chỉnh để Vocal hay hơn
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed font-bold pl-5 border-l-2 border-purple-200">
                                {item.mixing_mindset}
                              </p>
                            </div>
                            
                            <div className="bg-slate-900 rounded-3xl p-8 flex items-start gap-5 shadow-2xl shadow-slate-900/20 transform group-hover:-translate-y-1 transition-transform">
                              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-400/30">
                                 <i className="fa-solid fa-sliders text-lg"></i>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em]">Thông số Knobs</p>
                                <div className="text-[13px] text-slate-200 font-bold leading-relaxed font-mono">
                                  {item.knob_instruction}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-16 p-16 bg-slate-900 rounded-[5rem] shadow-2xl relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-1000">
                      <i className="fa-solid fa-sparkles text-[12rem] text-white"></i>
                    </div>
                    <div className="relative z-10 max-w-2xl">
                      <h5 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.6em] mb-8 flex items-center gap-4">
                         <span className="w-10 h-px bg-cyan-500/50"></span>
                         Final Mastering Blueprint
                      </h5>
                      <p className="text-base text-slate-300 leading-relaxed font-medium italic opacity-95 pl-12 border-l-4 border-cyan-500/20">
                        {report.mastering_advice}
                      </p>
                    </div>
                  </div>
                </section>

              </div>
            ) : (
              <div className="h-full min-h-[700px] border-2 border-dashed border-slate-200 rounded-[4.5rem] flex flex-col items-center justify-center text-center p-16 bg-white/50">
                <div className="relative mb-20">
                   <div className="absolute inset-0 bg-cyan-100 blur-[130px] rounded-full scale-150 animate-pulse"></div>
                   <div className="w-40 h-40 rounded-[4rem] bg-white border border-slate-200 flex items-center justify-center text-8xl relative z-10 shadow-[0_45px_90px_-15px_rgba(0,0,0,0.15)]">
                      <i className="fa-solid fa-volume-high text-slate-100"></i>
                   </div>
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter uppercase">Legendary Studio Signal Chain</h3>
                <p className="max-w-lg mx-auto text-base font-medium text-slate-400 leading-relaxed italic">
                  "Phân tích chuyên sâu 8 bước từ xử lý Dynamics đến hiệu ứng Reverb/Delay không gian của các hãng Waves, Valhalla, FabFilter."
                </p>
                <div className="mt-24 flex flex-wrap justify-center gap-8">
                  <Badge label="8-STEP RACK UNIT" />
                  <Badge label="SPACE EFFECTS" />
                  <Badge label="UI RECONSTRUCTION" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">
           <div className="flex items-center gap-6">
             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-900/10">
                <i className="fa-solid fa-wave-square text-cyan-400 text-lg"></i>
             </div>
             <p>© 2025 Legend Audio Lab - Senior Engineering Hub</p>
           </div>
           <div className="flex gap-16 mt-10 md:mt-0">
             <span className="hover:text-cyan-600 transition-colors cursor-pointer">Reverb Space</span>
             <span className="hover:text-cyan-600 transition-colors cursor-pointer">Delay Tap</span>
             <span className="hover:text-cyan-600 transition-colors cursor-pointer">Harmonics</span>
           </div>
        </div>
      </footer>

      <style>{`
        .svg-container svg { max-height: 450px; width: 100%; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .svg-container-highres svg { max-height: 550px; width: 100%; filter: drop-shadow(0 35px 35px rgb(0 0 0 / 0.15)); }
        audio::-webkit-media-controls-panel { background-color: #f8fafc; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

const TableRow: React.FC<{ label: string, value: string, desc: string }> = ({ label, value, desc }) => (
  <tr>
    <td className="px-6 py-5 font-bold text-slate-900 border-r border-slate-50">{label}</td>
    <td className="px-6 py-5 font-mono text-cyan-600 border-r border-slate-50">{value}</td>
    <td className="px-6 py-5 text-slate-400 font-bold font-mono text-center bg-slate-50/30">{desc}</td>
  </tr>
);

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-12 py-5 bg-white border border-slate-200 rounded-full text-[11px] font-black uppercase text-slate-400 shadow-sm hover:border-cyan-400 hover:text-cyan-600 hover:shadow-cyan-100 transition-all cursor-default tracking-widest">
    {label}
  </span>
);

export default App;
