export interface Lead {
  name: string;
  email: string;
  company: string;
  revenue: string;
  bottleneck: string;
}

export interface Service {
  title: string;
  description: string;
  icon: keyof typeof import('./constants').Icons;
}

export type LearningPhase = 'instruction' | 'practice' | 'evaluation';

export interface UserProfile {
  name: string;
  nativeLanguage: string;
  targetLanguage: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
  accentPreference: string;
  professionalGoal: string;
  planDuration?: number;
}

export interface DayPlan {
  day: number;
  title: string;
  topic: string;
  objective: string;
  status: "locked" | "active" | "completed";
  phases: {
    instruction: string;
    practice: string;
    evaluation: string;
  };
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

export interface SessionConfig {
  topic: string;
  accentPreference: string;
  phase: LearningPhase;
  dayContext?: DayPlan;
  userProfile?: UserProfile;
}

export interface Quiz {
  title: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface FluencyStats {
  confidence: number;
  grammarAccuracy: number;
  pronunciationScore: number;
  fluencyScore: number;
  vocabUsage: string[];
  accentMatch?: number;
}