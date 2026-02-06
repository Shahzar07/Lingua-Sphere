
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { Curriculum } from '../types';
import { GlassCard } from './GlassCard';

export const CourseGenerator: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const result = await geminiService.generateCurriculum(input);
      setCurriculum(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black tracking-tight">Academic <span className="gradient-text">Paths</span></h2>
        <p className="text-slate-400">Generate a comprehensive subject-based curriculum in any language.</p>
      </div>

      <GlassCard className="p-2 border-white/10">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Learn Quantum Mechanics in Japanese"
            className="flex-1 bg-transparent px-6 py-4 outline-none text-lg"
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-indigo-600 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
          >
            {isLoading ? 'Synthesizing...' : 'Generate'}
          </button>
        </div>
      </GlassCard>

      {curriculum && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {curriculum.weeks.map((week, idx) => (
            <GlassCard key={idx} className="border-indigo-500/20 hover:border-indigo-500/40">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Week {week.weekNumber}</span>
              <h3 className="text-xl font-black mt-1 mb-6 leading-tight">{week.title}</h3>
              <div className="space-y-4">
                {week.modules.map((mod, midx) => (
                  <div key={midx} className="space-y-2">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {mod.title}
                    </p>
                    <ul className="text-xs text-slate-500 space-y-2 pl-4 border-l border-white/5 ml-0.5">
                      {mod.lessons.map((lesson, lidx) => (
                        <li key={lidx} className="hover:text-indigo-400 transition-colors cursor-pointer">• {lesson.title}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
