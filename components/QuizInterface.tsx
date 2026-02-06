
import React, { useState } from 'react';
import { Quiz } from '../types';
import { GlassCard } from './GlassCard';
import { Icons } from '../constants';

interface QuizInterfaceProps {
  quiz: Quiz;
  onComplete: (score: number) => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({ quiz, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswer = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === quiz.questions[currentIndex].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto py-6 md:py-12 animate-in zoom-in px-4">
        <GlassCard className="text-center p-8 md:p-12 space-y-8 bg-white border border-slate-100 shadow-2xl">
          <div className="w-24 h-24 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-emerald-600">
            <Icons.Check />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2 text-slate-900">Lesson Completed!</h2>
            <p className="text-slate-500">You scored {score} out of {quiz.questions.length}</p>
          </div>
          <div className="text-5xl md:text-6xl font-bold text-red-900">{percentage}%</div>
          <button 
            onClick={() => onComplete(percentage)}
            className="w-full bg-red-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-red-800 transition-all shadow-xl shadow-red-900/20"
          >
            Continue Journey
          </button>
        </GlassCard>
      </div>
    );
  }

  const question = quiz.questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto py-4 md:py-8 px-4">
      <div className="flex justify-between items-center mb-6 px-2">
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">
          Question {currentIndex + 1} / {quiz.questions.length}
        </span>
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-red-900">
          Daily Quiz
        </span>
      </div>

      <GlassCard className="p-6 md:p-8 min-h-[400px] flex flex-col justify-between bg-white border border-slate-100 shadow-xl">
        <div>
          <h3 className="text-xl md:text-2xl font-serif font-bold mb-8 leading-relaxed text-slate-900">{question.question}</h3>
          
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={`w-full p-4 md:p-5 rounded-xl text-left font-medium transition-all flex justify-between items-center border text-sm md:text-base
                  ${selectedOption === null 
                    ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700' 
                    : idx === question.correctIndex
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : selectedOption === idx
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
              >
                <span>{opt}</span>
                {selectedOption !== null && idx === question.correctIndex && <Icons.Check />}
              </button>
            ))}
          </div>
        </div>

        {showExplanation && (
          <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in">
            <p className="text-sm text-slate-600 italic mb-4 font-medium">{question.explanation}</p>
            <button 
              onClick={nextQuestion}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
            >
              {currentIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
