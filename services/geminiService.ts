
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { Quiz, SessionConfig, DayPlan, UserProfile, Curriculum } from "../types";
import { getSystemInstruction } from "../constants";

const safeGetText = (response: any): string => {
  try {
    return response.text || '';
  } catch (error) {
    return '';
  }
};

const updateUserProfileTool: FunctionDeclaration = {
  name: 'updateUserProfile',
  description: 'Update student profile accurately. VERIFY the spelling of the name (e.g. Shahzar) and the exact accent target.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      nativeLanguage: { type: Type.STRING },
      targetLanguage: { type: Type.STRING },
      proficiency: { type: Type.STRING, enum: ['beginner', 'intermediate', 'advanced'] },
      accentPreference: { type: Type.STRING },
      professionalGoal: { type: Type.STRING },
      planDuration: { type: Type.INTEGER }
    },
  },
};

const finishOnboardingTool: FunctionDeclaration = {
  name: 'finishOnboarding',
  description: 'MANDATORY: Call only after student confirms their name, accent, and goals are 100% correct.',
  parameters: { type: Type.OBJECT, properties: {} },
};

export const geminiService = {
  async generateCurriculum(topic: string): Promise<Curriculum> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a detailed 4-week curriculum for learning: ${topic}. 
        Break it down into weeks, modules, and lessons. Output JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              weeks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    weekNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    modules: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          lessons: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                title: { type: Type.STRING }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(safeGetText(response) || '{}');
    } catch (e) {
      console.error("Curriculum Generation Failed", e);
      return { weeks: [] };
    }
  },

  async generateStudentPlan(profile: UserProfile): Promise<DayPlan[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Architect a 15-day Linguistic Mastery Path for student ${profile.name}. 
        Goal: ${profile.professionalGoal} in ${profile.targetLanguage} with ${profile.accentPreference} accent.
        Each Day MUST have three rigorous sub-phases: Instruction (Fundamentals), Practice (Grip), and Evaluation (Interview).
        Each phase description must be academic and objective-driven. Output JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                title: { type: Type.STRING },
                topic: { type: Type.STRING },
                objective: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["locked", "active", "completed"] },
                phases: {
                  type: Type.OBJECT,
                  properties: {
                    instruction: { type: Type.STRING },
                    practice: { type: Type.STRING },
                    evaluation: { type: Type.STRING }
                  }
                }
              },
              required: ["day", "title", "topic", "objective", "status", "phases"]
            }
          }
        }
      });
      const plans = JSON.parse(safeGetText(response) || '[]');
      return plans.map((p: any, i: number) => ({ ...p, status: i === 0 ? 'active' : 'locked' }));
    } catch (e) {
      console.error("Plan Generation Failed", e);
      return Array.from({ length: 15 }, (_, i) => ({
        day: i + 1,
        title: `Academic Mastery ${i + 1}`,
        topic: "Prosody Architecture",
        objective: "Master core regional stress and phonetic geometry.",
        status: i === 0 ? 'active' : 'locked',
        phases: {
          instruction: "Phonetic breakdown of vowel broadening and consonant softening.",
          practice: "Active conversational drill using regional idioms.",
          evaluation: "Formal interview session with accent fidelity testing."
        }
      })) as DayPlan[];
    }
  },

  async generateDailyQuiz(dayPlan: DayPlan, targetLang: string): Promise<Quiz> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a 10-question MCQ Mastery Assessment for: ${dayPlan.topic} in ${targetLang}. Focus on accent details and grammatical nuances.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(safeGetText(response) || '{}');
    } catch (e) {
      return { title: "Error", questions: [] };
    }
  },

  async generateGoldenSample(text: string, accent: string): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: {
          parts: [{ text: `Speak the following phrase with a perfect, thick ${accent} accent: "${text}"` }]
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' }
            }
          }
        }
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
      console.error("Golden Sample Generation Error:", e);
      return null;
    }
  },

  connectVoice(config: SessionConfig, callbacks: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction: getSystemInstruction(config),
        outputAudioTranscription: {},
        inputAudioTranscription: {}
      }
    });
  },

  connectOnboarding(callbacks: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
        },
        tools: [{ functionDeclarations: [updateUserProfileTool, finishOnboardingTool] }],
        systemInstruction: `You are the Dean of LinguaSphere Academy.
        MANDATE:
        1. FORMAL WELCOME: Greet the candidate professionally and with academic gravity.
        2. DATA COLLECTION: Capture Name, Native Language, Target Language, Accent (e.g., Australian, British RP, Lakhnavi Urdu), and Professional Goal.
        3. REAL-TIME SYNC: Call 'updateUserProfile' immediately when a field is provided.
        4. ACCENT VERIFICATION (MANDATORY): 
           - When the student states their accent, YOU MUST PAUSE and explicitly ask: "I have recorded your accent preference as [Accent]. Is this correct?"
           - Wait for verbal confirmation (e.g., "Yes").
           - If they say "No" or correct you, acknowledge the change, update the profile, and RE-VERIFY.
        5. FINAL REVIEW: Once all fields are captured and accent is verified, repeat the *entire* profile.
        6. CONCLUSION: ONLY call 'finishOnboarding' after the student confirms the final review with "Correct" or "Confirm".`,
        outputAudioTranscription: {},
        inputAudioTranscription: {}
      }
    });
  }
};
