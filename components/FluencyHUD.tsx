
import React from 'react';
import { FluencyStats } from '../types';

interface FluencyHUDProps {
  stats: FluencyStats;
}

export const FluencyHUD: React.FC<FluencyHUDProps> = ({ stats }) => {
  return (
    <div className="hidden lg:flex fixed top-24 right-8 z-50 flex-col gap-4 w-64 animate-in slide-in-from-right duration-500">
      <div className="bg-white/90 backdrop-blur-xl p-4 rounded-xl border border-slate-200 shadow-xl">
        <h3 className="text-xs font-bold text-red-900 uppercase tracking-widest mb-3">Live Analysis</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600 font-semibold">
              <span>Confidence</span>
              <span>{Math.round(stats.confidence * 100)}%</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-1000" 
                style={{ width: `${stats.confidence * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600 font-semibold">
              <span>Grammar Accuracy</span>
              <span>{Math.round(stats.grammarAccuracy * 100)}%</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${stats.grammarAccuracy * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600 font-semibold">
              <span>Pronunciation</span>
              <span>{stats.pronunciationScore}/10</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-1000" 
                style={{ width: `${(stats.pronunciationScore / 10) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-600 font-semibold">
              <span>Fluency Score</span>
              <span>{stats.fluencyScore}/10</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-1000" 
                style={{ width: `${(stats.fluencyScore / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-wider">Detected Vocab</p>
          <div className="flex flex-wrap gap-1">
            {stats.vocabUsage.length > 0 ? stats.vocabUsage.map((word, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] border border-slate-200 font-medium">
                {word}
              </span>
            )) : <span className="text-[10px] text-slate-400 italic">Waiting for input...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
