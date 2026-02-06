
import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Icons } from '../constants';
import { ScenarioSimulator } from './ScenarioSimulator';
import { QuizInterface } from './QuizInterface';
import { geminiService } from '../services/geminiService';
import { DayPlan, UserProfile, Quiz } from '../types';

interface DashboardProps {
  onLogout: () => void;
  userProfile: UserProfile | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, userProfile }) => {
  const [activeMode, setActiveMode] = useState<'overview' | 'simulation' | 'quiz'>('overview');
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<DayPlan[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      const profileToUse = userProfile || {
        name: "Guest Student",
        nativeLanguage: "English",
        targetLanguage: "Spanish",
        proficiency: "beginner" as const,
        accentPreference: "Neutral",
        professionalGoal: "General Fluency"
      };

      try {
          // REMOVED artificial delay for speed
          const plans = await geminiService.generateStudentPlan(profileToUse);
          setDays(plans);
      } catch (e) {
          console.error("Plan generation failed", e);
      } finally {
          setLoading(false);
      }
    };
    init();
  }, [userProfile]);

  const handleStartSimulation = () => {
      setActiveMode('simulation');
  };

  const handleSimulationComplete = async () => {
      setLoadingQuiz(true);
      setActiveMode('quiz');
      try {
        const day = days[selectedDayIndex];
        const quiz = await geminiService.generateDailyQuiz(day, userProfile?.targetLanguage || "English");
        setActiveQuiz(quiz);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingQuiz(false);
      }
  };

  const handleQuizComplete = (score: number) => {
      const newDays = [...days];
      newDays[selectedDayIndex].status = 'completed';
      if (newDays[selectedDayIndex + 1]) {
          newDays[selectedDayIndex + 1].status = 'active';
      }
      setDays(newDays);
      setActiveMode('overview');
  };

  if (activeMode === 'simulation' && days[selectedDayIndex]) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200">
           <button onClick={() => setActiveMode('overview')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-academic-red transition-colors">
             ← Return to Curriculum
           </button>
           <span className="text-sm font-serif font-bold text-slate-900">Day {days[selectedDayIndex].day}: {days[selectedDayIndex].topic}</span>
        </div>
        <ScenarioSimulator 
          lessonConfig={{
            topic: days[selectedDayIndex].topic,
            accentPreference: userProfile?.accentPreference || "Neutral",
            phase: 'instruction',
            dayContext: days[selectedDayIndex],
            userProfile: userProfile || undefined
          }}
          onLessonComplete={handleSimulationComplete}
        />
      </div>
    );
  }

  if (activeMode === 'quiz') {
      return (
        <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
            {loadingQuiz ? (
                 <div className="text-center space-y-4">
                     <div className="w-12 h-12 border-4 border-slate-200 border-t-academic-red rounded-full animate-spin mx-auto" />
                     <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Generating Assessment...</p>
                 </div>
            ) : activeQuiz ? (
                <QuizInterface quiz={activeQuiz} onComplete={handleQuizComplete} />
            ) : (
                <div className="text-center">Failed to load quiz. <button onClick={() => setActiveMode('overview')}>Back</button></div>
            )}
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Dashboard Nav */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-academic-red text-white flex items-center justify-center rounded font-serif font-bold">L</div>
          <span className="font-serif font-bold text-lg text-slate-900">LinguaSphere</span>
        </div>
        <div className="flex items-center gap-6">
            <span className="hidden md:block text-xs font-bold uppercase tracking-widest text-slate-400">
                Student: {userProfile?.name || "Guest"}
            </span>
            <button onClick={onLogout} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-red-900">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-32 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <span className="text-academic-red font-bold uppercase tracking-widest text-xs mb-2 block">15-Day Residency</span>
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-slate-900">Your Curriculum</h1>
          </div>
          <div className="bg-white border border-slate-200 px-6 py-3 rounded-full flex items-center gap-4 shadow-sm">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Target</span>
               <span className="font-serif font-bold text-slate-900">{userProfile?.targetLanguage} ({userProfile?.accentPreference})</span>
             </div>
             <div className="h-8 w-px bg-slate-200" />
             <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Progress</span>
                <span className="font-serif font-bold text-academic-red">Day {days.findIndex(d => d.status === 'active') + 1}/15</span>
             </div>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-8">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-slate-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-academic-red border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                <div className="absolute inset-4 bg-slate-50 rounded-full flex items-center justify-center">
                    <span className="font-serif font-bold text-2xl text-slate-300 animate-pulse">AI</span>
                </div>
            </div>
            <div className="text-center space-y-2">
                <p className="text-slate-900 text-sm uppercase tracking-[0.2em] font-bold animate-pulse">Dean is Architecting Plan...</p>
                <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                    Analyzing {userProfile?.nativeLanguage} phonemes to map against {userProfile?.targetLanguage} syntax. 
                    Constructing {userProfile?.planDuration} unique modules based on {userProfile?.professionalGoal}.
                </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Left Column: Timeline */}
             <div className="lg:col-span-2 space-y-6">
               {days.map((day, i) => (
                 <GlassCard 
                   key={i} 
                   onClick={() => day.status !== 'locked' && setSelectedDayIndex(i)}
                   className={`relative border transition-all duration-300 ${i === selectedDayIndex ? 'bg-white border-academic-red ring-1 ring-academic-red/20 shadow-xl scale-[1.02]' : 'bg-white/50 border-slate-100 hover:border-slate-300 hover:bg-white'} ${day.status === 'locked' ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                 >
                    <div className="flex items-start gap-6">
                       <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-serif font-bold text-lg border ${day.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : i === selectedDayIndex ? 'bg-academic-red text-white border-academic-red' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                          {day.status === 'completed' ? <Icons.Check /> : day.day}
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                             <h3 className={`font-serif font-bold text-xl ${i === selectedDayIndex ? 'text-slate-900' : 'text-slate-500'}`}>{day.title}</h3>
                             {day.status === 'active' && <span className="px-3 py-1 bg-academic-red text-white text-[10px] font-bold uppercase tracking-widest rounded-full">Current Focus</span>}
                             {day.status === 'completed' && <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Completed</span>}
                             {day.status === 'locked' && <Icons.Zap />} 
                          </div>
                          <p className="text-slate-500 text-sm mb-4 leading-relaxed">{day.objective}</p>
                          
                          {i === selectedDayIndex && (
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                               {Object.entries(day.phases).map(([key, val]) => (
                                 <div key={key}>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{key}</span>
                                    <p className="text-xs text-slate-700 line-clamp-2">{val}</p>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>
                    </div>
                 </GlassCard>
               ))}
             </div>

             {/* Right Column: Action Panel */}
             <div className="lg:col-span-1">
                <div className="sticky top-32 space-y-6">
                   <GlassCard className="bg-slate-900 text-white p-8 border-none shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-academic-red rounded-full blur-[60px] opacity-20" />
                      <h3 className="text-2xl font-serif font-bold mb-2">Ready to Begin?</h3>
                      <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                        Day {days[selectedDayIndex]?.day} focuses on {days[selectedDayIndex]?.topic}. 
                        Ensure you are in a quiet environment for accurate voice analysis.
                      </p>
                      
                      {days[selectedDayIndex]?.status === 'completed' ? (
                          <div className="w-full py-4 bg-green-600 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                              <Icons.Check /> Module Complete
                          </div>
                      ) : (
                        <button 
                            onClick={handleStartSimulation}
                            className="w-full bg-white text-slate-900 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-academic-red hover:text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                        >
                            Enter Simulation <Icons.ArrowRight />
                        </button>
                      )}
                   </GlassCard>

                   <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <h4 className="font-serif font-bold text-slate-900 mb-4">Live Metrics</h4>
                      <div className="space-y-4">
                         <div>
                            <div className="flex justify-between text-xs mb-1">
                               <span className="text-slate-500 font-bold uppercase">Fluency</span>
                               <span className="text-slate-900 font-bold">--</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full w-[0%] bg-emerald-500" />
                            </div>
                         </div>
                         <p className="text-[10px] text-slate-400 italic mt-2">
                             Complete daily simulations to unlock detailed analytics.
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
