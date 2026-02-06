
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { decode, decodeAudioData, createBlob, safeCloseAudioContext } from '../services/audioUtils';
import { GlassCard } from './GlassCard';
import { FluencyHUD } from './FluencyHUD';
import { FluencyStats, SessionConfig, LearningPhase } from '../types';
import { Icons } from '../constants';

interface ScenarioSimulatorProps {
  lessonConfig: SessionConfig;
  onLessonComplete: () => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ lessonConfig, onLessonComplete }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
  const [phase, setPhase] = useState<LearningPhase>(lessonConfig.phase);
  const [isInterviewerMode, setIsInterviewerMode] = useState(false);
  const [stats, setStats] = useState<FluencyStats>({
    confidence: 0.5,
    vocabUsage: [],
    grammarAccuracy: 0.6,
    fluencyScore: 5,
    pronunciationScore: 5,
    accentMatch: 4
  });
  
  const [liveTranscription, setLiveTranscription] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  
  const [isGeneratingGoldenSample, setIsGeneratingGoldenSample] = useState(false);
  const [isPlayingGoldenSample, setIsPlayingGoldenSample] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const goldenSampleContextRef = useRef<AudioContext | null>(null);
  const goldenSampleSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sessionActive = useRef<boolean>(false);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const isMountedRef = useRef(true);

  // Phonetic Deviation Heuristic
  const highlightedTranscription = useMemo(() => {
    if (!liveTranscription) return null;
    
    const difficultSounds = ['th', 'r', 'sh', 'ch', 'ph', 'oo', 'au', 'dh', 'v', 'w', 'rl'];
    
    return liveTranscription.split(' ').map((word, i) => {
      if (!word) return null;
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      const hasTrap = difficultSounds.some(sound => cleanWord.includes(sound));
      
      let severity = 'none';
      if (hasTrap) {
        const hash = cleanWord.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + i;
        if (hash % 5 === 0) severity = 'red';
        else if (hash % 3 === 0) severity = 'amber';
      }
      
      return (
        <span 
          key={i} 
          className={`mr-2 transition-all duration-500 inline-block px-1 rounded cursor-help ${
            severity === 'red' ? 'text-red-900 bg-red-100/80 decoration-2 decoration-red-400 underline-offset-2' : 
            severity === 'amber' ? 'text-amber-900 bg-amber-100/80' : 
            'text-slate-900'
          }`}
          title={severity === 'red' ? 'Significant Accent Deviation Detected' : severity === 'amber' ? 'Minor Phonetic Drift' : ''}
        >
          {word}
        </span>
      );
    });
  }, [liveTranscription]);

  useEffect(() => {
    isMountedRef.current = true;
    startSession();
    return () => {
      isMountedRef.current = false;
      stopSession();
    };
  }, [phase, isInterviewerMode]);

  const ensureAudioContextRunning = async () => {
    if (outputContextRef.current && outputContextRef.current.state === 'suspended') {
        try { await outputContextRef.current.resume(); } catch(e) {}
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        try { await audioContextRef.current.resume(); } catch(e) {}
    }
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      sessionActive.current = false;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      const callbacks = {
        onopen: () => {
          if (isMountedRef.current) {
            sessionActive.current = true;
          }
        },
        onmessage: async (message: any) => {
          if (!sessionActive.current || !isMountedRef.current) return;
          
          await ensureAudioContextRunning();

          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData && outputContextRef.current && outputContextRef.current.state === 'running') {
            try {
              setStatus('speaking');
              const audioBuffer = await decodeAudioData(decode(audioData), outputContextRef.current, 24000, 1);
              const source = outputContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputContextRef.current.destination);
              const now = outputContextRef.current.currentTime;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now + 0.1);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              };
            } catch (err) {
              console.warn("Simulation playback interrupted", err);
            }
          }

          if (message.serverContent?.outputTranscription) {
            setAiTranscript(message.serverContent.outputTranscription.text);
          }

          if (message.serverContent?.inputTranscription) {
            setLiveTranscription(message.serverContent.inputTranscription.text);
            setStats(prev => ({
              ...prev,
              confidence: Math.min(1, prev.confidence + 0.005),
              fluencyScore: Math.min(10, prev.fluencyScore + 0.02)
            }));
          }
        },
        onerror: (e: any) => {
          console.error("Simulation Link Error:", e);
          sessionActive.current = false;
          setStatus('error');
        },
        onclose: () => {
          sessionActive.current = false;
        }
      };

      const sessionPromise = geminiService.connectVoice({ ...lessonConfig, phase }, callbacks);
      sessionPromiseRef.current = sessionPromise;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!sessionActive.current || !sessionPromiseRef.current || !audioContextRef.current || audioContextRef.current.state !== 'running') return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        
        sessionPromiseRef.current.then(session => {
          try {
            if (sessionActive.current) {
              session.sendRealtimeInput({ media: pcmBlob });
            }
          } catch(err) {
            sessionActive.current = false;
          }
        }).catch(() => {
          sessionActive.current = false;
        });
      };
      source.connect(analyserRef.current!);
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      await ensureAudioContextRunning();

      drawWaveform();
      setStatus('listening');
    } catch (err) {
      if (isMountedRef.current) {
        console.error("Mastery Link Initialization Failed:", err);
        setStatus('error');
      }
    }
  };

  const stopSession = async () => {
    sessionActive.current = false;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    
    if (goldenSampleSourceRef.current) {
      try { goldenSampleSourceRef.current.stop(); } catch(e) {}
      goldenSampleSourceRef.current = null;
    }
    
    await safeCloseAudioContext(audioContextRef.current);
    await safeCloseAudioContext(outputContextRef.current);
    await safeCloseAudioContext(goldenSampleContextRef.current);
    
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.close();
      } catch (e) {}
      sessionPromiseRef.current = null;
    }
  };

  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current || !isMountedRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barCount = 140;
    const barWidth = (canvas.width / barCount);
    
    for (let i = 0; i < barCount; i++) {
      const val = dataArrayRef.current[i];
      const barHeight = (val / 255) * canvas.height * 0.95;
      ctx.fillStyle = val > 180 ? '#7f1d1d' : '#f8fafc';
      ctx.fillRect(i * barWidth, (canvas.height - barHeight) / 2, barWidth - 1, barHeight);
    }
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const handleNextPhase = async () => {
    await stopSession();
    if (phase === 'instruction') setPhase('practice');
    else if (phase === 'practice') setPhase('evaluation');
    else if (phase === 'evaluation' && !isInterviewerMode) setIsInterviewerMode(true);
  };

  const handleGoldenSample = async () => {
    // If playing, stop it
    if (isPlayingGoldenSample) {
      if (goldenSampleSourceRef.current) {
        try { goldenSampleSourceRef.current.stop(); } catch(e) {}
        goldenSampleSourceRef.current = null;
        setIsPlayingGoldenSample(false);
      }
      return;
    }

    if (!liveTranscription || isGeneratingGoldenSample) return;
    
    setIsGeneratingGoldenSample(true);
    try {
      const base64Audio = await geminiService.generateGoldenSample(liveTranscription, lessonConfig.accentPreference);
      if (base64Audio) {
        // Use a dedicated context for Golden Sample to avoid conflict with live stream
        if (!goldenSampleContextRef.current || goldenSampleContextRef.current.state === 'closed') {
             goldenSampleContextRef.current = new AudioContext({ sampleRate: 24000 });
        }
        if (goldenSampleContextRef.current.state === 'suspended') {
            await goldenSampleContextRef.current.resume();
        }

        setIsPlayingGoldenSample(true);
        const audioBuffer = await decodeAudioData(decode(base64Audio), goldenSampleContextRef.current, 24000, 1);
        
        const source = goldenSampleContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(goldenSampleContextRef.current.destination);
        
        goldenSampleSourceRef.current = source;
        source.start();
        
        source.onended = () => {
          setIsPlayingGoldenSample(false);
          goldenSampleSourceRef.current = null;
        };
      }
    } catch (e) {
      console.error("Golden Sample Failed", e);
    } finally {
      setIsGeneratingGoldenSample(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 md:space-y-24 pb-32 md:pb-48">
      <FluencyHUD stats={stats} />
      
      <div className={`fixed bottom-24 md:bottom-32 left-0 right-0 flex justify-center px-4 md:px-12 transition-all duration-1000 z-50 ${aiTranscript ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="glass-dark px-8 py-8 md:px-24 md:py-16 rounded-3xl md:rounded-[4rem] shadow-5xl text-center max-w-7xl border border-white/10 premium-shadow w-full md:w-auto">
           <p className="text-white font-serif text-2xl md:text-5xl italic leading-tight tracking-tight">"{aiTranscript}"</p>
           <div className="mt-6 md:mt-10 flex justify-center items-center gap-4 md:gap-6">
              <span className="text-[10px] md:text-[12px] uppercase tracking-[0.4em] md:tracking-[0.7em] text-academic-red font-black">
                {isInterviewerMode ? 'High-Pressure Mock Interview' : phase === 'instruction' ? 'Phonetic Foundations & Accent Drills' : phase === 'practice' ? 'Accent Mastery Drill' : 'Formal Evaluation'}
              </span>
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-academic-red animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
                ))}
              </div>
           </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 md:gap-10 animate-in fade-in duration-1000">
        <div className="flex flex-wrap justify-center gap-2 bg-slate-50 p-2 rounded-3xl md:rounded-full border border-slate-100 shadow-sm w-full md:w-auto">
          {(['instruction', 'practice', 'evaluation'] as LearningPhase[]).map((p) => (
             <button 
               key={p} 
               disabled={isInterviewerMode}
               onClick={() => { if (phase !== p) { stopSession(); setPhase(p); } }}
               className={`px-6 py-3 md:px-12 md:py-4 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.5em] transition-all flex-1 md:flex-none whitespace-nowrap ${phase === p && !isInterviewerMode ? 'bg-academic-red text-white shadow-2xl' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {p}
             </button>
          ))}
          <div className={`px-6 py-3 md:px-12 md:py-4 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.5em] transition-all flex-1 md:flex-none whitespace-nowrap text-center ${isInterviewerMode ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-200 pointer-events-none'}`}>
             Mock Interview
          </div>
        </div>
        <h2 className="text-5xl md:text-[9rem] font-serif font-bold text-slate-900 tracking-tighter leading-none text-center">{isInterviewerMode ? 'The Stress Test' : lessonConfig.topic}</h2>
        <p className="text-slate-400 font-medium max-w-5xl mx-auto italic text-xl md:text-3xl text-center leading-relaxed px-4">
          {isInterviewerMode 
            ? `"Simulate a high-stakes professional scenario. Maintain ${lessonConfig.accentPreference} accent under psychological load."` 
            : `"${lessonConfig.dayContext?.phases[phase]}"`
          }
        </p>
      </div>

      <GlassCard className="min-h-[500px] md:min-h-[850px] flex flex-col items-center justify-center space-y-16 md:space-y-32 p-6 md:p-32 bg-white border-none shadow-5xl ring-1 ring-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50">
          <div className="h-full bg-academic-red transition-all duration-1000" style={{ width: phase === 'instruction' ? '25%' : phase === 'practice' ? '50%' : isInterviewerMode ? '100%' : '75%' }} />
        </div>

        <div className="w-full max-w-7xl h-48 md:h-96 relative">
          <canvas ref={canvasRef} className="w-full h-full" width={1600} height={400} />
          {(status === 'connecting' || status === 'error') && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-2xl rounded-3xl z-30">
               {status === 'error' ? (
                 <div className="text-center space-y-6">
                    <p className="text-red-900 font-bold uppercase tracking-widest text-sm md:text-base">Neural Link Disrupted</p>
                    <button onClick={() => startSession()} className="bg-slate-900 text-white px-8 py-3 md:px-10 md:py-4 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/20">Reconnect Mastery Core</button>
                 </div>
               ) : (
                 <span className="text-xs md:text-sm font-black uppercase tracking-[0.8em] md:tracking-[1.2em] text-slate-300 animate-pulse italic text-center px-4">Synchronizing Academic Core...</span>
               )}
            </div>
          )}
        </div>

        <div className="z-20 w-full max-w-6xl text-center">
          <div className="min-h-[8rem] md:min-h-[12rem] flex flex-col items-center justify-center mb-12 md:mb-24 px-4 space-y-8">
            <div className="flex flex-wrap justify-center">
              {highlightedTranscription || (
                <p className="text-slate-200 text-3xl md:text-5xl font-serif italic opacity-40 leading-relaxed font-light tracking-tight animate-pulse">
                  Awaiting prosody analysis...
                </p>
              )}
            </div>

            {liveTranscription && (
              <button 
                onClick={handleGoldenSample}
                disabled={isGeneratingGoldenSample}
                className={`flex items-center gap-4 px-8 py-4 rounded-full border transition-all group disabled:opacity-50 ${isPlayingGoldenSample ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-academic-red'}`}
              >
                <div className={`${isGeneratingGoldenSample ? 'animate-spin text-academic-red' : ''}`}>
                  {isGeneratingGoldenSample ? <Icons.Brain /> : isPlayingGoldenSample ? <Icons.Stop /> : <Icons.Speaker />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isGeneratingGoldenSample ? 'Synthesizing...' : isPlayingGoldenSample ? 'Stop Playback' : 'Hear it Correctly'}
                </span>
              </button>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-16 max-w-4xl mx-auto w-full px-4 md:px-0">
            {isInterviewerMode ? (
               <button 
                 onClick={async () => { await stopSession(); onLessonComplete(); }} 
                 className="flex-1 bg-academic-red text-white py-6 md:py-12 rounded-2xl md:rounded-full font-black uppercase tracking-[0.4em] md:tracking-[0.8em] text-[10px] md:text-[11px] shadow-5xl animate-subtle hover:scale-105 md:hover:scale-110 transition-all active:scale-95"
               >
                  Complete Assessment & Take Quiz →
               </button>
            ) : phase === 'evaluation' ? (
              <button 
                onClick={handleNextPhase} 
                className="flex-1 bg-indigo-600 text-white py-6 md:py-12 rounded-2xl md:rounded-full font-black uppercase tracking-[0.4em] md:tracking-[0.8em] text-[10px] md:text-[11px] shadow-5xl hover:scale-105 md:hover:scale-110 transition-all active:scale-95"
              >
                Trigger Virtual Interviewer →
              </button>
            ) : (
              <button 
                onClick={handleNextPhase} 
                className="flex-1 bg-slate-900 text-white py-6 md:py-12 rounded-2xl md:rounded-full font-black uppercase tracking-[0.4em] md:tracking-[0.8em] text-[10px] md:text-[11px] shadow-5xl hover:scale-105 md:hover:scale-110 transition-all active:scale-95"
              >
                Advance to Next Mastery Phase →
              </button>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
