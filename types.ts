
export interface UserProfile {
  name: string;
  nativeLanguage: string;
  targetLanguage: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
  accentPreference: string;
  professionalGoal: string;
  planDuration: number;
}

export interface DayPlan {
  day: number;
  title: string;
  topic: string;
  objective: string;
  status: 'locked' | 'active' | 'completed';
  score?: number;
  phases: {
    instruction: string;
    practice: string;
    evaluation: string;
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export interface FluencyStats {
  confidence: number;
  vocabUsage: string[];
  grammarAccuracy: number;
  fluencyScore: number;
  pronunciationScore: number;
  accentMatch: number;
}

export type LearningPhase = 'instruction' | 'practice' | 'evaluation';

export interface SessionConfig {
  language: string;
  nativeLanguage: string;
  accentPreference: string;
  phase: LearningPhase;
  topic: string;
  proficiency: string;
  dayContext?: DayPlan;
}

export interface Curriculum {
  weeks: {
    weekNumber: number;
    title: string;
    modules: {
      title: string;
      lessons: {
        title: string;
      }[];
    }[];
  }[];
}
