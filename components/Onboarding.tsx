
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { decode, decodeAudioData, createBlob, safeCloseAudioContext } from '../services/audioUtils';
import { GlassCard } from './GlassCard';
import { Icons } from '../constants';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBack }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'completed' | 'error'>('idle');
  const [transcript, setTranscript] = useState('Ready to connect...');
  const [collectedData, setCollectedData] = useState<Partial<UserProfile>>({});
  
  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sessionActive = useRef<boolean>(false);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = async () => {
    sessionActive.current = false;
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    await safeCloseAudioContext(audioContextRef.current);
    await safeCloseAudioContext(outputContextRef.current);
    if (sessionPromiseRef.current) {
      try { (await sessionPromiseRef.current).close(); } catch(e) {}
    }
  };

  const startAdmissionsInterview = async () => {
    try {
      setStatus('connecting');
      setTranscript("Establishing secure connection...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!isMountedRef.current) return;

      // Initialize Audio Contexts after user gesture
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputContextRef.current = new AudioContext({ sampleRate: 24000 });

      const callbacks = {
        onopen: () => {
          if (isMountedRef.current) {
            sessionActive.current = true;
            setStatus('active');
            setTranscript("Admissions Officer is reviewing your file...");
          }
        },
        onmessage: async (message: any) => {
          if (!sessionActive.current) return;

          // 1. Handle Audio Output
          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData && outputContextRef.current) {
            const audioBuffer = await decodeAudioData(decode(audioData), outputContextRef.current, 24000, 1);
            const source = outputContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputContextRef.current.destination);
            
            const now = outputContextRef.current.currentTime;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          }

          // 2. Handle Tool Calls
          if (message.toolCall) {
            const toolCall = message.toolCall;
            const functionCalls = toolCall.functionCalls;
            
            if (functionCalls && functionCalls.length > 0) {
                 const fc = functionCalls[0];
                 
                 if (fc.name === 'updateUserProfile') {
                   const newData = fc.args as Partial<UserProfile>;
                   setCollectedData(prev => ({ ...prev, ...newData }));
                   
                   // Send confirmation back
                   sessionPromiseRef.current?.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          id: fc.id,
                          name: fc.name,
                          response: { result: "Profile updated successfully." }
                        }]
                      });
                   });
                 }
                 
                 if (fc.name === 'finishOnboarding') {
                    setStatus('completed');
                    // We don't close the session immediately so the AI can finish its sentence
                    // But we stop sending audio
                 }
            }
          }

          // 3. Transcription
          if (message.serverContent?.outputTranscription) {
            setTranscript(message.serverContent.outputTranscription.text);
          }
        },
        onerror: (err: any) => {
          console.error(err);
          setStatus('error');
        }
      };

      const sessionPromise = geminiService.connectOnboarding(callbacks);
      sessionPromiseRef.current = sessionPromise;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!sessionActive.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromiseRef.current?.then(session => {
          if (sessionActive.current) session.sendRealtimeInput({ media: pcmBlob });
        });
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

    } catch (e) {
      console.error("Mic Access Error", e);
      setStatus('error');
    }
  };

  const handleGenerateCurriculum = () => {
     cleanupAudio();
     const finalProfile: UserProfile = {
         name: collectedData.name || "Student",
         nativeLanguage: collectedData.nativeLanguage || "English",
         targetLanguage: collectedData.targetLanguage || "Spanish",
         proficiency: collectedData.proficiency || "intermediate",
         accentPreference: collectedData.accentPreference || "Neutral",
         professionalGoal: collectedData.professionalGoal || "Fluency",
         planDuration: 15
     };
     onComplete(finalProfile);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-red-100/50 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-3xl w-full relative z-10">
        <div className="mb-8 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm mb-6 ${status === 'completed' ? 'border-green-200 bg-green-50' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-red-500 animate-pulse' : status === 'completed' ? 'bg-green-500' : 'bg-slate-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {status === 'completed' ? 'Interview Complete' : status === 'active' ? 'Live Interview Session' : 'Admissions Office'}
                </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">Admissions Office</h1>
        </div>

        <GlassCard className="bg-white/80 border-white/40 shadow-2xl p-8 md:p-12 space-y-8">
            
            {/* Start Button / Visualizer */}
            <div className="min-h-[120px] flex flex-col items-center justify-center space-y-6">
                {status === 'idle' && (
                    <button 
                        onClick={startAdmissionsInterview}
                        className="group relative px-8 py-4 bg-slate-900 text-white rounded-full overflow-hidden shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                        <span className="relative z-10 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-3">
                            <Icons.Speaker /> Begin Interview
                        </span>
                    </button>
                )}

                {status === 'connecting' && (
                     <div className="flex flex-col items-center gap-4">
                        <Icons.Loader />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Connecting Secure Line...</span>
                     </div>
                )}

                {status === 'active' && (
                   <div className="flex gap-2 items-center h-12">
                       {[...Array(5)].map((_, i) => (
                           <div 
                               key={i} 
                               className="w-1.5 bg-slate-900 rounded-full animate-float"
                               style={{ 
                                   height: `${Math.random() * 40 + 10}px`, 
                                   animationDuration: `${0.5 + Math.random()}s`,
                               }} 
                           />
                       ))}
                   </div>
                )}
                
                {status === 'completed' && (
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-in zoom-in">
                        <Icons.Check />
                    </div>
                )}

                {status !== 'idle' && (
                    <p className="text-xl md:text-2xl font-serif italic text-slate-800 leading-relaxed text-center max-w-2xl animate-in fade-in">
                        "{transcript}"
                    </p>
                )}
            </div>

            {/* Live Data Display */}
            {status !== 'idle' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Name</label>
                        <div className="font-serif text-slate-900 text-lg">{collectedData.name || "..."}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Target</label>
                        <div className="font-serif text-slate-900 text-lg">{collectedData.targetLanguage || "..."}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Accent</label>
                        <div className="font-serif text-slate-900 text-lg">{collectedData.accentPreference || "..."}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Goal</label>
                        <div className="font-serif text-slate-900 text-lg truncate">{collectedData.professionalGoal || "..."}</div>
                    </div>
                </div>
            )}

            {status === 'completed' && (
                <div className="pt-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
                    <button 
                        onClick={handleGenerateCurriculum}
                        className="w-full py-5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-[0.2em] hover:bg-academic-red transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3"
                    >
                        Generate My Curriculum <Icons.ArrowRight />
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4 uppercase tracking-wider font-medium">
                        Based on your profile, the AI Dean will architect a 15-day plan.
                    </p>
                </div>
            )}

        </GlassCard>

        <div className="mt-8 text-center">
             <button onClick={onBack} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-900 transition-colors">
                 Cancel Interview
             </button>
        </div>
      </div>
    </div>
  );
};
