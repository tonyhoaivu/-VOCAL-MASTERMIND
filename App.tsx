
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import { analyzeVocalAudio } from './services/geminiService';
import { AnalysisReport, LoadingPhase } from './types';

// --- Improved Waveform Visualizer ---
const AudioMonitor: React.FC<{ audioUrl: string | null }> = ({ audioUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const animationRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;

    const startVisualizer = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioCtxRef.current.createAnalyser();
        if (audioRef.current) {
          sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
          sourceRef.current.connect(analyzerRef.current);
          analyzerRef.current.connect(audioCtxRef.current.destination);
          analyzerRef.current.fftSize = 128;
        }
      }
      draw();
    };

    const draw = () => {
      if (!analyzerRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerRef.current.getByteFrequencyData(dataArray);

      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        // Gradient color for a more "Waves" hardware look
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#0ea5e9');
        gradient.addColorStop(0.5, '#22d3ee');
        gradient.addColorStop(1, '#f87171');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
      animationRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      startVisualizer();
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, audioUrl]);

  return (
    <div className="space-y-4">
      <div className="lcd-screen rounded-xl p-3 h-24 flex items-center justify-center relative shadow-2xl">
        <canvas ref={canvasRef} width={400} height={80} className="w-full h-full opacity-90" />
        <div className="absolute top-1 left-2 flex gap-1 items-center">
            <span className="digital text-[7px] text-cyan-500/50">RMS MONITOR</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'active-green' : ''} led`}></div>
        </div>
        <div className="absolute bottom-1 right-2 digital text-[9px] text-cyan-400/80">
          {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} / {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
        </div>
      </div>
      
      <audio 
        ref={audioRef} 
        controls 
        src={audioUrl || undefined} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        className="w-full custom-audio-pro opacity-90 hover:opacity-100 transition-opacity"
      />
    </div>
  );
};

// --- Main App ---
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
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setFile(selectedFile);
      setLink('');
      setReport(null);
      setError(null);
      const url = URL.createObjectURL(selectedFile);
      setAudioUrl(url);
    }
  };

  const runAnalysis = async () => {
    if (!file && !link.trim()) return;

    try {
      setLoadingPhase(LoadingPhase.UPLOADING);
      setReport(null);
      setError(null);
      
      let analysisResult: AnalysisReport;

      if (file) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        analysisResult = await analyzeVocalAudio({ base64, mimeType: file.type });
      } else {
        analysisResult = await analyzeVocalAudio({ link });
      }

      setReport(analysisResult);
      setLoadingPhase(LoadingPhase.IDLE);
    } catch (err: any) {
      setError("Hệ thống giải mã tín hiệu thất bại. Hãy kiểm tra lại file audio (WAV/MP3).");
      setLoadingPhase(LoadingPhase.IDLE);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: IZWI ENGINE CONSOLE */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rack-case rounded-[2rem] p-8 sticky top-24 z-20">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] flex items-center gap-3">
                  <div className="led active-cyan animate-pulse"></div>
                  Inference Engine
                </h2>
                <div className="flex gap-2">
                   <div className="led active-green"></div>
                   <div className="led active-red"></div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Input Selector */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Local Model Target</label>
                  <div className="lcd-screen p-3 rounded-lg flex items-center justify-between">
                    <span className="digital text-cyan-500 text-xs">QWEN3-AUDIO-1.7B</span>
                    <i className="fa-solid fa-caret-down text-[10px] text-slate-700"></i>
                  </div>
                </div>

                <div className="lcd-screen p-1 rounded-lg">
                  <input 
                    type="text"
                    placeholder="URL (YouTube/Spotify)..."
                    className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none text-white placeholder:text-slate-800 digital"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>

                <div 
                  className={`group border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden
                    ${file ? 'border-cyan-500/50 bg-cyan-500/5 shadow-inner' : 'border-white/5 hover:border-cyan-500/30 bg-black/40'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                  <i className={`fa-solid ${file ? 'fa-music' : 'fa-microphone'} text-3xl mb-3 ${file ? 'text-cyan-400' : 'text-slate-700'}`}></i>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate max-w-full px-2">
                    {file ? file.name : "LOAD LOCAL STEM"}
                  </p>
                </div>

                {/* PRO MONITORING STATION */}
                {audioUrl && (
                  <div className="rack-case p-5 rounded-2xl animate-in fade-in shadow-inner bg-[#111827]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-1">
                        <i className="fa-solid fa-tower-broadcast"></i> Live Monitoring
                      </span>
                      <span className="digital text-[7px] text-slate-600">PCM 48KHZ / 24BIT</span>
                    </div>
                    <AudioMonitor audioUrl={audioUrl} />
                  </div>
                )}

                <button 
                  onClick={runAnalysis}
                  disabled={loadingPhase !== LoadingPhase.IDLE || (!file && !link.trim())}
                  className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white font-black text-[11px] uppercase tracking-[0.5em] rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 group relative overflow-hidden"
                >
                  {loadingPhase !== LoadingPhase.IDLE ? (
                    <><i className="fa-solid fa-microchip animate-spin"></i> Inferencing...</>
                  ) : (
                    <><i className="fa-solid fa-bolt-lightning"></i> Deploy Model</>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-rose-950/40 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-black uppercase text-center flex flex-col items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-lg"></i>
                  {error}
                </div>
              )}
            </div>

            {/* IZWI SYSTEM STATUS DECOR */}
            <div className="rack-case rounded-2xl p-6 hidden lg:block border-t-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-600 uppercase">GPU Acceleration</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 h-3 rounded-sm ${i < 4 ? 'active-green' : 'bg-slate-800'} led`}></div>)}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-600 uppercase">Metal Core</p>
                  <p className="digital text-[10px] text-cyan-500">ACTIVE</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: BLUEPRINT RACK */}
          <div className="lg:col-span-8">
            {report ? (
              <div className="space-y-10 animate-in fade-in duration-700 pb-20">
                
                {/* 1. SPECTRAL ENGINE SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rack-case p-8 rounded-[2.5rem] relative group">
                    <div className="absolute top-4 right-4"><div className="led active-cyan"></div></div>
                    <span className="text-[9px] font-black text-cyan-400 uppercase block mb-3 digital tracking-widest">ASR & Texture Map</span>
                    <p className="text-slate-200 text-sm leading-relaxed italic font-medium">"{report.vocal_diagnosis.texture}"</p>
                  </div>
                  <div className="rack-case p-8 rounded-[2.5rem] border-purple-500/20">
                    <span className="text-[9px] font-black text-purple-400 uppercase block mb-3 digital tracking-widest">Inference Logic</span>
                    <p className="text-slate-300 text-sm leading-relaxed opacity-80">{report.vocal_diagnosis.pitch_saturation}</p>
                  </div>
                </div>

                {/* 2. SPECTRAL VISUALIZER */}
                <div className="rack-case rounded-[3rem] p-8">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-2">
                        <i className="fa-solid fa-chart-simple text-cyan-500"></i> Signal Geometry
                      </h3>
                      <div className="flex gap-4">
                        <span className="digital text-[8px] text-slate-500">SAMPLING: 192KHZ</span>
                        <div className="led active-green"></div>
                      </div>
                   </div>
                   <div className="lcd-screen rounded-3xl p-6 flex items-center justify-center svg-container overflow-hidden" 
                        dangerouslySetInnerHTML={{ __html: report.visual_mapping.eq_curve_svg }} />
                   
                   <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                     {report.visual_data.eq_points.map((p, i) => (
                       <div key={i} className="px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-[9px] font-black flex flex-col items-center gap-1 shadow-inner">
                         <span className="text-slate-600 digital text-[7px]">{p.type}</span>
                         <span className="text-white digital">{p.freq}Hz</span>
                         <span className={p.gain >= 0 ? 'text-emerald-400 digital' : 'text-rose-400 digital'}>{p.gain > 0 ? '+' : ''}{p.gain}dB</span>
                       </div>
                     ))}
                   </div>
                </div>

                {/* 3. PLUGIN CHAIN */}
                <div className="space-y-12">
                  {report.plugin_chain.map((item, idx) => (
                    <div key={idx} className="rack-case rounded-[2.5rem] overflow-hidden group hover:border-cyan-500/30 transition-all duration-500">
                      <div className="bg-black/60 px-8 py-5 flex items-center justify-between border-b border-white/5">
                         <div className="flex items-center gap-6">
                            <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center text-xs font-black text-cyan-400 digital">
                              {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                            </div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">{item.plugin}</h4>
                         </div>
                         <div className="flex gap-1.5">
                            <div className="led active-green"></div>
                            <div className="led active-cyan"></div>
                         </div>
                      </div>

                      <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-[45%] bg-black/80 p-8 flex items-center justify-center svg-container border-b lg:border-b-0 lg:border-r border-white/5">
                          <div dangerouslySetInnerHTML={{ __html: item.visual_demo_svg }} className="w-full transform group-hover:scale-[1.05] transition-transform duration-700" />
                        </div>
                        <div className="lg:w-[55%] p-10 space-y-8">
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest digital border-b border-cyan-500/20 pb-1 w-fit">Processing Logic</p>
                            <p className="text-[13px] text-slate-300 italic">"{item.mixing_mindset}"</p>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest digital border-b border-amber-500/20 pb-1 w-fit">Studio Secret</p>
                            <p className="text-[12px] text-amber-100/70">{item.studio_secret}</p>
                          </div>
                          <div className="lcd-screen rounded-2xl p-5 shadow-2xl">
                             <p className="text-[8px] digital text-slate-600 mb-2 uppercase">Parameter Target</p>
                             <div className="text-sm text-white digital tracking-tight leading-relaxed">{item.knob_instruction}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[600px] rack-case rounded-[4rem] border-dashed border-white/10 flex flex-col items-center justify-center text-center p-12 bg-black/40 group">
                <div className="w-40 h-40 rounded-full bg-black/50 border border-white/5 flex items-center justify-center text-7xl mb-10 text-slate-800 relative shadow-2xl">
                   <i className="fa-solid fa-microchip animate-pulse"></i>
                   <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full"></div>
                </div>
                <h3 className="text-4xl font-black text-white mb-6 tracking-tighter uppercase digital">Engine Standby</h3>
                <p className="max-w-md mx-auto text-lg text-slate-500 leading-relaxed italic">
                  "Giải mã chuỗi tín hiệu triệu đô từ các phòng thu danh tiếng toàn cầu thông qua mô hình Local Inference."
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-12 opacity-30">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] digital">
           <div className="flex items-center gap-4">
             <i className="fa-solid fa-code-branch text-xl"></i>
             <p>Vocal Mastermind v3.6.8 // IZWI Engine Powered</p>
           </div>
           <div className="flex gap-10 mt-6 md:mt-0">
             <span>Metal GPU Enabled</span>
             <span>Offline Audio Inference</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
