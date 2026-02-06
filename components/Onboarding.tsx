
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, DayPlan } from '../types';
import { geminiService } from '../services/geminiService';
import { createBlob, decodeAudioData, decode, safeCloseAudioContext } from '../services/audioUtils';
import { Icons } from '../constants';

interface OnboardingProps {
  onComplete: (profile: UserProfile, preGeneratedPlan: DayPlan[]) => void;
  isLoading: boolean;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isLoading }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isReadyToTransition, setIsReadyToTransition] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    nativeLanguage: '',
    targetLanguage: '',
    proficiency: 'beginner',
    accentPreference: '',
    professionalGoal: '',
    planDuration: 15
  });
  
  const profileRef = useRef<UserProfile>(profile);
  const [transcript, setTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sessionActive = useRef<boolean>(false);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopSession();
    };
  }, []);

  const stopSession = async () => {
    sessionActive.current = false;
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    
    const aCtx = audioContextRef.current;
    const oCtx = outputContextRef.current;
    audioContextRef.current = null;
    outputContextRef.current = null;
    
    await safeCloseAudioContext(aCtx);
    await safeCloseAudioContext(oCtx);
    
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.close();
      } catch (e) {}
      sessionPromiseRef.current = null;
    }
  };

  const startJourney = async () => {
    try {
      setError(null);
      await stopSession(); // Ensure clean slate
      
      sessionActive.current = false;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputContextRef.current = new AudioContext({ sampleRate: 24000 });
      setHasStarted(true);
      setConnectionStatus('listening');

      const callbacks = {
        onopen: () => {
          if (isMountedRef.current) {
            sessionActive.current = true;
            console.debug("Admissions link established.");
          }
        },
        onmessage: async (message: any) => {
          if (!sessionActive.current || !isMountedRef.current) return;

          // Handle Interruption
          if (message.serverContent?.interrupted) {
            console.log("Interruption detected - clearing queue");
            sourcesRef.current.forEach(source => {
              try { source.stop(); } catch(e) {}
            });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setConnectionStatus('listening');
          }

          // Handle Audio Output
          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData && outputContextRef.current && outputContextRef.current.state === 'running') {
             setConnectionStatus('speaking');
             try {
               const audioBuffer = await decodeAudioData(decode(audioData), outputContextRef.current, 24000, 1);
               const source = outputContextRef.current.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputContextRef.current.destination);
               
               // Robust timing logic
               const now = outputContextRef.current.currentTime;
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now + 0.05); // Small buffer
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               
               sourcesRef.current.add(source);
               source.onended = () => {
                 sourcesRef.current.delete(source);
                 if (sourcesRef.current.size === 0 && isMountedRef.current) {
                   setConnectionStatus('listening');
                 }
               };
             } catch (err) {
               console.warn("Audio playback warning", err);
             }
          }

          if (message.serverContent?.outputTranscription) {
            setAiTranscript(message.serverContent.outputTranscription.text);
          }
          if (message.serverContent?.inputTranscription) {
            setTranscript(message.serverContent.inputTranscription.text);
          }

          // Handle Tool Calls (The Brain)
          if (message.toolCall) {
             setConnectionStatus('processing');
             const functionCalls = message.toolCall.functionCalls;
             const responses = [];
             
             for (const call of functionCalls) {
               console.log("Tool Call Received:", call.name, call.args);
               
               if (call.name === 'updateUserProfile') {
                 setProfile(prev => ({ ...prev, ...call.args }));
                 responses.push({ id: call.id, name: call.name, response: { result: 'Profile updated successfully.' } });
               }
               if (call.name === 'finishOnboarding') {
                  setIsReadyToTransition(true);
                  responses.push({ id: call.id, name: call.name, response: { result: 'Onboarding finalized.' } });
               }
             }
             
             // IMMEDIATE RESPONSE to prevent hanging
             if (sessionActive.current && sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  if (sessionActive.current) {
                      session.sendToolResponse({ functionResponses: responses });
                      // Status will revert to speaking/listening naturally via next message
                  }
                });
             }
          }
        },
        onerror: (e: any) => {
          console.error("Neural link error:", e);
          sessionActive.current = false;
          if (isMountedRef.current) {
            setError("Connection disrupted. Please reconnect.");
            setConnectionStatus('idle');
          }
        },
        onclose: () => {
          sessionActive.current = false;
          console.debug("Admissions link closed.");
        }
      };

      const sessionPromise = geminiService.connectOnboarding(callbacks);
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
             // Silent fail for stream drops
          }
        });
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      // Force resume contexts to handle browser autoplay policies
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      if (outputContextRef.current.state === 'suspended') await outputContextRef.current.resume();

    } catch (e) {
      console.error(e);
      if (isMountedRef.current) {
        setError("Microphone access is required for the interview.");
      }
    }
  };

  const handleComplete = async () => {
    setIsGenerating(true);
    await stopSession();
    try {
      const plan = await geminiService.generateStudentPlan(profileRef.current);
      if (isMountedRef.current) {
        onComplete(profileRef.current, plan);
      }
    } catch (e) {
      if (isMountedRef.current) {
        setError("Failed to generate your academy plan. Please try again.");
        setIsGenerating(false);
      }
    }
  };

  if (isLoading || isGenerating) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 md:p-12 text-center">
        <div className="w-16 h-16 md:w-24 md:h-24 bg-academic-red rounded-3xl mb-8 md:mb-12 animate-pulse flex items-center justify-center text-white font-serif text-3xl md:text-5xl shadow-3xl">L</div>
        <h2 className="text-4xl md:text-7xl font-serif text-slate-900 mb-6 tracking-tighter leading-tight">Architecting Your Mastery...</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] md:tracking-[0.6em] text-[8px] md:text-[10px]">15-Day Intensive Academy Protocol for {profile.name || 'Candidate'}</p>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-6xl space-y-10 md:space-y-16 animate-in slide-in-from-bottom-12 duration-1000">
           <div className="flex justify-center">
             <div className="px-8 py-4 md:px-12 md:py-5 border-[6px] md:border-[8px] border-academic-red text-academic-red text-[10px] md:text-xs font-black uppercase tracking-[0.8em] md:tracking-[1em] mb-4">LinguaSphere Academy</div>
           </div>
          <h1 className="text-6xl md:text-8xl lg:text-[12rem] font-serif text-slate-900 tracking-tighter leading-none">The<br/><span className="text-academic-red italic">Conservatory</span></h1>
          <p className="text-xl md:text-3xl text-slate-400 font-light max-w-4xl mx-auto leading-relaxed px-4">
            Professional linguistic mastery through clinical, real-time accent instruction. 15 days to native prosody.
          </p>
          <button 
            onClick={startJourney} 
            className="group relative px-12 py-8 md:px-32 md:py-14 bg-slate-900 text-white rounded-full font-bold uppercase tracking-[0.4em] md:tracking-[0.8em] text-[10px] shadow-5xl hover:bg-academic-red transition-all transform hover:scale-105 active:scale-95 mt-8 md:mt-0"
          >
            Enter Admissions Office
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50">
        <div className="h-full bg-academic-red transition-all duration-1000" style={{ width: `${Object.values(profile).filter(v => !!v).length * 15}%` }} />
      </div>

      <div className="w-full max-w-7xl relative space-y-20 md:space-y-32">
        {error && (
          <div className="fixed top-24 md:top-32 left-0 right-0 flex justify-center z-[100] animate-in slide-in-from-top-4 px-4">
             <div className="bg-red-50 border border-red-100 px-6 py-4 rounded-full flex flex-col md:flex-row items-center gap-4 md:gap-6 shadow-xl text-center">
                <span className="text-red-900 font-bold text-sm">{error}</span>
                <button onClick={startJourney} className="bg-red-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-800 transition-all active:scale-95 whitespace-nowrap">Reconnect Link</button>
             </div>
          </div>
        )}

        <div className="fixed bottom-8 md:bottom-24 left-0 right-0 flex flex-col items-center z-50 pointer-events-none">
          {/* Status Indicator */}
          <div className="mb-6 flex items-center gap-2 bg-slate-900/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'speaking' ? 'bg-emerald-400 animate-pulse' :
                  connectionStatus === 'processing' ? 'bg-amber-400 animate-bounce' :
                  'bg-red-500 animate-pulse'
              }`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {connectionStatus === 'speaking' ? 'Dean is Speaking' :
                   connectionStatus === 'processing' ? 'Processing Response' :
                   'Listening for Student...'}
              </span>
          </div>

          <div className={`transition-all duration-1000 transform ${aiTranscript ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="glass px-8 py-8 md:px-24 md:py-20 rounded-3xl md:rounded-[5rem] border border-slate-100 shadow-5xl text-center max-w-7xl ring-1 ring-slate-900/5 w-full md:w-auto mx-4">
               <p className="text-slate-900 font-serif text-2xl md:text-5xl italic leading-tight tracking-tight">"{aiTranscript}"</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-32 gap-y-12 md:gap-y-24 animate-in fade-in duration-1000">
          {[
            { label: 'Candidate Dossier Name', value: profile.name, color: 'text-slate-900' },
            { label: 'Primary Language Mastery', value: profile.targetLanguage, color: 'text-slate-900' },
            { label: 'Target Regional Accent', value: profile.accentPreference, color: 'text-academic-red font-bold italic' },
            { label: 'Scholar Objective', value: profile.professionalGoal, color: 'text-slate-800 text-3xl' }
          ].map((field, i) => (
            <div key={i} className="space-y-4 md:space-y-6 group">
              <label className="text-[10px] md:text-[14px] font-black uppercase tracking-[0.5em] md:tracking-[0.7em] text-academic-red/40 block group-hover:text-academic-red transition-colors">{field.label}</label>
              <div className={`text-4xl md:text-7xl font-serif border-b-4 border-slate-50 pb-4 md:pb-8 min-h-[5rem] md:min-h-[7rem] flex items-center transition-all group-hover:border-academic-red/10 ${field.color} break-words`}>
                {field.value || <span className="text-slate-100 italic font-light text-3xl">...</span>}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12 md:mt-20">
           <p className="text-slate-300 text-xl md:text-3xl font-light tracking-tight italic min-h-[3rem]">
             {transcript ? `"${transcript}"` : ''}
           </p>
        </div>

        <div className={`flex flex-col items-center gap-8 md:gap-16 transition-all duration-1000 pb-32 md:pb-0 ${isReadyToTransition ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24 pointer-events-none'}`}>
          <button 
            onClick={handleComplete} 
            className="w-full md:w-auto px-12 md:px-40 py-8 md:py-12 bg-slate-900 text-white rounded-2xl md:rounded-full font-black uppercase tracking-[0.6em] md:tracking-[0.9em] text-[10px] md:text-xs shadow-5xl animate-subtle hover:bg-academic-red transition-all transform hover:scale-105 pointer-events-auto"
          >
            Authenticate Admission Path →
          </button>
          <div className="flex items-center gap-4 md:gap-6 pb-24 md:pb-0">
             <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] md:text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] md:tracking-[0.6em]">Admission Protocol Verified</p>
          </div>
        </div>
      </div>
    </div>
  );
};
