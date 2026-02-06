
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
  description: 'Update student profile data. Call this IMMEDIATELY when the user provides any information (Name, Language, Accent, Goal).',
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
  description: 'Call this ONLY when you have captured Name, Target Language, Accent, and Goal, AND you have confirmed the summary with the user.',
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
        MISSION: Efficiently onboard a new student by gathering their details naturally.
        
        PROTOCOL:
        1. GREETING: Welcome the student professionally.
        2. GATHER INFO: Ask for Name, Target Language, Accent Preference (e.g. Australian, American, British), and Professional Goal.
           - DO NOT ask all questions at once. Ask one, wait for answer, then next.
        3. REAL-TIME UPDATES: Call 'updateUserProfile' IMMEDIATELY whenever you hear a piece of information. Do not wait.
        4. FLOW:
           - If the student says "I want to learn English", ask "Excellent. Which accent? British, American, Australian...?"
           - If the student says "Australian", call updateUserProfile({ accentPreference: 'Australian' }) and say "Australian. A distinguished choice."
        5. COMPLETION: 
           - Once you have Name, Language, Accent, and Goal, summarize it briefly.
           - Ask "Is this profile correct?"
           - If they say "Yes", call 'finishOnboarding'.
           - If they say "No", ask what to change, update it, then verify again.
        
        TONE: Prestigious, Academic, Warm, Efficient.`,
        outputAudioTranscription: {},
        inputAudioTranscription: {}
      }
    });
  }
};
