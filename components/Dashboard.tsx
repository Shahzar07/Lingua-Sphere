
import React, { useState } from 'react';
import { Icons } from '../constants';
import { ScenarioSimulator } from './ScenarioSimulator';
import { Onboarding } from './Onboarding';
import { QuizInterface } from './QuizInterface';
import { GlassCard } from './GlassCard';
import { geminiService } from '../services/geminiService';
import { UserProfile, DayPlan, Quiz } from '../types';

type View = 'onboarding' | 'dashboard' | 'session' | 'quiz';

export const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('onboarding');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [curriculum, setCurriculum] = useState<DayPlan[]>([]);
  const [currentDay, setCurrentDay] = useState<DayPlan | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const handleOnboardingComplete = async (profile: UserProfile, preGeneratedPlan: DayPlan[]) => {
    setUserProfile(profile);
    if (preGeneratedPlan && preGeneratedPlan.length > 0) {
      setCurriculum(preGeneratedPlan);
      setActiveView('dashboard');
    } else {
      setLoading(true);
      try {
        const plan = await geminiService.generateStudentPlan(profile);
        setCurriculum(plan);
        setActiveView('dashboard');
      } catch (e) {
        console.error("Dashboard Plan Generation Error:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const startDaySession = (day: DayPlan) => {
    if (day.status === 'locked') return;
    setCurrentDay(day);
    setActiveView('session');
  };

  const handleLessonComplete = async () => {
    if (!currentDay || !userProfile) return;
    setLoading(true);
    try {
      const quiz = await geminiService.generateDailyQuiz(currentDay, userProfile.targetLanguage);
      setActiveQuiz(quiz);
      setActiveView('quiz');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (score: number) => {
    const updatedCurriculum = curriculum.map(day => {
      if (day.day === currentDay?.day) {
        return { ...day, status: 'completed' as const, score };
      }
      if (day.day === (currentDay?.day || 0) + 1) {
        return { ...day, status: 'active' as const };
      }
      return day;
    });
    setCurriculum(updatedCurriculum);
    setActiveView('dashboard');
  };

  if (activeView === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} isLoading={loading} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-50 px-6 py-6 md:px-16 md:py-12 flex flex-col md:flex-row justify-between items-center bg-white/95 backdrop-blur-xl border-b border-slate-50 gap-6 md:gap-0">
        <div className="flex items-center gap-4 md:gap-10">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-academic-red rounded-xl md:rounded-2xl flex items-center justify-center font-serif font-bold text-2xl md:text-4xl text-white shadow-3xl shadow-red-900/20">L</div>
          <div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tighter text-slate-900 leading-none">LinguaSphere</h1>
            <p className="text-[8px] md:text-[12px] font-black uppercase tracking-[0.5em] md:tracking-[0.7em] text-academic-red mt-2 md:mt-3">Academy of Linguistic Sciences</p>
          </div>
        </div>
        
        {userProfile && (
          <div className="flex items-center gap-6 md:gap-16 w-full md:w-auto justify-end">
            <div className="text-right hidden md:block">
              <span className="text-[12px] font-black uppercase tracking-widest text-slate-300 block mb-1">Scholar in Residence</span>
              <span className="text-xl font-bold text-slate-900">{userProfile.name} • <span className="text-academic-red italic">{userProfile.accentPreference} Specialist</span></span>
            </div>
            <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-academic-red font-serif font-bold text-xl md:text-3xl shadow-xl">
               {userProfile.name.charAt(0)}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-6 md:px-16 py-12 md:py-32">
        {activeView === 'dashboard' && (
           <div className="max-w-[1500px] mx-auto space-y-20 md:space-y-40 animate-in fade-in duration-1000">
             <div className="space-y-6 md:space-y-10 max-w-5xl">
               <h2 className="text-6xl md:text-[10rem] font-serif text-slate-900 tracking-tighter leading-tight md:leading-[0.85]">The <span className="text-academic-red italic">Mastery</span> Path</h2>
               <p className="text-slate-400 text-xl md:text-4xl font-light leading-relaxed max-w-4xl">
                 A 15-day clinical intensive path designed for absolute fluency and accent grip in <span className="text-slate-900 font-medium underline decoration-academic-red/20 underline-offset-12">{userProfile?.targetLanguage}</span>.
               </p>
             </div>

             <div className="grid gap-6 md:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
               {curriculum.map((day) => {
                 const isExpanded = expandedDay === day.day;
                 return (
                   <GlassCard 
                      key={day.day}
                      onClick={() => day.status !== 'locked' && setExpandedDay(isExpanded ? null : day.day)}
                      className={`relative overflow-hidden group border-none transition-all duration-700 p-8 md:p-16 ring-1 ${
                        day.status === 'completed' ? 'bg-slate-50/50 opacity-60 ring-slate-100' : 
                        day.status === 'active' ? 'bg-white ring-slate-200 premium-shadow z-10' : 
                        'bg-white ring-slate-100 opacity-20 grayscale pointer-events-none'
                      } ${isExpanded ? 'lg:col-span-2' : ''}`}
                    >
                      <div className="space-y-8 md:space-y-12">
                        <div className="flex justify-between items-start">
                           <span className={`text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] px-4 py-2 md:px-6 md:py-3 rounded-full border ${day.status === 'active' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-transparent text-slate-300 border-slate-200'}`}>Day {day.day < 10 ? `0${day.day}` : day.day}</span>
                           {day.status === 'completed' && <div className="text-academic-red"><Icons.Award /></div>}
                        </div>
                        
                        <div>
                          <h3 className={`${isExpanded ? 'text-4xl md:text-7xl' : 'text-3xl md:text-5xl'} font-serif font-bold text-slate-900 mb-4 md:mb-8 tracking-tight transition-all duration-700`}>{day.title}</h3>
                          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed italic opacity-80">{day.objective}</p>
                        </div>

                        {isExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className="space-y-4">
                               <div className="flex items-center gap-4 text-academic-red">
                                 <Icons.Brain />
                                 <span className="text-[10px] font-black uppercase tracking-widest">I. Instruction</span>
                               </div>
                               <p className="text-sm text-slate-500 leading-relaxed">{day.phases.instruction}</p>
                             </div>
                             <div className="space-y-4">
                               <div className="flex items-center gap-4 text-slate-900">
                                 <Icons.Microphone />
                                 <span className="text-[10px] font-black uppercase tracking-widest">II. Practice</span>
                               </div>
                               <p className="text-sm text-slate-500 leading-relaxed">{day.phases.practice}</p>
                             </div>
                             <div className="space-y-4">
                               <div className="flex items-center gap-4 text-emerald-600">
                                 <Icons.Target />
                                 <span className="text-[10px] font-black uppercase tracking-widest">III. Evaluation</span>
                               </div>
                               <p className="text-sm text-slate-500 leading-relaxed">{day.phases.evaluation}</p>
                             </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          {[1,2,3].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${day.status === 'completed' ? 'bg-academic-red' : 'bg-slate-100'}`} />)}
                        </div>

                        {day.status === 'active' && (
                          <div className="pt-8 md:pt-10 border-t border-slate-50 flex justify-between items-center">
                             {isExpanded ? (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); startDaySession(day); }}
                                 className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-2xl font-black uppercase tracking-[0.4em] md:tracking-[0.8em] text-[10px] shadow-2xl hover:bg-academic-red transition-all transform hover:scale-[1.02]"
                               >
                                 Commence Master Session →
                               </button>
                             ) : (
                               <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] md:tracking-[0.7em] text-academic-red animate-pulse">Inspect Curriculum →</span>
                             )}
                          </div>
                        )}
                      </div>
                   </GlassCard>
                 );
               })}
             </div>
           </div>
        )}

        {activeView === 'session' && currentDay && userProfile && (
          <div className="animate-in slide-in-from-right duration-700">
             <button 
               onClick={() => setActiveView('dashboard')}
               className="mb-12 md:mb-24 text-[10px] md:text-[12px] font-black text-slate-400 hover:text-academic-red uppercase tracking-[0.6em] md:tracking-[0.8em] flex items-center gap-6 md:gap-10 transition-all"
             >
               <span className="text-3xl md:text-4xl leading-none">←</span> Exit Conservatory Campus
             </button>
             <ScenarioSimulator 
               lessonConfig={{
                 language: userProfile.targetLanguage,
                 nativeLanguage: userProfile.nativeLanguage,
                 accentPreference: userProfile.accentPreference,
                 phase: 'instruction',
                 topic: currentDay.topic,
                 proficiency: userProfile.proficiency,
                 dayContext: currentDay
               }}
               onLessonComplete={handleLessonComplete}
             />
          </div>
        )}

        {activeView === 'quiz' && activeQuiz && (
           <div className="animate-in zoom-in duration-700">
              <QuizInterface quiz={activeQuiz} onComplete={handleQuizComplete} />
           </div>
        )}
      </main>
    </div>
  );
};
